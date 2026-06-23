import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface BorrowingEntry {
  id: string;
  borrowedAt: string;
  returnedAt?: string | null;
  dueDate?: string | null;
  status: string;
  conditionBefore: string;
  conditionAfter?: string | null;
  notes?: string | null;
  item: {
    id: string;
    name: string;
    code: string;
  };
  user: {
    id: string;
    name: string;
  };
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [borrowings, setBorrowings] = useState<BorrowingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchBorrowings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);

        const query = params.toString();
        const data = await apiFetch<{ borrowings: BorrowingEntry[] }>(
          `/api/borrowings${query ? `?${query}` : ''}`
        );
        setBorrowings(data?.borrowings || []);
      } catch {
        setBorrowings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowings();
  }, [statusFilter, dateFrom, dateTo]);

  const columns: Column<BorrowingEntry>[] = [
    {
      key: 'item',
      header: 'Barang',
      render: (row) => (
        <div>
          <p className="font-medium text-sm">{row.item.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.item.code}</p>
        </div>
      ),
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            key: 'user' as const,
            header: 'Peminjam',
            render: (row: BorrowingEntry) => row.user.name,
          },
        ]
      : []),
    {
      key: 'borrowedAt',
      header: 'Tanggal Pinjam',
      sortable: true,
      render: (row) =>
        format(new Date(row.borrowedAt), 'dd MMM yyyy', { locale: localeId }),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Peminjaman</h1>
        <p className="text-muted-foreground">
          {user?.role === 'ADMIN'
            ? 'Semua riwayat peminjaman barang'
            : 'Riwayat peminjaman Anda'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DIPINJAM">Dipinjam</SelectItem>
              <SelectItem value="DIKEMBALIKAN">Dikembalikan</SelectItem>
              <SelectItem value="TERLAMBAT">Terlambat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Dari Tanggal</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-[160px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sampai Tanggal</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-[160px]"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Column<Record<string, unknown>>[]}
        data={borrowings as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="Belum ada riwayat peminjaman"
        keyExtractor={(row) => row.id as string}
      />
    </div>
  );
}
