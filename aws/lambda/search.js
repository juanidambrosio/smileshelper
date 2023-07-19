const { getFlights } = require("../../clients/smilesClient.js");

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

module.exports = { getMonthlyFlights };
