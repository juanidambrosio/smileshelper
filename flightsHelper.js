const { maxResults } = require("./config/config.js");
const { partitionArrays } = require("./utils/parser");

const sortAndSlice = (flights) =>
  flights
    .sort(
      (flight1, flight2) =>
        flight1.price +
        flight1.tax.milesNumber -
        (flight2.price + flight2.tax.milesNumber)
    )
    .slice(0, parseInt(maxResults, 10));

const sortAndSliceRoundTrip = (flights, minDays, maxDays, origin) => {
  const departuresAndReturns = partitionArrays(
    flights,
    (flight) => flight.origin === origin
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
        flightCombinations.push({ ...departureFlight, ...returnFlight });
      }
    }
  }
  return flightCombinations
    .sort(
      (flight1, flight2) =>
        flight1.departureFlight.price +
        flight1.departureFlight.tax.milesNumber +
        flight1.returnFlight.price +
        flight1.returnFlight.tax.milesNumber -
        (flight2.departureFlight.price +
          flight2.departureFlight.tax.milesNumber +
          flight2.returnFlight.price +
          flight2.returnFlight.tax.milesNumber)
    )
    .slice(0, parseInt(maxResults, 10));
};

module.exports = {
  sortAndSlice,
  sortAndSliceRoundTrip,
};
