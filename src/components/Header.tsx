import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import WalletModal from "./WalletModal";
import SettingsModal from "./SettingsModal";
import ProfileMenu from "./ProfileMenu";
import { useTheme } from "@/contexts/ThemeContext";
import { useWallet } from "@/hooks/use-wallet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Logo size constants - can be adjusted here for easy maintenance
const LOGO_SIZES = {
  small: "w-8 h-8",
  medium: "w-12 h-12",
  large: "w-16 h-16",
};

// Network configurations
const NETWORKS = {
  1: { name: "Ethereum", icon: "https://assets.belo.app/images/eth.png", shortName: "ETH" },
  11155111: { name: "Sepolia", icon: "https://assets.belo.app/images/eth.png", shortName: "SEP" },
  137: { name: "Polygon", icon: "https://assets.belo.app/images/polygon.png", shortName: "MATIC" },
  56: { name: "BNB Chain", icon: "https://assets.belo.app/images/blockchains/bsc.png", shortName: "BNB" },
};

export const Header = () => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("1"); // Default to Ethereum
  const { isConnected, address, disconnectWallet, chainId, switchNetwork, chains } = useWallet();
  const { isDarkMode } = useTheme();
  
  // Current logo size - change this to use any of the predefined sizes
  const logoSize = LOGO_SIZES.large;

  // Update selectedNetwork when chainId changes (after connection)
  useEffect(() => {
    if (chainId) {
      setSelectedNetwork(chainId.toString());
    }
  }, [chainId]);

  // Check if screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const handleConnectWallet = () => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
    }
  };

  const handleNetworkChange = (value: string) => {
    // Store the selected network value
    setSelectedNetwork(value);
    
    // If connected, also switch the network in the wallet
    if (isConnected) {
      switchNetwork(parseInt(value));
    }
  };

  // Get current network info based on connection status
  const networkId = isConnected ? chainId : parseInt(selectedNetwork);
  const currentNetwork = networkId && NETWORKS[networkId as keyof typeof NETWORKS] 
    ? NETWORKS[networkId as keyof typeof NETWORKS] 
    : NETWORKS[1]; // Default to Ethereum if network not found

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-crypto-dark/50 backdrop-blur-lg border-b border-crypto-border">
      <div className="flex items-center gap-2">
        <img 
          src={isDarkMode ? "/fluxis_dark_mode.svg" : "/fluxis_light_mode.svg"} 
          alt="Fluxis Logo" 
          className={logoSize}
        />
      </div>
      
      <div className="flex items-center gap-4">
        {/* Network selector - always visible and enabled regardless of connection status */}
        <Select 
          value={isConnected ? (chainId?.toString() || "1") : selectedNetwork}
          onValueChange={handleNetworkChange}
        >
          <SelectTrigger className={`bg-transparent border-crypto-border ${isMobile ? 'w-[60px]' : 'w-[140px]'}`}>
            {isMobile ? (
              <img 
                src={currentNetwork.icon} 
                alt={currentNetwork.name} 
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="flex items-center gap-2">
                <img 
                  src={currentNetwork.icon} 
                  alt={currentNetwork.name} 
                  className="w-5 h-5 rounded-full"
                />
                <span>{currentNetwork.name}</span>
              </div>
            )}
          </SelectTrigger>
          <SelectContent>
            {chains.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                <div className="flex items-center gap-2">
                  <img 
                    src={NETWORKS[chain.id as keyof typeof NETWORKS]?.icon || "https://assets.belo.app/images/eth.png"} 
                    alt={chain.name} 
                    className="w-5 h-5 rounded-full"
                  />
                  <span>{chain.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSettingsModalOpen(true)}
          className="text-crypto-text-secondary hover:text-crypto-text hover:bg-crypto-card/50"
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        {isConnected && address ? (
          <ProfileMenu 
            account={address} 
            onDisconnect={disconnectWallet}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        ) : (
          <Button
            onClick={handleConnectWallet}
            className="button-primary"
          >
            <span className="hidden sm:inline-block">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </Button>
        )}
      </div>

      <WalletModal open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen} />
      <SettingsModal open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
    </header>
  );
};
