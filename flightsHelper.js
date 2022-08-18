const { maxResults } = require("./config/config.js");

const sortAndSlice = (flights) =>
  flights
    .sort((flight1, flight2) => flight1.price - flight2.price)
    .filter((flight) => flight.price !== Number.MAX_VALUE)
    .slice(0, parseInt(maxResults, 10));

module.exports = {
  sortAndSlice,
};
