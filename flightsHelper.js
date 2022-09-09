const { maxResults } = require("./config/config.js");

const sortAndSlice = (flights) =>
  flights
    .sort(
      (flight1, flight2) =>
        flight1.price +
        flight1.tax.milesNumber -
        (flight2.price + flight2.tax.milesNumber)
    )
    .slice(0, parseInt(maxResults, 10));

module.exports = {
  sortAndSlice,
};
