import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/use-wallet";

export interface ProceedToPaymentButtonProps {
  networkMismatch: boolean;
  onClick?: () => void;
}

export const ProceedToPaymentButton = ({ networkMismatch, onClick }: ProceedToPaymentButtonProps) => {
  const { t } = useLanguage();
  const { isConnected } = useWallet();

  const isDisabled = networkMismatch || !isConnected;
  const buttonStyle = isDisabled
    ? "bg-gray-600/30 text-gray-500 dark:text-gray-400 cursor-not-allowed"
    : "button-primary hover:scale-[1.02] active:scale-[0.98]";

  return (
    <button
      className={cn(
        "w-full py-3 px-6 rounded-xl text-lg font-medium transition-all duration-200 flex items-center justify-center",
        buttonStyle
      )}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
    >
      {!isConnected ? t('connect_wallet_first') : t('proceed_to_payment')}
    </button>
  );
}; 