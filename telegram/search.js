const emoji = require("node-emoji");

const {
  generatePayloadMonthlySingleDestination,
  generatePayloadMultipleDestinations,
  generatePayloadMultipleOrigins,
  generatePayloadRoundTrip,
  applySimpleMarkdown,
  generateEmissionLink,
  generateFlightOutput,
  generateEmissionLinkRoundTrip,
} = require("../utils/parser");

const {
  getFlights,
  getFlightsMultipleCities,
  getFlightsRoundTrip,
} = require("../clients/smilesClient");

const { notFound, genericError, searching } = require("../config/constants");

const { createFlightSearch, getPreferencesDb } = require("./dbMapper");

const { buildError } = require("../utils/error");

const searchCityQuery = async (msg, flightFunctions = {}) => {
  const payload = generatePayloadMonthlySingleDestination(msg.text);
  const { createOne, getOne } = flightFunctions;

  if (getOne) {
    payload.preferences = await getPreferencesDb(
      {
        id: msg.from.username || msg.from.id.toString(),
      },
      getOne
    );
  }
  const flightList = await getFlights(payload);
  const bestFlights = flightList.results;
  if (flightList.error) {
    throw new Error(flightList.error);
  }
  if (bestFlights.length === 0) {
    return { response: notFound };
  }
  const response = bestFlights.reduce(
    (previous, current) =>
      msg.promoMiles && current.price > msg.promoMiles
        ? previous
        : previous.concat(
            emoji.get("airplane") +
              applySimpleMarkdown(
                current.departureDay + "/" + flightList.departureMonth,
                "[",
                "]"
              ) +
              applySimpleMarkdown(
                generateEmissionLink({
                  ...payload,
                  departureDate:
                    payload.departureDate + "-" + current.departureDay + " 09:",
                  tripType: "2",
                }),
                "(",
                ")"
              ) +
              ": " +
              applySimpleMarkdown(
                `${current.price.toString()} + ${current.tax.miles}/${
                  current.tax.money
                }`,
                "*"
              ) +
              generateFlightOutput(current) +
              "\n"
          ),
    payload.origin + " " + payload.destination + "\n"
  );

  if (createOne) {
    await createFlightSearch(
      {
        id: msg.from.username || msg.from.id.toString(),
        origin: payload.origin,
        destination: payload.destination,
        departureDate: payload.departureDate,
        price: bestFlights[0].price,
      },
      createOne
    );
  }
  return { response, bestFlight: bestFlights[0] };
};

const searchRegionalQuery = async (
  bot,
  msg,
  fixedDay,
  isMultipleOrigin,
  flightFunctions
) => {
  const chatId = msg.chat.id;
  const { getOne, createOne } = flightFunctions;
  const payload = isMultipleOrigin
    ? generatePayloadMultipleOrigins(msg.text, fixedDay)
    : generatePayloadMultipleDestinations(msg.text, fixedDay);

  payload.preferences = await getPreferencesDb(
    {
      id: msg.from.username || msg.from.id.toString(),
    },
    getOne
  );

  try {
    bot.sendMessage(chatId, searching);
    const flightList = await getFlightsMultipleCities(
      payload,
      fixedDay,
      isMultipleOrigin
    );
    const bestFlights = flightList.results;

    if (flightList.error) {
      return bot.sendMessage(chatId, buildError(flightList.error));
    }

    if (bestFlights.length === 0) {
      return bot.sendMessage(chatId, notFound);
    }

    const flightTitle = isMultipleOrigin
      ? `${payload.region} ${payload.destination} ${payload.departureDate}\n`
      : `${payload.origin} ${payload.region} ${payload.departureDate}\n`;

    const response = bestFlights.reduce((previous, current) => {
      const dateToShow = fixedDay
        ? ""
        : " " +
          current.departureDay +
          "/" +
          payload.departureDate.substring(5, 7);
      return previous.concat(
        emoji.get("airplane") +
          applySimpleMarkdown(
            (isMultipleOrigin ? current.origin : current.destination) +
              dateToShow,
            "[",
            "]"
          ) +
          applySimpleMarkdown(
            generateEmissionLink({
              ...payload,
              origin: isMultipleOrigin ? current.origin : payload.origin,
              destination: isMultipleOrigin
                ? payload.destination
                : current.destination,
              departureDate:
                payload.departureDate + "-" + current.departureDay + " 09:",
              tripType: "2",
            }),
            "(",
            ")"
          ) +
          ": " +
          applySimpleMarkdown(
            `${current.price.toString()} + ${current.tax.miles}/${
              current.tax.money
            }`,
            "*"
          ) +
          generateFlightOutput(current) +
          "\n"
      );
    }, flightTitle);
    await createFlightSearch(
      {
        id: msg.from.username || msg.from.id.toString(),
        origin: Array.isArray(payload.origin) ? payload.region : payload.origin,
        destination: Array.isArray(payload.destination)
          ? payload.region
          : payload.destination,
        departureDate: payload.departureDate,
        price: bestFlights[0].price,
      },
      createOne
    );
    console.log(msg.text);
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(chatId, genericError);
  }
};

