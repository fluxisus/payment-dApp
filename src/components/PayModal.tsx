import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, QrCode, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { readQrToken, QrReadResponse } from "@/lib/api";
import { extractPaymentInfo, parseNetworkToken } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import jsQR from "jsqr";
import { ProceedToPaymentButton } from "@/components/ProceedToPaymentButton";
import { useLanguage } from "@/contexts/LanguageContext";

interface PayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenDetected: (token: string) => void;
}

const PayModal = ({ open, onOpenChange, onTokenDetected }: PayModalProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isConnected, chainId, switchNetwork } = useWallet();
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<QrReadResponse | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<ReturnType<typeof extractPaymentInfo> | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);

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

  // Check for network mismatch when payment info or chain ID changes
  useEffect(() => {
    if (paymentInfo && paymentInfo.networkId && chainId) {
      setNetworkMismatch(paymentInfo.networkId !== chainId);
    }
  }, [paymentInfo, chainId]);

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
  }, [showCamera, streamRef.current]);

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
          console.log("QR code detected:", code.data);
          
          // If it's a NASPIP token, process it
          if (code.data.startsWith("naspip")) {
            console.log("NASPIP QR code detected:", code.data);
            
            // Stop scanning
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
            
            // Turn off camera
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => {
                console.log("Stopping camera track:", track.label);
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
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);

      // Simple camera request - don't set srcObject here
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Prefer back camera
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

      // Log the token for debugging
      console.log("NASPIP token detected:", token);

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
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast({
          title: t('empty_clipboard'),
          description: t('clipboard_empty_text'),
          variant: "destructive",
        });
        return;
      }
      console.log("Clipboard content:", text);
      
      // Process the token from clipboard
      await processNaspipToken(text);
    } catch (error) {
      console.error("Clipboard error:", error);
      toast({
        title: t('clipboard_access_denied'),
        description: t('allow_clipboard_access'),
        variant: "destructive",
      });
    }
  };

  const handleSwitchNetwork = async () => {
    if (!paymentInfo || !paymentInfo.networkId) return;
    
    try {
      await switchNetwork(paymentInfo.networkId);
    } catch (error) {
      console.error("Error switching network:", error);
      toast({
        title: "Network Switch Failed",
        description: "Could not switch to the required network",
        variant: "destructive"
      });
    }
  };

  const handleProceedToPayment = async () => {
    if (!paymentInfo) return;
    
    // TODO: Implement actual payment processing
    console.log("Processing payment:", paymentInfo);
    
    toast({
      title: "Payment Initiated",
      description: "Your payment is being processed",
    });
  };

  // Get network name from network ID
  const getNetworkName = (networkId: number | null) => {
    if (!networkId) return t('unknown_network');
    
    const networkKey = networkId === 1 ? 'ethereum' : 
                      networkId === 137 ? 'polygon' : 
                      networkId === 56 ? 'bsc' : 'unknown_network';
    return t(networkKey);
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
          {showCamera && (
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
          )}
          
          {paymentData && paymentInfo && (
            <div className="p-4 bg-white/5 rounded-xl space-y-4">
              <h3 className="font-medium">{t('payment_details')}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-crypto-text-secondary">{t('id')}</span>
                <span>{paymentInfo.id}</span>
                
                <span className="text-crypto-text-secondary">{t('amount')}</span>
                <span>{paymentInfo.amount}</span>
                
                <span className="text-crypto-text-secondary">{t('network')}</span>
                <span>{getNetworkName(paymentInfo.networkId)}</span>
                
                <span className="text-crypto-text-secondary">{t('address')}</span>
                <span className="truncate">{paymentInfo.address}</span>
                
                {paymentInfo.order && (
                  <>
                    <span className="text-crypto-text-secondary">{t('merchant')}</span>
                    <span>{paymentInfo.order.merchant.name}</span>
                    
                    <span className="text-crypto-text-secondary">{t('total')}</span>
                    <span>{paymentInfo.order.totalAmount} {paymentInfo.order.coinCode}</span>
                  </>
                )}
              </div>
              
              {networkMismatch && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{t('network_mismatch', { network: getNetworkName(paymentInfo.networkId) })}</p>
                    <button 
                      onClick={handleSwitchNetwork}
                      className="text-yellow-400 hover:text-yellow-300 font-medium mt-1"
                    >
                      {t('switch_network')}
                    </button>
                  </div>
                </div>
              )}
              
              <ProceedToPaymentButton 
                networkMismatch={networkMismatch} 
                onClick={handleProceedToPayment} 
              />
            </div>
          )}
          
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
