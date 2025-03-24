import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { WALLETS } from "@/lib/networks";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Definir tipo para window.ethereum con isTrust
declare global {
  interface Window {
    ethereum?: {
      isTrust?: boolean;
      [key: string]: unknown;
    };
  }
}

// Agregar tipo para operaMini
interface Navigator {
  vendor: string;
  opera?: unknown;
}

const WalletModal = ({ open, onOpenChange }: WalletModalProps) => {
  const { connectWallet, isConnecting, connectors } = useWallet();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar si estamos en un dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || ((window as unknown) as Navigator).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(
        typeof userAgent === 'string' ? userAgent : ''
      );
      setIsMobile(isMobileDevice);
    };
    
    checkIfMobile();
  }, [isMobile]);
  
  // Verifica si Trust Wallet está disponible
  const isTrustWalletAvailable = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const ethereum = window.ethereum;
    if (!ethereum) return false;
    
    // Detectar Trust Wallet
    // Trust Wallet agrega 'isTrust' a ethereum
    return !!ethereum.isTrust;
  };

  const handleConnect = async (walletId: string) => {
    try {
      setError(null);
      
      // Verificaciones específicas para Trust Wallet
      if (walletId === 'injected') {
        if (isMobile && !isTrustWalletAvailable()) {
          // En móvil pero Trust Wallet no está instalado
          // Redirigir a la app store o deeplink
          if (confirm(t('install_trust_wallet_prompt'))) {
            const isAndroid = /android/i.test(navigator.userAgent);
            if (isAndroid) {
              window.open('https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp', '_blank');
            } else {
              window.open('https://apps.apple.com/app/apple-store/id1288339409', '_blank');
            }
            return;
          }
        }
      }
      
      // Verificar si el conector está disponible
      const isConnectorAvailable = connectors.some(c => c.type === walletId);
      
      if (!isConnectorAvailable) {
        console.error(`Conector para ${walletId} no encontrado`);
        setError(t('wallet_connection_failed'));
        return;
      }
      
      await connectWallet(walletId);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to connect to wallet:", error);
      setError(t('wallet_connection_failed'));
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
              onClick={() => handleConnect(wallet.id)}
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