const searchRoundTrip = async (bot, msg, flightFunctions) => {
  const chatId = msg.chat.id;
  const payload = generatePayloadRoundTrip(msg.text);
  const { createOne, getOne } = flightFunctions;
  payload.preferences = await getPreferencesDb(
    {
      id: msg.from.username || msg.from.id.toString(),
    },
    getOne
  );

  try {
    bot.sendMessage(chatId, searching);
    const flightList = await getFlightsRoundTrip(payload);

    const bestFlights = flightList.results;
    if (flightList.error) {
      return bot.sendMessage(chatId, buildError(flightList.error));
    }
    if (bestFlights.length === 0) {
      return bot.sendMessage(chatId, notFound);
    }

    const response = bestFlights.reduce(
      (previous, current) =>
        previous.concat(
          emoji.get("airplane") +
            applySimpleMarkdown(
              current.departureFlight.departureDay.getDate() +
                "/" +
                (current.departureFlight.departureDay.getMonth() + 1) +
                " - " +
                current.returnFlight.departureDay.getDate() +
                "/" +
                (current.returnFlight.departureDay.getMonth() + 1),
              "[",
              "]"
            ) +
            applySimpleMarkdown(
              generateEmissionLinkRoundTrip({
                ...payload,
                departureDate: current.departureFlight.departureDay.setHours(9),
                returnDate: current.returnFlight.departureDay.setHours(9),
                tripType: "1",
              }),
              "(",
              ")"
            ) +
            ": " +
            applySimpleMarkdown(
              `${current.departureFlight.price.toString()} + ${current.returnFlight.price.toString()} + ${Math.floor(
                (current.departureFlight.tax.milesNumber +
                  current.returnFlight.tax.milesNumber) /
                  1000
              ).toString()}K/$${Math.floor(
                (current.departureFlight.tax.moneyNumber +
                  current.returnFlight.tax.moneyNumber) /
                  1000
              ).toString()}K`,
              "*"
            ) +
            "\n IDA:" +
            generateFlightOutput(current.departureFlight) +
            "\n VUELTA:" +
            generateFlightOutput(current.returnFlight) +
            "\n"
        ),
      payload.origin + " " + payload.destination + "\n"
    );
    await createFlightSearch(
      {
        id: msg.from.username || msg.from.id.toString(),
        origin: payload.origin,
        destination: payload.destination,
        departureDate: payload.departureDate,
        returnDate: payload.returnDate,
        price:
          bestFlights[0].departureFlight.price +
          bestFlights[0].returnFlight.price,
      },
      createOne
    );
    console.log(msg.text);
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(chatId, genericError);
  }
};

module.exports = { searchCityQuery, searchRegionalQuery, searchRoundTrip };
