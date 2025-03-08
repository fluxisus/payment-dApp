import { Header } from "@/components/Header";
import PayModal from "@/components/PayModal";
import ChargeModal from "@/components/ChargeModal";
import OrderModal from "@/components/OrderModal";
import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useTokenTransactions } from "@/hooks/use-token-transactions";
import { useChainId } from "wagmi";
import { readQrToken, QrReadResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  isTokenSupportedOnNetwork,
  type TokenSymbol,
  NETWORKS,
  TOKEN_METADATA
} from "@/lib/networks";

const Index = () => {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [paymentData, setPaymentData] = useState<QrReadResponse | null>(null);
  const { isConnected } = useWallet();
  const chainId = useChainId();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Fetch token balances using our custom hook
  const { balance: usdcBalance, isLoading: isLoadingUsdc, isSupported: isUsdcSupported } = useTokenBalance('USDC');
  const { balance: usdtBalance, isLoading: isLoadingUsdt, isSupported: isUsdtSupported } = useTokenBalance('USDT');

  // Fetch token transactions
  const { transactions, isLoading: isLoadingTransactions } = useTokenTransactions();

  // Define tokens with their balances
  const balanceCards = [
    {
      token: "USDT", 
      amount: usdtBalance, 
      icon: TOKEN_METADATA.USDT.icon,
      isLoading: isLoadingUsdt,
      isSupported: isUsdtSupported
    },
    {
      token: "USDC", 
      amount: usdcBalance, 
      icon: TOKEN_METADATA.USDC.icon,
      isLoading: isLoadingUsdc,
      isSupported: isUsdcSupported
    }
  ];

  // Handle NASPIP token detection
  const handleTokenDetected = async (token: string) => {
    // Close Pay modal if open
    setIsPayModalOpen(false);
    
    // Show loading state
    setIsLoadingOrder(true);
    
    try {
      // Call API to read the token
      const data = await readQrToken(token);
      
      // Store the payment data
      setPaymentData(data);
      
      // Open the order modal
      setIsOrderModalOpen(true);
    } catch (error) {
      console.error("Error reading token:", error);
      toast({
        title: t('error_reading_token'),
        description: error instanceof Error ? error.message : t('failed_read_token'),
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Handle closing the order modal
  const handleOrderModalClose = (open: boolean) => {
    if (!open) {
      setPaymentData(null);
      setIsOrderModalOpen(false);
    }
  };

  // Get network name based on chainId
  const getNetworkName = () => {
    const networkKey = chainId === 1 ? 'ethereum' : 
                      chainId === 137 ? 'polygon' : 
                      chainId === 56 ? 'bsc' : 'unknown_network';
    return t(networkKey);
  };

  // Get supported tokens on current network
  const getSupportedTokens = () => {
    const supported: TokenSymbol[] = [];
    if (isTokenSupportedOnNetwork('USDT', chainId)) supported.push('USDT');
    if (isTokenSupportedOnNetwork('USDC', chainId)) supported.push('USDC');
    return supported;
  };

  const supportedTokens = getSupportedTokens();

  const handleChargeClick = () => {
    if (!isConnected) {
      toast({
        title: t('wallet_not_connected'),
        description: t('connect_wallet_first'),
        variant: "destructive",
      });
      return;
    }
    setIsChargeModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-crypto-dark">
      <Header />
      
      <main className="flex-1 flex flex-col gap-8 p-6 mt-24">
        {/* Action Buttons - In a glass card container */}
        <div className="glass-card p-6 max-w-2xl mx-auto w-full">
          <div className="flex justify-center gap-4 w-full">
            <button
              onClick={handleChargeClick}
              className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700
                       flex items-center justify-center text-lg font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              {t('charge')}
            </button>
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700
                       flex items-center justify-center text-lg font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              {t('pay')}
            </button>
          </div>
        </div>
        
        {/* Balance Section */}
        <div className="glass-card p-6 max-w-2xl mx-auto w-full">
          <h2 className="text-xl font-semibold mb-4">{t('balance')}</h2>
          {supportedTokens.length === 0 ? (
            <div className="p-4 bg-white/5 rounded-xl text-center py-4 text-crypto-text-secondary">
              {t('no_supported_tokens', { network: getNetworkName() })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {balanceCards
                .filter(token => token.isSupported)
                .map((tokenBalance) => (
                  <div key={tokenBalance.token} className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 p-1 flex items-center justify-center mr-3">
                          <img 
                            src={tokenBalance.icon} 
                            alt={tokenBalance.token} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-lg">{tokenBalance.token}</span>
                      </div>
                      <div className="text-2xl font-semibold">
                        {isConnected ? (
                          tokenBalance.isLoading ? (
                            <div className="flex items-center">
                              <Loader2 className="w-5 h-5 mr-2 animate-spin text-crypto-primary" />
                              <span className="text-gray-400">{t('loading')}</span>
                            </div>
                          ) : (
                            tokenBalance.amount
                          )
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Transaction History Section - Only shown when wallet is connected */}
        {isConnected && (
          <div className="glass-card p-6 max-w-2xl mx-auto w-full">
            <h2 className="text-xl font-semibold mb-4">{t('transaction_history')}</h2>
            {isLoadingTransactions ? (
              <div className="p-4 bg-white/5 rounded-xl text-center py-4 text-crypto-text-secondary">
                {t('loading_transactions')}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-4 bg-white/5 rounded-xl text-center py-4 text-crypto-text-secondary">
                {t('no_transactions')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 bg-white/5 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{tx.type === 'Received' ? t('received') : t('sent')} {tx.token}</p>
                        <p className="text-sm text-crypto-text-secondary">{tx.timestamp}</p>
                      </div>
                      <div className={`text-lg font-medium ${tx.type === 'Received' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'Received' ? '+' : '-'}{tx.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Modals */}
      <PayModal 
        open={isPayModalOpen} 
        onOpenChange={setIsPayModalOpen} 
        onTokenDetected={handleTokenDetected}
      />
      
      <ChargeModal 
        open={isChargeModalOpen} 
        onOpenChange={setIsChargeModalOpen} 
      />
      
      <OrderModal 
        open={isOrderModalOpen} 
        onOpenChange={handleOrderModalClose} 
        paymentData={paymentData}
        isLoading={isLoadingOrder}
      />
    </div>
  );
};

export default Index;
