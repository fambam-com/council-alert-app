import { MongoClient, MongoClientOptions, Db } from "mongodb";
import Logger from "./Logger";
import { ChainName, BlockData, InterestedAlerts } from "./ChainHelper";

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

type AlertRemarkDTO = InterestedAlerts & {
  status:
    | `parser-ready`
    | `notification-available`
    | `notification-unavailable`;
  isCouncilMember?: boolean;
  isTCMember?: boolean;
};

type BlockDataDTO = {
  blockHash: string;
  blockNumber: number;
  alertRemarks: Array<AlertRemarkDTO>;
  status:
    | `parser-ready`
    | `notification-available`
    | `notification-unavailable`;
};

export const saveBlock = async (blockData: BlockData) => {
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
    blockHash,
    blockNumber,
    status: interestedAlerts.length
      ? `parser-ready`
      : `notification-unavailable`,
    alertRemarks: interestedAlerts.map((a) => ({
      ...a,
      status: `parser-ready`,
    })),
  };

  await blockCollection.insertOne(blockDataDB);

  Logger.info(`New block with number: ${blockNumber} saved`);
};

type NotificationDTO = {
  status: `ready` | `sent`;
  alertRemarkId: string;
  subject?: string;
  content: string;
  importance: `low` | `medium` | `high` | `urgent`;
};

type UserDTO = {
  notificationToken: string;
  notificationSetting?: any;
  notifications: Array<NotificationDTO>;
};

export const getUserInfo = async (token: string) => {
  Logger.info(`Start to query user by token: ${token} from DB...`);

  const db = await getDBInstance();

  const user = db.collection(`User`);

  const existingUser = await user.findOne({ notificationToken: token });

  return existingUser ? (existingUser as UserDTO) : null;
};

export const createUser = async (token: string) => {
  Logger.info(`Start to add new user with token: ${token}...`);

  const db = await getDBInstance();

  const user = db.collection(`User`);

  // Check for existing user first
  const existingUser = await getUserInfo(token);

  if (existingUser) {
    Logger.info(`User existed`);

    return `USER_EXISTED`;
  }

  const newUser: UserDTO = {
    notificationToken: token,
    notifications: [],
  };

  await user.insertOne(newUser);

  Logger.info(`New user created`);

  return `USER_CREATED`;
};
