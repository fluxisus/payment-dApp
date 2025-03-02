import { useState, useEffect } from "react";
import { useAccount, useReadContract, useChainId } from "wagmi";
import { formatUnits } from "viem";

// ERC20 ABI (minimal for balance checking)
const erc20ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

// Network IDs
export const NETWORKS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BSC: 56,
};

// Token information with network-specific addresses
export const TOKENS = {
  USDC: {
    // Token metadata (same across networks)
    decimals: 6,
    symbol: "USDC",
    icon: "https://assets.belo.app/images/usdc.png",
    // Network-specific addresses and overrides
    addresses: {
      [NETWORKS.ETHEREUM]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      [NETWORKS.POLYGON]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      [NETWORKS.BSC]: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    },
    // Network-specific decimal overrides (if needed)
    networkDecimals: {
      [NETWORKS.BSC]: 18, // Override if BSC reports different decimals
    },
  },
  USDT: {
    // Token metadata (same across networks)
    decimals: 6,
    symbol: "USDT",
    icon: "https://assets.belo.app/images/usdt.png",
    // Network-specific addresses
    addresses: {
      [NETWORKS.ETHEREUM]: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      [NETWORKS.POLYGON]: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      [NETWORKS.BSC]: "0x55d398326f99059fF775485246999027B3197955",
    },
    // Network-specific decimal overrides (if needed)
    networkDecimals: {
      [NETWORKS.BSC]: 18, // Override if BSC reports different decimals
    },
  },
};

export type TokenSymbol = keyof typeof TOKENS;

// Helper function to check if a token is supported on the current network
export function isTokenSupportedOnNetwork(
  tokenSymbol: TokenSymbol,
  chainId: number,
): boolean {
  return !!TOKENS[tokenSymbol].addresses[chainId];
}

// Helper function to get token address for the current network
export function getTokenAddressForNetwork(
  tokenSymbol: TokenSymbol,
  chainId: number,
): `0x${string}` | undefined {
  const address = TOKENS[tokenSymbol].addresses[chainId];
  return address ? (address as `0x${string}`) : undefined;
}

export function useTokenBalance(tokenSymbol: TokenSymbol) {
  const [formattedBalance, setFormattedBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const token = TOKENS[tokenSymbol];
  const tokenAddress = getTokenAddressForNetwork(tokenSymbol, chainId);

  // Get the correct decimals for the current network
  const tokenDecimals = token.networkDecimals?.[chainId] || token.decimals;

  // Check if token is supported on current network
  useEffect(() => {
    setIsSupported(isTokenSupportedOnNetwork(tokenSymbol, chainId));
  }, [tokenSymbol, chainId]);

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!tokenAddress && isSupported,
    },
  });

  useEffect(() => {
    // If token is not supported on this network
    if (!isSupported) {
      setFormattedBalance("Not available");
      setIsLoading(false);
      return;
    }

    if (!isConnected || !balance) {
      setFormattedBalance("0.00");
      setIsLoading(false);
      return;
    }

    try {
      // Format the balance with the correct number of decimals for the current network
      const formatted = formatUnits(balance as bigint, tokenDecimals);

      // Convert to number and always format to exactly 2 decimal places
      const numValue = parseFloat(formatted);
      const twoDecimalValue = numValue.toFixed(2);

      // Format with commas for thousands separators
      const parts = twoDecimalValue.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      setFormattedBalance(parts.join("."));
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error(`Error formatting ${tokenSymbol} balance:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [balance, isConnected, tokenDecimals, tokenSymbol, isSupported, chainId]);

  return { balance: formattedBalance, isLoading, error, isSupported };
}
