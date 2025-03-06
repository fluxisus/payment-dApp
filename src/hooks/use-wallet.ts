import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useToast } from "./use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, chains } = useSwitchChain();
  const { toast } = useToast();
  const { t } = useLanguage();

  const connector = connectors[0]; // MetaMask connector

  const connectWallet = async () => {
    try {
      if (!connector) {
        toast({
          title: t("metamask_not_available"),
          description: t("metamask_not_available_desc"),
          variant: "destructive",
        });
        return;
      }

      await connect({ connector });
      toast({
        title: t("success"),
        description: t("wallet_connected"),
      });
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("wallet_connection_error");
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    try {
      disconnect();
      toast({
        title: t("success"),
        description: t("wallet_disconnected"),
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const switchNetwork = async (chainId: number) => {
    try {
      await switchChain({ chainId });
      toast({
        title: t("success"),
        description: t("network_changed"),
      });
    } catch (error) {
      console.error("Error switching chain:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("network_change_error");
      toast({
        title: t("error"),
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
