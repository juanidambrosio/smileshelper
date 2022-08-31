const { mapCabinType } = require("./parser");

const getBestFlight = (flightSegment, cabinType) => {
  const mappedCabinType = mapCabinType(cabinType);
  return flightSegment.flightList.reduce(
    (previous, current) => {
      let currentMiles = Number.MAX_VALUE;
      if (mappedCabinType === "all" || current.cabin === mappedCabinType) {
        currentMiles = current.fareList.find(
          (fare) => fare.type === "SMILES_CLUB"
        ).miles;
      }
      return previous.price <= currentMiles
        ? previous
        : { flight: current, price: currentMiles };
    },
    { flight: {}, price: Number.MAX_VALUE }
  );
};

module.exports = { getBestFlight };
