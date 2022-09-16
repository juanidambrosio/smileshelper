const { groupChatIdAlerts } = require("../config/constants");
const { monthToString } = require("../utils/days");

const from = { username: "smileshelper" };

const chat = { id: groupChatIdAlerts };

const flights = ["BUE MIA", "BUE JFK", "BUE MAD", "BUE PAR", "BUE AMS"];

const currentDate = new Date();

const currentYear = currentDate.getFullYear();

const currentMonth = currentDate.getMonth() + 1;

const alertFlightsInput = (flights) => {
  const alertFlightsInput = [];
  for (const flight of flights) {
    for (let month = 1; month <= 12; month++) {
      if (month >= currentMonth) {
        alertFlightsInput.push(
          flight.concat(` ${currentYear}-${monthToString(month)}`)
        );
      } else {
        alertFlightsInput.push(
          flight.concat(` ${currentYear + 1}-${monthToString(month)}`)
        );
      }
    }
  }
  return alertFlightsInput;
};

module.exports = { from, chat, texts: alertFlightsInput(flights) };
