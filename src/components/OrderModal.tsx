import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { QrReadResponse } from "@/lib/api";
import { extractPaymentInfo } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { ProceedToPaymentButton } from "@/components/ProceedToPaymentButton";
import { useSimulateContract, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useToast } from "@/hooks/use-toast";

// ERC20 ABI with transfer function
const erc20ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentData: QrReadResponse | null;
  isLoading: boolean;
}

const OrderModal = ({ open, onOpenChange, paymentData, isLoading }: OrderModalProps) => {
  const { chainId, switchNetwork } = useWallet();
  const [paymentInfo, setPaymentInfo] = useState<ReturnType<typeof extractPaymentInfo> | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const { toast } = useToast();
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [transferArgs, setTransferArgs] = useState<{
    address: `0x${string}`;
    args: [`0x${string}`, bigint];
  } | null>(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (open) {
      // Reset payment state when modal opens
      setPaymentInitiated(false);
      setTransferArgs(null);
    }
  }, [open]);

  // Extract payment info when payment data changes
  useEffect(() => {
    if (paymentData) {
      const info = extractPaymentInfo(paymentData);
      setPaymentInfo(info);
      
      // Check for network mismatch
      if (info.networkId && chainId) {
        setNetworkMismatch(info.networkId !== chainId);
      }
    } else {
      setPaymentInfo(null);
    }
  }, [paymentData, chainId]);

  // Update network mismatch when chain ID changes
  useEffect(() => {
    if (paymentInfo?.networkId && chainId) {
      setNetworkMismatch(paymentInfo.networkId !== chainId);
    }
  }, [chainId, paymentInfo]);

  // Handle dialog close - reset state
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      onOpenChange(false);
      setPaymentInitiated(false);
      setTransferArgs(null);
    } else {
      onOpenChange(true);
    }
  };

  const handleSwitchNetwork = async () => {
    if (!paymentInfo || !paymentInfo.networkId || !switchNetwork) return;
    
    try {
      await switchNetwork(paymentInfo.networkId);
    } catch (error) {
      console.error("Error switching network:", error);
      toast({
        title: "Network Switch Failed",
        description: "Failed to switch to the required network",
        variant: "destructive",
      });
    }
  };

  // Setup the simulate contract hook
  const { data: simulateData } = useSimulateContract({
    address: transferArgs?.address,
    abi: erc20ABI,
    functionName: 'transfer',
    args: transferArgs?.args,
    query: {
      enabled: !!transferArgs,
    },
  });

  // Setup the write contract hook for token transfer
  const { writeContract, isPending: isWritePending, isError: isWriteError, error: writeError } = useWriteContract();

  const handleProceedToPayment = async () => {
    if (!paymentInfo) return;
    
    try {
      // Get the token address from the payment info
      const tokenAddress = paymentInfo.tokenAddress as `0x${string}`;
      if (!tokenAddress) {
        throw new Error("Token address not found in payment information");
      }

      // Get the recipient address from the payment info
      const recipientAddress = paymentInfo.address as `0x${string}`;
      if (!recipientAddress) {
        throw new Error("Recipient address not found in payment information");
      }

      // Get the amount from the payment info and convert to the correct format
      // We need to determine the token decimals - for simplicity, we'll use 6 for USDC/USDT
      // In a production app, you would query the token contract for decimals
      const decimals = 6;
      const amount = parseUnits(paymentInfo.amount, decimals);

      // Set the transfer args to trigger the simulation
      setTransferArgs({
        address: tokenAddress,
        args: [recipientAddress, amount],
      });

      // Mark payment as initiated
      setPaymentInitiated(true);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  // Execute the transaction when simulation data is available
  useEffect(() => {
    if (simulateData && simulateData.request && paymentInitiated) {
      try {
        writeContract(simulateData.request);
      } catch (error) {
        console.error("Error sending transaction:", error);
        toast({
          title: "Transaction Failed",
          description: error instanceof Error ? error.message : "Failed to send transaction",
          variant: "destructive",
        });
      }
    }
  }, [simulateData, paymentInitiated, writeContract, toast]);

  // Get network name from network ID
  const getNetworkName = (networkId: number | null) => {
    if (!networkId) return "Unknown";
    
    switch (networkId) {
      case 1: return "Ethereum";
      case 56: return "BNB Smart Chain";
      case 137: return "Polygon";
      case 42161: return "Arbitrum";
      case 10: return "Optimism";
      case 43114: return "Avalanche";
      case 8453: return "Base";
      case 5: return "Goerli (Testnet)";
      case 80001: return "Mumbai (Testnet)";
      case 11155111: return "Sepolia (Testnet)";
      default: return `Network ${networkId}`;
    }
  };

  // Check if a string is a valid URL
  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(
        "glass-card border-crypto-border sm:max-w-md overflow-visible",
        "order-modal" // Custom class for targeting in CSS
      )}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            Order Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-crypto-primary" />
              <p className="text-crypto-text-secondary">Loading order details...</p>
            </div>
          ) : paymentInfo && paymentData ? (
            <>
              {/* Network mismatch warning */}
              {networkMismatch && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Network mismatch. This payment requires {getNetworkName(paymentInfo.networkId)}.</p>
                    <button 
                      onClick={handleSwitchNetwork}
                      className="text-yellow-400 hover:text-yellow-300 font-medium mt-1"
                    >
                      Switch Network
                    </button>
                  </div>
                </div>
              )}
              
              {/* Merchant Information */}
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Merchant Information</h3>
                <div className="p-4 bg-white/5 rounded-xl space-y-2">
                  {paymentInfo.order?.merchant && (
                    <>
                      <p className="font-medium">{paymentInfo.order.merchant.name}</p>
                      <p className="text-sm">{paymentInfo.order.merchant.description}</p>
                      <p className="text-xs text-crypto-text-secondary">Tax id: {paymentInfo.order.merchant.tax_id}</p>
                    </>
                  )}
                  <div className="text-xs text-crypto-text-secondary mt-2">
                    From: {
                      isValidUrl(paymentData.payload.iss) ? (
                        <a 
                          href={paymentData.payload.iss} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-crypto-accent hover:text-crypto-accent-hover hover:underline inline-flex items-center"
                        >
                          {paymentData.payload.iss}
                          <ExternalLink className="ml-1 w-3 h-3" />
                        </a>
                      ) : (
                        paymentData.payload.iss
                      )
                    }
                  </div>
                </div>
              </div>
              
              {/* Order Information */}
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Identifier: {paymentInfo.id}</h3>
                
                {/* Order Items - Only this section is scrollable */}
                {paymentInfo.order?.items && paymentInfo.order.items.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl space-y-3 max-h-60 overflow-y-auto">
                    {paymentInfo.order.items.map((item, index) => (
                      <div key={index} className="border-b border-white/10 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <p className="font-medium">{item.description}</p>
                          <p>{item.amount} {item.coin_code}</p>
                        </div>
                        <div className="flex justify-between text-sm text-crypto-text-secondary">
                          <p>Unit price: {item.unit_price}</p>
                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Order Total */}
                    <div className="flex justify-between pt-2 font-medium border-t border-white/20">
                      <p>Total</p>
                      <p>{paymentInfo.order.coinCode} {paymentInfo.order.totalAmount}</p>
                    </div>
                  </div>
                )}
                
                {/* Payment Details */}
                <div className="p-4 bg-white/5 rounded-xl space-y-1 text-sm">
                  <div className="flex justify-between">
                    <p className="text-crypto-text-secondary">Payment Amount:</p>
                    <p>{paymentInfo.amount}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-crypto-text-secondary">Network:</p>
                    <p>{getNetworkName(paymentInfo.networkId)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-crypto-text-secondary">Recipient:</p>
                    <p className="break-all">{paymentInfo.address}</p>
                  </div>
                </div>
              </div>
              
              {/* Transaction Status */}
              {paymentInitiated && (
                <div className="p-4 bg-white/5 rounded-xl space-y-2">
                  <h3 className="font-medium">Transaction Status</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <p className="text-crypto-text-secondary">Status:</p>
                      {isWritePending && <p className="text-yellow-400">Processing...</p>}
                      {!isWritePending && !isWriteError && <p className="text-green-400">Submitted</p>}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {isWriteError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Transaction failed: {writeError?.message || "Unknown error"}</p>
                  </div>
                </div>
              )}
              
              {/* Payment Button */}
              {!paymentInitiated && (
                <ProceedToPaymentButton 
                  networkMismatch={networkMismatch} 
                  onClick={handleProceedToPayment} 
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-crypto-text-secondary">No order information available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal; 