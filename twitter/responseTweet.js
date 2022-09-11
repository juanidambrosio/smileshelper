const {
  getFlights,
  getFlightsMultipleCities,
} = require("../clients/smilesClient");
const { twitterClient, ApiResponseError } = require("../config/config");
const { incorrectFormat, notFound } = require("../config/constants");

module.exports.tweet = async (event) => {
  const { id, payload } = JSON.parse(event.body);
  try {
    if (!payload) {
      await twitterClient.reply(incorrectFormat, id);
      //console.log(incorrectFormat);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: incorrectFormat }, null, 2),
      };
    }
    const isMultipleOrigin = Array.isArray(payload.origin) ? true : false;
    const flightList = payload.region
      ? await getFlightsMultipleCities(payload, false, isMultipleOrigin)
      : await getFlights(payload);
    const bestFlights = flightList.results;
    if (flightList.error) {
      const response = flightList.error;
      await twitterClient.reply(response, id);
      return {
        statusCode: flightList.statusError,
        body: JSON.stringify({ message: response }, null, 2),
      };
    }
    if (bestFlights.length === 0) {
      await twitterClient.reply(notFound, id);
      //console.log(notFound);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: notFound }, null, 2),
      };
    }

    const flightTitle = isMultipleOrigin
      ? `${payload.region || payload.origin} ${payload.destination}\n`
      : `${payload.origin} ${payload.region || payload.destination}\n`;
    const responseTweet = bestFlights.reduce((previous, current) => {
      const taxWord = current.tax?.miles
        ? ` + ${current.tax.miles}/${current.tax.money}`
        : "";
      return previous.length <= 250
        ? previous.concat(
            (!payload.region
              ? ""
              : isMultipleOrigin
              ? current.origin + " "
              : current.destination + " ") +
              current.departureDay +
              "/" +
              payload.departureDate.substring(5, 7) +
              ": " +
              current.price +
              taxWord +
              "\n"
          )
        : previous;
    }, flightTitle);

    await twitterClient.reply(responseTweet, id);
    //console.log(responseTweet);
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Response was sent successfully!",
          bestPrice: bestFlights[0].price,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.log(error);

    if (
      error instanceof ApiResponseError &&
      error.rateLimitError &&
      error.rateLimit
    )
      console.log(
        `You just hit the rate limit! Request counter will reset at timestamp ${error.rateLimit.reset}.`
      );

    const errorMessage = error.response?.data?.errorMessage;
    await twitterClient.reply(errorMessage, id);
    return {
      statusCode: error.statusCode,
      body: JSON.stringify("Could not send the response tweet" + errorMessage),
    };
  }
};
