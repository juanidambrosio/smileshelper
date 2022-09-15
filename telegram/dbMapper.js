const FlightSearch = require("../models/FlightSearch");

const createFlightSearch = async (data, createOne) => {
  const { id, origin, destination, departureDate, returnDate, price } = data;

  const flightSearch = new FlightSearch(
    id,
    "telegram",
    new Date(),
    origin,
    destination,
    departureDate.substring(0, 4),
    departureDate.substring(5, 7),
    returnDate ? returnDate.substring(0, 4) : undefined,
    returnDate ? returnDate.substring(5, 7) : undefined,
    price
  );
  await createOne(flightSearch);
};

const setPreferencesDb = async (data, upsert) => {
  const { id, result } = data;
  await upsert({ author_id: id }, { $set: result });
};

const existingPreferencesDb = async (data, getOne) => {
  const { id, airlines } = data;
  const previous = await getOne({ author_id: id });

  if (previous !== null && previous.airlines !== undefined) {
    return [...previous.airlines, ...airlines];
  } else {
    return airlines;
  }
};

const getPreferencesDb = async (data, getOne) => {
  const { id } = data;
  return await getOne({ author_id: id });
};

module.exports = {
  createFlightSearch,
  setPreferencesDb,
  existingPreferencesDb,
  getPreferencesDb,
};
