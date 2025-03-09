// Network configurations
export const NETWORKS = {
  erc20: {
    translationKey: "ethereum" as const,
    icon: "https://assets.belo.app/images/eth.png",
    metamaskNetworkId: 1,
  },
  polygon: {
    translationKey: "polygon" as const,
    icon: "https://assets.belo.app/images/blockchains/polygon.png",
    metamaskNetworkId: 137,
  },
  bep20: {
    translationKey: "bsc" as const,
    icon: "https://assets.belo.app/images/blockchains/bsc.png",
    metamaskNetworkId: 56,
  },
} as const;

// Token metadata
export const TOKEN_METADATA = {
  USDT: {
    decimals: 6,
    symbol: "USDT",
    icon: "https://assets.belo.app/images/usdt.png",
    networkDecimals: {
      56: 18, // BSC override
    },
  },
  USDC: {
    decimals: 6,
    symbol: "USDC",
    icon: "https://assets.belo.app/images/usdc.png",
    networkDecimals: {
      56: 18, // BSC override
    },
  },
} as const;

// Token configurations with their addresses per network
export const TOKEN_ADDRESSES = {
  USDT: {
    erc20: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    bep20: "0x55d398326f99059fF775485246999027B3197955",
  },
  USDC: {
    erc20: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    bep20: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
} as const;

export type NaspipNetwork = keyof typeof NETWORKS;
export type TokenSymbol = keyof typeof TOKEN_ADDRESSES;

// Helper function to get NASPIP network from chainId
export const getNaspipNetwork = (
  chainId: number,
): NaspipNetwork | undefined => {
  return Object.entries(NETWORKS).find(
    ([_, network]) => network.metamaskNetworkId === chainId,
  )?.[0] as NaspipNetwork | undefined;
};

// Helper function to get chainId from NASPIP network
export const getChainId = (naspipNetwork: NaspipNetwork): number => {
  return NETWORKS[naspipNetwork].metamaskNetworkId;
};

// Helper function to check if a token is supported on a network
export const isTokenSupportedOnNetwork = (
  token: TokenSymbol,
  chainId: number,
): boolean => {
  const network = getNaspipNetwork(chainId);
  if (!network) return false;
  return !!TOKEN_ADDRESSES[token][network];
};

// Helper function to get token address for a network
export const getTokenAddress = (
  token: TokenSymbol,
  chainId: number,
): string | undefined => {
  const network = getNaspipNetwork(chainId);
  if (!network) return undefined;
  return TOKEN_ADDRESSES[token][network];
};
