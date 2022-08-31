const { searchFlights } = require("../search");
const { twitterClient, ApiResponseError } = require("../config/config");
const { localization } = require("./constants");

module.exports.tweet = async (event) => {
  const { id, payload } = JSON.parse(event.body);
  try {
    if (!payload) {
      await twitterClient.reply(localization.ES.incorrectFormat, id);
      //console.log(localization.ES.incorrectFormat);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: localization.ES.incorrectFormat }, null, 2),
      };
    }
    const flightList = await searchFlights(payload);
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
      await twitterClient.reply(localization.ES.notFound, id);
      //console.log(localization.ES.notFound);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: localization.ES.notFound }, null, 2),
      };
    }
    const month = flightList.departureMonth.substring(5);
    const responseTweet = bestFlights.reduce(
      (previous, current) =>
        previous.concat(
          current.departureDay + "/" + month + ": " + current.price + "\n"
        ),
      payload.origin + " " + payload.destination.name + "\n"
    );

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
