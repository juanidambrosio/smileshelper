const TelegramBot = require("node-telegram-bot-api");
const emoji = require("node-emoji");
const FlightSearch = require("../models/FlightSearch");
const { telegramApiToken } = require("../config/config");
const dbOperations = require("../db/operations");
const {
  notFound,
  telegramStart,
  genericError,
  searching,
  regions,
  retry,
  cafecito,
  links,
  preferencesSave,
  preferencesDelete,
  preferencesError,
  preferencesNone,
  airlinesCodes,
} = require("../config/constants");
const {
  generatePayloadMonthlySingleDestination,
  generatePayloadMultipleDestinations,
  generatePayloadMultipleOrigins,
  generatePayloadRoundTrip,
  applySimpleMarkdown,
  generateFlightOutput,
  generateEmissionLink,
  generateEmissionLinkRoundTrip,
  preferencesParser,
} = require("../utils/parser");
const {
  getFlights,
  getFlightsMultipleCities,
  getFlightsRoundTrip,
} = require("../clients/smilesClient");

const {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
  regexAirlines,
} = require("../utils/regex");

let preferences;

const listen = async () => {
  const { createOne } = await dbOperations("flight_search");
  const { createOne : createOnePref, upsert, getOne, deleteOne } = await dbOperations("preferences");
  const bot = new TelegramBot(telegramApiToken, { polling: true });

  bot.onText(/\/start/, async (msg) =>
    bot.sendMessage(msg.chat.id, telegramStart, { parse_mode: "MarkdownV2" })
  );

  bot.onText(/\/regiones/, async (msg) => {
    const airports = Object.entries(regions).reduce(
      (phrase, current) =>
        phrase.concat(
          applySimpleMarkdown(current[0], "__") + ": " + current[1] + "\n\n"
        ),
      ""
    );
    bot.sendMessage(msg.chat.id, airports, { parse_mode: "MarkdownV2" });
  });

  bot.onText(/\/cafecito/, async (msg) =>
    bot.sendMessage(msg.chat.id, cafecito, { parse_mode: "MarkdownV2" })
  );

  bot.onText(/\/links/, async (msg) =>
    bot.sendMessage(msg.chat.id, links, { parse_mode: "MarkdownV2" })
  );

  bot.onText(/\/aerolineas/, async (msg) =>
    bot.sendMessage(msg.chat.id, airlinesCodes, { parse_mode: "MarkdownV2" })
  );

  bot.onText(regexSingleCities, async (msg) => {
    const chatId = msg.chat.id;

    const payload = generatePayloadMonthlySingleDestination(msg.text);
    preferences = await getPreferences({
        id: msg.from.username || msg.from.id.toString(),
      }, 
      getOne);
    
    payload.preferences = preferences;
    
    bot.sendMessage(chatId, searching);
    try {
      const flightList = await getFlights(payload);
      const bestFlights = flightList.results;
      if (flightList.error) {
        return bot.sendMessage(chatId, flightList.error);
      }
      if (bestFlights.length === 0) {
        return bot.sendMessage(chatId, notFound);
      }
      const response = bestFlights.reduce(
        (previous, current) =>
          previous.concat(
            emoji.get("airplane") +
              applySimpleMarkdown(
                current.departureDay + "/" + flightList.departureMonth,
                "[",
                "]"
              ) +
              applySimpleMarkdown(
                generateEmissionLink({
                  ...payload,
                  departureDate:
                    payload.departureDate + "-" + current.departureDay + " 09:",
                  tripType: "2",
                }),
                "(",
                ")"
              ) +
              ": " +
              applySimpleMarkdown(
                `${current.price.toString()} + ${current.tax.miles}/${
                  current.tax.money
                }`,
                "*"
              ) +
              generateFlightOutput(current) +
              "\n"
          ),
        payload.origin + " " + payload.destination + "\n"
      );
      console.log(msg.text);
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });

      await createFlightSearch(
        {
          id: msg.from.username || msg.from.id.toString(),
          origin: payload.origin,
          destination: payload.destination,
          departureDate: payload.departureDate,
          price: bestFlights[0].price,
        },
        createOne
      );
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, genericError);
    }
  });

  bot.onText(
    regexMultipleDestinationMonthly,
    async (msg) => await searchRegionalQuery(bot, msg, false, false, createOne)
  );

  bot.onText(
    regexMultipleDestinationFixedDay,
    async (msg) => await searchRegionalQuery(bot, msg, true, false, createOne)
  );

  bot.onText(
    regexMultipleOriginMonthly,
    async (msg) => await searchRegionalQuery(bot, msg, false, true, createOne)
  );

  bot.onText(
    regexMultipleOriginFixedDay,
    async (msg) => await searchRegionalQuery(bot, msg, true, true, createOne)
  );

  bot.onText(regexRoundTrip, async (msg) => {
    const chatId = msg.chat.id;
    const payload = generatePayloadRoundTrip(msg.text);

    preferences = await getPreferences({
      id: msg.from.username || msg.from.id.toString(),
    }, 
    getOne);
  
    payload.preferences = preferences;

    try {
      bot.sendMessage(chatId, searching);
      const flightList = await getFlightsRoundTrip(payload);

      const bestFlights = flightList.results;
      if (flightList.error) {
        return bot.sendMessage(chatId, flightList.error);
      }
      if (bestFlights.length === 0) {
        return bot.sendMessage(chatId, notFound);
      }

      const response = bestFlights.reduce(
        (previous, current) =>
          previous.concat(
            emoji.get("airplane") +
              applySimpleMarkdown(
                current.departureFlight.departureDay.getDate() +
                  "/" +
                  (current.departureFlight.departureDay.getMonth() + 1) +
                  " - " +
                  current.returnFlight.departureDay.getDate() +
                  "/" +
                  (current.returnFlight.departureDay.getMonth() + 1),
                "[",
                "]"
              ) +
              applySimpleMarkdown(
                generateEmissionLinkRoundTrip({
                  ...payload,
                  departureDate:
                    current.departureFlight.departureDay.setHours(9),
                  returnDate: current.returnFlight.departureDay.setHours(9),
                  tripType: "1",
                }),
                "(",
                ")"
              ) +
              ": " +
              applySimpleMarkdown(
                `${current.departureFlight.price.toString()} + ${current.returnFlight.price.toString()} + ${Math.floor(
                  (current.departureFlight.tax.milesNumber +
                    current.returnFlight.tax.milesNumber) /
                    1000
                ).toString()}K/$${Math.floor(
                  (current.departureFlight.tax.moneyNumber +
                    current.returnFlight.tax.moneyNumber) /
                    1000
                ).toString()}K`,
                "*"
              ) +
              "\n IDA:" +
              generateFlightOutput(current.departureFlight) +
              "\n VUELTA:" +
              generateFlightOutput(current.returnFlight) +
              "\n"
          ),
        payload.origin + " " + payload.destination + "\n"
      );
      await createFlightSearch(
        {
          id: msg.from.username || msg.from.id.toString(),
          origin: payload.origin,
          destination: payload.destination,
          departureDate: payload.departureDate,
          returnDate: payload.returnDate,
          price:
            bestFlights[0].departureFlight.price +
            bestFlights[0].returnFlight.price,
        },
        createOne
      );
      console.log(msg.text);
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, genericError);
    }
  });

  bot.onText(regexAirlines, async (msg) => {
    const chatId = msg.chat.id;
    const result = preferencesParser(msg.text);
    const airlines = result.airlines;
    const stops = result.stops;
    try{
      if(airlines !== undefined){
        result.airlines = await existingPreferences(
          {
            id : msg.from.username || msg.from.id.toString(),
            airlines,
          },
          getOne
        );
      }
      
      await setPreferences(
        {
          id: msg.from.username || msg.from.id.toString(),
          result,
        },
        upsert
      );
      bot.sendMessage(chatId, preferencesSave, { parse_mode: "Markdown" });
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, preferencesError);
    }
  });

  bot.onText(/\/filtros-eliminar/, async (msg) => {
    const chatId = msg.chat.id;
    
    try{
      await deleteOne({author_id: msg.from.username || msg.from.id.toString()});
      bot.sendMessage(chatId, preferencesDelete, { parse_mode: "Markdown" });
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, preferencesError);
    }
  });

  bot.onText(/\/filtros$/, async (msg) => {
    const chatId = msg.chat.id;
    
    try{
      preferences = await getPreferences({
        id: msg.from.username || msg.from.id.toString(),
      }, 
      getOne);

      let response = "";
      if(preferences === null){
        response = preferencesNone;
      }else{
        if(preferences.hasOwnProperty('airlines')){
          response += "a: " + preferences.airlines.toString() + " ";
        }
        if(preferences.hasOwnProperty('stops')){
          response += "e: " + preferences.stops + " ";
        }
      }
      
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, preferencesError);
    }
  });

};

