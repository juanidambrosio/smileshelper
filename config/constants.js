const emoji = require("node-emoji");

const badResponse = "El formato es inválido.";

const dailyTweet =
  "Te ayudamos a encontrar las 10 mejores ofertas en millas! Respondé este tweet con el formato [ORIGEN] [DESTINO] [AÑO-MES]. Ejemplo EZE MAD 2023-05.";

const telegramStart = `Te ayudamos a encontrar las mejores ofertas en millas \\! El bot soporta los siguientes ejemplos: \n\n __Búsqueda simple__: EZE MAD 2023\\-05 \n\n __Búsqueda por tipo de cabina__: EZE MAD 2023\\-05 EJE , EZE MAD 2023\\-05 ECO, EZE MAD 2023\\-05 PEC \\(premium economy\\)\n\n __Búsqueda por cantidad de adultos__: EZE MAD 2023\\-05 3\n\n __Búsqueda por región__: EZE EUROPA 2023\\-05\nEZE EUROPA 2023\\-05\\-01`;

const incorrectFormat =
  "El formato indicado es incorrecto. Intentá de nuevo respondiendo con [ORIGEN] [DESTINO] [AÑO]-[MES]";

const notFound = "No se encontraron resultados para este tramo.";

const genericError =
  "Hubo un problema en el servidor de Smiles para responder la consulta. Intenta nuevamente.";

const retry = (attempt) =>
  `Error al consultar en smiles. Reintento numero ${attempt}/3`;

const searching = emoji.get("mag_right") + " Buscando las mejores ofertas...";

const SMILES_URL = "https://api-air-flightsearch-prd.smiles.com.br/v1/airlines";
const TWITTER_OWN_ID = "1529767809105920000";
const SMILES_EMISSION_URL = "https://www.smiles.com.ar/emission?";
const SMILES_TAX_URL =
  "https://api-airlines-boarding-tax-prd.smiles.com.br/v1/airlines/flight";

const SAMERICA = ["SCL", "LIM", "BOG", "BUE", "MVD", "ASU", "UIO"];

const ARGENTINA = ["BUE", "COR", "ROS", "MDZ", "NQN", "BRC", "IGR"];

const BRASIL = ["RIO", "SAO", "FLN", "MCZ", "SSA", "REC", "NAT", "IGU"];

const COLOMBIA = ["BOG", "ADZ", "CTG", "SMR"];

const CARIBE = ["CUN", "PTY", "PUJ", "SJO", "AUA", "HAV", "CTG"];

const NAMERICA = ["MEX", "CHI", "NYC", "LAX", "DFW", "HNL", "SFO", "LAS"];

const FLORIDA = ["MIA", "FLL", "MCO", "TPA"];

const EUROPA = ["LIS", "MAD", "BCN", "PAR", "AMS", "ROM", "LON", "FRA", "IST"];

const CEUROPA = ["BRU", "ATH", "BER", "ZRH", "VIE", "PRG"];

const ESPANA = ["MAD", "BCN", "VLC", "PMI", "AGP", "IBZ", "SVQ"];

const ITALIA = ["ROM", "MIL", "BLQ", "VCE", "NAP"];

const ASIA = ["DXB", "BKK", "TLV", "TYO", "SEL", "DPS"];

const MORIENTE = ["IST", "CAI", "DXB", "TLV", "DOH"];

const SASIA = ["BKK", "SIN", "MLE", "DPS", "SGN", "KUL"];

const NASIA = ["TYO", "SEL", "HKG"];

const INDIA = ["DEL", "BLR", "BOM", "CCU", "JAI"];

const AFRICA = ["CAI", "SEZ", "CPT", "DAR", "ADD", "RBA"];

const OCEANIA = ["AKL", "SYD", "MEL"];

const regions = {
  SAMERICA,
  ARGENTINA,
  BRASIL,
  COLOMBIA,
  CARIBE,
  NAMERICA,
  FLORIDA,
  EUROPA,
  CEUROPA,
  ESPANA,
  ITALIA,
  ASIA,
  MORIENTE,
  SASIA,
  NASIA,
  INDIA,
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
  retry,
  searching,
  regions,
  SMILES_URL,
  TWITTER_OWN_ID,
  SMILES_EMISSION_URL,
  SMILES_TAX_URL,
};
