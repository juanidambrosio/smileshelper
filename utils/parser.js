const emoji = require("node-emoji");
const { SMILES_EMISSION_URL, monthSections } = require("../config/constants");
const regions = require("../data/regions");
const airlines = require("../data/airlines");
const { padMonth } = require("../utils/string");

/*
Parse the message string to object indicating the index of the cabin and/or adults preference
Giving flexibility to include one or both of them in any order
EZE LON 2023-12 ECO 3
EZE LON 2023-12 3 ECO
EZE LON 2023-12 ECO
EZE LON 2023-12 3
*/
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

const getAdultsAndCabinType = (parameters) => {
  const regex = /^\d$|^(EJE|ECO|PEC)$/;
  const parametersToReturn = { adults: undefined, cabinType: undefined };
  for (const parameter of parameters) {
    if (regex.test(parameter?.toUpperCase())) {
      if (parameter.length === 3) {
        parametersToReturn.cabinType = parameter.toUpperCase();
      } else if (parameter.length === 1) {
        parametersToReturn.adults = parameter;
      }
    }
  }
  return parametersToReturn;
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
  `${SMILES_EMISSION_URL}originAirportCode=${flight.origin
  }&destinationAirportCode=${flight.destination}&departureDate=${new Date(
    flight.departureDate
  ).getTime()}&adults=${flight.adults || "1"
  }&infants=0&children=0&cabinType=${mapCabinType(flight.cabinType)}&tripType=${flight.tripType
  }`;

const generateEmissionLinkRoundTrip = (flight) =>
  generateEmissionLink(flight).concat(`&returnDate=${flight.returnDate}`);

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

const findMonthAndYearFromText = (text) => {
  let [origin, destination, dateString] = text.split(" ");
  // Safe check if the user inputs origin and destination as <ORIGIN>-<DESTINATION>
  if (!dateString) {
    dateString = destination;
  }
  if (dateString.includes("-")) return dateString;
  const month = Number(dateString);
  let year = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  if (month < currentMonth) {
    year += 1;
  }
  return `${year}-${dateString}`;
};

const generatePayloadMonthlySingleDestination = (match) => {
  const [origin, destination, departureMonth, parameter1, parameter2] =
    match.slice(1, 6);
  //TODO: Update below function to receive month when changing all payload generations
  const departureDate = findMonthAndYearFromText(match[0]);
  const { adults, cabinType } = getAdultsAndCabinType([parameter1, parameter2]);
  return {
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departureDate,
    adults: adults || "",
    cabinType: cabinType || "",
  };
};

const generatePayloadMonthlySingleDestinationAlerts = (text) => {
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

const generatePayloadMultipleDestinations = (
  match,
  customRegions = {},
  fixedDay
) => {
  const [origin, destination, departureMonth, parameter1, parameter2] =
    match.slice(1, 6);
  // If fixedDay, it would be departureDate and not departureMonth (we give entire date ex 2023-07-01)
  const departureDate = fixedDay
    ? departureMonth
    : findMonthAndYearFromText(match[0]);
  const regionsCopy = getCustomRegions(customRegions);
  const region = destination.toUpperCase();
  const { adults, cabinType } = getAdultsAndCabinType([parameter1, parameter2]);
  return {
    origin: origin.toUpperCase(),
    destination: regionsCopy ? regionsCopy[region] : regions[region],
    departureDate,
    adults: adults || "",
    cabinType: cabinType || "",
    region,
  };
};

const generatePayloadMultipleOrigins = (
  match,
  customRegions = {},
  fixedDay
) => {
  const [origin, destination, departureMonth, parameter1, parameter2] =
    match.slice(1, 6);
  // If fixedDay, it would be departureDate and not departureMonth (we give entire date ex 2023-07-01)
  const departureDate = fixedDay
    ? departureMonth
    : findMonthAndYearFromText(match[0]);
  const regionsCopy = getCustomRegions(customRegions);
  const region = origin.toUpperCase();
  const { adults, cabinType } = getAdultsAndCabinType([parameter1, parameter2]);
  return {
    origin: regionsCopy ? regionsCopy[region] : regions[region],
    destination: destination.toUpperCase(),
    departureDate,
    adults: adults || "",
    cabinType: cabinType || "",
    region,
  };
};

const getCustomRegions = (customRegions) => {
  let regionsCopy = undefined;
  if (customRegions) {
    regionsCopy = { ...regions };
    for (const [name, airports] of Object.entries(customRegions)) {
      regionsCopy[name] = airports;
    }
  }
  return regionsCopy;
};

const generatePayloadRoundTrip = (match) => {
  const [
    origin,
    destination,
    departureDate,
    returnDate,
    minDays,
    maxDays,
    parameter1,
    parameter2,
  ] = match.slice(1, 9);
  const { adults, cabinType } = getAdultsAndCabinType([parameter1, parameter2]);
  return {
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departureDate,
    returnDate,
    adults: adults || "",
    cabinType: cabinType || "",
    minDays: parseInt(minDays.substring(1), 10),
    maxDays: maxDays ? parseInt(maxDays.substring(1), 10) : undefined,
  };
};

const preferencesParser = (text, booleanPreferences) => {
  const { previousfare, previousBrasilNonGol, previousSmilesAndMoney } =
    booleanPreferences;

  const offsetAirlines = text.indexOf(" a:");
  const offsetStops = text.indexOf(" e:");
  const offsetResults = text.indexOf(" r:");
  const offsetHours = text.indexOf(" h:");
  const offsetVF = text.indexOf(" vf");
  const offsetBrasilNonGol = text.indexOf(" singol");
  const offsetSmilesAndMoney = text.indexOf(" smilesandmoney");
  const offsetCustomRegion = text.indexOf(" region");
  const offsetMilePrice = text.indexOf(" pm:");
  const offsetDolarPrice = text.indexOf(" pd:");

  const result = {};

  const airlinesEnd =
    offsetAirlines > 0 && offsetStops == -1 ? text.length : offsetStops;

  if (offsetAirlines > 0) {
    const airlinesArray = text
      .substring(offsetAirlines + 3, airlinesEnd)
      .toUpperCase()
      .split(" ")
      .filter((airline) => airlines.includes(airline));
    result.airlines = airlinesArray;
  }

  if (offsetCustomRegion > 0) {
    const [name, airportsString] = text
      .substring(offsetCustomRegion)
      .split("/");
    const airports = airportsString.toUpperCase().split(" ");
    result.customRegions = { name, airports };
  }

  if (offsetStops > 0) {
    result.stops = text.substring(offsetStops + 3, offsetStops + 4);
  }

  if (offsetResults > 0) {
    result.maxresults = text.substring(offsetResults + 3, offsetResults + 5);
  }

  if (offsetHours > 0) {
    result.maxhours = text.substring(offsetHours + 3, offsetHours + 5);
  }

  if (offsetMilePrice > 0) {
    result.milePrice = text.substring(offsetMilePrice + 4, offsetMilePrice + 8);
  }

  if (offsetDolarPrice > 0) {
    result.dolarPrice = text.substring(
      offsetDolarPrice + 4,
      offsetDolarPrice + 7
    );
  }

  if (offsetVF > 0) {
    result.fare = !previousfare;
  }

  if (offsetBrasilNonGol > 0) {
    result.brasilNonGol = !previousBrasilNonGol;
  }

  if (offsetSmilesAndMoney > 0) {
    result.smilesAndMoney = !previousSmilesAndMoney;
  }

  return result;
};

const getInlineKeyboardSearch = (
  origin,
  destination,
  parameter1,
  parameter2,
  bestFlight,
  preferences
) => {
  // const inlineKeyboard = monthSections.map((monthSection, indexSection) =>
  //   monthSection.map((month, indexMonth) => ({
  //     text: month.name,
  //     callback_data: `${origin} ${destination} ${padMonth(
  //       monthSection.length * indexSection + (indexMonth + 1)
  //     )} ${parameter1 || ""} ${parameter2 || ""}`.trimEnd(),
  //   }))
  // );
  const inlineKeyboard = [];
  if (bestFlight) {
    inlineKeyboard.push([
      {
        text: "Calcular $",
        callback_data: `calculadora ${bestFlight?.price} ${bestFlight?.tax.moneyNumber} ${preferences?.milePrice} ${preferences?.dolarPrice} ${bestFlight?.money}`,
      },
    ]);
  }
  return inlineKeyboard;
};

const getInlineKeyboardSearchOnlyCalculator = (bestFlight, preferences) => [
  [
    {
      text: "Calcular $",
      callback_data: `calculadora ${parseInt(bestFlight.departureFlight.price) +
        parseInt(bestFlight.returnFlight.price)
        } ${parseInt(bestFlight.departureFlight.tax.moneyNumber) +
        parseInt(bestFlight.returnFlight.tax.moneyNumber)
        } ${preferences?.milePrice} ${preferences?.dolarPrice} ${parseFloat(bestFlight.departureFlight.money) +
        parseFloat(bestFlight.returnFlight.money)
        }`,
    },
  ],
];

module.exports = {
  calculateIndex,
  generateFlightOutput,
  mapCabinType,
  generateEmissionLink,
  generateEmissionLinkRoundTrip,
  applySimpleMarkdown,
  partitionArrays,
  belongsToCity,
  generatePayloadMonthlySingleDestination,
  generatePayloadMonthlySingleDestinationAlerts,
  generatePayloadMultipleDestinations,
  generatePayloadMultipleOrigins,
  generatePayloadRoundTrip,
  preferencesParser,
  getInlineKeyboardSearch,
  getInlineKeyboardSearchOnlyCalculator,
};
