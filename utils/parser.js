const emoji = require("node-emoji");
const { SMILES_EMISSION_URL } = require("../config/constants");

const calculateIndex = (parameters) => {
  if (parameters.length) {
    switch (parameters.length) {
      case 4:
        return !isNaN(parameters[0])
          ? {
              adults: 13,
              cabinType: 14,
            }
          : {
              adults: 16,
              cabinType: 13,
            };
      case 3:
        return { cabinType: 13 };
      case 1:
        return { adults: 13 };
    }
  }
  return { adults: 13, cabinType: 13 };
};

const generateFlightOutput = (flight) =>
  " " +
  [flight.airline, flight.stops + " escalas", flight.seats + emoji.get("seat")];

const mapCabinType = (cabinType) =>
  cabinType === "ECO"
    ? "ECONOMIC"
    : cabinType === "EJE"
    ? "BUSINESS"
    : cabinType === "PEC"
    ? "PREMIUM_ECONOMIC"
    : "all";

const generateEmissionLink = (flight) =>
  `${SMILES_EMISSION_URL}originAirportCode=${
    flight.origin
  }&destinationAirportCode=${flight.destination.name}&departureDate=${new Date(
    flight.departureDate
  ).getTime()}&adults=${
    flight.adults || "1"
  }&infants=0&children=0&cabinType=${mapCabinType(
    flight.cabinType
  )}&tripType=2`;

const generateTaxLink = (flight) =>
  `adults=1&children=0&infants=0&fareuid=${flight.fareUid}&uid=${flight.uid}&type=SEGMENT_1&highlightText=SMILES_CLUB`;

const applySimpleMarkdown = (word, symbol, symbolEnd) =>
  symbol + word + (symbolEnd || symbol);

module.exports = {
  calculateIndex,
  generateFlightOutput,
  mapCabinType,
  generateEmissionLink,
  generateTaxLink,
  applySimpleMarkdown,
};
