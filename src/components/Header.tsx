import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import WalletModal from "./WalletModal";
import SettingsModal from "./SettingsModal";
import ProfileMenu from "./ProfileMenu";
import { useMetaMask } from "@/hooks/use-metamask";
import { useTheme } from "@/contexts/ThemeContext";
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

export const Header = () => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("bnb");
  const [isMobile, setIsMobile] = useState(false);
  const { isConnected, account, disconnect } = useMetaMask();
  const { isDarkMode } = useTheme();
  
  // Current logo size - change this to use any of the predefined sizes
  const logoSize = LOGO_SIZES.large;

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
        <Select 
          value={selectedNetwork}
          onValueChange={setSelectedNetwork}
        >
          <SelectTrigger className={`bg-transparent border-crypto-border ${isMobile ? 'w-[60px]' : 'w-[140px]'}`}>
            {isMobile ? (
              <img 
                src={selectedNetwork === "bnb" 
                  ? "https://assets.belo.app/images/blockchains/bsc.png" 
                  : "https://assets.belo.app/images/eth.png"} 
                alt="Selected Network" 
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="flex items-center gap-2">
                <img 
                  src={selectedNetwork === "bnb" 
                    ? "https://assets.belo.app/images/blockchains/bsc.png" 
                    : "https://assets.belo.app/images/eth.png"} 
                  alt="Selected Network" 
                  className="w-5 h-5 rounded-full"
                />
                <span>{selectedNetwork === "bnb" ? "BNB Chain" : "Ethereum"}</span>
              </div>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bnb">
              <div className="flex items-center gap-2">
                <img 
                  src="https://assets.belo.app/images/blockchains/bsc.png" 
                  alt="BNB Chain" 
                  className="w-5 h-5 rounded-full"
                />
                <span>BNB Chain</span>
              </div>
            </SelectItem>
            <SelectItem value="eth">
              <div className="flex items-center gap-2">
                <img 
                  src="https://assets.belo.app/images/eth.png" 
                  alt="Ethereum" 
                  className="w-5 h-5 rounded-full"
                />
                <span>Ethereum</span>
              </div>
            </SelectItem>
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
        
        {isConnected && account ? (
          <ProfileMenu 
            account={account} 
            onDisconnect={disconnect}
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
