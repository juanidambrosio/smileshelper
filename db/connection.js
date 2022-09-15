require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGO_URL;
let client = undefined;

const getDbCollection = async (collectionName) => {
  if(client === undefined){
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });
  }
  
  try {
    await client.connect();
    return client.db("smiles_helper").collection(collectionName);
  } catch (error) {
    console.log(`Could not connect to Mongo DB instance` + error);
  }
};

module.exports = getDbCollection;
