import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { 
  getNaspipNetwork, 
  getNetworkTranslationKey, 
  getTokenAddress, 
  getNetworkIcon,
  type TokenSymbol 
} from "@/lib/networks";
import InstructionsModal from "./InstructionsModal";
import { generateQrToken } from "@/lib/api";

interface ChargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChargeModal = ({ open, onOpenChange }: ChargeModalProps) => {
  const { t } = useLanguage();
  const { address, chainId, isConnected } = useWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [qrData, setQrData] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    token: "USDT" as TokenSymbol,
    amount: "",
    address: "",
    description: "",
    merchantName: "",
    merchantDescription: "",
    merchantTaxId: "",
  });
  const [showExtraFields, setShowExtraFields] = useState(false);

  // Reset form data and set address when modal is opened
  useEffect(() => {
    if (open) {
      setFormData({
        id: "",
        token: "USDT" as TokenSymbol,
        amount: "",
        address: address || "",
        description: "",
        merchantName: "",
        merchantDescription: "",
        merchantTaxId: "",
      });
      setShowExtraFields(false);
      setShowInstructions(false);
      setQrData("");
    }
  }, [open, address]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and up to 2 decimal places
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || (numValue >= 0 && numValue <= 10000000)) {
        setFormData(prev => ({ ...prev, amount: value }));
      }
    }
  };

  const tokenOptions = [
    { value: "USDT" as TokenSymbol, icon: "https://assets.belo.app/images/usdt.png" },
    { value: "USDC" as TokenSymbol, icon: "https://assets.belo.app/images/usdc.png" },
  ];

  // Check if required fields are filled
  const isFormValid = formData.amount.trim() !== "" && formData.address.trim() !== "";

  const handleCreatePayment = async () => {
    if (!isConnected) {
      toast({
        title: t('wallet_not_connected'),
        description: t('connect_wallet_first'),
        variant: "destructive",
      });
      return;
    }

    if (!chainId) {
      toast({
        title: t('error'),
        description: t('network_mismatch'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current timestamp and add 1 hour for expiration
      const expiresAt = Date.now() + 3600000; // 1 hour in milliseconds

      // Get NASPIP network identifier
      const naspipNetwork = getNaspipNetwork(chainId);
      if (!naspipNetwork) {
        throw new Error('Unsupported network');
      }

      // Get token address for the current network
      const tokenAddress = getTokenAddress(formData.token, chainId);
      if (!tokenAddress) {
        throw new Error('Token not supported on this network');
      }

      // Create NASPIP network_token format
      const unique_asset_id = `n${naspipNetwork}_t${tokenAddress}`;

      // Prepare the request body
      const order = formData.merchantName || formData.merchantDescription || formData.merchantTaxId ? {
        total: formData.amount,
        coin_code: formData.token,
        merchant: {
          name: formData.merchantName,
          description: formData.merchantDescription,
          tax_id: formData.merchantTaxId
        },
        items: []
      } : undefined;

      const requestBody = {
        payment: {
          id: formData.id.trim() || uuidv4(),
          address: formData.address,
          unique_asset_id,
          is_open: false,
          amount: formData.amount,
          expires_at: expiresAt
        },
        order
      };

      const response = await generateQrToken(requestBody);

      if (!response.ok) {
        toast({
          title: t('qr_code_generation_error'),
          variant: "destructive",
        });
      }
      
      // Set QR data and show instructions modal
      setQrData(response.data);
      setShowInstructions(response.ok);
      
      // Close the charge modal
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('charge_error'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get network name based on chainId
  const getNetworkName = (chainId: number) => {
    const networkTransalationKey = getNetworkTranslationKey(chainId) ?? "unknown_network";
    return t(networkTransalationKey);
  };

  // Get network icon based on chainId
  const networkIcon = getNetworkIcon(chainId) ?? getNetworkIcon(1);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card border-crypto-border sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          {/* Network Banner */}
          <div className="flex items-center justify-center gap-2 py-2 border-b border-white/10">
            <img 
              src={networkIcon}
              alt={getNetworkName(chainId || 1)}
              className="w-6 h-6"
            />
            <span className="text-base">
              {getNetworkName(chainId || 1)}
            </span>
          </div>

          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-xl font-semibold text-center">
              {t('charge')}
            </DialogTitle>
          </DialogHeader>

          {/* Main Content - Custom Scrollbar */}
          <div className={cn(
            "flex-1 px-4 overflow-y-auto",
            "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30",
            "scrollbar-track-rounded-full scrollbar-thumb-rounded-full"
          )}>
            <div className="space-y-6 py-4">
              {/* ID and Amount Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id">{t('payment_id')}:</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={e => setFormData(prev => ({ ...prev, id: e.target.value.slice(0, 128) }))}
                    className="bg-white/5"
                    placeholder={t('enter_id')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">{t('amount')}:</Label>
                  <Input
                    id="amount"
                    type="text"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    className="bg-white/5"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('address')}:</Label>
                  <div className="px-3 py-2 font-mono text-sm tracking-tight text-foreground">
                    {formData.address}
                  </div>
                </div>
              </div>

              {/* Token Selector */}
              <div className="space-y-2">
                <Label>{t('token')}</Label>
                <div className="flex gap-4 justify-center">
                  {tokenOptions.map((token) => (
                    <button
                      key={token.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, token: token.value }))}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                        formData.token === token.value 
                          ? "bg-white/10 scale-105" 
                          : "bg-white/5 opacity-70"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 p-2 flex items-center justify-center">
                        <img
                          src={token.icon}
                          alt={token.value}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="mt-2 font-medium">{token.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Fields Toggle */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowExtraFields(!showExtraFields)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="font-medium">{t('additional_details')}</span>
                  {showExtraFields ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {/* Extra Fields Content */}
                {showExtraFields && (
                  <div className="space-y-4 p-4 bg-white/5 rounded-xl">
                    {/* Payment Description */}
                    <div>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-white/5"
                        placeholder={t('payment_description')}
                      />
                    </div>

                    {/* Merchant Information */}
                    <div className="space-y-4">
                      <Input
                        id="merchantName"
                        value={formData.merchantName}
                        onChange={e => setFormData(prev => ({ ...prev, merchantName: e.target.value }))}
                        className="bg-white/5"
                        placeholder={t('merchant_name')}
                      />

                      <Input
                        id="merchantDescription"
                        value={formData.merchantDescription}
                        onChange={e => setFormData(prev => ({ ...prev, merchantDescription: e.target.value }))}
                        className="bg-white/5"
                        placeholder={t('merchant_description')}
                      />

                      <Input
                        id="merchantTaxId"
                        value={formData.merchantTaxId}
                        onChange={e => setFormData(prev => ({ ...prev, merchantTaxId: e.target.value }))}
                        className="bg-white/5"
                        placeholder={t('tax_id')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Create Payment Button - Fixed at bottom */}
          <div className="px-4 py-4 border-t border-white/10">
            <Button
              onClick={handleCreatePayment}
              disabled={!isFormValid || isLoading}
              className="w-full button-primary"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {}
                </div>
              ) : (
                t('create_payment_instructions_req')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InstructionsModal
        open={showInstructions}
        onOpenChange={setShowInstructions}
        qrData={qrData}
      />
    </>
  );
};

export default ChargeModal;
