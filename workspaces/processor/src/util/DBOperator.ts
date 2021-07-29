import { MongoClient, MongoClientOptions, Db } from "mongodb";
import Logger from "./Logger";
import { ChainName } from "./ChainHelper";

let _dbInstance: Db | null = null;

export const getDBInstance = async () => {
  if (_dbInstance) {
    return _dbInstance;
  }

  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@playgrounddb.td2rv.mongodb.net?retryWrites=true&w=majority`;

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as MongoClientOptions);

  await client.connect();

  _dbInstance = client.db(process.env.DB_NAME);

  return _dbInstance;
};

export const test = async () => {
  const db = await getDBInstance();

  const record = await db.collection(`Block`).findOne();

  console.log(record);
};
