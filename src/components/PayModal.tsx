import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import { useLanguage } from "@/contexts/LanguageContext";

interface PayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenDetected: (token: string) => void;
}

const PayModal = ({ open, onOpenChange, onTokenDetected }: PayModalProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [clipboardPermissionDenied, setClipboardPermissionDenied] = useState(false);
 
  // Reset state when modal is opened
  useEffect(() => {
    if (open) {
      // Reset clipboard permission state when modal opens
      setClipboardPermissionDenied(false);
      
      // Reset processing state
      setIsProcessing(false);
      
      // Ensure camera is off when modal opens
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Clear any scanning intervals
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      
      // Reset camera UI state
      setShowCamera(false);
      setCameraReady(false);
    }
  }, [open]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
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
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
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
        startQrScanning();
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
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
      };
    }
  }, [showCamera]);

  const startQrScanning = () => {
    if (!videoRef.current || !canvasRef.current || scanIntervalRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set up scanning interval
    scanIntervalRef.current = window.setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        // Set canvas dimensions to match video
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Get image data for QR code scanning
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        // If QR code found
        if (code) {
          
          // If it's a NASPIP token, process it
          if (code.data.startsWith("naspip")) {
            
            // Stop scanning
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
            
            // Turn off camera
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => {
                track.stop();
              });
              streamRef.current = null;
              setShowCamera(false);
            }
            
            // Process the token
            processNaspipToken(code.data);
          }
        }
      }
    }, 200); // Scan every 200ms
  };

  const handleScanClick = async () => {
    try {
      // If camera is already on, turn it off
      if (showCamera && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setShowCamera(false);
        setCameraReady(false);
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        return;
      }

      // Get available video devices
      // const devices = await navigator.mediaDevices.enumerateDevices();
      // const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // Simple camera request - don't set srcObject here
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Prefer back camera
        audio: false
      });
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Set state to show camera - the effect will handle setting srcObject
      setShowCamera(true);
      
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: t('camera_access_error'),
        description: t('allow_camera_access'),
        variant: "destructive",
      });
    }
  };

  const processNaspipToken = async (token: string) => {
    setIsProcessing(true);
    try {
      // Check if the token starts with "naspip"
      if (!token.startsWith("naspip")) {
        toast({
          title: t('invalid_code'),
          description: t('invalid_payment_code'),
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      // Close the Pay modal
      onOpenChange(false);
      
      // Notify parent component about the detected token
      onTokenDetected(token);
      
    } catch (error) {
      console.error("Error processing NASPIP token:", error);
      toast({
        title: t('processing_error'),
        description: error instanceof Error ? error.message : t('failed_read_token'),
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handlePasteClick = async () => {
    // If clipboard permission was previously denied, show a more helpful message
    if (clipboardPermissionDenied) {
      toast({
        title: "Clipboard Access Required",
        description: "Please allow clipboard access in your browser settings and try again",
        variant: "destructive",
      });
      return;
    }

    try {
      // Request clipboard permission and read text
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast({
          title: t('empty_clipboard'),
          description: t('clipboard_empty_text'),
          variant: "destructive",
        });
        return;
      }
      
      if (!text) {
        toast({
          title: "Empty Clipboard",
          description: "Your clipboard is empty or doesn't contain text",
          variant: "destructive",
        });
        return;
      }
      
      // Process the token from clipboard
      await processNaspipToken(text);
    } catch (error) {
      console.error("Clipboard error:", error);
      
      // Mark clipboard permission as denied for this session
      setClipboardPermissionDenied(true);
      
      toast({
        title: t('clipboard_access_denied'),
        description: t('allow_clipboard_access'),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-crypto-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {t('pay')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {showCamera ? (
            <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden mb-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas 
                ref={canvasRef} 
                className="hidden" // Hidden canvas for QR processing
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  {t('loading_camera')}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/5 h-3/5 relative">
                  {/* QR code scanning frame corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-lg" />
                </div>
              </div>
            </div>
          ) : null}
          <button
            onClick={handleScanClick}
            className="button-primary w-full"
            disabled={isProcessing}
          >
            <Camera className="w-5 h-5" />
            {showCamera ? t('stop_camera') : t('scan')}
          </button>
          
          <button
            onClick={handlePasteClick}
            className="button-secondary w-full"
            disabled={isProcessing}
          >
            <QrCode className="w-5 h-5" />
            {t('paste')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayModal;
