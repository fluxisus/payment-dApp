import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  TOKENS,
  TokenSymbol,
  isTokenSupportedOnNetwork,
  getTokenAddressForNetwork,
  NETWORKS,
} from "./use-token-balance";

// ERC20 Transfer event interface
interface TokenTransfer {
  id: string;
  type: "Received" | "Sent";
  amount: string;
  from: string;
  to: string;
  timestamp: string;
  token: TokenSymbol;
}

// API endpoints for different networks
const API_ENDPOINTS = {
  [NETWORKS.ETHEREUM]: "https://api.etherscan.io/api",
  [NETWORKS.POLYGON]: "https://api.polygonscan.com/api",
  [NETWORKS.BSC]: "https://api.bscscan.com/api",
};

export function useTokenTransactions() {
  const [transactions, setTransactions] = useState<TokenTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    if (!isConnected || !address || !chainId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // Get supported tokens on current network
        const supportedTokens: TokenSymbol[] = [];
        if (isTokenSupportedOnNetwork("USDT", chainId))
          supportedTokens.push("USDT");
        if (isTokenSupportedOnNetwork("USDC", chainId))
          supportedTokens.push("USDC");

        // If no supported tokens on this network, return empty array
        if (supportedTokens.length === 0) {
          setTransactions([]);
          setIsLoading(false);
          return;
        }

        // In a real implementation, we would fetch from an API like Etherscan, Alchemy, or The Graph
        // For example, using Etherscan API (or equivalent for the current network):

        // Get the appropriate API endpoint for the current network
        const apiEndpoint =
          API_ENDPOINTS[chainId as keyof typeof API_ENDPOINTS];

        if (!apiEndpoint) {
          console.warn(
            `No API endpoint configured for network with chainId ${chainId}`,
          );
          setTransactions([]);
          return;
        }

        // Example of how to fetch transactions for each supported token:
        // const allTransactions: TokenTransfer[] = [];

        // for (const token of supportedTokens) {
        //   const tokenAddress = getTokenAddressForNetwork(token, chainId);
        //   if (!tokenAddress) continue;
        //
        //   const response = await fetch(
        //     `${apiEndpoint}?module=account&action=tokentx&contractaddress=${tokenAddress}&address=${address}&startblock=0&endblock=999999999&sort=desc&apikey=YOUR_API_KEY`
        //   );
        //   const data = await response.json();
        //
        //   if (data.status === "1" && Array.isArray(data.result)) {
        //     // Process and filter transactions from the last 30 days
        //     const thirtyDaysAgo = new Date();
        //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        //
        //     const recentTransactions = data.result
        //       .filter((tx: any) => {
        //         const txDate = new Date(tx.timeStamp * 1000);
        //         return txDate >= thirtyDaysAgo;
        //       })
        //       .map((tx: any) => {
        //         const isReceived = tx.to.toLowerCase() === address.toLowerCase();
        //         return {
        //           id: tx.hash,
        //           type: isReceived ? "Received" : "Sent",
        //           amount: (parseInt(tx.value) / Math.pow(10, TOKENS[token].decimals)).toFixed(2),
        //           from: tx.from,
        //           to: tx.to,
        //           timestamp: new Date(tx.timeStamp * 1000).toLocaleDateString(),
        //           token: token
        //         };
        //       });
        //
        //     allTransactions.push(...recentTransactions);
        //   }
        // }
        //
        // // Sort transactions by timestamp (newest first)
        // allTransactions.sort((a, b) => {
        //   return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        // });
        //
        // setTransactions(allTransactions);

        // For this implementation, we'll return an empty array since we don't have real API integration
        setTransactions([]);
      } catch (error) {
        console.error("Error fetching token transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, isConnected, chainId]); // chainId dependency ensures refetch when network changes

  return { transactions, isLoading };
}
