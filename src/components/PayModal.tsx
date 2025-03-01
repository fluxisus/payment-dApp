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
  const [cameraReady, setCameraReady] = useState(false);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Clean up camera when modal closes
  useEffect(() => {
    if (!open && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setShowCamera(false);
      setCameraReady(false);
    }
  }, [open]);

  // This effect handles setting up the video element when showCamera changes
  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      // Set srcObject in this effect to ensure it happens after state update
      videoRef.current.srcObject = streamRef.current;
      
      // Add event listeners to handle video loading
      const handleCanPlay = () => {
        setCameraReady(true);
      };
      
      const handleError = (e: Event) => {
        setCameraReady(false);
      };
      
      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.addEventListener('error', handleError);
      
      // Clean up event listeners
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('canplay', handleCanPlay);
          videoRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [showCamera, streamRef.current]);

  const handleScanClick = async () => {
    try {
      // If camera is already on, turn it off
      if (showCamera && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setShowCamera(false);
        setCameraReady(false);
        return;
      }

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);

      // Simple camera request - don't set srcObject here
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false
      });
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Set state to show camera - the effect will handle setting srcObject
      setShowCamera(true);
      
      console.log('Camera stream obtained:', stream.getVideoTracks().map(t => t.label));
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Access Error",
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
      <DialogContent className="glass-card border-crypto-border sm:max-w-md">
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
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror the video for selfie view
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  Loading camera...
                </div>
              )}
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
