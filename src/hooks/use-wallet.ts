import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useToast } from "./use-toast";

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, chains } = useSwitchChain();
  const { toast } = useToast();

  const connector = connectors[0]; // MetaMask connector

  const connectWallet = async () => {
    try {
      if (!connector) {
        toast({
          title: "MetaMask not available",
          description:
            "Please install MetaMask extension or use MetaMask mobile app",
          variant: "destructive",
        });
        return;
      }

      await connect({ connector });
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect to wallet";
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    try {
      disconnect();
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected from this dApp",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const switchNetwork = async (chainId: number) => {
    try {
      await switchChain({ chainId });
    } catch (error) {
      console.error("Error switching chain:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to switch network";
      toast({
        title: "Network switch failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    address,
    isConnected,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    chains,
    isConnecting: isPending,
  };
}
