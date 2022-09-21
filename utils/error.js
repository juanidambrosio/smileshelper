const { genericError } = require("../config/constants");
const buildError = (errorMessage) => {
  switch (errorMessage) {
    case "Service Unavailable":
      return "El servicio no está disponible. Intenta nuevamente.";
    case "6. Data informada é inválida.":
      return "El tramo consultado pertenece a una fecha pasada.";
    case "TypeError: Cannot read property 'flightList' of undefined":
      return "Smiles está recibiendo demasiadas peticiones y no pudo contestar. Intenta nuevamente."
    default:
      return genericError;
  }
};

module.exports = { buildError };
