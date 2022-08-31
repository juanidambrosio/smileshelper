const { getFlights: getSmilesFlights } = require("./clients/smilesClient.js");

const searchFlights = async (inputFlight) => {
  const { origin, destination, cabinType, adults, operationCountry } = inputFlight;

  const { name, departureYearMonth } = destination;

  const flightDetails = {
    origin,
    destination: name,
    departureYearMonth,
    cabinType,
    adults,
    operationCountry
  };

  return await getSmilesFlights(flightDetails);

};

module.exports = { searchFlights };
