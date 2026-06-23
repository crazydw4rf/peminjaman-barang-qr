import { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
  itemId: string;
  itemCode: string;
  size?: number;
}

export function QRCodeDisplay({ itemId, itemCode, size = 200 }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(itemId, {
      width: size,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch(() => setError('Gagal membuat QR code'));
  }, [itemId, size]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !qrDataUrl) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${itemCode}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
            img { max-width: 300px; }
            p { margin-top: 12px; font-size: 18px; font-weight: 600; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <img src="${qrDataUrl}" alt="QR Code" />
          <p>${itemCode}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [qrDataUrl, itemCode]);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${itemCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrDataUrl, itemCode]);

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR Code untuk ${itemCode}`} className="h-auto w-auto" />
        ) : (
          <div
            className="animate-pulse bg-muted rounded"
            style={{ width: size, height: size }}
          />
        )}
      </div>
      <p className="text-sm font-mono font-semibold text-muted-foreground">{itemCode}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={!qrDataUrl}>
          <Printer className="mr-2 h-4 w-4" />
          Cetak
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={!qrDataUrl}>
          <Download className="mr-2 h-4 w-4" />
          Unduh
        </Button>
      </div>
    </div>
  );
}
