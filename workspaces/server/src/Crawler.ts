import {
  BlockData,
  getApiInstance,
  getBlockData,
  InterestedAlert,
} from "./util/ChainHelper";
import Logger, { _getUTCNow } from "./util/Logger";
import { saveBlock, getDBInstance } from "./util/DBOperator";

const run = async (): Promise<void> => {
  Logger.info(`Crawler starts to run...`);

  // await __mockData();

  // return;

  // TODO: Put into setting
  const api = await getApiInstance({
    chainName: `kusama`,
    endpoint: [`wss://kusama-rpc.polkadot.io/`],
  });

  // TESTING: This one has system.remark - `0x5c74a36bd4311637991701f8d759a2ae757ac5c480044534bd056c94ab3b7443`

  // Subscribe to the last head
  await api.rpc.chain.subscribeFinalizedHeads(async (blockHeader) => {
    const blockNumber = blockHeader.number.toNumber();

    const blockData = await getBlockData(api, {
      blockNumber,
    });

    Logger.info(`New block detected, number: ${blockNumber}`);

    // DB Operation
    if (blockData) {
      await saveBlock(blockData, {
        chainName: `kusama`,
      });
    }
  });
};

export default run;

const __mockData = async () => {
  let counter = 10;

  const db = await getDBInstance();

  const blockDB = db.collection(`Block`);
  const notificationDB = db.collection(`Notification`);

  await blockDB.deleteMany({});
  await notificationDB.deleteMany({});

  const api = await getApiInstance({
    chainName: `kusama`,
    endpoint: [`wss://kusama-rpc.polkadot.io/`],
  });

  // Get Council and TC members
  const councilMembers = (
    await api.query.council.members()
  ).toJSON() as Array<string>;

  const tcMembers = (
    await api.query.technicalCommittee.members()
  ).toJSON() as Array<string>;

  const validAddrs = [...councilMembers, ...tcMembers];

  const timmer = setInterval(async () => {
    // if (counter <= 0) {
    //   clearInterval(timmer);

    //   return;
    // }

    // counter--;

    const alerts: Array<InterestedAlert> = [];

    for (let i = 0; i < getRandomInt(1, 5); i++) {
      const alert: InterestedAlert = {
        alertCouncil: true,
        message: `Random Message ${getRandomInt(0, 100)}`,
        address: validAddrs[getRandomInt(0, validAddrs.length - 1)],
      };

      alerts.push(alert);
    }

    const utcNow = _getUTCNow();

    const blockData: BlockData = {
      blockNumber: utcNow,
      blockHash: utcNow.toString(),
      interestedAlerts: alerts,
    };

    await saveBlock(blockData, {
      chainName: `kusama`,
    });
  }, 1000 * 6);
};

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
