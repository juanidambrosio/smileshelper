const { groupChatIdAlerts } = require("../config/constants");
const { monthToString } = require("../utils/days");

const from = { username: "smileshelper" };

const chat = { id: groupChatIdAlerts };

const flights = [
  { journey: "EZE MIA", promoMiles: 47700 },
  { journey: "EZE JFK", promoMiles: 57200 },
  { journey: "EZE MAD", promoMiles: 90000 },
  { journey: "EZE CDG", promoMiles: 79700 },
  { journey: "EZE AMS", promoMiles: 82200 },
];

const currentDate = new Date();

const currentYear = currentDate.getFullYear();

const currentMonth = currentDate.getMonth() + 1;

const alertFlightsInput = (flights) => {
  const alertFlightsInput = [];
  for (const flight of flights) {
    const reverseJourney = flight.journey.split(" ").reverse().join(" ");
    for (let month = 1; month <= 12; month++) {
      if (month >= currentMonth) {
        alertFlightsInput.push(
          {
            journey: flight.journey.concat(
              ` ${currentYear}-${monthToString(month)}`
            ),
            promoMiles: flight.promoMiles,
          },
          {
            journey: reverseJourney.concat(
              ` ${currentYear}-${monthToString(month)}`
            ),
          }
        );
      } else {
        alertFlightsInput.push(
          {
            journey: flight.journey.concat(
              ` ${currentYear + 1}-${monthToString(month)}`
            ),
            promoMiles: flight.promoMiles,
          },
          {
            journey: reverseJourney.concat(
              ` ${currentYear + 1}-${monthToString(month)}`
            ),
          }
        );
      }
    }
  }
  return alertFlightsInput;
};

module.exports = { from, chat, texts: alertFlightsInput(flights) };