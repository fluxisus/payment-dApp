
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMetaMask } from "@/hooks/use-metamask";

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
  const { connect } = useMetaMask();

  const handleConnect = async (walletName: string) => {
    if (walletName === "MetaMask") {
      try {
        await connect();
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
      }
    } else {
      // For other wallets, just close the modal for now
      // (future integration point)
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Connect Wallet
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.name}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-200"
              onClick={() => handleConnect(wallet.name)}
            >
              <img
                src={wallet.icon}
                alt={wallet.name}
                className="w-8 h-8"
              />
              <span className="font-medium">{wallet.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;
