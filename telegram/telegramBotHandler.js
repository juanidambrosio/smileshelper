const { monthSections, searching } = require("../config/constants");
const { buildError } = require("../utils/error");
const { padMonth } = require("../utils/string");
const { searchCityQuery } = require("./search");

const searchSingleDestination = async (match, msg, bot) => {
  bot.sendMessage(msg.chat.id, searching);
  try {
    const [origin, destination, departureMonth, parameter1, parameter2] =
      match.slice(1, 6);
    const { response } = await searchCityQuery(msg, match);
    console.log(match[0]);
    const inlineKeyboardMonths = monthSections.map(
      (monthSection, indexSection) =>
        monthSection.map((month, indexMonth) => ({
          text: month.name,
          callback_data: `${origin} ${destination} ${padMonth(
            monthSection.length * indexSection + (indexMonth + 1)
          )} ${parameter1 || ""} ${parameter2 || ""}`.trimEnd(),
        }))
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

module.exports = { searchSingleDestination };
