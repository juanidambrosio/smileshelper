const { default: axios } = require("axios");
const { backOff } = require("exponential-backoff");
const { SMILES_URL, SMILES_TAX_URL } = require("../config/constants.js");
const { smiles, maxResults } = require("../config/config.js");
const { parseDate, calculateFirstDay, lastDays } = require("../utils/days.js");
const { getBestFlight } = require("../utils/calculate.js");
const { sortFlights, sortFlightsRoundTrip } = require("../flightsHelper.js");
const { belongsToCity } = require("../utils/parser");

const headers = {
  authorization: `Bearer ${smiles.authorizationToken}`,
  "x-api-key": smiles.apiKey,
  "Content-Type": "application/json",
  Accept: "application/json",
  region: "ARGENTINA",
};

const smilesClient = axios.create({
  baseURL: SMILES_URL,
  headers,
  insecureHTTPParser: true,
});

const smilesTaxClient = axios.create({
  baseURL: SMILES_TAX_URL,
  headers,
  insecureHTTPParser: true,
});

async function searchFlights(params) {
  const response = await backOff(async () => {
    try {
      const { data } = await smilesClient.get("/search", { params });
      return { data };
    } catch(error) {
      const isFlightListUndefinedError = error.response?.data?.error === "TypeError: Cannot read property 'flightList' of undefined";
      const isServiceUnavailable = error.response?.data?.message === "Service Unavailable";
      // only attempt to backoff-retry requests matching any of the errors above, otherwise we will respond with the error straight to the client
      const shouldRetryRequest = isFlightListUndefinedError || isServiceUnavailable;
      if (shouldRetryRequest) throw error;
      return { error };
    }
  }, { jitter: 'full' });
  if (response.error) throw error;
  return response;
}

const getFlights = async (parameters) => {
  const { origin, destination, departureDate, cabinType, adults, preferences } =
    parameters;
  const lastDayOfMonthDeparture = lastDays.get(departureDate.substring(5));
  try {
    const getFlightPromises = [];
    for (
      let day = calculateFirstDay(departureDate);
      day <= lastDayOfMonthDeparture;
      day++
    ) {
      const params = buildParams(
        origin,
        destination,
        departureDate,
        adults,
        false,
        day,
        preferences?.brasilNonGol ? "true" : "false"
      );
      getFlightPromises.push(searchFlights(params));
    }
    const flightResults = (await Promise.all(getFlightPromises)).flat();
    const mappedFlightResults = (
      await Promise.all(
        flightResults.map(async (flightResult) => {
          const { flight, price, money, fareUid } = getBestFlight(
            flightResult.data?.requestedFlightSegmentList[0],
            cabinType,
            preferences?.smilesAndMoney ? "SMILES_MONEY_CLUB" : "SMILES_CLUB"
          );
          return {
            origin: flight.departure?.airport?.code,
            destination: flight.arrival?.airport?.code,
            price,
            money,
            departureDay: parseInt(flight.departure?.date?.substring(8, 10)),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            airlineCode: flight.airline?.code,
            seats: flight.availableSeats?.toString(),
            tax: fareUid
              ? await getTax(flight.uid, fareUid, preferences?.smilesAndMoney)
              : undefined,
            fare: flight.sourceFare,
          };
        })
      )
    ).filter((flight) => validFlight(flight, preferences));

    return {
      results: sortFlights(mappedFlightResults).slice(
        0,
        getBestFlightsCount(preferences?.maxresults)
      ),
      departureMonth: departureDate.substring(5, 7),
    };
  } catch (error) {
    return {
      statusError: error.response?.status,
      error:
        error.response?.data?.error ||
        error.response?.data?.errorMessage ||
        error.response?.data?.message,
    };
  }
};

const getFlightsMultipleCities = async (
  parameters,
  fixedDay,
  isMultipleOrigin
) => {
  const { origin, destination, departureDate, cabinType, adults, preferences } =
    parameters;

  const multipleCity = isMultipleOrigin ? origin : destination;
  const lastDayOfMonthDeparture = lastDays.get(departureDate.substring(5));
  const getFlightPromises = [];
  try {
    for (const city of multipleCity) {
      for (
        let day = fixedDay ? 0 : calculateFirstDay(departureDate);
        day < (fixedDay ? 1 : lastDayOfMonthDeparture);
        day++
      ) {
        const params = buildParams(
          isMultipleOrigin ? city : origin,
          isMultipleOrigin ? destination : city,
          departureDate,
          adults,
          fixedDay,
          fixedDay ? undefined : day,
          preferences?.brasilNonGol ? "true" : "false"
        );
        getFlightPromises.push(searchFlights(params));
      }
    }
    const flightResults = (await Promise.all(getFlightPromises)).flat();
    const mappedFlightResults = (
      await Promise.all(
        flightResults.map(async (flightResult) => {
          const { flight, price, money, fareUid } = getBestFlight(
            flightResult.data?.requestedFlightSegmentList[0],
            cabinType,
            preferences?.smilesAndMoney ? "SMILES_MONEY_CLUB" : "SMILES_CLUB"
          );
          return {
            origin: flight.departure?.airport?.code,
            destination: flight.arrival?.airport?.code,
            price,
            money,
            departureDay: parseInt(flight.departure?.date?.substring(8, 10)),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            airlineCode: flight.airline?.code,
            seats: flight.availableSeats?.toString(),
            tax: fareUid
              ? await getTax(flight.uid, fareUid, preferences?.smilesAndMoney)
              : undefined,
            fare: flight.sourceFare,
          };
        })
      )
    ).filter((flight) => validFlight(flight, preferences));
    return {
      results: sortFlights(mappedFlightResults.flat()).slice(
        0,
        getBestFlightsCount(preferences?.maxresults)
      ),
    };
  } catch (error) {
    console.log(
      "Error while getting flights: ",
      error.response?.data?.error ||
        error.response?.data?.errorMessage ||
        error.response?.data?.message
    );
    return {
      statusError: error.response?.status,
      error:
        error.response?.data?.error ||
        error.response?.data?.errorMessage ||
        error.response?.data?.message,
    };
  }
};

