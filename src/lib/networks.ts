// Wallet Connectors Configurations
export const WALLETS = [
  {
    name: "MetaMask",
    icon: "https://assets.pcswap.org/web/wallets/metamask.png",
    id: "metaMask",
  },
  {
    name: "Trust Wallet",
    icon: "https://assets.pcswap.org/web/wallets/trust.png",
    id: "injected",
  },
  {
    name: "WalletConnect",
    icon: "https://assets.pcswap.org/web/wallets/walletconnect.png",
    id: "walletConnect",
  },
  {
    name: "Coinbase Wallet",
    icon: "https://assets.pcswap.org/web/wallets/coinbase.png",
    id: "coinbaseWallet",
  },
];
// Network configurations
export const MapChainIdToNetworkData = {
  1: {
    naspipNetwork: "erc20",
    networkLabel: "Ethereum",
    networkShortName: "ETH",
    translationKey: "ethereum" as const,
    icon: "https://assets.belo.app/images/eth.png",
    chainId: 1,
  },
  137: {
    naspipNetwork: "polygon",
    networkLabel: "Polygon PoS",
    networkShortName: "MATIC",
    translationKey: "polygon" as const,
    icon: "https://assets.belo.app/images/blockchains/polygon.png",
    chainId: 137,
  },
  56: {
    naspipNetwork: "bep20",
    networkLabel: "BNB Smart Chain (BEP20)",
    networkShortName: "BNB",
    translationKey: "bsc" as const,
    icon: "https://assets.belo.app/images/blockchains/bsc.png",
    chainId: 56,
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

export type TokenSymbol = keyof typeof TOKEN_ADDRESSES;

export const getNetworkTranslationKey = (chainId: number) => {
  return MapChainIdToNetworkData[chainId]?.translationKey ?? "unknown_network";
};

// Helper function to get NASPIP network from chainId
export const getNaspipNetwork = (chainId: number) => {
  return MapChainIdToNetworkData[chainId]?.naspipNetwork;
};

export const getNetworkIcon = (chainId: number) => {
  return MapChainIdToNetworkData[chainId]?.icon;
};

// Helper function to get chainId from NASPIP network
export const getChainId = (naspipNetwork: string): number => {
  const network = Object.values(MapChainIdToNetworkData).find(
    (network) => network.naspipNetwork === naspipNetwork,
  );

  return network?.chainId ?? 0;
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

  if (!network) {
    return;
  }

  return TOKEN_ADDRESSES[token][network];
};
