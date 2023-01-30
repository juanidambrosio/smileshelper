const { getPreferencesDb, setPreferencesDb } = require("./dbMapper");

const { preferencesParser } = require("../utils/parser");

const {
  preferencesDelete,
  preferencesError,
  preferencesNone,
  preferencesSave,
  preferencesMap,
  regionSave,
} = require("../config/constants");

const { getDbFunctions } = require("../db/dbFunctions");

const setPreferences = async (msg) => {
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
    return { response: preferencesSave };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const setRegion = async (id, name, airports) => {
  let result = { regions: { [name]: airports } };
  const { getOne, upsert } = getDbFunctions();

  try {
    const previousPreferences =
      (await getPreferencesDb(
        { id },
        getOne
      )) || {};

    if (previousPreferences.regions) {
      result.regions = { ...previousPreferences.regions, [name]: airports };
    }

    await setPreferencesDb(
      {
        id,
        result,
      },
      upsert
    );
    return { response: regionSave };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const deletePreferences = async (msg) => {
  const { deleteOne } = getDbFunctions();

  try {
    await deleteOne({
      author_id: msg.from.username || msg.from.id.toString(),
    });
    return { response: preferencesDelete };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const getPreferences = async (msg) => {
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
            "\n";
        }
      }
    }
    return { response };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const getRegions = async (msg) => {
  const { getOne } = getDbFunctions();

  try {
    const preferences = await getPreferencesDb(
      {
        id: msg.from.username || msg.from.id.toString(),
      },
      getOne
    );

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

module.exports = { setPreferences, setRegion, getPreferences, getRegions, deletePreferences };
