
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ChargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChargeModal = ({ open, onOpenChange }: ChargeModalProps) => {
  const [formData, setFormData] = useState({
    id: "",
    token: "USDT",
    amount: "",
  });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Charge
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="id">ID</Label>
            <Input
              id="id"
              value={formData.id}
              onChange={e => setFormData(prev => ({ ...prev, id: e.target.value.slice(0, 128) }))}
              className="bg-white/5"
              placeholder="Enter ID"
            />
          </div>

          <div className="space-y-2">
            <Label>Token</Label>
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

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="text"
              value={formData.amount}
              onChange={handleAmountChange}
              className="bg-white/5"
              placeholder="0.00"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChargeModal;
