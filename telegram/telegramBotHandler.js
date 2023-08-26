const {monthSections, searching} = require("../config/constants");
const {buildError} = require("../utils/error");
const {padMonth} = require("../utils/string");
const {searchCityQuery, searchRegionalQuery} = require("./search");

const sendMessageWithKeyboard = async (bot, chatId, message, keyboard) => {
    await bot.sendMessage(chatId, message, {
        parse_mode: "Markdown", reply_markup: {
            inline_keyboard: keyboard,
        },
    });
};
const sendMessageInChunks = async (bot, chatId, response, inlineKeyboardMonths) => {
    const lines = response.split("\n");
    lines[0] = `${lines[0]} ${lines.length} resultados`;

    let chunk = [];
    for (let i = 0; i < lines.length; i++) {
        chunk.push(lines[i]);
        if (chunk.length === 35 || i === lines.length - 1) {
            const options = {
                parse_mode: "Markdown",
                reply_markup: i === lines.length - 1 ? {inline_keyboard: inlineKeyboardMonths} : undefined,
            };
            await bot.sendMessage(chatId, chunk.join("\n"), options);
            chunk = [];
        }
    }
};

const searchSingleDestination = async (match, msg, bot) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, searching);

    try {
        const [, origin, destination] = match;
        const {response} = await searchCityQuery(msg, match);

        console.log(`${new Date().toLocaleTimeString()} ${msg.chat.username} ${match[0]}`);

        const inlineKeyboardMonths = getInlineKeyboardMonths(origin, destination);
        await sendMessageInChunks(bot, chatId, response, inlineKeyboardMonths);
    } catch (error) {
        console.error(error.message);
        bot.sendMessage(chatId, buildError(error.message));
    }
};
const searchMultipleDestination = async (match, msg, bot, fixedDay, isMultipleOrigin) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, searching);

    try {
        const [, origin, destination] = match;
        const {response} = await searchRegionalQuery(msg, match, fixedDay, isMultipleOrigin);

        console.log(`${new Date().toLocaleTimeString()} ${msg.chat.username} ${match[0]}`);

        const inlineKeyboardMonths = getInlineKeyboardMonths(origin, destination);
        await sendMessageInChunks(bot, chatId, response, inlineKeyboardMonths);
    } catch (error) {
        console.error(error.message);
        bot.sendMessage(chatId, buildError(error.message));
    }
};
const getInlineKeyboardMonths = (origin, destination) => {
    return monthSections.map((section, sectionIndex) => section.map((month, monthIndex) => ({
        text: month.name,
        callback_data: `${origin} ${destination} ${padMonth(section.length * sectionIndex + (monthIndex + 1))}`.trim(),
    })));
};

module.exports = {searchSingleDestination, searchMultipleDestination};
