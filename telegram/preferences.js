const { getPreferencesDb, setPreferencesDb } = require("./dbMapper");

const { preferencesParser } = require("../utils/parser");

const {
  preferencesDelete,
  preferencesError,
  preferencesNone,
  preferencesSave,
  preferencesMap,
} = require("../config/constants");

const { getDbFunctions } = require("../db/dbFunctions");

const setPreferences = async (bot, msg) => {
  const chatId = msg.chat.id;
  const { getOne, upsert } = getDbFunctions();

  try {
    const previousPreferences =
      (await getPreferencesDb(
        { id: msg.from.username || msg.from.id.toString() },
        getOne
      )) || {};

    const result = preferencesParser(msg.text, {
      previousfare: previousPreferences.fare,
      previousBrasilNonGol: previousPreferences.brasilNonGol,
      previousSmilesAndMoney: previousPreferences.smilesAndMoney,
    });

    if (previousPreferences.airlines && result.airlines) {
      result.airlines = [...previousPreferences.airlines, ...result.airlines];
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

const deletePreferences = async (bot, msg) => {
  const chatId = msg.chat.id;
  const { deleteOne } = getDbFunctions();

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

const getPreferences = async (bot, msg) => {
  const chatId = msg.chat.id;
  const { getOne } = getDbFunctions();

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
      for (const preference in preferences) {
        if (preferencesMap.has(preference)) {
          response +=
            preferencesMap.get(preference) +
            preferences[preference].toString() +
            " ";
        }
      }
    }
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, preferencesError);
  }
};

module.exports = { setPreferences, getPreferences, deletePreferences };
