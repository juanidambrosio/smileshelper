const TelegramBot = require("node-telegram-bot-api");
const { telegramApiToken } = require("../config/config");
const dbOperations = require("../db/operations");
const {
  telegramStart,
  cafecito,
  links,
  airlinesCodes,
  searching,
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
  regexAirlines,
} = require("../utils/regex");

const { checkDailyAlerts } = require("./alerts");

const {
  searchRegionalQuery,
  searchCityQuery,
  searchRoundTrip,
} = require("./search");

const {
  getPreferences,
  setPreferences,
  deletePreferences,
} = require("./preferences");

const { buildError } = require("../utils/error");

const listen = async () => {
  const { createOne } = await dbOperations("flight_search");
  const { upsert, getOne, deleteOne } = await dbOperations("preferences");
  const bot = new TelegramBot(telegramApiToken, { polling: true });

  await checkDailyAlerts(bot);

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
    try {
      bot.sendMessage(msg.chat.id, searching);
      const { response } = await searchCityQuery(msg, { createOne, getOne });
      console.log(msg.text);
      bot.sendMessage(msg.chat.id, response, { parse_mode: "Markdown" });
    } catch (error) {
      console.log(error.message);
      bot.sendMessage(msg.chat.id, buildError(error.message));
    }
  });

  bot.onText(
    regexMultipleDestinationMonthly,
    async (msg) =>
      await searchRegionalQuery(bot, msg, false, false, { createOne, getOne })
  );

  bot.onText(
    regexMultipleDestinationFixedDay,
    async (msg) =>
      await searchRegionalQuery(bot, msg, true, false, { createOne, getOne })
  );

  bot.onText(
    regexMultipleOriginMonthly,
    async (msg) =>
      await searchRegionalQuery(bot, msg, false, true, { createOne, getOne })
  );

  bot.onText(
    regexMultipleOriginFixedDay,
    async (msg) =>
      await searchRegionalQuery(bot, msg, true, true, { createOne, getOne })
  );

  bot.onText(
    regexRoundTrip,
    async (msg) => await searchRoundTrip(bot, msg, { createOne, getOne })
  );

  bot.onText(regexAirlines, async (msg) => {
    await setPreferences(bot, msg, { getOne, upsert });
  });

  bot.onText(/\/filtroseliminar/, async (msg) => {
    await deletePreferences(bot, msg, deleteOne);
  });
  bot.onText(/\/filtros$/, async (msg) => {
    await getPreferences(bot, msg, getOne);
  });
};
listen();
