import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, QrCode, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { readQrToken, QrReadResponse } from "@/lib/api";
import { extractPaymentInfo, parseNetworkToken } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import jsQR from "jsqr";
import { ProceedToPaymentButton } from "@/components/ProceedToPaymentButton";

interface PayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenDetected: (token: string) => void;
}

const PayModal = ({ open, onOpenChange, onTokenDetected }: PayModalProps) => {
  const { toast } = useToast();
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
        title: "Camera Access Error",
        description: "Please allow camera access to scan QR codes",
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
          title: "Invalid Code",
          description: "The content is not a valid NASPIP payment code",
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
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process payment code",
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
      console.log("Clipboard content:", text);
      
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
        title: "Clipboard Access Denied",
        description: "Please allow clipboard access to paste content. You may need to reload the page.",
        variant: "destructive",
      });
    }
  };

  const handleSwitchNetwork = async () => {
    if (paymentInfo?.networkId && switchNetwork) {
      try {
        await switchNetwork(paymentInfo.networkId);
      } catch (error) {
        console.error("Error switching network:", error);
        toast({
          title: "Network Switch Failed",
          description: "Failed to switch to the required network",
          variant: "destructive"
        });
      }
    }
  };

  const handleProceedToPayment = async () => {
    console.log("Proceeding to payment for ID:", paymentInfo?.id);
    // Payment logic will be implemented here
  };

  const getNetworkName = (networkId: number | null) => {
    if (!networkId) return "Unknown";
    
    switch (networkId) {
      case 1: return "Ethereum";
      case 56: return "BNB Smart Chain";
      case 137: return "Polygon";
      case 42161: return "Arbitrum";
      case 10: return "Optimism";
      case 43114: return "Avalanche";
      case 8453: return "Base";
      case 5: return "Goerli (Testnet)";
      case 80001: return "Mumbai (Testnet)";
      case 11155111: return "Sepolia (Testnet)";
      default: return `Network ${networkId}`;
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
              />
              <canvas 
                ref={canvasRef} 
                className="hidden" // Hidden canvas for QR processing
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
          
          {paymentData && paymentInfo && (
            <div className="p-4 bg-white/5 rounded-xl space-y-4">
              <h3 className="font-medium">Payment Details:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-crypto-text-secondary">ID:</span>
                <span>{paymentInfo.id}</span>
                
                <span className="text-crypto-text-secondary">Amount:</span>
                <span>{paymentInfo.amount}</span>
                
                <span className="text-crypto-text-secondary">Network:</span>
                <span>{getNetworkName(paymentInfo.networkId)}</span>
                
                <span className="text-crypto-text-secondary">Address:</span>
                <span className="truncate">{paymentInfo.address}</span>
                
                {paymentInfo.order && (
                  <>
                    <span className="text-crypto-text-secondary">Merchant:</span>
                    <span>{paymentInfo.order.merchant.name}</span>
                    
                    <span className="text-crypto-text-secondary">Total:</span>
                    <span>{paymentInfo.order.totalAmount} {paymentInfo.order.coinCode}</span>
                  </>
                )}
              </div>
              
              {networkMismatch && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Network mismatch. This payment requires {getNetworkName(paymentInfo.networkId)}.</p>
                    <button 
                      onClick={handleSwitchNetwork}
                      className="text-yellow-400 hover:text-yellow-300 font-medium mt-1"
                    >
                      Switch Network
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
            {showCamera ? "Stop Camera" : "Scan"}
          </button>
          
          <button
            onClick={handlePasteClick}
            className="button-secondary w-full"
            disabled={isProcessing}
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
