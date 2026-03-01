'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const rafRef       = useRef<number>(0);
  const [status, setStatus]   = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [error, setError]     = useState('');
  const [scanned, setScanned] = useState('');

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('scanning');
        scanFrame();
      }
    } catch (err: any) {
      setError('Camera access denied. Please allow camera permissions.');
      setStatus('error');
    }
  }, []);

  const scanFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Use BarcodeDetector API if available (Chrome/Edge)
    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      detector.detect(canvas).then((codes: any[]) => {
        if (codes.length > 0) {
          const result = codes[0].rawValue;
          setScanned(result);
          setStatus('success');
          stopCamera();
          onScan(result);
        } else {
          rafRef.current = requestAnimationFrame(scanFrame);
        }
      }).catch(() => {
        rafRef.current = requestAnimationFrame(scanFrame);
      });
    } else {
      // Fallback: use imageData heuristic or just show manual entry
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  }, [onScan, stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden">
      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 bg-gray-900 rounded-2xl">
          <Camera className="h-12 w-12 text-gray-400" />
          <p className="text-white text-sm">Scan a QR code to check in</p>
          <Button onClick={startCamera} className="bg-indigo-600 hover:bg-indigo-700">
            <Camera className="h-4 w-4 mr-2" />Open Camera
          </Button>
        </div>
      )}

      {(status === 'scanning') && (
        <div className="relative">
          <video ref={videoRef} className="w-full rounded-2xl" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          {/* Scanner overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 border-2 border-white rounded-xl opacity-70">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
            </div>
          </div>
          <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs">
            Point at QR code to scan
          </p>
          {onClose && (
            <button onClick={() => { stopCamera(); onClose(); }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-green-900 rounded-2xl">
          <CheckCircle className="h-12 w-12 text-green-400" />
          <p className="text-white font-medium">QR Code Scanned!</p>
          <p className="text-green-300 text-xs break-all px-4 text-center">{scanned}</p>
          <Button onClick={() => { setStatus('idle'); setScanned(''); }} variant="outline"
            className="text-white border-white hover:bg-white/10">
            Scan Again
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-red-900 rounded-2xl">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-white text-sm text-center px-4">{error}</p>
          <Button onClick={() => setStatus('idle')} variant="outline"
            className="text-white border-white hover:bg-white/10">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
