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
} = require("../config/constants");
const {
  generatePayloadMonthlySingleDestination,
  generatePayloadMultipleDestinations,
  generatePayloadMultipleOrigins,
  applySimpleMarkdown,
  generateFlightOutput,
  generateEmissionLink,
} = require("../utils/parser");
const {
  getFlights,
  getFlightsMultipleCities,
} = require("../clients/smilesClient");

const {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
} = require("../utils/regex");

const listen = async () => {
  const { createOne } = await dbOperations("flight_search");
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

  bot.onText(regexSingleCities, async (msg) => {
    const chatId = msg.chat.id;

    const payload = generatePayloadMonthlySingleDestination(msg.text);
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
                    payload.destination.departureDate +
                    "-" +
                    current.departureDay +
                    " 09:",
                }),
                "(",
                ")"
              ) +
              ": " +
              applySimpleMarkdown(
                current.tax?.miles
                  ? `${current.price} + ${current.tax?.miles}/${current.tax?.money}`
                  : `${current.price}`,
                "*"
              ) +
              generateFlightOutput(current) +
              "\n"
          ),
        payload.origin + " " + payload.destination.name + "\n"
      );
      console.log(msg.text);
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });

      await createFlightSearch(
        {
          id: msg.from.username || msg.from.id.toString(),
          origin: payload.origin,
          destination: payload.destination.name,
          departureDate: payload.destination.departureDate,
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
    async (msg) => await searchRegionalQuery(bot, msg, false, false)
  );

  bot.onText(
    regexMultipleDestinationFixedDay,
    async (msg) => await searchRegionalQuery(bot, msg, true, false)
  );

  bot.onText(
    regexMultipleOriginMonthly,
    async (msg) => await searchRegionalQuery(bot, msg, false, true)
  );

  bot.onText(
    regexMultipleOriginFixedDay,
    async (msg) => await searchRegionalQuery(bot, msg, true, true)
  );
};

listen();

const searchRegionalQuery = async (
  bot,
  msg,
  fixedDay,
  isMultipleOrigin,
  attempt = 1
) => {
  const chatId = msg.chat.id;
  const payload = isMultipleOrigin
    ? generatePayloadMultipleOrigins(msg.text, fixedDay)
    : generatePayloadMultipleDestinations(msg.text, fixedDay);
  try {
    bot.sendMessage(chatId, searching);
    const flightList = await getFlightsMultipleCities(
      payload,
      fixedDay,
      isMultipleOrigin
    );
    const bestFlights = flightList.results;

    if (!bestFlights) {
      // if (attempt <= 3) {
      //   bot.sendMessage(chatId, retry(attempt));
      //   await searchRegionalQuery(bot, msg, fixedDay, attempt + 1);
      //   return;
      // } else {
      //   throw new Error();
      // }
      throw new Error();
    }

    if (flightList.error) {
      return bot.sendMessage(chatId, flightList.error);
    }
    if (bestFlights.length === 0) {
      return bot.sendMessage(chatId, notFound);
    }

    const flightTitle = isMultipleOrigin
      ? `${payload.region} ${payload.destination.name} ${payload.destination.departureDate}\n`
      : `${payload.origin} ${payload.region} ${payload.destination.departureDate}\n`;

    const response = bestFlights.reduce((previous, current) => {
      const dateToShow = fixedDay
        ? ""
        : " " +
          current.departureDay +
          "/" +
          payload.destination.departureDate.substring(5, 7);
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
                : { name: current.destination },
              departureDate:
                payload.destination.departureDate +
                "-" +
                current.departureDay +
                " 09:",
            }),
            "(",
            ")"
          ) +
          ": " +
          applySimpleMarkdown(
            current.tax?.miles
              ? `${current.price} + ${current.tax?.miles}/${current.tax?.money}`
              : `${current.price}`,
            "*"
          ) +
          generateFlightOutput(current) +
          "\n"
      );
    }, flightTitle);
    console.log(msg.text);
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, genericError);
  }
};

const createFlightSearch = async (data, createOne) => {
  const { id, origin, destination, departureDate, price } = data;

  const flightSearch = new FlightSearch(
    id,
    "telegram",
    new Date(),
    origin,
    destination,
    departureDate.substring(0, 4),
    departureDate.substring(5, 7),
    price
  );
  await createOne(flightSearch);
};
