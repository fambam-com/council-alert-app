import { getApiInstance, getBlockData } from "./util/ChainHelper";
import Logger from "./util/Logger";

const run = async (): Promise<void> => {
  Logger.info(`Crawler starts to run...`);

  // TODO: Put into setting
  const api = await getApiInstance({
    chainName: `kusama`,
    endpoint: [`wss://kusama-rpc.polkadot.io/`],
  });

  // This one has system.remark - `0x5c74a36bd4311637991701f8d759a2ae757ac5c480044534bd056c94ab3b7443`

  // Retrieve the latest header
  const lastHeader = await api.rpc.chain.getHeader();

  // Compare last number from rpc to db record and fetch block hash within the gap
  const lastNumber = parseInt(lastHeader.number.toString());
  let currentNumber = 800000; // TODO: Get from DB

  let gapBetween = lastNumber - currentNumber;

  if (gapBetween > 100) {
    gapBetween = 100;
  }

  const toNumber = currentNumber + gapBetween;

  // while (currentNumber <= toNumber) {
  //   currentNumber++;

  //   // Handle error
  //   const blockHash = await api.rpc.chain.getBlockHash(currentNumber);

  //   console.log(`Block Height: ${currentNumber} - ${blockHash.toJSON()}`);
  // }

  const blockData = await getBlockData(api, {
    blockHash: `0x5c74a36bd4311637991701f8d759a2ae757ac5c480044534bd056c94ab3b7443`,
  });

  console.log(blockData);
};

export default run;
