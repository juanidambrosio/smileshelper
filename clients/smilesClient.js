const { default: axios } = require("axios");
const https = require("https");
const { backOff } = require("exponential-backoff");
const {
  SMILES_URL,
  SMILES_TAX_URL,
  tripTypes,
} = require("../config/constants.js");
const { smiles, maxResults } = require("../config/config.js");
const { parseDate, calculateFirstDay, lastDays } = require("../utils/days.js");
const { getBestFlight } = require("../utils/bestFlight.js");
const { sortFlights, sortFlightsRoundTrip } = require("../flightsHelper.js");

const headers = {
  Accept: "application/json, */*",
  "Content-Type": "application/json",
  Region: "ARGENTINA",
  "User-Agent": "",
  "x-api-key": "aJqPU7xNHl9qN3NVZnPaJ208aPo2Bh2p2ZV844tw",
};

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246",
  "Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.54",
];

const lambdaClient = axios.create({
  baseURL: "https://hh0ly57vb7.execute-api.us-east-1.amazonaws.com",
});

const smilesClient = axios.create({
  baseURL: SMILES_URL,
  headers,
  maxRedirects: 0, //hace un redirect infinito x eso el timeout
  timeout: 1000 * 60,
  httpsAgent: new https.Agent({ keepAlive: true }),
  insecureHTTPParser: true,
});

const smilesClientOptions = axios.create({
  baseURL: SMILES_URL,
  maxRedirects: 0, //hace un redirect infinito x eso el timeout
  timeout: 1000 * 60,
  httpsAgent: new https.Agent({ keepAlive: true }),
  insecureHTTPParser: true,
  headers: {
    Origin: "https://www.smiles.com.ar",
    "User-Agent": "",
  },
  validateStatus: (status) => status >= 200 && status <= 302,
});

const smilesTaxClient = axios.create({
  baseURL: SMILES_TAX_URL,
  headers,
  insecureHTTPParser: true,
});

const searchFlights = async (params) => {
  try {
    const response = await backOff(
      async () => {
        const headerUserAgent =
          userAgents[Math.floor(Math.random() * userAgents.length)];
        const optionsResponse = await smilesClientOptions.options("/search", {
          params,
          headers: { "User-Agent": headerUserAgent },
        });
        const cookies = optionsResponse.headers["set-cookie"]
          ?.map((c) => {
            return c.split(" ")[0];
          })
          .join(" ");
        return await smilesClient.get("/search", {
          params,
          headers: { Cookie: cookies, "User-Agent": headerUserAgent },
        });
      },
      {
        jitter: "full",
        numOfAttempts: 3,
        startingDelay: 1000,
        delayFirstAttempt: true,
        retry: (error, attemptNumber) => {
          console.log(error.message);
          const apiFailureRetryCodes = [
            "ETIMEDOUT",
            "EAI_AGAIN",
            "ECONNRESET",
            "ERR_FR_TOO_MANY_REDIRECTS",
          ];
          const isFlightListRelatedError = [
            "TypeError: Cannot read properties of undefined (reading 'flightList')",
            "TypeError: Cannot read property 'flightList' of undefined",
          ].includes(error.response?.data?.error);
          const isServiceUnavailable = error.response?.status === 503;
          // only attempt to backoff-retry requests matching any of the errors above, otherwise we will respond with the error straight to the client
          const shouldRetryRequest =
            isFlightListRelatedError ||
            isServiceUnavailable ||
            apiFailureRetryCodes.includes(error.code);
          if (shouldRetryRequest) {
            console.log(`retry ${params.departureDate} #${attemptNumber}`);
            return true;
          }
          return false;
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error.message);
    return { data: { requestedFlightSegmentList: [{ flightList: [] }] } };
  }
};

const getFlightsLambda = async (params) =>
  (await lambdaClient.get("/search_month", { params })).data;

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
        departureDate.replace("/", "-"),
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
            { ...preferences, cabinType },
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
            seats: flight.availableSeats?.toString(),
            tax: fareUid
              ? await getTax(flight.uid, fareUid, preferences?.smilesAndMoney)
              : undefined,
          };
        })
      )
    ).filter((flight) => validFlight(flight));

    return {
      results: sortFlights(mappedFlightResults).slice(
        0,
        getBestFlightsCount(preferences?.maxresults)
      ),
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
          departureDate.replace("/", "-"),
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
            { ...preferences, cabinType },
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
            seats: flight.availableSeats?.toString(),
            tax: fareUid
              ? await getTax(flight.uid, fareUid, preferences?.smilesAndMoney)
              : undefined,
          };
        })
      )
    ).filter((flight) => validFlight(flight));
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
    adults,
    cabinType,
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
        date.toLocaleDateString("fr-CA"),
        adults,
        true,
        undefined,
        preferences?.brasilNonGol ? "true" : "false"
      );

      getFlightPromises.push(searchFlights(paramsGoing));
    }
    for (
      let dateReturn = firstReturnDate;
      dateReturn <= new Date(returnDate);
      dateReturn.setDate(dateReturn.getDate() + 1)
    ) {
      const paramsComing = buildParams(
        destination,
        origin,
        dateReturn.toLocaleDateString("fr-CA"),
        adults,
        true,
        undefined,
        preferences?.brasilNonGol ? "true" : "false"
      );
      getFlightPromises.push(searchFlights(paramsComing));
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
            {
              ...preferences,
              cabinType,
            },
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
            seats: flight.availableSeats?.toString(),
            tax: fareUid
              ? await getTax(flight.uid, fareUid, preferences?.smilesAndMoney)
              : undefined,
          };
        })
      )
    ).filter((flight) => validFlight(flight));
    return {
      results: sortFlightsRoundTrip(
        mappedFlightResults,
        minDays,
        maxDays,
        origin
      ).slice(0, getBestFlightsCount(preferences?.maxresults)),
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
    const headerUserAgent = {
      "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
    };
    const { data } = await smilesTaxClient.get("/boardingtax", {
      params,
      headers: headerUserAgent,
    });
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

const validFlight = (flight) =>
  flight.price &&
  flight.price !== Number.MAX_VALUE.toString() &&
  flight.tax?.miles;

const getBestFlightsCount = (preferencesMaxResults) =>
  !preferencesMaxResults
    ? parseInt(maxResults, 10)
    : parseInt(preferencesMaxResults, 10);

module.exports = {
  getFlights,
  getFlightsMultipleCities,
  getFlightsRoundTrip,
  getFlightsLambda,
};
