const { ObjectId } = require("mongodb");

const getMany = (collection) => async (parameters) => {
  const { page, limit, query } = parameters || {};
  const skip = parseInt(page * limit);
  const results = await collection
    .find(query || {}, { skip, limit: parseInt(limit) })
    .toArray();
  return { count: results.length, results };
};

const getOne = (collection) => async (id) => {
  if (id) {
    return collection.findOne(id);
  } else throw new Error("getOne: Id provided has an incorrect format");
};

const createOne = (collection) => async (event) => collection.insertOne(event);

const updateOne = (collection) => async (id, updatedEvent) => {
  if (ObjectId.isValid(id)) {
    return collection.updateOne({ _id: ObjectId(id) }, updatedEvent);
  } else throw new Error("updateOne: Id provided has an incorrect format");
};

const deleteOne = (collection) => async (id) => {
  if (id) {
    return collection.deleteOne(id);
  } else throw new Error("deleteOne: Id provided has an incorrect format");
};

const upsert = (collection) => async (id, update) => {
  if (id) {
    return await collection.findOneAndUpdate(id, update, { upsert: true });
  } else throw new Error("upsert: Id provided has an incorrect format");
};

module.exports = (dbCollection) => {
  return {
    getMany: getMany(dbCollection),
    getOne: getOne(dbCollection),
    createOne: createOne(dbCollection),
    updateOne: updateOne(dbCollection),
    deleteOne: deleteOne(dbCollection),
    upsert: upsert(dbCollection),
  };
};
