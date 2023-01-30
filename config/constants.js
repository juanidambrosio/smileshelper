const emoji = require("node-emoji");

const badResponse = "El formato es inválido.";

const dailyTweet =
  "Te ayudamos a encontrar las 10 mejores ofertas en millas! Respondé este tweet con el formato [ORIGEN] [DESTINO] [AÑO-MES]. Ejemplo EZE MAD 2023-05.";

const telegramStart =
  "Te ayudamos a encontrar las mejores ofertas en millas \\! El bot soporta los siguientes ejemplos: \n\n __Búsqueda simple__:\n`EZE MAD 2023\\-05` \n\n __Búsqueda por tipo de cabina__:\n`EZE MAD 2023\\-05 EJE`\n`EZE MAD 2023\\-05 ECO`\n`EZE MAD 2023\\-05 PEC` \\(premium economy\\)\n\n __Búsqueda por cantidad de adultos__:\n`EZE MAD 2023\\-05 3`\n\n __Búsqueda por región__: \n`EZE EUROPA 2023\\-05`\n`EZE EUROPA 2023\\-05\\-01`\n`EUROPA EZE 2023\\-05\\-01`\n`EUROPA EZE 2023\\-05\\-01`\n\n__Búsqueda ida y vuelta__:\n`EZE BCN 2023\\-03\\-01 2023\\-03\\-30 m7`\n`EZE BCN 2023\\-03\\-01 2023\\-03\\-30 m7 M14`\n`EZE BCN 2023\\-03\\-01 EJE 2 2023\\-03\\-30 m7 ECO 3` \n\n __Parámetros ida y vuelta__:\n\\m\\[OBLIGATORIO\\]\\: Mínima cantidad de días entre ida y vuelta\nM \\[OPCIONAL\\]\\: Máxima cantidad de días entre ida y vuelta\n\n__Filtros configurables__:\na:\\[Códigos de aerolineas a EXCLUIR, separados por espacio\\]\n\\e:\\[Cantidad máxima de escalas del vuelo\\]\n\\r:\\[Cantidad máxima de vuelos mostrados en las búsquedas\\]\n\\h:\\[Cantidad máxima de horas de duración de los vuelos mostrados en las búsquedas\\]\n\\vf \\[Solo muestra los vuelos que aceptan Viaje Fácil\\]\nsingol \\[Muestra los vuelos desde/hacia Brasil que corresponden a otras aerolíneas que no sean Gol\\]\n\\smilesandmoney \\[Muestra los precios de los vuelos usando la tarifa de Smiles & Money\\]\n\n\\Ejemplo: /filtros a:AA IB e:1\n\\(en este ejemplo cualquier búsqueda realizada luego de configurar esos valores excluirá a American Airlines, a Iberia y buscará vuelos de 0 o 1 escala\\)\n\n\\Otros ejemplos \\(tener en cuenta que las aerolíneas a excluir se irán sumando a medida que utilice ese filtro\\): \n\\/filtros a:AR\n\\/filtros e:2\n\\/filtros r:15\n\\/filtros h:17\n\\/filtros vf\n\\/filtros singol\n\\/filtros a:AV e:0 r:30 vf\n\\\n\\Los códigos de las aerolíneas los puede encontrar usando el comando: /aerolineas\n\n\\Para consultar sus filtros puede usar el siguiente comando: \n\\/filtros\n\n\\Para eliminar sus filtros y que no sean considerados para las búsquedas puede usar el siguiente comando: \n\\/filtroseliminar";

const incorrectFormat =
  "El formato indicado es incorrecto. Intentá de nuevo respondiendo con [ORIGEN] [DESTINO] [AÑO]-[MES]";

const notFound = "No se encontraron resultados para este tramo.";

const genericError =
  "Hubo un problema en el servidor de Smiles para responder la consulta. Intenta nuevamente.";

const retry = (attempt) =>
  `Error al consultar en smiles. Reintento numero ${attempt}/3`;

const searching = emoji.get("mag_right") + " Buscando las mejores ofertas...";

const cafecito = `Si te ayudé a encontrar tu vuelo ideal y te gustaría contribuir al proyecto de Smiles Helper, podés donar en este link de [Cafecito](https://cafecito.app/juandambrosio)\\. Muchas gracias\\!`;

