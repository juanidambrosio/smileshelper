const TelegramBot = require("node-telegram-bot-api");
const { telegramApiToken } = require("../config/config");
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
  regexFilters,
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

const { initializeDbFunctions } = require("../db/dbFunctions");

const listen = async () => {
  const bot = new TelegramBot(telegramApiToken, { polling: true });
  await initializeDbFunctions();
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

  bot.onText(regexRoundTrip, async (msg) => await searchRoundTrip(bot, msg));

  bot.onText(regexFilters, async (msg) => {
    await setPreferences(bot, msg);
  });

  bot.onText(/\/filtroseliminar/, async (msg) => {
    await deletePreferences(bot, msg);
  });
  bot.onText(/\/filtros$/, async (msg) => {
    await getPreferences(bot, msg);
  });
};
listen();
