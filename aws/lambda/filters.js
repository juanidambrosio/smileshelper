const { initializeFunctions, stringify } = require("./utils.js");
const { deletePreferences } = require("../../handlers/preferencesHandler.js");

const removeFilters = async (event) => {
  await initializeFunctions();
  console.log(event)
  const { response, error } = await deletePreferences(
    event.pathParameters.username
  );
  if (response) {
    return { statusCode: 200, body: stringify(response) };
  }
  return {
    statusCode: 500,
    body: error,
  };
};

module.exports = { removeFilters };
