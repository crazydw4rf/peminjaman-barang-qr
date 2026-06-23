import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  width?: number;
  height?: number;
}

export function QRScanner({ onScan, width = 300, height = 300 }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanCallbackRef = useRef(onScan);

  // Keep onScan ref updated
  scanCallbackRef.current = onScan;

  const startScanner = useCallback(async () => {
    setError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          scanCallbackRef.current(decodedText);
        },
        () => {
          // QR code parse error - ignore
        }
      );
      setIsScanning(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengakses kamera';
      if (message.includes('Permission')) {
        setError('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
      } else {
        setError(message);
      }
    }
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }
    } catch {
      // Ignore stop errors
    }
  }, [isScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-4 p-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full max-w-sm overflow-hidden rounded-lg bg-muted"
          style={{ minHeight: isScanning ? height : 0 }}
        />

        {!isScanning && !error && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Camera className="h-12 w-12 opacity-40" />
            <p className="text-sm">Tekan tombol di bawah untuk memulai scanner</p>
          </div>
        )}

        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanner} className="gap-2">
              <Camera className="h-4 w-4" />
              Mulai Scan
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="outline" className="gap-2">
              <CameraOff className="h-4 w-4" />
              Berhenti
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
