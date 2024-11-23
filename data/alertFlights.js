const { monthToString } = require("../utils/days");

const flights = [
  { journey: "EZE MIA", promoMiles: 100000 },
  { journey: "EZE JFK", promoMiles: 100000 },
  { journey: "EZE MCO", promoMiles: 100000 },
  { journey: "EZE HAV", promoMiles: 100000 },
  { journey: "EZE MAD", promoMiles: 120000 },
  { journey: "EZE CDG", promoMiles: 161100 },
  { journey: "EZE AMS", promoMiles: 166200 },
  { journey: "EZE CUN", promoMiles: 100000 },
  { journey: "EZE PUJ", promoMiles: 100000 },
];

const currentDate = new Date();

const currentYear = currentDate.getFullYear();

const currentMonth = currentDate.getMonth() + 1;

const alertFlightsInput = (journey, promoMiles) => {
  const alertFlightsInput = [];
  const reverseJourney = journey.split(" ").reverse().join(" ");
  for (let month = 12; month >= 1; month--) {
    if (month >= currentMonth) {
      alertFlightsInput.unshift(
        {
          journey,
          journeyComplete: journey.concat(
            ` ${currentYear}-${monthToString(month)}`
          ),
          promoMiles,
        },
        {
          journey: reverseJourney,
          journeyComplete: reverseJourney.concat(
            ` ${currentYear}-${monthToString(month)}`
          ),
          promoMiles,
        }
      );
    }
    if (month <= currentMonth) {
      alertFlightsInput.push(
        {
          journey,
          journeyComplete: journey.concat(
            ` ${currentYear + 1}-${monthToString(month)}`
          ),
          promoMiles,
        },
        {
          journey: reverseJourney,
          journeyComplete: reverseJourney.concat(
            ` ${currentYear + 1}-${monthToString(month)}`
          ),
          promoMiles,
        }
      );
    }
  }
  return alertFlightsInput;
};

module.exports = { flights, alertFlightsInput };
