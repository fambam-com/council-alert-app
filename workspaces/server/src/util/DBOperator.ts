import {
  MongoClient,
  MongoClientOptions,
  Db,
  Collection,
  ObjectId,
} from "mongodb";
import Logger, { _getUTCNow } from "./Logger";
import { ChainName, BlockData, InterestedAlert } from "./ChainHelper";

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

export type BlockStatus =
  | `parser-ready`
  | `notification-available`
  | `notification-unavailable`;

type AlertRemarkDTO = InterestedAlert & {};

export type BlockDataDTO = {
  _id?: ObjectId;
  chainName: ChainName;
  blockHash: string;
  blockNumber: number;
  alertRemarks: Array<AlertRemarkDTO>;
  status: BlockStatus;
};

export const saveBlock = async (
  blockData: BlockData,
  option: { chainName: ChainName }
) => {
  Logger.info(`Start to save new block into DB...`);

  const { blockNumber, blockHash, interestedAlerts } = blockData;

  const db = await getDBInstance();

  const blockCollection = db.collection(`Block`);

  const existingBlock = await blockCollection.findOne({
    $or: [{ blockHash }, { blockNumber }],
  });

  // The block with this hash or number already existed
  if (existingBlock) {
    Logger.warning(
      `Block with number: ${blockNumber} or hash: ${blockHash} already existed`
    );

    // TODO: Logic to handle this case
    return;
  }

  const blockDataDB: BlockDataDTO = {
    chainName: option.chainName,
    blockHash,
    blockNumber,
    status: interestedAlerts.length
      ? `parser-ready`
      : `notification-unavailable`,
    alertRemarks: interestedAlerts.map((a) => ({
      ...a,
    })),
  };

  await blockCollection.insertOne(blockDataDB);

  Logger.info(`New block with number: ${blockNumber} saved`);
};

type NotificationStatus = `ready` | `sent`;

export type NotificationDTO = {
  _id?: ObjectId;
  chainName: ChainName;
  status: NotificationStatus;
  blockNumber: number;
  blockHash: string;
  alertRemarkId: string;
  subject?: string;
  content: string;
  importance: `low` | `medium` | `high` | `urgent`;
};

export type UserDTO = {
  _id?: ObjectId;
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
}: {
  id: string;
  token: string;
}) => {
  Logger.info(`Start to add new user with token: ${token}...`);

  const db = await getDBInstance();

  const user = db.collection(`User`);

  const newUser: UserDTO = {
    id,
    notificationToken: token,
    lastActiveTime: _getUTCNow(),
    notifications: [],
  };

  await user.insertOne(newUser);

  Logger.info(`New user created`);

  return `USER_CREATED`;
};
