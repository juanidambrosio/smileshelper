const {
  getFlights,
  getFlightsMultipleCities,
  getFlightsRoundTrip,
} = require("../../clients/smilesClient.js");

const getMonthlyFlights = async (event) => {
  const { results, error, statusError } = await getFlights(
    event.queryStringParameters
  );
  if (results) {
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } else {
    return {
      statusCode: statusError,
      error: error,
    };
  }
};

const getRegionalFlights = async (event) => {
  const { origin, destination, departureDate } = event.queryStringParameters;
  const fixedDay = departureDate.length > 7;
  if (origin.length > 3) {
    isMultipleOrigin = true;
    event.queryStringParameters.origin = origin.split(",");
  } else {
    isMultipleOrigin = false;
    event.queryStringParameters.destination = destination.split(",");
  }

  const { results, error, statusError } = await getFlightsMultipleCities(
    event.queryStringParameters,
    fixedDay,
    isMultipleOrigin
  );
  if (results) {
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } else {
    return {
      statusCode: statusError,
      error: error,
    };
  }
};

const getRoundTripFlights = async (event) => {
  const { results, error, statusError } = await getFlightsRoundTrip(
    event.queryStringParameters
  );
  if (results) {
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } else {
    return {
      statusCode: statusError,
      error: error,
    };
  }
};

module.exports = { getMonthlyFlights, getRegionalFlights, getRoundTripFlights };
