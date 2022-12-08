const { groupChatIdAlerts } = require("../config/constants");
const { monthToString } = require("../utils/days");

const from = { username: "smileshelper" };

const chat = { id: groupChatIdAlerts };

const flights = [
  { journey: "EZE MIA", promoMiles: 49600 },
  { journey: "EZE JFK", promoMiles: 59400 },
  { journey: "EZE MAD", promoMiles: 95200 },
  { journey: "EZE CDG", promoMiles: 83700 },
  { journey: "EZE AMS", promoMiles: 86500 },
  { journey: "EZE CUN", promoMiles: 47800 },
  { journey: "EZE PUJ", promoMiles: 50800 },
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