const links = `\\-[Grupo de Telegram sobre alerta de ofertas en Smiles](https://t.me/+FiKom9f1944xYzIx)\n\\-[Grupo de Telegram sobre consultas de Smiles](https://t.me/+3JRDTJIf2gM0YWE5)\n\\-[Guía completa sobre Smiles](https://elviajeroserial.com/smiles-argentina-manual-del-usuario-analisis-estrategias-y-todo-lo-que-necesitas-saber/)\n\\-[Video explicativo sobre el uso de Smiles Helper](https://twitter.com/chicodlasmillas/status/1572362460707037186)\n`;

const groupChatIdAlerts = -1001638072368;
//const groupChatIdAlerts = -590494802;

const maxRetriesAlerts = 3;

const delaySecondsRetriesAlerts = 10000;

const SMILES_URL = "https://api-air-flightsearch-prd.smiles.com.br/v1/airlines";
const TWITTER_OWN_ID = "1529767809105920000";
const SMILES_EMISSION_URL = "https://www.smiles.com.ar/emission?";
const SMILES_TAX_URL =
  "https://api-airlines-boarding-tax-prd.smiles.com.br/v1/airlines/flight";

const airlinesCodes = `El listado de aerolíneas disponibles en Smiles es el siguiente: Use el código de 2 caracteres para configurar sus filtros:  \n\\\n\\AA: American Airlines\n\\AR: Aerolíneas Argentinas\n\\UX: Air Europa\n\\AM: AeroMéxico\n\\AV: Avianca\n\\CM: Copa Airlines\n\\AF: Air France\n\\KL: KLM\n\\AC: Air Canadá\n\\IB: Iberia\n\\EK: Emirates\n\\TK: Turkish Airlines\n\\TP: TAP Portugal\n\\SA: South African Airways\n\\ET: Ethiopian Airways\n\\AT: Royal Air Maroc\n\\KE: Korean Air\n\\2Z: Voe Pass\n\\G3: Gol\n\\FV: Viva Air\n\\A3: Aegean\n\\MS: Egyptair\n\\AS: Alaska Airlines\n\\EI: Aer Lingus\n\\VA: Virgin Australia\n\\V7: Volotea\n\\NH: Ana\n\\XW: Sky Express\n\\AI: Air India\n\\4O: Interjet\n\\OU: Croatia Airlines\n\\UP: Bahamas Air\n\\HA: Hawaiian Airlines\n\\OB: Boliviana de Aviación\n\\TR: Scoot\n\\OK: Czech Airlines\n\\JQ: Jetstar\n\\MN: Kulula\n\\PG: Bangkok Airways\n\\WM: Winair\n\\KQ: Kenya Airways\n\\BT: Air Baltic\n\\MU: China Estern\n\\ZP: Paranair\n\\ME: MEA\n\\GA: Garuda Indonesia\n\\HO: Juneyao Airlines\n\\SG: SpiceJet\n\\PY: Surinam Airways\n\\PS: UIA\n\\CX: Cathay Pacific\n\\TG: THAI\n\\JL: Japan Airlines\n\\S7: S7 Airlines\n\\FA: FlySafair\n\\H2: SKY Airline`;

const preferencesSave = "Se han guardado sus filtros.";

const preferencesDelete = "Se han eliminado sus filtros.";

const preferencesNone = "No tiene filtros guardados.";

const preferencesError =
  "Se ha presentado un error. Revise el formato del comando por favor";

const preferencesMap = new Map([
  ["airlines", "a: "],
  ["stops", "e: "],
  ["maxresults", "r: "],
  ["maxhours", "h: "],
  ["fare", "vf: "],
  ["brasilNonGol", "singol: "],
  ["smilesAndMoney", "smilesandmoney: "],
]);

const regionSave = "Se ha guardado la nueva region."

const maxAirports = 10;

module.exports = {
  badResponse,
  dailyTweet,
  telegramStart,
  incorrectFormat,
  notFound,
  genericError,
  retry,
  searching,
  cafecito,
  links,
  groupChatIdAlerts,
  maxRetriesAlerts,
  delaySecondsRetriesAlerts,
  SMILES_URL,
  TWITTER_OWN_ID,
  SMILES_EMISSION_URL,
  SMILES_TAX_URL,
  preferencesSave,
  preferencesDelete,
  preferencesError,
  preferencesNone,
  preferencesMap,
  regionSave,
  airlinesCodes,
  maxAirports
};
