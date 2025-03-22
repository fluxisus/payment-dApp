import { useState, useEffect } from "react";
import { useAccount, useReadContract, useChainId } from "wagmi";
import { formatUnits } from "viem";
import {
  isTokenSupportedOnNetwork,
  getTokenAddress,
  type TokenSymbol,
} from "@/lib/networks";

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

// Token metadata
const TOKEN_METADATA = {
  USDC: {
    decimals: 6,
    symbol: "USDC",
    icon: "https://assets.belo.app/images/usdc.png",
    networkDecimals: {
      56: 18, // BSC override
    },
  },
  USDT: {
    decimals: 6,
    symbol: "USDT",
    icon: "https://assets.belo.app/images/usdt.png",
    networkDecimals: {
      56: 18, // BSC override
    },
  },
} as const;

export function useTokenBalance(tokenSymbol: TokenSymbol) {
  const [formattedBalance, setFormattedBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const token = TOKEN_METADATA[tokenSymbol];
  const tokenAddress = getTokenAddress(tokenSymbol, chainId) as
    | `0x${string}`
    | undefined;

  // Get the correct decimals for the current network
  const tokenDecimals = token.networkDecimals?.[chainId] || token.decimals;

  // Check if token is supported on current network
  useEffect(() => {
    setIsSupported(isTokenSupportedOnNetwork(tokenSymbol, chainId));
  }, [tokenSymbol, chainId]);

  const { data: balance, status: readStatus } = useReadContract({
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

    if (!isConnected) {
      setFormattedBalance("0.00");
      setIsLoading(false);
      return;
    }

    // Show loading state while fetching balance
    if (readStatus === "pending") {
      setIsLoading(true);
      return;
    }

    // If we have no balance data after loading is complete, show 0.00
    if (!balance && readStatus === "success") {
      setFormattedBalance("0.00");
      setIsLoading(false);
      return;
    }

    // If we have balance data, format it
    if (balance) {
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
    }
  }, [
    balance,
    readStatus,
    isConnected,
    tokenDecimals,
    tokenSymbol,
    isSupported,
    chainId,
  ]);

  return { balance: formattedBalance, isLoading, error, isSupported };
}
