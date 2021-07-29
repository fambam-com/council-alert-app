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

type AlertRemarkDB = InterestedAlerts & {
  phase: `parser-ready` | `notification-available` | `notification-unavailable`;
  isCouncilMember?: boolean;
  isTCMember?: boolean;
};

type BlockDataDB = {
  blockHash: string;
  blockNumber: number;
  alertRemarks: Array<AlertRemarkDB>;
  phase: `parser-ready` | `notification-available` | `notification-unavailable`;
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

  const blockDataDB: BlockDataDB = {
    blockHash,
    blockNumber,
    phase: interestedAlerts.length
      ? `parser-ready`
      : `notification-unavailable`,
    alertRemarks: interestedAlerts.map((a) => ({
      ...a,
      phase: `parser-ready`,
    })),
  };

  await blockCollection.insertOne(blockDataDB);

  Logger.info(`New block with number: ${blockNumber} saved`);
};
