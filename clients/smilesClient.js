const { default: axios } = require("axios");
const { SMILES_URL, SMILES_TAX_URL } = require("../config/constants.js");
const { smiles } = require("../config/config.js");
const { parseDate, calculateFirstDay, lastDays } = require("../utils/days.js");
const { getBestFlight } = require("../utils/calculate.js");
const { sortAndSlice } = require("../flightsHelper.js");

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
  const { origin, destination, departureDate, cabinType, adults } = parameters;

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
      destination,
      results: sortAndSlice(mappedFlightResults),
      departureMonth: departureDate.substring(5, 7),
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

const getFlightsMultipleCities = async (
  parameters,
  fixedDay,
  isMultipleOrigin
) => {
  const { origin, destination, departureDate, cabinType, adults } = parameters;

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
            price: price.toString(),
            departureDay: parseInt(flight.departure?.date?.substring(8, 10)),
            stops: flight.stops?.toString(),
            duration: flight.duration?.hours?.toString(),
            airline: flight.airline?.name,
            seats: flight.availableSeats?.toString(),
            tax: fareUid ? await getTax(flight.uid, fareUid) : undefined,
            destination: flight.arrival?.airport?.code,
            origin: flight.departure?.airport?.code,
          };
        })
      )
    ).filter((flight) => validFlight(flight));
    return {
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
  } = parameters;
  const parsedReturnDate = new Date(returnDate);
  //TODO: REVIEW HOW IT BEHAVES WITH MONTH CHANGE
  const lastDepartureDate = parsedReturnDate.setDate(
    parsedReturnDate.getDate - minDays
  );
  const getFlightPromises = [];
  try {
    for (
      let date = new Date(departureDate);
      date <= new Date(lastDepartureDate);
      date.setDate(day.getDate() + 1)
    ) {
      const paramsGoing = buildParams(origin, destination, date, adultsGoing);
      getFlightPromises.push(smilesClient.get("/search", { paramsGoing }));
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
      destination,
      results: sortAndSlice(mappedFlightResults),
      departureMonth: departureDate.substring(5, 7),
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

const buildParams = (origin, destination, departureDate, adults, fixedDay) => ({
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
  departureDate: fixedDay ? departureDate : parseDate(departureDate, fixedDay),
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

    return {
      miles: `${Math.floor(data?.totals?.totalBoardingTax?.miles / 1000)}K`,
      milesNumber: Math.floor(data?.totals?.totalBoardingTax?.miles / 1000),
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

module.exports = { getFlights, getFlightsMultipleCities, getFlightsRoundTrip };
