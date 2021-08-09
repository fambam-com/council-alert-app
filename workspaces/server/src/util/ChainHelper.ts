import { ApiPromise, WsProvider } from "@polkadot/api";
import Logger from "./Logger";
import { ChainName } from "../endpoint";

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

  await api.isReady;

  activeApiInstances.push({
    chainName,
    apiInstance: api,
  });

  Logger.info(`RPC connected`);

  return api;
};

type AlertRemark = {
  // Fields from onchain data
  alertCouncil: boolean;
  message: string;
};

export type InterestedAlert = AlertRemark & {
  address: string;
  isCouncilMember?: boolean;
  isTCMember?: boolean;
};

export type BlockData = {
  blockNumber: number;
  blockHash: string;
  interestedAlerts: Array<InterestedAlert>;
};

export const getBlockData = async (
  api: ApiPromise,
  option: {
    blockHash?: string;
    blockNumber?: number;
  }
): Promise<BlockData | null> => {
  const { blockHash, blockNumber } = option;

  if (!blockHash && !blockNumber) {
    throw new Error("Either Block Hash or Block Number needs to have value");
  }

  // Get Council and TC members
  // TODO: Put into a global var and update less frequently
  const councilMembers = (
    await api.query.council.members()
  ).toJSON() as Array<string>;

  const tcMembers = (
    await api.query.technicalCommittee.members()
  ).toJSON() as Array<string>;

  let _blockHash = blockHash;

  if (!blockHash && blockNumber) {
    _blockHash = (
      await api.rpc.chain.getBlockHash(blockNumber)
    ).toHuman() as string;
  }

  try {
    const { block } = await api.rpc.chain.getBlock(_blockHash);

    const _blockNumber = parseInt(
      (block.header.number.toJSON() as string).toString(),
      10
    );

    const interestedAlerts: Array<InterestedAlert> = [];

    block.extrinsics.forEach((e) => {
      if (
        e.isSigned &&
        e.method.section === `system` &&
        e.method.method === `remark`
      ) {
        const {
          signer: address,
          method: { args },
        } = e;

        const ADDR = (address.toJSON() as { id: string }).id;

        if (![...councilMembers, ...tcMembers].includes(ADDR)) {
          return;
        }

        // Validate args has the desired AlertType bfore validating the account
        args.forEach((a) => {
          const alertRemark = a as any as AlertRemark;

          let interested = true;

          // TODO: Add more validation here
          if (!alertRemark.alertCouncil) {
            interested = false;
          }

          if (alertRemark.message === undefined) {
            interested = false;
          }

          if (interested) {
            // TODO: Construct the alert remark data
            const alertRemarkData: AlertRemark = {
              alertCouncil: alertRemark.alertCouncil,
              message: alertRemark.message,
            };

            const alerts: InterestedAlert = {
              ...alertRemarkData,
              address: ADDR,
            };

            if (councilMembers.includes(ADDR)) {
              alerts.isCouncilMember = true;
            } else {
              alerts.isTCMember = true;
            }

            interestedAlerts.push(alerts);
          }
        });
      }
    });

    return {
      blockNumber: _blockNumber,
      blockHash: _blockHash as string,
      interestedAlerts,
    };
  } catch (error) {
    Logger.error(error.message, error);

    return null;
  }
};
