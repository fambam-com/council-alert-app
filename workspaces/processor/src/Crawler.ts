import { getApiInstance } from "./util/SubstrateChainHelper";
import Logger from "./util/Logger";

const run = async (): Promise<void> => {
  Logger.info(`Crawler starts to run...`);

  const api = await getApiInstance({
    chainName: `kusama`,
    endpoint: [`wss://kusama-rpc.polkadot.io/`],
  });

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

  while (currentNumber <= toNumber) {
    currentNumber++;

    // Handle error
    const blockHash = await api.rpc.chain.getBlockHash(currentNumber);

    console.log(`Block Height: ${currentNumber} - ${blockHash.toJSON()}`);
  }

  Logger.info(`Crawler finished`);
};

export default run;
