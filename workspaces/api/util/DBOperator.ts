import {
  MongoClient,
  MongoClientOptions,
  Db,
  Collection,
  ObjectId,
} from "mongodb";
import Logger, { _getUTCNow } from "./Logger";
import { ChainName } from "../endpoint";

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

export type NotificationStatus = `ready` | `sent` | `error`;

export type NotificationDTO = {
  _id: ObjectId;
  _key: string;
  _type: `system.remark` | `proposal`;
  chainName: ChainName;
  status: NotificationStatus;
  block_number: number;
  subject?: string;
  content: string;
  importance: `low` | `medium` | `high` | `urgent`;
  createdTime: number;
};

export type UserDTO = {
  _id: ObjectId;
  id: string;
  notificationToken: string;
  notificationSetting?: any;
  lastActiveTime: number;
  notifications: Array<NotificationDTO>;
};

export const getUserInfo = async ({ id }: { id: string }) => {
  Logger.info(`Start to query user by id: ${id} from DB...`);

  const db = await getDBInstance();

  const user = db.collection(`User`);

  const existingUser = await user.findOne({ id: id });

  if (existingUser) {
    (existingUser as UserDTO).notifications = (
      existingUser as UserDTO
    ).notifications.sort((a, b) => b.createdTime - a.createdTime);
  }

  return existingUser ? (existingUser as UserDTO) : null;
};

export const updateToken = async ({
  token,
  _id,
}: {
  token: string;
  _id: ObjectId;
}) => {
  Logger.info(`Update user token`);

  const db = await getDBInstance();

  const user = db.collection(`User`) as Collection<UserDTO>;

  await user.updateOne({ _id }, { $set: { notificationToken: token } });
};

export const userIsActive = async (_id: ObjectId) => {
  Logger.info(`Update user last active time to UTC now`);

  const db = await getDBInstance();

  const user = db.collection(`User`) as Collection<UserDTO>;

  await user.updateOne({ _id }, { $set: { lastActiveTime: _getUTCNow() } });
};

export const createUser = async ({
  id,
  token,
  deviceInfo,
}: {
  id: string;
  token: string;
  deviceInfo: {};
}) => {
  Logger.info(`Start to add new user with token: ${token}...`);

  const db = await getDBInstance();

  const user = db.collection(`User`);

  const newUser = {
    id,
    notificationToken: token,
    lastActiveTime: _getUTCNow(),
    notifications: [],
    ...(deviceInfo || {}),
  };

  await user.insertOne(newUser);

  Logger.info(`New user created`);

  return `USER_CREATED`;
};

export const saveEvents = async (events) => {
  // const keys = events.map((e) => e._key);

  const db = await getDBInstance();

  const eventCollection = db.collection(`Event`);

  for (const e of events) {
    const duplicateEvent = await eventCollection.findOne({
      _key: e._key,
    });

    if (!duplicateEvent) {
      await eventCollection.insertOne({
        ...e,
      });
    }
  }
};
