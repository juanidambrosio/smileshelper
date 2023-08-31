const FlightSearch = require("../models/FlightSearch");

const createFlightSearch = async (data, createOne) => {
    const {
        id,
        origin,
        destination,
        departureDate,
        returnDate,
        price,
        searchType,
        smilesAndMoney,
    } = data;

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
        price,
        searchType,
        smilesAndMoney
    );
    await createOne(flightSearch);
};

const setPreferencesDb = async (data, upsert) => {
    const {id, result} = data;
    await upsert({author_id: id}, {$set: result});
};

const getPreferencesDb = async (data, getOne) => {
    const {id} = data;
    return await getOne({author_id: id});
};

const getAllPreferencesDb = async (getAll) => {
    return await getAll();
};

module.exports = {
    createFlightSearch,
    setPreferencesDb,
    getPreferencesDb,
    getAllPreferencesDb,
};
