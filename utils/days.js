const lastDays = new Map([
  ["01", 31],
  ["02", 28],
  ["03", 31],
  ["04", 30],
  ["05", 31],
  ["06", 30],
  ["07", 31],
  ["08", 31],
  ["09", 30],
  ["10", 31],
  ["11", 30],
  ["12", 31],
]);

const monthToString = (month) =>
  month >= 10 ? month.toString() : "0".concat(month);

const parseDate = (monthDate, number) =>
  number >= 10 ? monthDate + "-" + number : monthDate + "-" + "0" + number;

const calculateFirstDay = (departureMonth) => {
  const today = new Date();
  const month = today.getMonth();
  if (month !== new Date(departureMonth).getMonth()) {
    return 1;
  } else {
    return today.getDate();
  }
};

module.exports = { lastDays, parseDate, calculateFirstDay, monthToString };
