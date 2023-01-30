const TelegramBot = require("node-telegram-bot-api");
const { telegramApiToken } = require("../config/config");
const {
  telegramStart,
  cafecito,
  links,
  airlinesCodes,
  searching,
  maxAirports
} = require("../config/constants");
const regions = require("../data/regions");
const { applySimpleMarkdown } = require("../utils/parser");

const {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
  regexFilters,
  regexCustomRegion
} = require("../utils/regex");

const { checkDailyAlerts } = require("./alerts");

const {
  searchRegionalQuery,
  searchCityQuery,
  searchRoundTrip,
} = require("./search");

const {
  getPreferences,
  getRegions,
  setPreferences,
  deletePreferences,
  setRegion,
} = require("./preferences");

const { buildError } = require("../utils/error");

const { initializeDbFunctions } = require("../db/dbFunctions");

const listen = async () => {
  const bot = new TelegramBot(telegramApiToken, { polling: true });
  await initializeDbFunctions();
  await checkDailyAlerts(bot);

  bot.onText(/\/start/, async (msg) =>
    bot.sendMessage(msg.chat.id, telegramStart, { parse_mode: "MarkdownV2" })
  );

  bot.onText(/\/regiones/, async (msg) => {
    const entries = { ...regions, ...await getRegions(msg) };
    const airports = Object.entries(entries).reduce(
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
    try {
      bot.sendMessage(msg.chat.id, searching);
      const { response } = await searchCityQuery(msg);
      console.log(msg.text);
      bot.sendMessage(msg.chat.id, response, { parse_mode: "Markdown" });
    } catch (error) {
      console.log(error.message);
      bot.sendMessage(msg.chat.id, buildError(error.message));
    }
  });

  bot.onText(
    regexMultipleDestinationMonthly,
    async (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, searching);
      const { response, error } = await searchRegionalQuery(msg, false, false);

      if (error) {
        bot.sendMessage(chatId, error);
      }
      else {
        bot.sendMessage(chatId, response, { parse_mode: "Markdown" })
      }
    }
  );

  bot.onText(
    regexMultipleDestinationFixedDay,
    async (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, searching);
      const { response, error } = await searchRegionalQuery(msg, true, false);

      if (error) {
        bot.sendMessage(chatId, error);
      }
      else {
        bot.sendMessage(chatId, response, { parse_mode: "Markdown" })
      }
    }
  );

  bot.onText(
    regexMultipleOriginMonthly,
    async (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, searching);
      const { response, error } = await searchRegionalQuery(msg, false, true);

      if (error) {
        bot.sendMessage(chatId, error);
      }
      else {
        bot.sendMessage(chatId, response, { parse_mode: "Markdown" })
      }
    }
  );

  bot.onText(
    regexMultipleOriginFixedDay,
    async (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, searching);
      const { response, error } = await searchRegionalQuery(msg, true, true);

      if (error) {
        bot.sendMessage(chatId, error);
      }
      else {
        bot.sendMessage(chatId, response, { parse_mode: "Markdown" })
      }
    }
  );

  bot.onText(regexRoundTrip, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, searching);
    const { response, error } = await searchRoundTrip(msg);
    if (error) {
      bot.sendMessage(chatId, error);
    }
    else {
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" })
    }
  })

  bot.onText(regexFilters, async (msg) => {
    const chatId = msg.chat.id;
    const { response, error } = await setPreferences(msg);
    if (error) {
      bot.sendMessage(chatId, error);
    }
    else {
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    }
  });

  bot.onText(regexCustomRegion, async (msg, match) => {
    const chatId = msg.chat.id;
    const regionName = match[1].toUpperCase();
    const regionAirports = match[2].split(" ").slice(0, maxAirports).map(airport => airport.toUpperCase());
    const { response, error } = await setRegion(msg.from.username || msg.from.id.toString(), regionName, regionAirports);
    if (error) {
      bot.sendMessage(chatId, error);
    }
    else {
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    }
  });

  bot.onText(/\/filtroseliminar/, async (msg) => {
    const chatId = msg.chat.id;
    const { response, error } = await deletePreferences(msg);
    if (error) {
      bot.sendMessage(chatId, error);
    }
    else {
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    }
  });

  bot.onText(/\/filtros$/, async (msg) => {
    const chatId = msg.chat.id;
    const { response, error } = await getPreferences(msg);
    if (error) {
      bot.sendMessage(chatId, error);
    }
    else {
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    }
  });
};
listen();
