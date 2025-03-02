import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
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

// Token information
export const TOKENS = {
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    symbol: "USDC",
    icon: "https://assets.belo.app/images/usdc.png",
  },
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    symbol: "USDT",
    icon: "https://assets.belo.app/images/usdt.png",
  },
};

export type TokenSymbol = keyof typeof TOKENS;

export function useTokenBalance(tokenSymbol: TokenSymbol) {
  const [formattedBalance, setFormattedBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { address, isConnected } = useAccount();
  const token = TOKENS[tokenSymbol];

  const { data: balance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  useEffect(() => {
    if (!isConnected || !balance) {
      setFormattedBalance("0.00");
      setIsLoading(false);
      return;
    }

    try {
      // Format the balance with the correct number of decimals
      const formatted = formatUnits(balance, token.decimals);

      // Convert to number to limit to 2 decimal places
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
  }, [balance, isConnected, token.decimals, tokenSymbol]);

  return { balance: formattedBalance, isLoading, error };
}
