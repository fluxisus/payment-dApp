import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { QrReadResponse } from "@/lib/api";
import { extractPaymentInfo } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { ProceedToPaymentButton } from "@/components/ProceedToPaymentButton";

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
    } else {
      onOpenChange(true);
    }
  };

  const handleSwitchNetwork = async () => {
    if (!paymentInfo || !paymentInfo.networkId) return;
    
    try {
      await switchNetwork(paymentInfo.networkId);
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };

  const handleProceedToPayment = () => {
    // Proceed to payment logic will go here
    console.log("Proceed to payment for:", paymentInfo?.id);
  };

  // Get network name from network ID
  const getNetworkName = (networkId: number | null) => {
    if (!networkId) return "Unknown";
    
    switch (networkId) {
      case 1: return "Ethereum";
      case 137: return "Polygon";
      case 56: return "BSC";
      default: return "Unknown";
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
                      isValidUrl(paymentData.data.payload.iss) ? (
                        <a 
                          href={paymentData.data.payload.iss} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-crypto-accent hover:text-crypto-accent-hover hover:underline inline-flex items-center"
                        >
                          {paymentData.data.payload.iss}
                          <ExternalLink className="ml-1 w-3 h-3" />
                        </a>
                      ) : (
                        paymentData.data.payload.iss
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
                  <div className="flex justify-between">
                    <p className="text-crypto-text-secondary">Recipient:</p>
                    <p className="truncate max-w-[200px]">{paymentInfo.address}</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Button */}
              <ProceedToPaymentButton 
                networkMismatch={networkMismatch} 
                onClick={handleProceedToPayment} 
              />
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