import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useLanguage } from "@/contexts/LanguageContext";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WALLETS = [
  {
    name: "MetaMask",
    icon: "https://assets.pcswap.org/web/wallets/metamask.png",
  },
  {
    name: "Trust Wallet",
    icon: "https://assets.pcswap.org/web/wallets/trust.png",
  },
];

const WalletModal = ({ open, onOpenChange }: WalletModalProps) => {
  const { connectWallet, isConnecting } = useWallet();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (walletName: string) => {
    if (walletName === "MetaMask") {
      try {
        setError(null);
        await connectWallet();
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to connect to wallet:", error);
        setError(t('wallet_connection_failed'));
      }
    } else {
      // For other wallets, just close the modal for now
      // (future integration point)
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-crypto-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {t('connect_wallet')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {WALLETS.map((wallet) => (
            <button
              key={wallet.name}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleConnect(wallet.name)}
              disabled={isConnecting}
            >
              <img
                src={wallet.icon}
                alt={wallet.name}
                className="w-8 h-8"
              />
              <span className="font-medium">
                {wallet.name}
              </span>
            </button>
          ))}
          
          {isConnecting && (
            <div className="text-center text-sm text-crypto-text-secondary animate-pulse">
              {t('connecting')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;
