import { useAccount, useChainId } from "wagmi";
import { useEffect, useState } from "react";
import {
  isTokenSupportedOnNetwork,
  getTokenAddress,
  type TokenSymbol,
  type NaspipNetwork,
  NETWORKS,
} from "@/lib/networks";

// ERC20 Transfer event interface
interface Transfer {
  id: string;
  from: string;
  to: string;
  timestamp: string;
  token: TokenSymbol;
  type: "Received" | "Sent";
  amount: string;
}

// API endpoints for each network
const API_ENDPOINTS = {
  1: "https://api.etherscan.io/api",
  137: "https://api.polygonscan.com/api",
  56: "https://api.bscscan.com/api",
} as const;

export function useTokenTransactions() {
  const [transactions, setTransactions] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isConnected || !address || !chainId) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      try {
        // Get supported tokens on current network
        const supportedTokens: TokenSymbol[] = [];
        if (isTokenSupportedOnNetwork("USDT", chainId))
          supportedTokens.push("USDT");
        if (isTokenSupportedOnNetwork("USDC", chainId))
          supportedTokens.push("USDC");

        // Get API endpoint for current network
        const apiEndpoint =
          API_ENDPOINTS[chainId as keyof typeof API_ENDPOINTS];
        if (!apiEndpoint) {
          throw new Error(
            `No API endpoint configured for network with chainId ${chainId}`,
          );
        }

        // Fetch transactions for each supported token
        const allTransactions: Transfer[] = [];
        for (const token of supportedTokens) {
          // Get token contract address
          const tokenAddress = getTokenAddress(token, chainId);
          if (!tokenAddress) continue;

          // TODO: Implement actual API call to fetch transactions
          // This is a placeholder that simulates fetching transactions
          const mockTransactions: Transfer[] = [
            {
              id: "1",
              from: "0x123...",
              to: address,
              timestamp: new Date().toISOString(),
              token,
              type: "Received",
              amount: "100",
            },
          ];

          allTransactions.push(...mockTransactions);
        }

        // Sort transactions by timestamp (newest first)
        allTransactions.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        setTransactions(allTransactions);
        setError(null);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, isConnected, chainId]); // chainId dependency ensures refetch when network changes

  return { transactions, isLoading, error };
}
