const getDbCollection = require("../db/connection");
const dbOperations = require("../db/operations");

let dbFunctions = {};

const getDbFunctions = () => dbFunctions;

const initializeDbFunctions = async () => {
  const flightSearch = await getDbCollection("flight_search");
  const preferences = await getDbCollection("preferences");
  const { createOne } = dbOperations(flightSearch);
  const { upsert, getOne, deleteOne, getAll } = dbOperations(preferences);

  dbFunctions = { createOne, upsert, getOne, deleteOne, getAll };
};

module.exports = { initializeDbFunctions, getDbFunctions };
