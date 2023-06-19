const {
  searching,
  convertedToMoney,
  mustCompletePrices,
} = require("../config/constants");
const { buildError } = require("../utils/error");
const {
  searchCityQuery,
  searchRegionalQuery,
  searchRoundTrip: getSearchRoundTrip,
} = require("./searchHandler");
const { convertToMoney } = require("../utils/milesConverter");
const { setPreferences } = require("./preferencesHandler");
const { getInlineKeyboardSearch } = require("../utils/parser");

const searchSingleDestination = async (match, msg, bot) => {
  bot.sendMessage(msg.chat.id, searching);
  try {
    const [origin, destination, departureMonth, parameter1, parameter2] =
      match.slice(1, 6);
    const { response, bestFlight, preferences } = await searchCityQuery(
      msg,
      match
    );
    console.log(match[0]);
    const inlineKeyboardMonths = getInlineKeyboardSearch(
      origin,
      destination,
      parameter1,
      parameter2,
      bestFlight,
      preferences
    );
    bot.sendMessage(msg.chat.id, response, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: inlineKeyboardMonths,
      },
    });
  } catch (error) {
    console.log(error.message);
    bot.sendMessage(msg.chat.id, buildError(error.message));
  }
};

const searchMultipleDestination = async (
  match,
  msg,
  bot,
  fixedDay,
  isMultipleOrigin
) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, searching);
  const [origin, destination, departureMonth, parameter1, parameter2] =
    match.slice(1, 6);
  const { response, error, bestFlight, preferences } =
    await searchRegionalQuery(msg, match, fixedDay, isMultipleOrigin);
  console.log(match[0]);
  if (error) {
    bot.sendMessage(chatId, error);
  } else {
    const inlineKeyboardMonths = getInlineKeyboardSearch(
      origin,
      destination,
      parameter1,
      parameter2,
      bestFlight,
      preferences
    );
    bot.sendMessage(chatId, response, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: inlineKeyboardMonths,
      },
    });
  }
};

const searchRoundTrip = async (match, msg, bot) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, searching);
  const [
    origin,
    destination,
    departureMinDate,
    returnMaxDate,
    minimumDays,
    maximumDays,
    parameter1,
    parameter2,
  ] = match.slice(1, 9);
  const { response, error } = await getSearchRoundTrip(msg, match);
  if (error) {
    bot.sendMessage(chatId, error);
  } else {
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  }
};

const calculateMoney = (parameters, msg, bot) => {
  const { miles, taxPrice, milePrice, dolarPrice, moneyPrice } = parameters;

  if (milePrice === "undefined" || dolarPrice === "undefined") {
    bot.sendMessage(msg.chat.id, mustCompletePrices);
    return;
  }

  const { arsPrice, usdPrice } = convertToMoney(
    miles,
    taxPrice,
    milePrice,
    dolarPrice,
    moneyPrice
  );
  bot.sendMessage(
    msg.chat.id,
    convertedToMoney(
      miles,
      taxPrice,
      milePrice,
      dolarPrice,
      arsPrice,
      usdPrice,
      moneyPrice
    )
  );
};

const savePreferences = async (msg, bot) => {
  const chatId = msg.chat.id;
  const { response, error } = await setPreferences(msg);
  if (error) {
    bot.sendMessage(chatId, error);
  } else {
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  }
};

module.exports = {
  searchSingleDestination,
  searchMultipleDestination,
  searchRoundTrip,
  calculateMoney,
  savePreferences,
};
