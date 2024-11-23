const { initializeFunctions, stringify } = require("./utils.js");
const { deletePreferences } = require("../../handlers/preferencesHandler.js");

const removePreferences = async (event) => {
  await initializeFunctions();
  console.log(event);
  const { response, error, statusError } = await deletePreferences(
    event.pathParameters.username
  );
  if (response) {
    return { statusCode: 200, body: stringify(response) };
  }
  return {
    statusCode: statusError,
    body: error,
  };
};

module.exports = { removePreferences };
