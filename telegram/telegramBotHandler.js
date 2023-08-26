const {monthSections, searching} = require("../config/constants");
const {buildError} = require("../utils/error");
const {padMonth} = require("../utils/string");
const {searchCityQuery, searchRegionalQuery} = require("./search");

const searchSingleDestination = async (match, msg, bot) => {
    bot.sendMessage(msg.chat.id, searching);
    try {
        const [origin, destination, departureMonth, parameter1, parameter2] =
            match.slice(1, 6);
        const {response} = await searchCityQuery(msg, match);
        console.log((new Date()).toLocaleTimeString(), msg.chat.username, match[0]);
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
    const {response, error} = await searchRegionalQuery(
        msg,
        match,
        fixedDay,
        isMultipleOrigin
    );
    console.log((new Date()).toLocaleTimeString(), msg.chat.username, match[0]);
    if (error) {
        bot.sendMessage(chatId, error);
    } else {
        const inlineKeyboardMonths = getInlineKeyboardMonths(
            origin,
            destination,
            parameter1,
            parameter2
        );
        lines = response.split("\n")
        let chunk = [];
        for (let i = 0; i < lines.length; i++) {
            chunk.push(lines[i]);
            if (chunk.length === 35 || i === lines.length - 1) {
                let options = {
                    parse_mode: "Markdown",
                };

                // Include inline keyboard only in the last message
                if (i === lines.length - 1) {
                    options.reply_markup = {
                        inline_keyboard: inlineKeyboardMonths,
                    };
                }

                await bot.sendMessage(chatId, chunk.join("\n"), options);
                chunk = [];  // Reset the chunk
            }
        }
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

module.exports = {searchSingleDestination, searchMultipleDestination};
