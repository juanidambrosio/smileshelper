const { mapCabinType } = require("./parser");

const getBestFlight = (flightSegment, cabinType) => {
  const mappedCabinType = mapCabinType(cabinType);
  return flightSegment.flightList.reduce(
    (previous, current) => {
      let currentMiles = Number.MAX_VALUE;
      if (mappedCabinType === "all" || current.cabin === mappedCabinType) {
        currentFare = current.fareList.find(
          (fare) => fare.type === "SMILES_CLUB"
        );
        currentMiles = currentFare.miles;
      }
      return previous.price <= currentMiles
        ? previous
        : { flight: current, price: currentMiles, fareUid: currentFare.uid };
    },
    { flight: {}, price: Number.MAX_VALUE }
  );
};

module.exports = { getBestFlight };
