import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Network configurations
const NETWORKS = {
  1: { 
    translationKey: "ethereum" as const, 
    icon: "https://assets.belo.app/images/eth.png" 
  },
  137: { 
    translationKey: "polygon" as const, 
    icon: "https://assets.belo.app/images/blockchains/polygon.png" 
  },
  56: { 
    translationKey: "bsc" as const, 
    icon: "https://assets.belo.app/images/blockchains/bsc.png" 
  },
};

const ChargeModal = ({ open, onOpenChange }: ChargeModalProps) => {
  const { t } = useLanguage();
  const { address, chainId, isConnected } = useWallet();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    id: "",
    token: "USDT",
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
        token: "USDT",
        amount: "",
        address: address || "",
        description: "",
        merchantName: "",
        merchantDescription: "",
        merchantTaxId: "",
      });
      setShowExtraFields(false);
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
    { value: "USDT", icon: "https://assets.belo.app/images/usdt.png" },
    { value: "USDC", icon: "https://assets.belo.app/images/usdc.png" },
  ];

  // Check if required fields are filled
  const isFormValid = formData.id.trim() !== "" && 
                     formData.amount.trim() !== "" && 
                     formData.address.trim() !== "";

  const handleCreatePayment = () => {
    if (!isConnected) {
      toast({
        title: t('wallet_not_connected'),
        description: t('connect_wallet_first'),
        variant: "destructive",
      });
      return;
    }
    // TODO: Implement payment creation logic
    console.log("Creating payment with data:", formData);
  };

  // Get network name based on chainId
  const getNetworkName = (id: number) => {
    return t(NETWORKS[id as keyof typeof NETWORKS]?.translationKey || 'unknown_network');
  };

  // Get network icon based on chainId
  const getNetworkIcon = (id: number) => {
    return NETWORKS[id as keyof typeof NETWORKS]?.icon || NETWORKS[1].icon;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-crypto-border sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {/* Network Banner */}
        <div className="flex items-center justify-center gap-2 py-2 border-b border-white/10">
          <img 
            src={getNetworkIcon(chainId || 1)}
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
                <Label htmlFor="id">{t('id')}</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={e => setFormData(prev => ({ ...prev, id: e.target.value.slice(0, 128) }))}
                  className="bg-white/5"
                  placeholder={t('enter_id')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t('amount')}</Label>
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
                <Label htmlFor="address">{t('address')}</Label>
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
                      placeholder={t('description')}
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
            disabled={!isFormValid}
            className="w-full button-primary"
          >
            {t('create_payment')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChargeModal;
