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

const generateFlightOutput = (flight) => {
  const parameters = [
    flight.airline,
    flight.stops + " escalas",
    "duracion " + flight.duration + " hs",
    flight.seats + emoji.get("seat"),
  ];
  return parameters.map((parameter) => " - " + parameter);
};

const mapCabinType = (cabinType) =>
  cabinType === "ECO"
    ? "ECONOMIC"
    : cabinType === "EJE"
    ? "BUSINESS"
    : cabinType === "PEC"
    ? "PREMIUM_ECONOMIC"
    : "all";

const generateLink = (flight) =>
  `${SMILES_EMISSION_URL}originAirportCode=${
    flight.origin
  }&destinationAirportCode=${flight.destination.name}&departureDate=${new Date(
    flight.departureDate
  ).getTime()}&adults=${
    flight.adults || "1"
  }&infants=0&cabinType=${mapCabinType(flight.cabinType)}&tripType=2`;

const applySimpleMarkdown = (word, symbol, symbolEnd) =>
  symbol + word + (symbolEnd || symbol);

module.exports = {
  calculateIndex,
  generateFlightOutput,
  mapCabinType,
  generateLink,
  applySimpleMarkdown,
};
