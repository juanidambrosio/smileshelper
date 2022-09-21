const { default: axios } = require("axios");
const { SMILES_URL, SMILES_TAX_URL } = require("../config/constants.js");
const { smiles } = require("../config/config.js");
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
        day
      );
      getFlightPromises.push(smilesClient.get("/search", { params }));
    }
    const flightResults = (await Promise.all(getFlightPromises)).flat();
    const mappedFlightResults = (
      await Promise.all(
        flightResults.map(async (flightResult) => {
          const { flight, price, fareUid } = getBestFlight(
            flightResult.data?.requestedFlightSegmentList[0],
            cabinType
          );
          return {
            origin: flight.departure?.airport?.code,
            destination: flight.arrival?.airport?.code,
            price,
            departureDay: parseInt(flight.departure?.date?.substring(8, 10)),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            airlineCode: flight.airline?.code,
            seats: flight.availableSeats?.toString(),
            tax: fareUid ? await getTax(flight.uid, fareUid) : undefined,
          };
        })
      )
    ).filter((flight) => validFlight(flight, preferences));

    return {
      results: sortFlights(mappedFlightResults).slice(
        0,
        getBestFlightsCount(preferences)
      ),
      departureMonth: departureDate.substring(5, 7),
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
          fixedDay ? undefined : day
        );
        getFlightPromises.push(smilesClient.get("/search", { params }));
      }
    }
    const flightResults = (await Promise.all(getFlightPromises)).flat();
    const mappedFlightResults = (
      await Promise.all(
        flightResults.map(async (flightResult) => {
          const { flight, price, fareUid } = getBestFlight(
            flightResult.data?.requestedFlightSegmentList[0],
            cabinType
          );
          return {
            origin: flight.departure?.airport?.code,
            destination: flight.arrival?.airport?.code,
            price,
            departureDay: parseInt(flight.departure?.date?.substring(8, 10)),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            airlineCode: flight.airline?.code,
            seats: flight.availableSeats?.toString(),
            tax: fareUid ? await getTax(flight.uid, fareUid) : undefined,
          };
        })
      )
    ).filter((flight) => validFlight(flight, preferences));
    return {
      results: sortFlights(mappedFlightResults.flat()).slice(
        0,
        getBestFlightsCount(preferences)
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

  const showResults = getBestFlightsCount(preferences);

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
        true
      );
      getFlightPromises.push(
        smilesClient.get("/search", { params: paramsGoing })
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
        true
      );
      getFlightPromises.push(
        smilesClient.get("/search", {
          params: paramsComing,
        })
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
          const { flight, price, fareUid } = getBestFlight(
            flightSegment,
            belongsToCity(departureAirport, origin)
              ? cabinTypeGoing
              : cabinTypeComing
          );
          return {
            origin: departureAirport,
            destination: flight.arrival?.airport?.code,
            price,
            departureDay: new Date(flight.departure?.date),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            airlineCode: flight.airline?.code,
            seats: flight.availableSeats?.toString(),
            tax: fareUid ? await getTax(flight.uid, fareUid) : undefined,
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
      ).slice(0, getBestFlightsCount(preferences)),
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
  specificDay
) => ({
  adults: adults || "1",
  cabinType: "all",
  children: "0",
  currencyCode: "ARS",
  infants: "0",
  isFlexibleDateChecked: "false",
  tripType: "2",
  forceCongener: "false",
  r: "ar",
  originAirportCode: origin,
  destinationAirportCode: destination,
  departureDate: fixedDay
    ? departureDate
    : parseDate(departureDate, specificDay),
});

const getTax = async (uid, fareuid) => {
  const params = {
    adults: "1",
    children: "0",
    infants: "0",
    fareuid,
    uid,
    type: "SEGMENT_1",
    highlightText: "SMILES_CLUB",
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
    !preferences.hasOwnProperty("airlines") ||
    !preferences.airlines.includes(flight.airlineCode)) &&
  (!preferences ||
    !preferences.hasOwnProperty("stops") ||
    flight.stops <= preferences.stops);

const getBestFlightsCount = (preferences) =>
  !preferences || !preferences.hasOwnProperty("maxresults")
    ? parseInt(maxResults, 10)
    : parseInt(preferences.maxresults, 10);

module.exports = { getFlights, getFlightsMultipleCities, getFlightsRoundTrip };
