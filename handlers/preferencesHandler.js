const { getPreferencesDb, setPreferencesDb } = require("../telegram/dbMapper");

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
    const previousPreferences = (await getPreferencesDb({ id }, getOne)) || {};

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

const deletePreferences = async (author_id) => {
  const { deleteOne } = getDbFunctions();

  try {
    await deleteOne({
      author_id,
    });
    return { response: preferencesDelete };
  } catch (error) {
    console.log(error);
    return { error: preferencesError };
  }
};

const getPreferences = async (id) => {
  console.log(id);
  const { getOne } = getDbFunctions();

  try {
    const preferences = await getPreferencesDb(
      {
        id,
      },
      getOne
    );

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
  const { getOne } = getDbFunctions();

  try {
    const preferences = await getPreferencesDb(
      {
        id,
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

module.exports = {
  setPreferences,
  setRegion,
  getPreferences,
  getRegions,
  deletePreferences,
};
