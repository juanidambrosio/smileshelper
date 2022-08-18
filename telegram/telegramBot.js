const TelegramBot = require("node-telegram-bot-api");
const { telegramApiToken } = require("../config/config");
const { calculateIndex } = require("../utils/parser");
const { searchFlights } = require("../search");
const {
  notFound,
  incorrectFormat,
  dailyTweet,
  genericError,
} = require("../twitter/constants");

const bot = new TelegramBot(telegramApiToken, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "/start") {
    bot.sendMessage(chatId, dailyTweet);
    return;
  }

  const trimmedText = msg.text.replace(/\s/g, "").replace("@smileshelper", "");

  const regex = new RegExp(/\w{6}(2022|2023|2024)(-|\/)(0|1)\d/);

  if (!regex.test(trimmedText)) {
    bot.sendMessage(chatId, incorrectFormat);
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
          current.departureDay + "/" + month + ": " + current.price + "\n"
        ),
      payload.origin + " " + payload.destination.name + "\n"
    );
    console.log(trimmedText);
    bot.sendMessage(chatId, response);
  } catch (error) {
    bot.sendMessage(chatId, genericError);
  }
  //console.log(responseTweet);
});
