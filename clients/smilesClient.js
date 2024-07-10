const axios = require('axios');
const {backOff} = require('exponential-backoff');
const {SMILES_URL, SMILES_TAX_URL, tripTypes} = require('../config/constants');
const {smiles, maxResults} = require('../config/config');
const {parseDate, calculateFirstDay, lastDays} = require('../utils/days');
const {getBestFlight} = require('../utils/calculate');
const {sortFlights, sortFlightsRoundTrip} = require('../flightsHelper');
const {belongsToCity} = require('../utils/parser');

const headers = {
    authorization: `Bearer ${smiles.authorizationToken[Math.floor(Math.random() * smiles.authorizationToken.length)]}`,
    'x-api-key': smiles.apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    region: 'ARGENTINA',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
};

const createAxiosClient = (baseURL) => axios.create({
    baseURL,
    headers,
    insecureHTTPParser: true,
});

const smilesClient = createAxiosClient(SMILES_URL);
const smilesTaxClient = createAxiosClient(SMILES_TAX_URL);

const handleError = (error, id) => {
    const errorDetails = {
        message: error.message,
        code: error.code,
        config: error.config,
    };
    console.error(`could not get flight ${id}:`, JSON.stringify(errorDetails));
    return {data: {requestedFlightSegmentList: [{flightList: []}]}};
};


const handleErrorForTax = (error, id) => {
    const errorDetails = {
        message: error.message,
        code: error.code,
        config: error.config,
    };
    console.error(`could not get tax of ${id}:`, JSON.stringify(errorDetails));
    return undefined
};

const API_FAILURE_RETRY_CODES = ["ETIMEDOUT", "EAI_AGAIN", "ECONNRESET", "ERR_BAD_RESPONSE"];
const FLIGHT_LIST_ERRORS = [
    "TypeError: Cannot read properties of undefined (reading 'flightList')",
    "TypeError: Cannot read property 'flightList' of undefined",
];
const SERVICE_UNAVAILABLE_STATUS = 503;

const shouldRetry = (error) => {
    const isFlightListRelatedError = FLIGHT_LIST_ERRORS.includes(error.response?.data?.error);
    const isServiceUnavailable = error.response?.status === SERVICE_UNAVAILABLE_STATUS;
    return isFlightListRelatedError || isServiceUnavailable || API_FAILURE_RETRY_CODES.includes(error.code);
};

const shouldRetryTax = (error) => {
    const isFlightListRelatedError = FLIGHT_LIST_ERRORS.includes(error.response?.data?.error);
    const isServiceUnavailable = error.response?.status === SERVICE_UNAVAILABLE_STATUS;
    return isFlightListRelatedError || isServiceUnavailable || API_FAILURE_RETRY_CODES.includes(error.code);
};

const searchFlights = async (params) => {
    const maxAttempts = 3;
    let attempts = 0;
    const search = `${params.originAirportCode} ${params.destinationAirportCode} ${params.departureDate}`

    const response = await backOff(
        async () => {
            attempts++;
            if (attempts > 1) {
                console.log(`retrying ${search}`);
            }
            const {data} = await smilesClient.get("/search", {params});
            return {data};
        },
        {
            jitter: "full",
            numOfAttempts: maxAttempts,
            retry: (error, attemptNumber) => {
                const retry = shouldRetry(error);
                console.log(`error getting flight details for ${search}`,
                    JSON.stringify({
                        will_retry: retry,
                        attemptNumber: attemptNumber - 1,
                        message: error.message,
                        code: error.code
                    }));
                return retry
            },
        }
    );

    if (response.error && attempts >= maxAttempts) {
        return handleError(response.error, search);
    }

    if (attempts > 1) {
        console.log(`retry success ${search}`);
    }

    return response;
};

const createFlightObject = async (flightResult, preferences, cabinType) => {
    const {flight, price, money, fareUid} = getBestFlight(
        flightResult.data?.requestedFlightSegmentList[0],
        {...preferences, cabinType},
        preferences?.smilesAndMoney ? 'SMILES_MONEY_CLUB' : 'SMILES_CLUB'
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
        seats: flight.availableSeats?.toString(),
        tax: fareUid
            ? await getTax(flight.uid, fareUid, preferences?.smilesAndMoney)
            : undefined,
    };
};

const getFlights = async (parameters) => {
    const {origin, destination, departureDate, cabinType, adults, preferences, startDate, endDate} = parameters;
    const lastDayOfMonthDeparture = lastDays.get(departureDate.substring(5));
    const getFlightPromises = [];
    const startDateFinal = startDate > 0 ? startDate : calculateFirstDay(departureDate);
    const endDateFinal = endDate > 0 ? endDate : lastDayOfMonthDeparture;

    for (let day = startDateFinal; day <= endDateFinal; day++) {
        const params = buildParams(origin, destination, departureDate.replace("/", "-"), adults, false, day, preferences?.brasilNonGol ? "true" : "false");
        getFlightPromises.push(searchFlights(params));
    }

    const flightResults = (await Promise.all(getFlightPromises)).flat();
    const mappedFlightResults = (await Promise.all(flightResults.map(flightResult => createFlightObject(flightResult, preferences, cabinType)))).filter(flight => validFlight(flight));

    return {
        results: sortFlights(mappedFlightResults).slice(0, getBestFlightsCount(preferences?.maxresults)),
        departureMonth: departureDate.substring(5, 7),
    };
};

