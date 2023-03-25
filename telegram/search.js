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

const { notFound, genericError, tripTypes } = require("../config/constants");

const { createFlightSearch, getPreferencesDb } = require("./dbMapper");

const { buildError } = require("../utils/error");

const { getDbFunctions } = require("../db/dbFunctions");

const searchCityQuery = async (msg, isAlert) => {
  const payload = generatePayloadMonthlySingleDestination(msg.text);
  const { createOne, getOne } = getDbFunctions();
  payload.preferences =
    (await getPreferencesDb(
      {
        id: msg.from.username || msg.from.id.toString(),
      },
      getOne
    )) || {};

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
              tripType: tripTypes.ONE_WAY,
            }),
            "(",
            ")"
          ) +
          ": " +
          applySimpleMarkdown(
            `${current.price.toString()} + ${current.money ? "$" + current.money.toString() + " + " : ""
            }${current.tax.miles}/${current.tax.money}`,
            "*"
          ) +
          generateFlightOutput(current) +
          "\n"
        ),
    payload.origin + " " + payload.destination + " " + payload.departureDate + "\n"
  );

  if (!isAlert) {
    await createFlightSearch(
      {
        id: msg.from.username || msg.from.id.toString(),
        origin: payload.origin,
        destination: payload.destination,
        departureDate: payload.departureDate,
        price: bestFlights[0].price,
        searchType: "airport",
        smilesAndMoney: payload.preferences?.smilesAndMoney || false,
      },
      createOne
    );
  }
  return { response, bestFlight: bestFlights[0], departureDate: payload.departureDate };
};

const searchRegionalQuery = async (msg, fixedDay, isMultipleOrigin) => {
  const { createOne, getOne } = getDbFunctions();

  const preferences =
    (await getPreferencesDb(
      {
        id: msg.from.username || msg.from.id.toString(),
      },
      getOne
    )) || {};

  const payload = isMultipleOrigin
    ? generatePayloadMultipleOrigins(msg.text, fixedDay, preferences.regions)
    : generatePayloadMultipleDestinations(msg.text, fixedDay, preferences.regions);

  payload.preferences = preferences;

  try {
    const flightList = await getFlightsMultipleCities(
      payload,
      fixedDay,
      isMultipleOrigin
    );
    const bestFlights = flightList.results;

    if (flightList.error) {
      return { error: buildError(flightList.error) };
    }

    if (bestFlights.length === 0) {
      return { error: notFound }
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
            departureDate: fixedDay
              ? payload.departureDate
              : payload.departureDate.substring(0, 7) +
              "-" +
              current.departureDay +
              " 09:",
            tripType: tripTypes.ONE_WAY,
          }),
          "(",
          ")"
        ) +
        ": " +
        applySimpleMarkdown(
          `${current.price.toString()} + ${current.money ? "$" + current.money.toString() + " + " : ""
          }${current.tax.miles}/${current.tax.money}`,
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
        searchType: "region",
        smilesAndMoney: payload.preferences?.smilesAndMoney || false,
      },
      createOne
    );
    console.log(msg.text);
    return { response, departureDate: payload.departureDate }
  } catch (error) {
    return { error: genericError }
  }
};

const searchRoundTrip = async (msg) => {
  const payload = generatePayloadRoundTrip(msg.text);
  const { createOne, getOne } = getDbFunctions();
  payload.preferences =
    (await getPreferencesDb(
      {
        id: msg.from.username || msg.from.id.toString(),
      },
      getOne
    )) || {};

  try {
    const flightList = await getFlightsRoundTrip(payload);
    const bestFlights = flightList.results;
    if (flightList.error) {
      return { error: buildError(flightList.error) };
    }
    if (bestFlights.length === 0) {
      return { error: notFound };
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
              tripType: tripTypes.RETURN,
            }),
            "(",
            ")"
          ) +
          ": " +
          applySimpleMarkdown(
            `${current.departureFlight.price.toString()} + ${current.departureFlight.money
              ? "$" + current.departureFlight.money.toString() + " + "
              : ""
            }${current.returnFlight.price.toString()} + ${current.returnFlight.money
              ? "$" + current.returnFlight.money.toString() + " + "
              : ""
            }${Math.floor(
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
        searchType: "airport",
        smilesAndMoney: payload.preferences?.smilesAndMoney || false,
      },
      createOne
    );
    console.log(msg.text);
    return { response };
  } catch (error) {
    return { error: genericError };
  }
};

module.exports = {
  searchCityQuery,
  searchRegionalQuery,
  searchRoundTrip,
};
