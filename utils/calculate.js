const getBestFlight = (flightSegment, cabinType) => {
  const mappedCabinType =
    cabinType === "ECO"
      ? "ECONOMIC"
      : cabinType === "EJE"
      ? "BUSINESS"
      : cabinType === "PEC"
      ? "PREMIUM_ECONOMIC"
      : undefined;
  return flightSegment.flightList.reduce(
    (previous, current) => {
      let currentMiles = Number.MAX_VALUE;
      if (!cabinType || !mappedCabinType || current.cabin === mappedCabinType) {
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
