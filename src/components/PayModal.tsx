
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";

interface PayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PayModal = ({ open, onOpenChange }: PayModalProps) => {
  const { toast } = useToast();
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera stream when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setShowCamera(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [open]);

  const handleScanClick = async () => {
    try {
      if (showCamera && streamRef.current) {
        // If camera is already on, turn it off
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setShowCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setShowCamera(true);
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive",
      });
    }
  };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      if (text.startsWith("naspip")) {
        toast({
          title: "Valid Code",
          description: "Processing payment...",
          className: "bg-green-600 border-green-700"
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "The clipboard content is not a valid payment code",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Clipboard Access Denied",
        description: "Please allow clipboard access to paste content",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Pay
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {showCamera && (
            <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden mb-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/5 h-3/5 relative">
                  {/* Top-left corner */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
                  {/* Top-right corner */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
                  {/* Bottom-left corner */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
                  {/* Bottom-right corner */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-lg" />
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleScanClick}
            className="button-primary w-full"
          >
            <Camera className="w-5 h-5" />
            {showCamera ? "Stop Camera" : "Scan"}
          </button>
          
          <button
            onClick={handlePasteClick}
            className="button-secondary w-full"
          >
            <QrCode className="w-5 h-5" />
            Paste
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayModal;
