const {monthSections, searching} = require("../config/constants");
const {buildError} = require("../utils/error");
const {padMonth} = require("../utils/string");
const {searchCityQuery, searchRegionalQuery} = require("./search");

const sendMessageInChunks = async (bot, chatId, response, inlineKeyboardMonths) => {
    if (!response) return;

    const maxResultsPerMessage = 35;
    const lines = response.split("\n");

    if (lines.length > 1) {
        lines[0] = `${lines[0]} ${lines.length - 2} resultados`;
    }

    let results = [];
    for (let i = 0; i < lines.length; i++) {
        results.push(lines[i]);
        if (results.length === maxResultsPerMessage || i === lines.length - 1) {
            const options = {
                parse_mode: "Markdown",
                reply_markup: i === lines.length - 1 ? {inline_keyboard: inlineKeyboardMonths} : undefined,
            };
            await bot.sendMessage(chatId, results.join("\n"), options);
            results = [];
        }
    }
};

const searchSingleDestination = async (match, msg, bot, send_message = true) => {
    console.log(`${new Date().toLocaleTimeString()} ${msg.chat.username} ${match[0]}`);

    const chatId = msg.chat.id;
    if (send_message) {
        bot.sendMessage(chatId, searching);
    }

    try {
        const {response} = await searchCityQuery(msg, match);
        const inlineKeyboardMonths = getInlineKeyboardMonths(match);

        if (send_message) {
            await sendMessageInChunks(bot, chatId, response, inlineKeyboardMonths);
        }

        return response
    } catch (error) {
        console.error(error.message);
        if (send_message) {
            bot.sendMessage(chatId, buildError(error.message));
        }

    }
};
const searchMultipleDestination = async (match, msg, bot, fixedDay, isMultipleOrigin, send_message = true) => {
    console.log(`${new Date().toLocaleTimeString()} ${msg.chat.username} ${match[0]}`);
    const chatId = msg.chat.id;
    if (send_message) {
        bot.sendMessage(chatId, searching);
    }

    try {
        const {response} = await searchRegionalQuery(msg, match, fixedDay, isMultipleOrigin);
        if (send_message) {
            await sendMessageInChunks(bot, chatId, response, getInlineKeyboardMonths(match));
        }
        return response
    } catch (error) {
        console.error(error.message);
        if (send_message) {
            bot.sendMessage(chatId, buildError(error.message));
        }
    }
};
const getInlineKeyboardMonths = (match) => {
    const [, origin, destination] = match;
    return monthSections.map((section, sectionIndex) => section.map((month, monthIndex) => ({
        text: month.name,
        callback_data: `${origin} ${destination} ${padMonth(section.length * sectionIndex + (monthIndex + 1))}`.trim(),
    })));
};

module.exports = {searchSingleDestination, searchMultipleDestination, sendMessageInChunks, getInlineKeyboardMonths};
