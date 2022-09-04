const { maxResults } = require("./config/config.js");

const sortAndSlice = (flights) =>
  flights
    .sort((flight1, flight2) => flight1.price - flight2.price)
    .slice(0, parseInt(maxResults, 10));

module.exports = {
  sortAndSlice,
};
