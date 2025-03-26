import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface InstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrData: string;
}

const InstructionsModal = ({ open, onOpenChange, qrData }: InstructionsModalProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      // Mostrar tooltip
      setShowCopiedTooltip(true);
      // Ocultar después de 2 segundos
      setTimeout(() => {
        setShowCopiedTooltip(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: t('error'),
        description: t('copy_failed'),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-crypto-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            {t('payment_instructions_ready')}
          </DialogTitle>
        </DialogHeader>

        {/* QR Code */}
        <div className="flex justify-center p-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG
              value={qrData}
              size={350}
              level="L"
              marginSize={2}
              className="w-full h-full"
              imageSettings={{
                src: "/fluxis_icon.svg",
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>
        </div>

        {/* Share Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center text-crypto-text">
            {t('share_instructions')}
          </h3>
          
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 p-2 hover:bg-white/10 transition-colors"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(qrData)}`, '_blank')}
            >
              <img 
                src="/whatsapp.png" 
                alt={t('share_on_whatsapp')}
                className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 p-2 hover:bg-white/10 transition-colors"
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(qrData)}`, '_blank')}
            >
              <img 
                src="/telegram.png" 
                alt={t('share_on_telegram')}
                className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 p-2 hover:bg-white/10 transition-colors group"
                onClick={handleCopyLink}
              >
                <Copy className="w-full h-full text-gray-800 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              </Button>
              
              {/* Tooltip */}
              {showCopiedTooltip && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md">
                  {t('qr_naspip_copied')}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsModal; 