const getFlightsMultipleCities = async (parameters, fixedDay, isMultipleOrigin) => {
    const {origin, destination, departureDate, cabinType, adults, preferences, startDate, endDate} = parameters;
    const multipleCity = isMultipleOrigin ? origin : destination;
    const lastDayOfMonthDeparture = lastDays.get(departureDate.substring(5));
    const getFlightPromises = [];
    let startDateFinal = startDate > 0 ? startDate : calculateFirstDay(departureDate);
    let endDateFinal = endDate > 0 ? endDate : lastDayOfMonthDeparture;
    if (fixedDay) {
        startDateFinal = 0
        endDateFinal = 1
    }

    for (const city of multipleCity) {
        for (let day = startDateFinal; day <= endDateFinal; day++) {
            const params = buildParams(isMultipleOrigin ? city : origin, isMultipleOrigin ? destination : city, departureDate.replace("/", "-"), adults, fixedDay, fixedDay ? undefined : day, preferences?.brasilNonGol ? "true" : "false");
            getFlightPromises.push(searchFlights(params));
        }
    }

    const flightResults = (await Promise.all(getFlightPromises)).flat();
    const mappedFlightResults = (await Promise.all(flightResults.map(flightResult => createFlightObject(flightResult, preferences, cabinType)))).filter(flight => validFlight(flight));

    return {
        results: sortFlights(mappedFlightResults.flat()).slice(0, getBestFlightsCount(preferences?.maxresults)),
    };
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
        preferences
    } = parameters;
    const lastDepartureDate = new Date(returnDate);
    const firstReturnDate = new Date(departureDate);
    const getFlightPromises = [];

    lastDepartureDate.setDate(lastDepartureDate.getDate() - minDays);
    firstReturnDate.setDate(firstReturnDate.getDate() + minDays);

    for (let date = new Date(departureDate); date <= lastDepartureDate; date.setDate(date.getDate() + 1)) {
        const paramsGoing = buildParams(origin, destination, date.toLocaleDateString("fr-CA"), adultsGoing, true, undefined, preferences?.brasilNonGol ? "true" : "false");
        getFlightPromises.push(searchFlights(paramsGoing));
    }

    for (let dateReturn = firstReturnDate; dateReturn <= new Date(returnDate); dateReturn.setDate(dateReturn.getDate() + 1)) {
        const paramsComing = buildParams(destination, origin, dateReturn.toLocaleDateString("fr-CA"), adultsComing, true, undefined, preferences?.brasilNonGol ? "true" : "false");
        getFlightPromises.push(searchFlights(paramsComing));
    }

    const flightResults = (await Promise.all(getFlightPromises)).flat();
    const mappedFlightResults = (await Promise.all(flightResults.map(flightResult => {
        const cabinType = belongsToCity(flightResult.data?.requestedFlightSegmentList[0]?.airports?.departureAirportList[0]?.code, origin) ? cabinTypeGoing : cabinTypeComing;
        return createFlightObject(flightResult, preferences, cabinType);
    }))).filter(flight => validFlight(flight));

    return {
        results: sortFlightsRoundTrip(mappedFlightResults, minDays, maxDays, origin).slice(0, getBestFlightsCount(preferences?.maxresults)),
    };
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
    tripType: tripTypes.ONE_WAY,
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
        const {data} = await smilesTaxClient.get("/boardingtax", {params});
        const milesNumber = data?.totals?.totalBoardingTax?.miles;
        const moneyNumber = data?.totals?.totalBoardingTax?.money;
        return {
            miles: `${Math.floor(milesNumber / 1000)}K`,
            milesNumber,
            money: `$${Math.floor(moneyNumber / 1000)}K`,
            moneyNumber,
        };
    } catch (error) {
        console.error(`could not get tax of ${uid}:`, JSON.stringify({
            message: error.message,
            code: error.code
        }));
        return {miles: undefined};
    }
};


const validFlight = (flight) =>
    flight.price &&
    flight.price !== Number.MAX_VALUE.toString() &&
    flight.tax?.miles;

const getBestFlightsCount = (preferencesMaxResults) =>
    !preferencesMaxResults
        ? parseInt(maxResults, 10)
        : parseInt(preferencesMaxResults, 10);

module.exports = {getFlights, getFlightsMultipleCities, getFlightsRoundTrip};
