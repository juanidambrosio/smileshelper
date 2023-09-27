const TelegramBot = require("node-telegram-bot-api");
const { telegramApiToken } = require("../config/config");
const {
  telegramStart,
  cafecito,
  links,
  airlinesCodes,
  maxAirports,
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
  regexCustomRegion,
} = require("../utils/regex");

const { checkDailyAlerts } = require("./alerts");

const {
  getPreferences,
  getRegions,
  deletePreferences,
  setRegion,
} = require("../handlers/preferencesHandler");

const { initializeDbFunctions } = require("../db/dbFunctions");
const {
  searchSingleDestination,
  searchMultipleDestination,
  searchRoundTrip,
  savePreferences,
  calculateMoney,
} = require("../handlers/telegramBotHandler");

const listen = async () => {
  const bot = new TelegramBot(telegramApiToken, {
    polling: { interval: 10000, params: { offset: -1 } },
    onlyFirstMatch: true,
  });
  await initializeDbFunctions();
  await checkDailyAlerts();

  bot.onText(/\/start/, async (msg) =>
    bot.sendMessage(msg.chat.id, telegramStart, { parse_mode: "MarkdownV2" })
  );

  bot.onText(/\/regiones/, async (msg) => {
    const entries = {
      ...regions,
      ...(await getRegions(msg.from.username || msg.from.id.toString())),
    };
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

  bot.onText(regexSingleCities, async (msg, match) => {
    await searchSingleDestination(match, msg, bot);
  });

  // bot.onText(regexMultipleDestinationMonthly, async (msg, match) => {
  //   await searchMultipleDestination(match, msg, bot, false, false);
  // });

  // bot.onText(regexMultipleDestinationFixedDay, async (msg, match) => {
  //   await searchMultipleDestination(match, msg, bot, true, false);
  // });

  // bot.onText(regexMultipleOriginMonthly, async (msg, match) => {
  //   await searchMultipleDestination(match, msg, bot, false, true);
  // });

  // bot.onText(regexMultipleOriginFixedDay, async (msg, match) => {
  //   await searchMultipleDestination(match, msg, bot, true, true);
  // });

  // bot.onText(regexRoundTrip, async (msg, match) => {
  //   await searchRoundTrip(match, msg, bot);
  // });

  bot.on("callback_query", async (query) => {
    const match = query.data.split(" ");
    const entireCommand = [query.data];
    // Calculator
    if (match[0] === "calculadora") {
      calculateMoney(
        {
          miles: match[1],
          taxPrice: match[2],
          milePrice: match[3],
          dolarPrice: match[4],
          moneyPrice: match[5],
        },
        query.message,
        bot
      );
      return;
    }
    // If first match is a region
    if (match[0].length > 3) {
      await searchMultipleDestination(
        entireCommand.concat(match),
        query.message,
        bot,
        false,
        true
      );
      // If second match is a region
    } else if (match[1].length > 3) {
      await searchMultipleDestination(
        entireCommand.concat(match),
        query.message,
        bot,
        false,
        false
      );
      // Default - search a single destination query
    } else {
      await searchSingleDestination(
        entireCommand.concat(match),
        query.message,
        bot
      );
    }
  });

  bot.onText(regexFilters, async (msg) => {
    await savePreferences(msg, bot);
  });

  bot.onText(regexCustomRegion, async (msg, match) => {
    const chatId = msg.chat.id;
    const regionName = match[1].toUpperCase();
    const regionAirports = match[2]
      .split(" ")
      .slice(0, maxAirports)
      .map((airport) => airport.toUpperCase());
    const { response, error } = await setRegion(
      msg.chat.username || msg.chat.id.toString(),
      regionName,
      regionAirports
    );
    if (error) {
      bot.sendMessage(chatId, error);
    } else {
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    }
  });

  bot.onText(/\/filtroseliminar/, async (msg) => {
    const chatId = msg.chat.id;
    const { response, error } = await deletePreferences(
      msg.from.username || msg.from.id.toString()
    );
    if (error) {
      bot.sendMessage(chatId, error);
    } else {
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    }
  });

  bot.onText(/\/filtros$/, async (msg) => {
    const chatId = msg.chat.id;
    const { response, error } = await getPreferences(
      msg.from.username || msg.from.id.toString()
    );
    if (error) {
      bot.sendMessage(chatId, error);
    } else {
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    }
  });
};
listen();
