import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable, type Column } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ItemDetail {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  photoUrl?: string | null;
  status: string;
  category?: {
    id: string;
    name: string;
  };
  borrowings?: BorrowingRecord[];
}

interface BorrowingRecord {
  id: string;
  borrowedAt: string;
  returnedAt?: string | null;
  dueDate?: string | null;
  status: string;
  conditionBefore: string;
  conditionAfter?: string | null;
  notes?: string | null;
  user: {
    id: string;
    name: string;
  };
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Borrow form state
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Return form state
  const [condition, setCondition] = useState('BAIK');

  const fetchItem = async () => {
    if (!id) return;
    try {
      const data = await apiFetch<{ item: ItemDetail }>(`/api/items/${id}`);
      setItem(data?.item || null);
    } catch {
      toast.error('Gagal memuat data barang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  const handleBorrow = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await apiFetch('/api/borrowings/checkout', {
        method: 'POST',
        body: JSON.stringify({
          itemId: id,
          notes: notes || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      toast.success('Barang berhasil dipinjam!');
      setBorrowDialogOpen(false);
      setNotes('');
      setDueDate('');
      await fetchItem();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal meminjam barang');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!id) return;
    // Find active borrowing by current user
    const activeBorrowing = item?.borrowings?.find(
      (b) => b.user.id === user?.id && b.status === 'DIPINJAM'
    );
    if (!activeBorrowing) {
      toast.error('Peminjaman aktif tidak ditemukan');
      return;
    }

    setActionLoading(true);
    try {
      await apiFetch(`/api/borrowings/${activeBorrowing.id}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ conditionAfter: condition }),
      });
      toast.success('Barang berhasil dikembalikan!');
      setReturnDialogOpen(false);
      setCondition('BAIK');
      await fetchItem();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengembalikan barang');
    } finally {
      setActionLoading(false);
    }
  };

  const isCurrentUserBorrowing = item?.borrowings?.some(
    (b) => b.user.id === user?.id && b.status === 'DIPINJAM'
  );

  const borrowingColumns: Column<BorrowingRecord>[] = [
    {
      key: 'user',
      header: 'Peminjam',
      render: (row) => row.user.name,
    },
    {
      key: 'borrowedAt',
      header: 'Tanggal Pinjam',
      sortable: true,
      render: (row) => format(new Date(row.borrowedAt), 'dd MMM yyyy', { locale: localeId }),
    },
    {
      key: 'dueDate',
      header: 'Jatuh Tempo',
      render: (row) =>
        row.dueDate
          ? format(new Date(row.dueDate), 'dd MMM yyyy', { locale: localeId })
          : '-',
    },
    {
      key: 'returnedAt',
      header: 'Tanggal Kembali',
      render: (row) =>
        row.returnedAt
          ? format(new Date(row.returnedAt), 'dd MMM yyyy', { locale: localeId })
          : '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'conditionAfter',
      header: 'Kondisi',
      render: (row) =>
        row.conditionAfter ? <StatusBadge status={row.conditionAfter} /> : '-',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Package className="h-12 w-12 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Barang tidak ditemukan</p>
        <Link to="/items">
          <Button variant="outline">Kembali ke Daftar Barang</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/items" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Barang
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Item Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              {/* Photo */}
              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{item.name}</h1>
                    <p className="text-sm font-mono text-muted-foreground">{item.code}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {item.category && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Kategori: </span>
                    <span className="font-medium">{item.category.name}</span>
                  </div>
                )}

                {item.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Deskripsi</p>
                    <p className="text-sm">{item.description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {item.status === 'TERSEDIA' && (
                    <Button onClick={() => setBorrowDialogOpen(true)}>
                      Pinjam Barang
                    </Button>
                  )}
                  {item.status === 'DIPINJAM' && isCurrentUserBorrowing && (
                    <Button onClick={() => setReturnDialogOpen(true)} variant="outline">
                      Kembalikan Barang
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Code */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <QRCodeDisplay itemId={item.id} itemCode={item.code} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Borrowing History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Peminjaman</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={borrowingColumns}
            data={(item.borrowings || []) as unknown as Record<string, unknown>[]}
            emptyMessage="Belum ada riwayat peminjaman"
            keyExtractor={(row) => row.id as string}
          />
        </CardContent>
      </Card>

      {/* Borrow Dialog */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pinjam Barang</DialogTitle>
            <DialogDescription>
              Anda akan meminjam <strong>{item.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Tanggal Pengembalian (opsional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrowDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleBorrow} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi Pinjam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kembalikan Barang</DialogTitle>
            <DialogDescription>
              Anda akan mengembalikan <strong>{item.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kondisi Barang</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIK">Baik</SelectItem>
                  <SelectItem value="RUSAK">Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleReturn} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi Pengembalian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
