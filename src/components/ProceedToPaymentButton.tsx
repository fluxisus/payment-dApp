import { cn } from "@/lib/utils";

export interface ProceedToPaymentButtonProps {
  networkMismatch: boolean;
  onClick?: () => void;
}

export const ProceedToPaymentButton = ({ networkMismatch, onClick }: ProceedToPaymentButtonProps) => {
  return (
    <button
      className={cn(
        "w-full py-3 px-6 rounded-xl text-lg font-medium transition-all duration-200 flex items-center justify-center",
        networkMismatch 
          ? "bg-gray-600/30 text-gray-400 cursor-not-allowed" 
          : "button-primary hover:scale-[1.02] active:scale-[0.98]"
      )}
      disabled={networkMismatch}
      onClick={networkMismatch ? undefined : onClick}
    >
      Proceed to Payment
    </button>
  );
}; 