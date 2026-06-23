import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { QRScanner } from '@/components/QRScanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ScanLine, Search, CheckCircle } from 'lucide-react';

export default function ScanPage() {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [scannedId, setScannedId] = useState<string | null>(null);

  const handleScan = useCallback(
    (decodedText: string) => {
      // Prevent multiple navigations
      if (scannedId) return;
      setScannedId(decodedText);
      toast.success('QR Code berhasil dipindai!');

      // Navigate after short delay for feedback
      setTimeout(() => {
        navigate(`/items/${decodedText}`);
      }, 500);
    },
    [navigate, scannedId]
  );

  const handleManualSearch = () => {
    if (!manualCode.trim()) {
      toast.error('Masukkan kode barang');
      return;
    }
    // Navigate to items page with search
    navigate(`/items?search=${encodeURIComponent(manualCode.trim())}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan QR Code</h1>
        <p className="text-muted-foreground">
          Pindai QR code pada barang untuk melihat detail atau meminjam
        </p>
      </div>

      {/* Scanner */}
      {scannedId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle className="h-16 w-16 text-emerald-500" />
            <p className="text-lg font-medium">QR Code Terdeteksi!</p>
            <p className="text-sm text-muted-foreground">Mengalihkan ke halaman barang...</p>
          </CardContent>
        </Card>
      ) : (
        <QRScanner onScan={handleScan} />
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4" />
            Petunjuk Penggunaan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Tekan tombol "Mulai Scan" untuk mengaktifkan kamera</li>
            <li>Arahkan kamera ke QR code pada barang</li>
            <li>QR code akan terbaca secara otomatis</li>
            <li>Anda akan diarahkan ke halaman detail barang</li>
          </ol>
        </CardContent>
      </Card>

      {/* Manual Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cari Manual</CardTitle>
          <CardDescription>
            Tidak bisa scan? Masukkan kode barang secara manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="manualCode" className="sr-only">
                Kode Barang
              </Label>
              <Input
                id="manualCode"
                placeholder="Masukkan kode barang..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              />
            </div>
            <Button onClick={handleManualSearch}>
              <Search className="mr-2 h-4 w-4" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
