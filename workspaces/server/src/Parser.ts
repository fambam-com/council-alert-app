import { getApiInstance, getBlockData } from "./util/ChainHelper";
import Logger from "./util/Logger";
import {
  getDBInstance,
  BlockDataDTO,
  NotificationDTO,
} from "./util/DBOperator";
import { Collection, ObjectId } from "mongodb";

const run = async (): Promise<void> => {
  Logger.info(`Parser is running...`);

  const db = await getDBInstance();

  const blockCollection = db.collection(`Block`) as Collection<BlockDataDTO>;
  const notificationCollection = db.collection(
    `Notification`
  ) as Collection<NotificationDTO>;

  Logger.info(`Start to query unprocessed block and alert remarks`);

  const blockCursor = blockCollection
    .find({ status: `parser-ready` })
    .sort({ blockNumber: 1 })
    .limit(10);

  if ((await blockCursor.count()) === 0) {
    Logger.info("There is no unprocessed block. Wait for the next run");

    return;
  }

  Logger.info(`Unprocessed blocks found. Start to process block data.`);

  // TODO: Put into setting
  // const api = await getApiInstance({
  //   chainName: `kusama`,
  //   endpoint: [`wss://kusama-rpc.polkadot.io/`],
  // });

  let notifications: Array<NotificationDTO> = [];

  await blockCursor.forEach((b) => {
    const { alertRemarks, _id, chainName, blockHash, blockNumber } =
      b as BlockDataDTO & { _id: ObjectId };

    notifications = [
      ...notifications,
      ...alertRemarks.map(
        (a): NotificationDTO => ({
          chainName,
          status: `ready`,
          blockNumber,
          blockHash,
          alertRemarkId: _id.valueOf().toString(),
          importance: `medium`,
          subject: `Alert Message`,
          content: a.message,
        })
      ),
    ];

    blockCollection.updateOne(
      { _id: _id },
      { $set: { status: `notification-available` } }
    );
  });

  // the option prevents additional documents from being inserted if one fails
  await notificationCollection.insertMany(notifications, { ordered: true });

  Logger.info(`Parser finished running`);
};

export default run;
