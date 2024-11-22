const { preferencesParser } = require("../utils/parser");
const userRepository = require('../db/repositories/userRepository');

const {
  preferencesDelete,
  preferencesError,
  preferencesNone,
  preferencesSave,
  preferencesMap,
  regionSave,
} = require("../config/constants");

const setPreferences = async (msg) => {
  try {
    const userId = msg.from.username || msg.from.id.toString();
    const previousPreferences = await userRepository.getPreferences(userId) || {};

    const result = preferencesParser(msg.text, {
      previousfare: previousPreferences.fare,
      previousBrasilNonGol: previousPreferences.brasilNonGol,
      previousSmilesAndMoney: previousPreferences.smilesAndMoney,
    });

    if (previousPreferences.airlines && result.airlines) {
      result.airlines = [...previousPreferences.airlines, ...result.airlines];
    }

    await userRepository.upsertPreferences(userId, result);
    return { response: preferencesSave };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const setRegion = async (id, name, airports) => {
  try {
    const previousPreferences = await userRepository.getPreferences(id) || {};
    let result = { regions: { [name]: airports } };

    if (previousPreferences.regions) {
      result.regions = { ...previousPreferences.regions, [name]: airports };
    }

    await userRepository.upsertPreferences(id, result);
    return { response: regionSave };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const deletePreferences = async (userId) => {
  try {
    await userRepository.deletePreferences(userId);
    return { response: preferencesDelete };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const getPreferences = async (id) => {
  try {
    const preferences = await userRepository.getPreferences(id);

    let response = "";
    if (preferences !== null) {
      for (const preference in preferences) {
        if (preferencesMap.has(preference)) {
          response +=
            preferencesMap.get(preference) +
            preferences[preference].toString() +
            "\n";
        }
      }
    }
    return {
      response: response || preferencesNone,
    };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const getRegions = async (id) => {
  try {
    const preferences = await userRepository.getPreferences(id);

    if (preferences === null || !preferences.regions) {
      return {};
    } else {
      return preferences.regions;
    }
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

module.exports = {
  setPreferences,
  setRegion,
  getPreferences,
  getRegions,
  deletePreferences,
};