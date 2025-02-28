
import { useState, useEffect, useCallback } from "react";
import { MetaMaskSDK, SDKProvider } from "@metamask/sdk";
import { useToast } from "@/hooks/use-toast";

type MetaMaskHookReturn = {
  isConnected: boolean;
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: SDKProvider | null;
};

export function useMetaMask(): MetaMaskHookReturn {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [sdk, setSDK] = useState<MetaMaskSDK | null>(null);
  const [provider, setProvider] = useState<SDKProvider | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const sdk = new MetaMaskSDK({
          dappMetadata: {
            name: "CryptoPay",
            url: window.location.href,
          },
          logging: {
            developerMode: false,
          },
          checkInstallationImmediately: false,
        });
        
        setSDK(sdk);
        setProvider(sdk.getProvider());
        
        const provider = sdk.getProvider();
        
        if (provider) {
          // Check if already connected
          const accounts = await provider.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error("Error initializing MetaMask SDK:", error);
      }
    };

    initializeSDK();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setIsConnected(false);
        setAccount(null);
      } else {
        // User changed account
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) {
      toast({
        title: "MetaMask not available",
        description: "Please install MetaMask extension",
        variant: "destructive",
      });
      return;
    }

    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        toast({
          title: "Wallet connected",
          description: "Successfully connected to MetaMask",
        });
      }
    } catch (error: any) {
      console.error("Error connecting to MetaMask:", error);
      toast({
        title: "Connection failed",
        description: error?.message || "Failed to connect to MetaMask",
        variant: "destructive",
      });
    }
  }, [provider, toast]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);

  return {
    isConnected,
    account,
    connect,
    disconnect,
    provider,
  };
}
