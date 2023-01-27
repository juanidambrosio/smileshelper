const emoji = require("node-emoji");
const { tripTypes } = require('../config/constants');
const {
  applySimpleMarkdown,
  generateEmissionLink,
  generateFlightOutput,
  generateEmissionLinkRoundTrip,
} = require("./parser");
const {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
} = require("./regex");

const parseSingleCityResult = ({ result, payload }) => {
  const departureMonth = payload.departureDate.substring(5, 7);
  return emoji.get("airplane") + " " +
    applySimpleMarkdown(
      result.departureDay + "/" + departureMonth,
      "[",
      "]",
    ) +
    applySimpleMarkdown(
      generateEmissionLink({
        ...payload,
        departureDate: payload.departureDate + "-" + result.departureDay +
          " 09:",
        tripType: tripTypes.ONE_WAY,
      }),
      "(",
      ")",
    ) +
    ": " +
    applySimpleMarkdown(
      `${result.price.toString()} + ${
        result.money ? "$" + result.money.toString() + " + " : ""
      }${result.tax.miles}/${result.tax.money}`,
      "*",
    ) +
    generateFlightOutput(result);
}

const parseRegionalResult = ({ result, payload, isMultipleOrigin, fixedDay }) => {
  const dateToShow = fixedDay ? "" : " " +
    result.departureDay +
    "/" +
    payload.departureDate.substring(5, 7);
  return emoji.get("airplane") + " " +
    applySimpleMarkdown(
      (isMultipleOrigin ? result.origin : result.destination) +
        dateToShow,
      "[",
      "]",
    ) +
    applySimpleMarkdown(
      generateEmissionLink({
        ...payload,
        origin: isMultipleOrigin ? result.origin : payload.origin,
        destination: isMultipleOrigin
          ? payload.destination
          : result.destination,
        departureDate: fixedDay
          ? payload.departureDate
          : payload.departureDate.substring(0, 7) + "-" + result.departureDay +
            " 09:",
        tripType: tripTypes.ONE_WAY,
      }),
      "(",
      ")",
    ) +
    ": " +
    applySimpleMarkdown(
      `${result.price.toString()} + ${
        result.money ? "$" + result.money.toString() + " + " : ""
      }${result.tax.miles}/${result.tax.money}`,
      "*",
    ) +
    generateFlightOutput(result);
}

const parseRoundTripResult = ({ result, payload }) => {
  return emoji.get("airplane") + " " +
    applySimpleMarkdown(
      result.departureFlight.departureDay.getDate() +
        "/" +
        (result.departureFlight.departureDay.getMonth() + 1) +
        " - " +
        result.returnFlight.departureDay.getDate() +
        "/" +
        (result.returnFlight.departureDay.getMonth() + 1),
      "[",
      "]",
    ) +
    applySimpleMarkdown(
      generateEmissionLinkRoundTrip({
        ...payload,
        departureDate: result.departureFlight.departureDay.setHours(9),
        returnDate: result.returnFlight.departureDay.setHours(9),
        tripType: tripTypes.RETURN,
      }),
      "(",
      ")",
    ) +
    ": " +
    applySimpleMarkdown(
      `${result.departureFlight.price.toString()} + ${
        result.departureFlight.money
          ? "$" + result.departureFlight.money.toString() + " + "
          : ""
      }${result.returnFlight.price.toString()} + ${
        result.returnFlight.money
          ? "$" + result.returnFlight.money.toString() + " + "
          : ""
      }${
        Math.floor(
          (result.departureFlight.tax.milesNumber +
            result.returnFlight.tax.milesNumber) /
            1000,
        ).toString()
      }K/$${
        Math.floor(
          (result.departureFlight.tax.moneyNumber +
            result.returnFlight.tax.moneyNumber) /
            1000,
        ).toString()
      }K`,
      "*",
    ) +
    "\n IDA:" +
    generateFlightOutput(result.departureFlight) +
    "\n VUELTA:" +
    generateFlightOutput(result.returnFlight);
}

const parseFlightsFromQuery = ({ flights, payload, query }) => {
  let title, flightsMarkdown;
  if (regexSingleCities.test(query)) {
    title = payload.origin + " " + payload.destination;
    flightsMarkdown = flights.map((result) =>
      parseSingleCityResult({ result, payload })
    );
  } else if (regexRoundTrip.test(query)) {
    title = payload.origin + " " + payload.destination;
    flightsMarkdown = flights.map((result) =>
      parseRoundTripResult({ result, payload })
    );
  } else if (regexMultipleDestinationMonthly.test(query)) {
    title = `${payload.origin} ${payload.region} ${payload.departureDate}`;
    flightsMarkdown = flights.map((result) =>
      parseRegionalResult({
        result,
        payload,
        isMultipleOrigin: false,
        fixedDay: false,
      })
    );
  } else if (regexMultipleDestinationFixedDay.test(query)) {
    title = `${payload.origin} ${payload.region} ${payload.departureDate}`;
    flightsMarkdown = flights.map((result) =>
      parseRegionalResult({
        result,
        payload,
        isMultipleOrigin: false,
        fixedDay: true,
      })
    );
  } else if (regexMultipleOriginMonthly.test(query)) {
    title = `${payload.region} ${payload.destination} ${payload.departureDate}`;
    flightsMarkdown = flights.map((result) =>
      parseRegionalResult({
        result,
        payload,
        isMultipleOrigin: true,
        fixedDay: false,
      })
    );
  } else if (regexMultipleOriginFixedDay.test(query)) {
    title = `${payload.region} ${payload.destination} ${payload.departureDate}`;
    flightsMarkdown = flights.map((result) =>
      parseRegionalResult({
        result,
        payload,
        isMultipleOrigin: true,
        fixedDay: true,
      })
    );
  } else {
    throw new Error(`Failed to parse flights for query "${query}".`);
  }
  return [title, ...flightsMarkdown].join("\n");
}

module.exports = { parseFlightsFromQuery };
