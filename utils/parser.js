const emoji = require("node-emoji");
const { SMILES_EMISSION_URL, regions } = require("../config/constants");

const calculateIndex = (parameters, indexStart) => {
  if (parameters.length) {
    switch (parameters.length) {
      case 5:
        return !isNaN(parameters[0])
          ? {
              adults: indexStart,
              cabinType: indexStart + 2,
            }
          : {
              adults: indexStart + 4,
              cabinType: indexStart,
            };
      case 3:
        return { cabinType: indexStart };
      case 1:
        return { adults: indexStart };
    }
  }
  return { adults: indexStart, cabinType: indexStart };
};

const generateFlightOutput = (flight) =>
  " " +
  [
    flight.airline,
    flight.stops + " escalas",
    emoji.get("clock1") +
      flight.duration +
      "hs," +
      emoji.get("seat") +
      flight.seats,
  ];

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

const generatePayloadMonthlySingleDestination = (text) => {
  const { adults, cabinType } = calculateIndex(text.substring(16), 16);
  return {
    origin: text.substring(0, 3).toUpperCase(),
    destination: {
      name: text.substring(4, 7).toUpperCase(),
      departureDate: text.substring(8, 15),
    },
    adults: adults ? text.substring(adults, adults + 1) : "",
    cabinType: cabinType
      ? text.substring(cabinType, cabinType + 3).toUpperCase()
      : "",
  };
};

const generatePayloadMultipleDestinations = (text, fixedDay) => {
  const offset = fixedDay ? 10 : 7;
  const region = text.substring(4, text.indexOf(" ", 4)).toUpperCase();
  const startIndexAfterRegion = 4 + region.length + 1;
  const { adults, cabinType } = calculateIndex(
    text.substring(startIndexAfterRegion + offset + 1),
    startIndexAfterRegion + offset + 1
  );
  return {
    origin: text.substring(0, 3).toUpperCase(),
    destination: {
      name: regions[region],
      departureDate: text.substring(
        startIndexAfterRegion,
        startIndexAfterRegion + offset
      ),
    },
    adults: adults ? text.substring(adults, adults + 1) : "",
    cabinType: cabinType
      ? text.substring(cabinType, cabinType + 3).toUpperCase()
      : "",
    region,
  };
};

module.exports = {
  calculateIndex,
  generateFlightOutput,
  mapCabinType,
  generateEmissionLink,
  generateTaxLink,
  applySimpleMarkdown,
  generatePayloadMonthlySingleDestination,
  generatePayloadMultipleDestinations,
};
