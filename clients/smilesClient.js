const { default: axios } = require("axios");
const { SMILES_URL } = require("../config/constants.js");
const { smiles } = require("../config/config.js");
const { parseDate, calculateFirstDay, lastDays } = require("../utils/days.js");
const { getBestFlight } = require("../utils/calculate.js");
const { sortAndSlice } = require("../flightsHelper.js");



const getFlights = async (parameters) => {

  const { origin, destination, departureYearMonth, cabinType, adults, operationCountry } =
    parameters;

  const headers = {
    authorization: `Bearer ${smiles.authorizationToken}`,
    "x-api-key": smiles.apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
    region: operationCountry || "ARGENTINA" ,
  };
  
  // TODO: Hasta aca hiciste llegar el operation country al header de la request, viajo por el handler search 
  const smilesClient = axios.create({
    baseURL: SMILES_URL,
    headers,
    insecureHTTPParser: true,
  });
  const lastDayOfMonthDeparture = lastDays.get(departureYearMonth.substring(5));
  try {
    const getFlightPromises = [];
    for (
      let day = calculateFirstDay(departureYearMonth);
      day <= lastDayOfMonthDeparture;
      day++
    ) {
      // TODO: aca hay que tambien parametrizar el campo currencyCode segun el pais (me imagino que aca ira algo como BRL), lo mismo con el parametro R que nose que pingo hace
      
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
        destinationAirportCode: destination,
        departureDate: parseDate(departureYearMonth, day),
      };
      getFlightPromises.push(smilesClient.get("/search", { params }));
    }
    const flightResults = (await Promise.all(getFlightPromises))
      .flat()
      .map((flightResult) => {
        const { flight, price } = getBestFlight(
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
        };
      })
      .filter((flight) => flight.price);
    return {
      origin,
      destination,
      results: sortAndSlice(flightResults),
      departureMonth: departureYearMonth,
    };
  } catch (error) {
    console.log("Error while getting flights: ", error);
    return {
      statusError: error.response?.status,
      error: error.response?.data?.errorMessage,
    };
  }
};

module.exports = { getFlights };
