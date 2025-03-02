import { Header } from "@/components/Header";
import PayModal from "@/components/PayModal";
import ChargeModal from "@/components/ChargeModal";
import OrderModal from "@/components/OrderModal";
import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useTokenBalance, TOKENS, TokenSymbol, isTokenSupportedOnNetwork } from "@/hooks/use-token-balance";
import { useTokenTransactions } from "@/hooks/use-token-transactions";
import { useChainId } from "wagmi";
import { readQrToken, QrReadResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [paymentData, setPaymentData] = useState<QrReadResponse | null>(null);
  const { isConnected } = useWallet();
  const chainId = useChainId();
  const { toast } = useToast();
  
  // Fetch token balances using our custom hook
  const { balance: usdcBalance, isLoading: isLoadingUsdc, isSupported: isUsdcSupported } = useTokenBalance('USDC');
  const { balance: usdtBalance, isLoading: isLoadingUsdt, isSupported: isUsdtSupported } = useTokenBalance('USDT');

  // Fetch token transactions
  const { transactions, isLoading: isLoadingTransactions } = useTokenTransactions();

  // Define tokens with their balances
  const tokenBalances = [
    { 
      token: "USDT", 
      amount: usdtBalance, 
      icon: TOKENS.USDT.icon,
      isLoading: isLoadingUsdt,
      isSupported: isUsdtSupported
    },
    { 
      token: "USDC", 
      amount: usdcBalance, 
      icon: TOKENS.USDC.icon,
      isLoading: isLoadingUsdc,
      isSupported: isUsdcSupported
    },
  ];

  // Handle NASPIP token detection
  const handleTokenDetected = async (token: string) => {
    // Close Pay modal if open
    setIsPayModalOpen(false);
    
    // Show loading state
    setIsLoadingOrder(true);
    setIsOrderModalOpen(true);
    
    try {
      // Show processing toast
      toast({
        title: "Processing",
        description: "Reading payment information...",
      });

      // Call the API to read the token
      const response = await readQrToken(token);
      
      if (response) {
        // Store the payment data
        setPaymentData(response);
        
        // Show success toast
        toast({
          title: "Payment Information Read",
          description: "Ready to process payment",
          className: "bg-green-600 border-green-700"
        });
        
        // Log the response to console
        console.log("Payment data:", response);
      }
    } catch (error) {
      console.error("Error processing NASPIP token:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process payment code",
        variant: "destructive"
      });
      
      // Close Order modal on error
      setIsOrderModalOpen(false);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Handle Order modal close
  const handleOrderModalClose = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setPaymentData(null);
      setIsOrderModalOpen(false);
    }
  };

  // Get network name based on chainId
  const getNetworkName = () => {
    switch (chainId) {
      case 1:
        return "Ethereum";
      case 137:
        return "Polygon";
      case 56:
        return "BSC";
      default:
        return "the selected network";
    }
  };

  // Get supported tokens on current network
  const getSupportedTokens = () => {
    const supported: TokenSymbol[] = [];
    if (isTokenSupportedOnNetwork('USDT', chainId)) supported.push('USDT');
    if (isTokenSupportedOnNetwork('USDC', chainId)) supported.push('USDC');
    return supported;
  };

  const supportedTokens = getSupportedTokens();

  return (
    <div className="min-h-screen flex flex-col bg-crypto-dark">
      <Header />
      
      <main className="flex-1 flex flex-col gap-8 p-6 mt-24">
        {/* Action Buttons - In a glass card container */}
        <div className="glass-card p-6 max-w-2xl mx-auto w-full">
          <div className="flex justify-center gap-4 w-full">
            <button
              onClick={() => setIsChargeModalOpen(true)}
              className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700
                       flex items-center justify-center text-lg font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              Charge
            </button>
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700
                       flex items-center justify-center text-lg font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              Pay
            </button>
          </div>
        </div>
        
        {/* Balance Section */}
        <div className="glass-card p-6 max-w-2xl mx-auto w-full">
          <h2 className="text-xl font-semibold mb-4">Balance</h2>
          {supportedTokens.length === 0 ? (
            <div className="p-4 bg-white/5 rounded-xl text-center py-4 text-crypto-text-secondary">
              No supported tokens available on {getNetworkName()}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {tokenBalances
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
                            <span className="text-gray-400">Loading...</span>
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
            <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
            {supportedTokens.length === 0 ? (
              <div className="p-4 bg-white/5 rounded-xl text-center py-4 text-crypto-text-secondary">
                No supported tokens available on {getNetworkName()}
              </div>
            ) : isLoadingTransactions ? (
              <div className="text-center py-4 text-crypto-text-secondary">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-4 bg-white/5 rounded-xl text-center py-4 text-crypto-text-secondary">
                No {supportedTokens.join(' or ')} transactions found on {getNetworkName()} in the last 30 days
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{tx.type}</span>
                      <span className="text-sm text-crypto-text-secondary">
                        {tx.type === "Received" ? `From: ${tx.from}` : `To: ${tx.to}`}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-medium ${tx.type === "Received" ? "text-emerald-400" : "text-red-400"}`}>
                        {tx.type === "Received" ? "+" : "-"}{tx.amount} {tx.token}
                      </span>
                      <span className="text-sm text-crypto-text-secondary">{tx.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <PayModal 
        open={isPayModalOpen} 
        onOpenChange={setIsPayModalOpen} 
        onTokenDetected={handleTokenDetected} 
      />
      <ChargeModal open={isChargeModalOpen} onOpenChange={setIsChargeModalOpen} />
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
