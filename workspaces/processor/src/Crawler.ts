import { getApiInstance, getBlockData } from "./util/ChainHelper";
import Logger from "./util/Logger";
import { saveBlock } from "./util/DBOperator";

const run = async (): Promise<void> => {
  Logger.info(`Crawler starts to run...`);

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
      await saveBlock(blockData);
    }
  });
};

export default run;
