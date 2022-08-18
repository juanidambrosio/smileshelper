const calculatePrice = (flightSegment, cabinType) => {
  const mappedCabinType =
    cabinType === "ECO"
      ? "ECONOMIC"
      : cabinType === "EJE"
      ? "BUSINESS"
      : cabinType === "PEC"
      ? "PREMIUM_ECONOMIC"
      : undefined;
  if (!cabinType || !mappedCabinType) {
    return flightSegment.bestPricing?.miles;
  } else {
    return flightSegment.flightList.reduce((previous, current) => {
      let currentMiles = Number.MAX_VALUE;
      if (current.cabin === mappedCabinType) {
        currentMiles = current.fareList.find(
          (fare) => fare.type === "SMILES_CLUB"
        ).miles;
      }
      return Math.min(currentMiles, previous);
    }, Number.MAX_VALUE);
  }
};

module.exports = { calculatePrice };
