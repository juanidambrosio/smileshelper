const {
  getPreferencesDb,
  setPreferencesDb,
  existingPreferencesDb,
} = require("./dbMapper");

const { preferencesParser } = require("../utils/parser");

const {
  preferencesDelete,
  preferencesError,
  preferencesNone,
  preferencesSave,
} = require("../config/constants");

const setPreferences = async (bot, msg, preferencesFunctions) => {
  const chatId = msg.chat.id;
  const { getOne, upsert } = preferencesFunctions;

  const result = preferencesParser(msg.text);
  try {
    if (result.airlines) {
      result.airlines = await existingPreferencesDb(
        {
          id: msg.from.username || msg.from.id.toString(),
          airlines: result.airlines,
        },
        getOne
      );
    }

    await setPreferencesDb(
      {
        id: msg.from.username || msg.from.id.toString(),
        result,
      },
      upsert
    );
    bot.sendMessage(chatId, preferencesSave, { parse_mode: "Markdown" });
  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, preferencesError);
  }
};

const deletePreferences = async (bot, msg, deleteOne) => {
  const chatId = msg.chat.id;
  try {
    await deleteOne({
      author_id: msg.from.username || msg.from.id.toString(),
    });
    bot.sendMessage(chatId, preferencesDelete, { parse_mode: "Markdown" });
  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, preferencesError);
  }
};

const getPreferences = async (bot, msg, getOne) => {
  const chatId = msg.chat.id;

  try {
    const preferences = await getPreferencesDb(
      {
        id: msg.from.username || msg.from.id.toString(),
      },
      getOne
    );

    let response = "";
    if (preferences === null) {
      response = preferencesNone;
    } else {
      if (preferences.hasOwnProperty("airlines")) {
        response += "a: " + preferences.airlines.toString() + " ";
      }
      if (preferences.hasOwnProperty("stops")) {
        response += "e: " + preferences.stops + " ";
      }
    }

    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, preferencesError);
  }
};

module.exports = { setPreferences, getPreferences, deletePreferences };
