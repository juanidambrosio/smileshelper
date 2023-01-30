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
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const month = today.getMonth();
  const year = today.getFullYear();

  const dateDepartureMonth = new Date(new Date(departureMonth).toLocaleString("en-us", { timeZone: "Europe/Madrid" }));
  if (
    month === dateDepartureMonth.getMonth() &&
    year === dateDepartureMonth.getFullYear()
  ) {
    return today.getDate();
  } else {
    return 1;
  }
};

module.exports = { lastDays, parseDate, calculateFirstDay, monthToString };
