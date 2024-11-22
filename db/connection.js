require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGO_URL;
let client;

const getDb = async () => {
  if (client) {
    return client.db("smiles_helper");
  } else {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });

    try {
      await client.connect();
      console.log("Connected to MongoDB");
      return client.db("smiles_helper");
    } catch (error) {
      console.log(`Could not connect to Mongo DB instance` + error);
    }
  }
};

module.exports = getDb;
