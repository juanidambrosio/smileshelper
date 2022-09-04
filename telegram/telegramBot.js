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
} = require("../config/constants");
const {
  generatePayloadMonthlySingleDestination,
  generatePayloadMultipleDestinations,
  applySimpleMarkdown,
  generateFlightOutput,
  generateEmissionLink,
} = require("../utils/parser");
const {
  getFlights,
  getFlightsMultipleDestinations,
} = require("../clients/smilesClient");

const listen = async () => {
  const { createOne } = await dbOperations("flight_search");
  const bot = new TelegramBot(telegramApiToken, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    bot.sendMessage(msg.chat.id, telegramStart, { parse_mode: "MarkdownV2" });
  });

  bot.onText(/\w{3}\s\w{3}\s\d{4}(-|\/)(0|1)\d/, async (msg) => {
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
                    payload.destination.departureYearMonth +
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
          departureYearMonth: payload.destination.departureYearMonth,
          price: bestFlights[0].price,
        },
        createOne
      );
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, genericError);
    }
  });

  bot.onText(/\w{3}\s\w{4,8}\s\d{4}(-|\/)[0-1]\d/, async (msg) => {
    const chatId = msg.chat.id;
    const payload = generatePayloadMultipleDestinations(msg.text);
    try {
      bot.sendMessage(chatId, searching);
      const flightList = await getFlightsMultipleDestinations(payload);
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
      const response = bestFlights.reduce(
        (previous, current) =>
          previous.concat(
            emoji.get("airplane") +
              applySimpleMarkdown(
                current.destination +
                  " " +
                  current.departureDay +
                  "/" +
                  payload.destination.departureYearMonth.substring(5),
                "[",
                "]"
              ) +
              applySimpleMarkdown(
                generateEmissionLink({
                  ...payload,
                  destination: { name: current.destination },
                  departureDate:
                    payload.destination.departureYearMonth +
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
        payload.origin +
          " " +
          payload.region +
          " " +
          payload.destination.departureYearMonth +
          "\n"
      );
      console.log(msg.text);
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, genericError);
    }
  });
};

listen();

const createFlightSearch = async (data, createOne) => {
  const { id, origin, destination, departureYearMonth, price } = data;

  const flightSearch = new FlightSearch(
    id,
    "telegram",
    new Date(),
    origin,
    destination,
    departureYearMonth.substring(0, 4),
    departureYearMonth.substring(5),
    price
  );
  await createOne(flightSearch);
};
