const TelegramBot = require("node-telegram-bot-api");
const emoji = require("node-emoji");
const FlightSearch = require("../models/FlightSearch");
const { telegramApiToken } = require("../config/config");
const {
  calculateIndex,
  applySimpleMarkdown,
  generateFlightOutput,
  generateLink,
} = require("../utils/parser");
const { searchFlights } = require("../search");
const { localization } = require("../twitter/constants");
const dbOperations = require("../db/operations");
const region = "ARGENTINA"

const listen = async () => {
  const { createOne } = await dbOperations("flight_search");
  const bot = new TelegramBot(telegramApiToken, { polling: true });

  bot.sendMessage()
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === "/start") {
      bot.sendMessage(chatId, localization.ES.dailyTweet);
      return;
    }

    const trimmedText = msg.text.replace(/\s/g, "");

    const regex = new RegExp(/\w{6}(2022|2023|2024)(-|\/)(0|1)\d/);

    if (!regex.test(trimmedText)) {
      bot.sendMessage(chatId, localization.ES.incorrectFormat);
      return;
    }
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
        operationCountry: region,

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
        bot.sendMessage(chatId, localization.ES.notFound);
        return;
        //console.log(localization.ES.notFound);
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
                generateLink({
                  ...payload,
                  departureDate:
                    payload.destination.departureYearMonth +
                    "-" +
                    current.departureDay,
                }),
                "(",
                ")"
              ) +
              ": " +
              applySimpleMarkdown(current.price, "*") +
              " millas" +
              generateFlightOutput(current) +
              "\n"
          ),
        payload.origin + " " + payload.destination.name + "\n"
      );
      console.log(trimmedText);
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
      // TODO: Falta agregar el region en la db de mongo
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
      bot.sendMessage(chatId, localization.ES.genericError);
    }
    //console.log(responseTweet);
  });
};

listen();