listen();

const searchRegionalQuery = async (
  bot,
  msg,
  fixedDay,
  isMultipleOrigin,
  createFlight
) => {
  const chatId = msg.chat.id;
  const payload = isMultipleOrigin
    ? generatePayloadMultipleOrigins(msg.text, fixedDay)
    : generatePayloadMultipleDestinations(msg.text, fixedDay);

  preferences = await getPreferences({
    id: msg.from.username || msg.from.id.toString(),
  }, 
  getOne);
  
  payload.preferences = preferences;

  try {
    bot.sendMessage(chatId, searching);
    const flightList = await getFlightsMultipleCities(
      payload,
      fixedDay,
      isMultipleOrigin
    );
    const bestFlights = flightList.results;

    if (!bestFlights) {
      throw new Error();
    }

    if (flightList.error) {
      return bot.sendMessage(chatId, flightList.error);
    }
    if (bestFlights.length === 0) {
      return bot.sendMessage(chatId, notFound);
    }

    const flightTitle = isMultipleOrigin
      ? `${payload.region} ${payload.destination} ${payload.departureDate}\n`
      : `${payload.origin} ${payload.region} ${payload.departureDate}\n`;

    const response = bestFlights.reduce((previous, current) => {
      const dateToShow = fixedDay
        ? ""
        : " " +
          current.departureDay +
          "/" +
          payload.departureDate.substring(5, 7);
      return previous.concat(
        emoji.get("airplane") +
          applySimpleMarkdown(
            (isMultipleOrigin ? current.origin : current.destination) +
              dateToShow,
            "[",
            "]"
          ) +
          applySimpleMarkdown(
            generateEmissionLink({
              ...payload,
              origin: isMultipleOrigin ? current.origin : payload.origin,
              destination: isMultipleOrigin
                ? payload.destination
                : current.destination,
              departureDate:
                payload.departureDate + "-" + current.departureDay + " 09:",
              tripType: "2",
            }),
            "(",
            ")"
          ) +
          ": " +
          applySimpleMarkdown(
            `${current.price.toString()} + ${current.tax.miles}/${
              current.tax.money
            }`,
            "*"
          ) +
          generateFlightOutput(current) +
          "\n"
      );
    }, flightTitle);
    await createFlightSearch(
      {
        id: msg.from.username || msg.from.id.toString(),
        origin: Array.isArray(payload.origin) ? payload.region : payload.origin,
        destination: Array.isArray(payload.destination)
          ? payload.region
          : payload.destination,
        departureDate: payload.departureDate,
        price: bestFlights[0].price,
      },
      createFlight
    );
    console.log(msg.text);
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, genericError);
  }
};

const createFlightSearch = async (data, createOne) => {
  const { id, origin, destination, departureDate, returnDate, price } = data;

  const flightSearch = new FlightSearch(
    id,
    "telegram",
    new Date(),
    origin,
    destination,
    departureDate.substring(0, 4),
    departureDate.substring(5, 7),
    returnDate ? returnDate.substring(0, 4) : undefined,
    returnDate ? returnDate.substring(5, 7) : undefined,
    price
  );
  await createOne(flightSearch);
};

const setPreferences = async (data, upsert) => {
  const { id, result } = data;
  await upsert({author_id: id}, {$set: result});
};

const existingPreferences = async (data, getOne) => {
  const { id, airlines } = data;
  const previous = await getOne({author_id: id});

  if(previous !== null && previous.airlines !== undefined){
    return [...previous.airlines, ...airlines];
  }else{
    return airlines;
  }
};

const getPreferences = async (data, getOne) => {
  const { id } = data;
  return await getOne({author_id: id});
};