const getFlightsRoundTrip = async (parameters) => {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adultsGoing,
    cabinTypeGoing,
    adultsComing,
    cabinTypeComing,
    minDays,
    maxDays,
    preferences,
  } = parameters;

  const lastDepartureDate = new Date(returnDate);
  const firstReturnDate = new Date(departureDate);

  lastDepartureDate.setDate(lastDepartureDate.getDate() - minDays);
  firstReturnDate.setDate(firstReturnDate.getDate() + minDays);

  const getFlightPromises = [];

  try {
    for (
      let date = new Date(departureDate);
      date <= lastDepartureDate;
      date.setDate(date.getDate() + 1)
    ) {
      const paramsGoing = buildParams(
        origin,
        destination,
        date.toLocaleDateString("en-CA"),
        adultsGoing,
        true,
        undefined,
        preferences.brasilNonGol ? "true" : "false"
      );
      getFlightPromises.push(
        searchFlights(paramsGoing)
      );
    }

    for (
      let dateReturn = firstReturnDate;
      dateReturn <= new Date(returnDate);
      dateReturn.setDate(dateReturn.getDate() + 1)
    ) {
      const paramsComing = buildParams(
        destination,
        origin,
        dateReturn.toLocaleDateString("en-CA"),
        adultsComing,
        true,
        undefined,
        preferences.brasilNonGol ? "true" : "false"
      );
      getFlightPromises.push(
        searchFlights(paramsComing)
      );
    }

    const flightResults = (await Promise.all(getFlightPromises)).flat();
    const mappedFlightResults = (
      await Promise.all(
        flightResults.map(async (flightResult) => {
          const flightSegment =
            flightResult.data?.requestedFlightSegmentList[0];
          const departureAirport =
            flightSegment?.airports?.departureAirportList[0]?.code;
          const { flight, price, money, fareUid } = getBestFlight(
            flightSegment,
            belongsToCity(departureAirport, origin)
              ? cabinTypeGoing
              : cabinTypeComing,
            preferences?.smilesAndMoney ? "SMILES_MONEY_CLUB" : "SMILES_CLUB"
          );
          return {
            origin: departureAirport,
            destination: flight.arrival?.airport?.code,
            price,
            money,
            departureDay: new Date(flight.departure?.date),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            airlineCode: flight.airline?.code,
            seats: flight.availableSeats?.toString(),
            tax: fareUid
              ? await getTax(flight.uid, fareUid, preferences?.smilesAndMoney)
              : undefined,
            fare: flight.sourceFare,
          };
        })
      )
    ).filter((flight) => validFlight(flight, preferences));
    return {
      results: sortFlightsRoundTrip(
        mappedFlightResults,
        minDays,
        maxDays,
        origin
      ).slice(0, getBestFlightsCount(preferences.maxresults)),
    };
  } catch (error) {
    console.log(
      "Error while getting flights: ",
      error.response?.data?.error ||
        error.response?.data?.errorMessage ||
        error.response?.data?.message
    );
    return {
      statusError: error.response?.status,
      error:
        error.response?.data?.error ||
        error.response?.data?.errorMessage ||
        error.response?.data?.message,
    };
  }
};

const buildParams = (
  origin,
  destination,
  departureDate,
  adults,
  fixedDay,
  specificDay,
  brasilNonGol = "false"
) => ({
  adults: adults || "1",
  cabinType: "all",
  children: "0",
  currencyCode: "ARS",
  infants: "0",
  isFlexibleDateChecked: "false",
  tripType: "2",
  forceCongener: brasilNonGol,
  r: "ar",
  originAirportCode: origin,
  destinationAirportCode: destination,
  departureDate: fixedDay
    ? departureDate
    : parseDate(departureDate, specificDay),
});

const getTax = async (uid, fareuid, isSmilesMoney) => {
  const params = {
    adults: "1",
    children: "0",
    infants: "0",
    fareuid,
    uid,
    type: "SEGMENT_1",
    highlightText: isSmilesMoney ? "SMILES_MONEY_CLUB" : "SMILES_CLUB",
  };

  try {
    const { data } = await smilesTaxClient.get("/boardingtax", { params });
    const milesNumber = data?.totals?.totalBoardingTax?.miles;
    const moneyNumber = data?.totals?.totalBoardingTax?.money;
    return {
      miles: `${Math.floor(milesNumber / 1000)}K`,
      milesNumber,
      money: `$${Math.floor(moneyNumber / 1000)}K`,
      moneyNumber,
    };
  } catch (error) {
    return { miles: undefined };
  }
};

const validFlight = (flight, preferences) =>
  flight.price &&
  flight.price !== Number.MAX_VALUE.toString() &&
  flight.tax?.miles &&
  (!preferences ||
    ((!preferences.hasOwnProperty("airlines") ||
      !preferences.airlines.includes(flight.airlineCode)) &&
      (!preferences.hasOwnProperty("stops") ||
        flight.stops <= preferences.stops) &&
      (!preferences.hasOwnProperty("fare") || flight.fare == "AWARD") &&
      (!preferences.hasOwnProperty("maxhours") || Number(flight.duration) <= Number(preferences.maxhours))));

const getBestFlightsCount = (preferencesMaxResults) =>
  !preferencesMaxResults
    ? parseInt(maxResults, 10)
    : parseInt(preferencesMaxResults, 10);

module.exports = { getFlights, getFlightsMultipleCities, getFlightsRoundTrip };
