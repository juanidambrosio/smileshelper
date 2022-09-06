const { default: axios } = require("axios");
const { SMILES_URL, SMILES_TAX_URL } = require("../config/constants.js");
const { smiles } = require("../config/config.js");
const { parseDate, calculateFirstDay, lastDays } = require("../utils/days.js");
const { getBestFlight } = require("../utils/calculate.js");
const { sortAndSlice } = require("../flightsHelper.js");
const fs = require("fs").promises;

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
  const { origin, destination, cabinType, adults } = parameters;

  const { name, departureYearMonth } = destination;

  const lastDayOfMonthDeparture = lastDays.get(departureYearMonth.substring(5));
  try {
    const getFlightPromises = [];
    for (
      let day = calculateFirstDay(departureYearMonth);
      day <= lastDayOfMonthDeparture;
      day++
    ) {
      const params = {
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
        destinationAirportCode: name,
        departureDate: parseDate(departureYearMonth, day),
      };
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
            price: price.toString(),
            departureDay: parseInt(flight.departure?.date?.substring(8, 10)),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            seats: flight.availableSeats?.toString(),
            tax: fareUid ? await getTax(flight.uid, fareUid) : undefined,
          };
        })
      )
    ).filter((flight) => validFlight(flight));
    return {
      origin,
      destination: name,
      results: sortAndSlice(mappedFlightResults),
      departureMonth: departureYearMonth.substring(5),
    };
  } catch (error) {
    console.log(
      "Error while getting flights: ",
      error.response?.data?.error || error.response?.data?.errorMessage
    );
    return {
      statusError: error.response?.status,
      error: error.response?.data?.errorMessage,
    };
  }
};

const getFlightsMultipleDestinations = async (parameters, fixedDay) => {
  const { origin, destination, cabinType, adults } = parameters;

  const { name, departureDate } = destination;
  const lastDayOfMonthDeparture = lastDays.get(departureDate.substring(5));
  const getFlightPromises = [];
  try {
    for (const destinationName of name) {
      for (
        let day = fixedDay ? 0 : calculateFirstDay(departureDate);
        day < (fixedDay ? 1 : lastDayOfMonthDeparture);
        day++
      ) {
        const params = {
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
          destinationAirportCode: destinationName,
          departureDate: fixedDay
            ? departureDate
            : parseDate(departureDate, day),
        };
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
            price: price.toString(),
            departureDay: parseInt(flight.departure?.date?.substring(8, 10)),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            seats: flight.availableSeats?.toString(),
            tax: fareUid ? await getTax(flight.uid, fareUid) : undefined,
            destination: flight.arrival?.airport?.code,
          };
        })
      )
    ).filter((flight) => validFlight(flight));
    return {
      origin,
      results: sortAndSlice(mappedFlightResults.flat()),
    };
  } catch (error) {
    console.log(
      "Error while getting flights: ",
      error.response?.data?.error ||
        error.response?.data?.errorMessage ||
        error.response ||
        error
    );
    return {
      statusError: error.response?.status,
      error: error.response?.data?.errorMessage,
    };
  }
};

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

    return {
      miles: `${Math.floor(data?.totals?.totalBoardingTax?.miles / 1000)}K`,
      money: `$${Math.floor(
        data?.totals?.totalBoardingTax?.money / 1000
      ).toString()}K`,
    };
  } catch (error) {
    return { miles: undefined };
  }
};

const validFlight = (flight) =>
  flight.price &&
  flight.price !== Number.MAX_VALUE.toString() &&
  flight.tax?.miles;

module.exports = { getFlights, getFlightsMultipleDestinations };
