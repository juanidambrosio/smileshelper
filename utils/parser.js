const emoji = require("node-emoji");
const { SMILES_EMISSION_URL, regions, airlines } = require("../config/constants");

const calculateIndex = (parameters, indexStart) => {
  const regex = /^\d$|^(EJE|ECO|PEC)$|^\d (EJE|ECO|PEC)$|^(EJE|ECO|PEC) \d$/;

  if (regex.test(parameters?.toUpperCase())) {
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
  return { adults: undefined, cabinType: undefined };
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
  }&destinationAirportCode=${flight.destination}&departureDate=${new Date(
    flight.departureDate
  ).getTime()}&adults=${
    flight.adults || "1"
  }&infants=0&children=0&cabinType=${mapCabinType(flight.cabinType)}&tripType=${
    flight.tripType
  }`;

const generateEmissionLinkRoundTrip = (flight) =>
  generateEmissionLink(flight).concat(`&returnDate=${flight.returnDate}`);

const generateTaxLink = (flight) =>
  `adults=1&children=0&infants=0&fareuid=${flight.fareUid}&uid=${flight.uid}&type=SEGMENT_1&highlightText=SMILES_CLUB`;

const applySimpleMarkdown = (word, symbol, symbolEnd) =>
  symbol + word + (symbolEnd || symbol);

const partitionArrays = (array, predicate) => {
  return array.reduce(
    (acc, item) =>
      predicate(item) ? (acc[0].push(item), acc) : (acc[1].push(item), acc),
    [[], []]
  );
};

const belongsToCity = (airport, city) => {
  switch (city) {
    case "BUE":
      return ["EZE", "AEP"].includes(airport);
    case "RIO":
      return ["GIG", "SDU", "CFB"].includes(airport);
    case "LON":
      return ["LHR", "LGW", "LCY", "STN"].includes(airport);
    case "ROM":
      return ["FCO"].includes(airport);
    case "SAO":
      return ["GRU", "CGH"].includes(airport);
    case "PAR":
      return ["CDG", "ORY"].includes(airport);
    default:
      return airport === city;
  }
};

const generatePayloadMonthlySingleDestination = (text) => {
  const { adults, cabinType } = calculateIndex(text.substring(16), 16);
  return {
    origin: text.substring(0, 3).toUpperCase(),
    destination: text.substring(4, 7).toUpperCase(),
    departureDate: text.substring(8, 15),
    adults: adults ? text.substring(adults, adults + 1) : "",
    cabinType: cabinType
      ? text.substring(cabinType, cabinType + 3).toUpperCase()
      : "",
  };
};

const generatePayloadMultipleDestinations = (text, fixedDay) => {
  const offset = fixedDay ? 10 : 7;
  const region = text.substring(4, text.indexOf(" ", 4)).toUpperCase();
  const startIndexAfterRegion = region.length + 5;
  const { adults, cabinType } = calculateIndex(
    text.substring(startIndexAfterRegion + offset + 1),
    startIndexAfterRegion + offset + 1
  );
  return {
    origin: text.substring(0, 3).toUpperCase(),
    destination: regions[region],
    departureDate: text.substring(
      startIndexAfterRegion,
      startIndexAfterRegion + offset
    ),
    adults: adults ? text.substring(adults, adults + 1) : "",
    cabinType: cabinType
      ? text.substring(cabinType, cabinType + 3).toUpperCase()
      : "",
    region,
  };
};

const generatePayloadMultipleOrigins = (text, fixedDay) => {
  const offset = fixedDay ? 10 : 7;
  const region = text.substring(0, text.indexOf(" ")).toUpperCase();
  const startIndexAfterRegion = region.length + 5;
  const { adults, cabinType } = calculateIndex(
    text.substring(startIndexAfterRegion + offset + 1),
    startIndexAfterRegion + offset + 1
  );
  return {
    origin: regions[region],
    destination: text
      .substring(region.length + 1, region.length + 4)
      .toUpperCase(),
    departureDate: text.substring(
      startIndexAfterRegion,
      startIndexAfterRegion + offset
    ),
    adults: adults ? text.substring(adults, adults + 1) : "",
    cabinType: cabinType
      ? text.substring(cabinType, cabinType + 3).toUpperCase()
      : "",
    region,
  };
};

const generatePayloadRoundTrip = (text) => {
  // Get offset of coming date to know whether they exist options or not
  const offsetComing = text.indexOf("202", 19);
  const { adults: adultsGoing, cabinType: cabinTypeGoing } = calculateIndex(
    text.substring(19, offsetComing - 1),
    19
  );

  const minDaysStart = text.indexOf("m", offsetComing + 10) + 1;
  const minDaysEnd = text.indexOf(" ", minDaysStart);

  const maxDaysStart = text.indexOf("M", offsetComing + 10) + 1;
  const spaceExistsAfterMaxDays = text.indexOf(" ", maxDaysStart) !== -1;
  const maxDaysEnd =
    maxDaysStart !== 0
      ? spaceExistsAfterMaxDays
        ? text.indexOf(" ", maxDaysStart)
        : text.length + 2
      : undefined;

  const minDays = parseInt(
    text.substring(
      minDaysStart,
      minDaysEnd !== -1 ? minDaysEnd + 1 : text.length + 1
    ),
    10
  );
  const maxDays = maxDaysEnd
    ? parseInt(text.substring(maxDaysStart, maxDaysEnd + 1), 10)
    : undefined;

  const minDaysOffset = minDays.toString().length + 2;
  const maxDaysOffset = maxDays ? maxDays.toString().length + 2 : 0;

  const { adults: adultsComing, cabinType: cabinTypeComing } = calculateIndex(
    text.substring(offsetComing + 11 + minDaysOffset + maxDaysOffset),
    offsetComing + 11 + minDaysOffset + maxDaysOffset
  );
  return {
    origin: text.substring(0, 3).toUpperCase(),
    destination: text.substring(4, 7).toUpperCase(),
    departureDate: text.substring(8, 18),
    returnDate: text.substring(offsetComing, offsetComing + 10),
    adultsGoing: adultsGoing
      ? text.substring(adultsGoing, adultsGoing + 1)
      : "",
    cabinTypeGoing: cabinTypeGoing
      ? text.substring(cabinTypeGoing, cabinTypeGoing + 3).toUpperCase()
      : "",
    adultsComing: adultsComing
      ? text.substring(adultsComing, adultsComing + 1)
      : "",
    cabinTypeComing: cabinTypeComing
      ? text.substring(cabinTypeComing, cabinTypeComing + 3).toUpperCase()
      : "",
    minDays,
    maxDays,
  };
};

const preferencesParser = (text) => {
  const offsetAirlines = text.indexOf(" a:");
  const offsetStops = text.indexOf(" e:");
  const result = {};

  const airlinesEnd = (offsetAirlines > 0 && offsetStops == -1)? text.length : offsetStops;

  if(offsetAirlines > 0){
    const airlinesArray = text.substring(offsetAirlines + 3, airlinesEnd).toUpperCase().split(" ").filter(airline => airlines.includes(airline));
    Object.assign(result, {airlines : airlinesArray});
  }

  if(offsetStops > 0){
    Object.assign(result, {stops : text.substring(offsetStops + 3, offsetStops + 4)});
  }

  return result;
};

module.exports = {
  calculateIndex,
  generateFlightOutput,
  mapCabinType,
  generateEmissionLink,
  generateEmissionLinkRoundTrip,
  generateTaxLink,
  applySimpleMarkdown,
  partitionArrays,
  belongsToCity,
  generatePayloadMonthlySingleDestination,
  generatePayloadMultipleDestinations,
  generatePayloadMultipleOrigins,
  generatePayloadRoundTrip,
  preferencesParser,
};
