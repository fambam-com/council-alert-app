export type ChainName = `kusama` | `polkadot`;

export type ChainInfo = {
  endpoint: Array<string>;
  chainName: ChainName;
  displayName: string;
};

export const getChaininfo = async (
  chainName: ChainName
): Promise<ChainInfo | null> => {
  try {
    const { default: chainInfo } = await import(`./${chainName.toUpperCase()}`);

    return chainInfo;
  } catch (error) {
    console.log(error);

    return null;
  }
};

export const getAllChaininfo = async (): Promise<Array<ChainInfo>> => {
  // Add more as required
  const chainNames: Array<ChainName> = [`kusama`];

  const infos = await Promise.all(chainNames.map((n) => getChaininfo(n)));

  return infos as Array<ChainInfo>;
};
