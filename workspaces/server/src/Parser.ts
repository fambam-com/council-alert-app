import { getApiInstance, getBlockData } from "./util/ChainHelper";
import Logger from "./util/Logger";
import { getDBInstance, BlockDataDTO, BlockStatus } from "./util/DBOperator";
import { Collection, ObjectId } from "mongodb";

const run = async (): Promise<void> => {
  Logger.info(`Parser is running...`);

  const db = await getDBInstance();

  const blockCollection = db.collection(`Block`) as Collection<BlockDataDTO>;

  Logger.info(`Start to query unprocessed block and alert remarks`);

  const blockCursor = blockCollection
    .find({ status: `parser-ready` })
    .sort({ blockNumber: 1 });

  if ((await blockCursor.count()) === 0) {
    Logger.info("There is no unprocessed block. Wait for the next run");

    return;
  }

  Logger.info(`Unprocessed blocks found. Start to process block data.`);

  // TODO: Put into setting
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

  await blockCursor.forEach((b) => {
    const { alertRemarks, _id } = b as BlockDataDTO & { _id: ObjectId };

    if (!Array.isArray(alertRemarks) || !alertRemarks.length) {
      blockCollection.updateOne(
        { _id: _id },
        { $set: { status: `notification-unavailable` } }
      );

      return;
    }

    const alerts = alertRemarks.filter(
      (a) =>
        a.status === `parser-ready` &&
        (councilMembers.includes(a.address) || tcMembers.includes(a.address))
    );

    if (!alerts.length) {
      blockCollection.updateOne(
        { _id: _id },
        { $set: { status: `notification-unavailable` } }
      );

      return;
    }
  });

  Logger.info(`Parser finished running`);
};

export default run;
