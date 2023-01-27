const { mapCabinType } = require("./parser");

const getBestFlight = (
  flightSegment = { flightList: [] },
  preferences,
  offerType
) => {
  let currentFare = {};
  return flightSegment?.flightList.reduce(
    (previous, current) => {
      let currentMiles = Number.MAX_VALUE;
      if (flightSatisfiesPreferences(current, preferences)) {
        currentFare = current.fareList.find(
          (fare) => fare.type === offerType
        );
        currentMiles = currentFare.miles;
      }
      return previous.price <= currentMiles
        ? previous
        : {
          flight: current,
          price: currentMiles,
          money: currentFare.money,
          fareUid: currentFare.uid,
        };
    },
    { flight: {}, price: Number.MAX_VALUE }
  )
};

const flightSatisfiesPreferences = (flight, preferences) => {
  const { cabinType, airlines, stops, fare, maxhours } = preferences;
  const mappedCabinType = mapCabinType(cabinType);

  return (mappedCabinType === "all" || flight.cabin === mappedCabinType) &&
    (!airlines || !airlines.includes(flight.airline.code)) &&
    (!stops || flight.stops <= stops) &&
    (!fare || flight.sourceFare === "AWARD") &&
    (!maxhours || Number(flight.duration.hours) <= Number(maxhours))

}

module.exports = { getBestFlight };
