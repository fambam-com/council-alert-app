import { ApiPromise, WsProvider } from "@polkadot/api";
import Logger from "./Logger";

export type ChainName = `kusama` | `polkadot`;

interface BaseOption {
  endpoint: Array<string>;
  chainName: ChainName;
}

interface ApiInstance {
  chainName: ChainName;
  apiInstance: ApiPromise | undefined;
}

const activeApiInstances: Array<ApiInstance> = [];

export const getApiInstance = async ({
  endpoint,
  chainName,
}: BaseOption): Promise<ApiPromise> => {
  const activeInstance = activeApiInstances.find(
    (i) => i.chainName === chainName
  );

  if (activeInstance) {
    return activeInstance.apiInstance as ApiPromise;
  }

  Logger.info(`Connection to ${chainName} through ${endpoint[0]}`);

  // TODO: Handle failed connection
  const wsProvider = new WsProvider(endpoint[0]);
  const api = await ApiPromise.create({ provider: wsProvider });

  activeApiInstances.push({
    chainName,
    apiInstance: api,
  });

  Logger.info(`RPC connected`);

  return api;
};
