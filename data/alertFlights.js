const { groupChatIdAlerts } = require("../config/constants");
const { monthToString } = require("../utils/days");

const from = { username: "smileshelper" };

const chat = { id: groupChatIdAlerts };

const flights = [
  { journey: "EZE MIA", promoMiles: 54500 },
  { journey: "EZE JFK", promoMiles: 65400 },
  { journey: "EZE MAD", promoMiles: 110100 },
  { journey: "EZE CDG", promoMiles: 92100 },
  { journey: "EZE AMS", promoMiles: 95100 },
  { journey: "EZE CUN", promoMiles: 61300 },
  { journey: "EZE PUJ", promoMiles: 55900 },
];

const currentDate = new Date();

const currentYear = currentDate.getFullYear();

const currentMonth = currentDate.getMonth() + 1;

const alertFlightsInput = (flights) => {
  const alertFlightsInput = [];
  for (const flight of flights) {
    const reverseJourney = flight.journey.split(" ").reverse().join(" ");
    for (let month = 12; month >= 1; month--) {
      if (month >= currentMonth) {
        alertFlightsInput.unshift(
          {
            journey: flight.journey,
            journeyComplete: flight.journey.concat(
              ` ${currentYear}-${monthToString(month)}`
            ),
            promoMiles: flight.promoMiles,
          },
          {
            journey: reverseJourney,
            journeyComplete: reverseJourney.concat(
              ` ${currentYear}-${monthToString(month)}`
            ),
            promoMiles: flight.promoMiles,
          }
        );
      }
      if (month <= currentMonth) {
        alertFlightsInput.push(
          {
            journey: flight.journey,
            journeyComplete: flight.journey.concat(
              ` ${currentYear + 1}-${monthToString(month)}`
            ),
            promoMiles: flight.promoMiles,
          },
          {
            journey: reverseJourney,
            journeyComplete: reverseJourney.concat(
              ` ${currentYear + 1}-${monthToString(month)}`
            ),
            promoMiles: flight.promoMiles,
          }
        );
      }
    }
  }
  return alertFlightsInput;
};

module.exports = { from, chat, texts: alertFlightsInput(flights) };
