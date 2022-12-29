const { badResponse, notFound } = require("../config/constants");
const {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
} = require("../utils/regex");
const {
  generatePayloadMonthlySingleDestination,
  generatePayloadMultipleDestinations,
  generatePayloadMultipleOrigins,
  generatePayloadRoundTrip,
} = require("../utils/parser");
const { getFlights, getFlightsMultipleCities, getFlightsRoundTrip } = require(
  "../clients/smilesClient",
);

async function searchForFlights(query) {
  let flightsResponse, payload;
  if (regexSingleCities.test(query)) {
    payload = generatePayloadMonthlySingleDestination(query);
    flightsResponse = await getFlights(payload);
  } else if (regexRoundTrip.test(query)) {
    payload = generatePayloadRoundTrip(query);
    flightsResponse = await getFlightsRoundTrip(payload);
  } else if (regexMultipleDestinationMonthly.test(query)) {
    payload = generatePayloadMultipleDestinations(query, false);
    flightsResponse = await getFlightsMultipleCities(
      payload,
      false,
      false,
    );
  } else if (regexMultipleDestinationFixedDay.test(query)) {
    payload = generatePayloadMultipleDestinations(query, true);
    flightsResponse = await getFlightsMultipleCities(
      payload,
      true,
      false,
    );
  } else if (regexMultipleOriginMonthly.test(query)) {
    payload = generatePayloadMultipleOrigins(query, false);
    flightsResponse = await getFlightsMultipleCities(
      payload,
      false,
      true,
    );
  } else if (regexMultipleOriginFixedDay.test(query)) {
    payload = generatePayloadMultipleOrigins(query, true);
    flightsResponse = await getFlightsMultipleCities(
      payload,
      true,
      true,
    );
  } else {
    throw new Error(badResponse);
  }
  const { error, results: flights } = flightsResponse;
  if (error) throw error;
  if (flights.length === 0) throw new Error(notFound);
  return { flights, payload };
}

module.exports = { searchForFlights };
