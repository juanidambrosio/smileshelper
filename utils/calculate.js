const { mapCabinType } = require("./parser");

const getBestFlight = (
  flightSegment = { flightList: [] },
  cabinType,
  offerType
) => {
  const mappedCabinType = mapCabinType(cabinType);
  return flightSegment?.flightList.reduce(
    (previous, current) => {
      let currentMiles = Number.MAX_VALUE;
      if (mappedCabinType === "all" || current.cabin === mappedCabinType) {
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
  );
};

module.exports = { getBestFlight };
