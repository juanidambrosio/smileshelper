const { initializeDbFunctions } = require("../../db/dbFunctions");

// Not used, only for caching the call to initialize db
let functions;

const initializeFunctions = async () => {
  if (!functions) {
    functions = await initializeDbFunctions();
  }
};

const stringify = (response) => JSON.stringify({ response });

module.exports = { initializeFunctions, stringify };
