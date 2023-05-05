const {
  monthSections,
  searching,
  convertedToMoney,
  mustCompletePrices,
} = require("../config/constants");
const { buildError } = require("../utils/error");
const { padMonth } = require("../utils/string");
const { searchCityQuery, searchRegionalQuery } = require("./search");
const { convertToMoney } = require("../utils/milesConverter");

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
    const inlineKeyboardMonths = getInlineKeyboard(
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
    const inlineKeyboardMonths = getInlineKeyboard(
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

const calculateMoney = (parameters, msg, bot) => {
  const { miles, taxPrice, milePrice, dolarPrice } = parameters;

  if (milePrice === "undefined" || dolarPrice === "undefined") {
    bot.sendMessage(msg.chat.id, mustCompletePrices);
    return;
  }

  const { arsPrice, usdPrice } = convertToMoney(
    miles,
    taxPrice,
    milePrice,
    dolarPrice
  );
  bot.sendMessage(
    msg.chat.id,
    convertedToMoney(miles, taxPrice, milePrice, dolarPrice, arsPrice, usdPrice)
  );
};

const getInlineKeyboard = (
  origin,
  destination,
  parameter1,
  parameter2,
  bestFlight,
  preferences
) => {
  const inlineKeyboard = monthSections.map((monthSection, indexSection) =>
    monthSection.map((month, indexMonth) => ({
      text: month.name,
      callback_data: `${origin} ${destination} ${padMonth(
        monthSection.length * indexSection + (indexMonth + 1)
      )} ${parameter1 || ""} ${parameter2 || ""}`.trimEnd(),
    }))
  );
  inlineKeyboard.push([
    {
      text: "Calcular $",
      callback_data: `calculadora ${bestFlight.price} ${bestFlight.tax.moneyNumber} ${preferences?.milePrice} ${preferences?.dolarPrice}`,
    },
  ]);
  return inlineKeyboard;
};

module.exports = {
  searchSingleDestination,
  searchMultipleDestination,
  calculateMoney,
};
