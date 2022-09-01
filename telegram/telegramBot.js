const TelegramBot = require("node-telegram-bot-api");
const emoji = require("node-emoji");
const FlightSearch = require("../models/FlightSearch");
const { telegramApiToken } = require("../config/config");
const {
  calculateIndex,
  applySimpleMarkdown,
  generateFlightOutput,
  generateEmissionLink,
} = require("../utils/parser");
const { searchFlights } = require("../search");
const {
  notFound,
  incorrectFormat,
  telegramStart,
  genericError,
} = require("../twitter/constants");
const dbOperations = require("../db/operations");

const listen = async () => {
  const { createOne } = await dbOperations("flight_search");
  const bot = new TelegramBot(telegramApiToken, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    bot.sendMessage(msg.chat.id, telegramStart, { parse_mode: "MarkdownV2" });
  });
  bot.onText(/\w{3}\s\w{3}\s\d{4}(-|\/)(0|1)\d/, async (msg) => {
    const chatId = msg.chat.id;

    const trimmedText = msg.text.replace(/\s/g, "");

    const { adults, cabinType } = calculateIndex(trimmedText.substring(13));
    const payload = {
      origin: trimmedText.substring(0, 3).toUpperCase(),
      destination: {
        name: trimmedText.substring(3, 6).toUpperCase(),
        departureYearMonth: trimmedText.substring(6, 13),
      },
      adults: adults ? trimmedText.substring(adults, adults + 1) : "",
      cabinType: cabinType
        ? trimmedText.substring(cabinType, cabinType + 3).toUpperCase()
        : "",
    };

    try {
      const flightList = await searchFlights(payload);
      const bestFlights = flightList.results;
      if (flightList.error) {
        const response = flightList.error;
        bot.sendMessage(chatId, response);
        return;
      }
      if (bestFlights.length === 0) {
        bot.sendMessage(chatId, notFound);
        return;
        //console.log(notFound);
      }
      const month = flightList.departureMonth.substring(5);
      const response = bestFlights.reduce(
        (previous, current) =>
          previous.concat(
            emoji.get("airplane") +
              applySimpleMarkdown(
                current.departureDay + "/" + month,
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
      console.log(trimmedText);
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
      const flightSearch = new FlightSearch(
        msg.from.username || msg.from.id.toString(),
        "telegram",
        new Date(),
        payload.origin,
        payload.destination.name,
        payload.destination.departureYearMonth.substring(0, 4),
        payload.destination.departureYearMonth.substring(5),
        bestFlights[0].price
      );
      await createOne(flightSearch);
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, genericError);
    }
  });
};

listen();
