const emoji = require("node-emoji");

const badResponse = "El formato es inválido.";

const dailyTweet =
  "Te ayudamos a encontrar las 10 mejores ofertas en millas! Respondé este tweet con el formato [ORIGEN] [DESTINO] [AÑO-MES]. Ejemplo EZE MAD 2023-05.";

const telegramStart = `Te ayudamos a encontrar las mejores ofertas en millas \\! El bot soporta los siguientes ejemplos: \n\n __Búsqueda simple__: EZE MAD 2023\\-05 \n\n __Búsqueda por tipo de cabina__: EZE MAD 2023\\-05 EJE , EZE MAD 2023\\-05 ECO, EZE MAD 2023\\-05 PEC \\(premium economy\\)\n\n __Búsqueda por cantidad de adultos__: EZE MAD 2023\\-05 3`;

const incorrectFormat =
  "El formato indicado es incorrecto. Intentá de nuevo respondiendo con [ORIGEN] [DESTINO] [AÑO]-[MES]";

const notFound = "No se encontraron resultados para este tramo.";

const genericError =
  "Hubo un problema en el servidor de Smiles para responder la consulta. Intenta nuevamente.";

const searching = emoji.get("mag_right") + " Buscando las mejores ofertas...";

const SMILES_URL = "https://api-air-flightsearch-prd.smiles.com.br/v1/airlines";
const TWITTER_OWN_ID = "1529767809105920000";
const SMILES_EMISSION_URL = "https://www.smiles.com.ar/emission?";
const SMILES_TAX_URL =
  "https://api-airlines-boarding-tax-prd.smiles.com.br/v1/airlines/flight";

const EUROPA = ["LIS", "MAD", "BCN", "PAR", "AMS", "ROM", "LON", "FRA", "IST"];

const NAMERICA = [
  "MEX",
  "MIA",
  "NYC",
  "FLL",
  "LAX",
  "MCO",
  "DFW",
  "LAS",
  "HNL",
  "SFO",
];

const SAMERICA = [
  "SCL",
  "LIM",
  "BOG",
  "BUE",
  "COR",
  "MVD",
  "ASU",
  "ROS",
  "UIO",
  "IGU",
];

const BRASIL = ["RIO", "SAO", "FLN", "MCZ", "SSA", "REC", "NAT"];

const CARIBE = ["CUN", "MEX", "PTY", "PUJ", "SJO", "AUA", "HAV", "CTG", "ADZ"];

const ASIA = ["DXB", "BKK", "TLV", "TYO", "DOH", "SEL", "SIN", "MLE"];

const AFRICA = ["CAI", "SEZ", "CPT", "DAR", "ADD", "RBA"];

const OCEANIA = ["AKL", "SYD"];

const regions = {
  EUROPA,
  NAMERICA,
  SAMERICA,
  BRASIL,
  CARIBE,
  ASIA,
  AFRICA,
  OCEANIA,
};

module.exports = {
  badResponse,
  dailyTweet,
  telegramStart,
  incorrectFormat,
  notFound,
  genericError,
  searching,
  regions,
  SMILES_URL,
  TWITTER_OWN_ID,
  SMILES_EMISSION_URL,
  SMILES_TAX_URL,
};
