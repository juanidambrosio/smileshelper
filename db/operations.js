const { ObjectId } = require("mongodb");
const getDbCollection = require("./connection");

const getMany = (collection) => async (parameters) => {
  const { page, limit, query } = parameters || {};
  const skip = parseInt(page * limit);
  const results = await collection
    .find(query || {}, { skip, limit: parseInt(limit) })
    .toArray();
  return { count: results.length, results };
};

const getOne = (collection) => async (id) => {
  if (ObjectId.isValid(id)) {
    return collection.findOne({ _id: ObjectId(id) });
  } else throw new Error("Id provided has an incorrect format");
};

const createOne = (collection) => async (event) => collection.insertOne(event);

const updateOne = (collection) => async (id, updatedEvent) => {
  if (ObjectId.isValid(id)) {
    return collection.updateOne({ _id: ObjectId(id) }, updatedEvent);
  } else throw new Error("Id provided has an incorrect format");
};

const deleteOne = (collection) => async (id) => {
  if (ObjectId.isValid(id)) {
    return collection.deleteOne({ _id: ObjectId(id) });
  } else throw new Error("Id provided has an incorrect format");
};

module.exports = async (collection) => {
  const dbCollection = await getDbCollection(collection);
  return {
    getMany: getMany(dbCollection),
    getOne: getOne(dbCollection),
    createOne: createOne(dbCollection),
    updateOne: updateOne(dbCollection),
    deleteOne: deleteOne(dbCollection),
  };
};
