const { partitionArrays, belongsToCity } = require("./utils/parser");

const sortFlights = (flights) =>
  flights.sort(
    (flight1, flight2) => (flight1.price + flight1.tax.milesNumber) - (flight2.price + flight2.tax.milesNumber)
  );

const sortFlightsRoundTrip = (flights, minDays, maxDays, origin) => {
  const departuresAndReturns = partitionArrays(flights, (flight) =>
    belongsToCity(flight.origin, origin)
  );
  const flightCombinations = [];
  for (const departureFlight of departuresAndReturns[0]) {
    for (const returnFlight of departuresAndReturns[1]) {
      const daysDifference = Math.floor(
        (returnFlight.departureDay - departureFlight.departureDay) /
          (24 * 60 * 60 * 1000)
      );
      if (
        daysDifference >= minDays &&
        (!maxDays || daysDifference <= maxDays)
      ) {
        flightCombinations.push({
          departureFlight: { ...departureFlight },
          returnFlight: { ...returnFlight },
        });
      }
    }
  }
  return flightCombinations.sort(
    (flight1, flight2) =>
      flight1.departureFlight.price +
      flight1.departureFlight.tax.milesNumber +
      flight1.returnFlight.price +
      flight1.returnFlight.tax.milesNumber -
      (flight2.departureFlight.price +
        flight2.departureFlight.tax.milesNumber +
        flight2.returnFlight.price +
        flight2.returnFlight.tax.milesNumber)
  );
};

module.exports = {
  sortFlights,
  sortFlightsRoundTrip,
};
