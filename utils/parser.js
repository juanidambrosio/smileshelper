const calculateIndex = (parameters) => {
  if (parameters.length) {
    switch (parameters.length) {
      case 4:
        return !isNaN(parameters[0])
          ? {
              adults: 13,
              cabinType: 14,
            }
          : {
              adults: 16,
              cabinType: 13,
            };
      case 3:
        return { cabinType: 13 };
      case 1:
        return { adults: 13 };
    }
  }
  return { adults: 13, cabinType: 13 };
};

const generateString = (flight) => {
  const parameters = [
    flight.airline,
    flight.stops + " escalas",
    flight.duration + " hs de duracion",
  ];
  return parameters.map((parameter) => " - " + parameter);
};

module.exports = {
  calculateIndex,
  generateString,
};
