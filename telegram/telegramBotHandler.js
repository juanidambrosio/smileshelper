const { monthSections, searching } = require("../config/constants");
const { buildError } = require("../utils/error");
const { padMonth } = require("../utils/string");
const { searchCityQuery, searchRegionalQuery } = require("./search");

const searchSingleDestination = async (match, msg, bot) => {
  bot.sendMessage(msg.chat.id, searching);
  try {
    const [origin, destination, departureMonth, parameter1, parameter2] =
      match.slice(1, 6);
    const { response } = await searchCityQuery(msg, match);
    console.log(match[0]);
    const inlineKeyboardMonths = getInlineKeyboardMonths(
      origin,
      destination,
      parameter1,
      parameter2
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
  const { response, error } = await searchRegionalQuery(
    msg,
    match,
    fixedDay,
    isMultipleOrigin
  );
  console.log(match[0]);
  if (error) {
    bot.sendMessage(chatId, error);
  } else {
    const inlineKeyboardMonths = getInlineKeyboardMonths(
      origin,
      destination,
      parameter1,
      parameter2
    );
    bot.sendMessage(chatId, response, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: inlineKeyboardMonths,
      },
    });
  }
};

const getInlineKeyboardMonths = (
  origin,
  destination,
  parameter1,
  parameter2
) => {
  return monthSections.map((monthSection, indexSection) =>
    monthSection.map((month, indexMonth) => ({
      text: month.name,
      callback_data: `${origin} ${destination} ${padMonth(
        monthSection.length * indexSection + (indexMonth + 1)
      )} ${parameter1 || ""} ${parameter2 || ""}`.trimEnd(),
    }))
  );
};

module.exports = { searchSingleDestination, searchMultipleDestination };
