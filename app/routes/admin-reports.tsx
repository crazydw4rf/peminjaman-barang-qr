import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { Navigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable, type Column } from '@/components/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  PackageCheck,
  AlertTriangle,
  Clock,
  BarChart3,
  FileDown,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface SummaryData {
  totalItems: number;
  availableItems: number;
  borrowedItems: number;
  damagedItems: number;
  totalBorrowings: number;
  activeBorrowings: number;
}

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
    category?: { name: string } | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type DatePreset = 'today' | 'week' | 'month' | 'last-month' | 'custom';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [borrowings, setBorrowings] = useState<BorrowingEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Set initial date range to current month
  useEffect(() => {
    const now = new Date();
    setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
    setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
  }, []);

  const applyPreset = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    switch (preset) {
      case 'today':
        setDateFrom(format(now, 'yyyy-MM-dd'));
        setDateTo(format(now, 'yyyy-MM-dd'));
        break;
      case 'week':
        setDateFrom(format(subDays(now, 7), 'yyyy-MM-dd'));
        setDateTo(format(now, 'yyyy-MM-dd'));
        break;
      case 'month':
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'last-month': {
        const lastMonth = subMonths(now, 1);
        setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      }
      case 'custom':
        break;
    }
    setCurrentPage(1);
  }, []);

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const res = await apiFetch<{ summary: SummaryData }>('/api/reports/summary');
        setSummary(res?.summary || null);
      } catch {
        setSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch history
  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const params = new URLSearchParams();
        params.set('from', dateFrom);
        params.set('to', dateTo);
        params.set('page', currentPage.toString());
        params.set('limit', '10');
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const res = await apiFetch<{
          borrowings: BorrowingEntry[];
          pagination: Pagination;
        }>(`/api/reports/history?${params.toString()}`);

        setBorrowings(res?.borrowings || []);
        setPagination(res?.pagination || null);
      } catch {
        setBorrowings([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [dateFrom, dateTo, statusFilter, currentPage]);

  // CSV Export
  const handleExportCSV = () => {
    if (!borrowings.length) return;

    const headers = ['No', 'Barang', 'Kode', 'Kategori', 'Peminjam', 'Email', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status', 'Kondisi Sebelum', 'Kondisi Sesudah', 'Catatan'];
    const rows = borrowings.map((b, i) => [
      i + 1,
      b.item.name,
      b.item.code,
      b.item.category?.name || '-',
      b.user.name,
      b.user.email,
      format(new Date(b.borrowedAt), 'dd/MM/yyyy HH:mm'),
      b.returnedAt ? format(new Date(b.returnedAt), 'dd/MM/yyyy HH:mm') : '-',
      b.status,
      b.conditionBefore,
      b.conditionAfter || '-',
      b.notes || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-peminjaman-${dateFrom}-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const utilizationRate = summary
    ? summary.totalItems > 0
      ? Math.round((summary.borrowedItems / summary.totalItems) * 100)
      : 0
    : 0;

  const summaryCards = [
    {
      label: 'Total Barang',
      value: summary?.totalItems ?? 0,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-900',
    },
    {
      label: 'Tersedia',
      value: summary?.availableItems ?? 0,
      icon: PackageCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
    },
    {
      label: 'Dipinjam',
      value: summary?.borrowedItems ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-900',
    },
    {
      label: 'Rusak',
      value: summary?.damagedItems ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-900',
    },
  ];

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
    {
      key: 'category',
      header: 'Kategori',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.item.category?.name || '-'}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Peminjam',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.user.name}</p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'borrowedAt',
      header: 'Tgl Pinjam',
      sortable: true,
      render: (row) =>
        format(new Date(row.borrowedAt), 'dd MMM yyyy', { locale: localeId }),
    },
    {
      key: 'returnedAt',
      header: 'Tgl Kembali',
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
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Statistik & Laporan
          </h1>
          <p className="text-muted-foreground">
            Dashboard statistik admin dan penarikan laporan riwayat peminjaman
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`overflow-hidden border ${card.borderColor}`}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                {loadingSummary ? (
                  <Skeleton className="h-6 w-6 rounded" />
                ) : (
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {loadingSummary ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{card.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tingkat Penggunaan</p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="text-xl font-bold">{utilizationRate}%</p>
                  {utilizationRate > 50 ? (
                    <ArrowUpRight className="h-4 w-4 text-amber-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/30">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Peminjaman</p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <p className="text-xl font-bold">{summary?.totalBorrowings ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peminjaman Aktif</p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <p className="text-xl font-bold">{summary?.activeBorrowings ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Report Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Laporan Riwayat Peminjaman
              </CardTitle>
              <CardDescription>
                Filter dan unduh laporan riwayat peminjaman barang
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!borrowings.length}
              className="gap-1.5"
            >
              <FileDown className="h-4 w-4" />
              Unduh CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-end">
            {/* Date Presets */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Periode</Label>
              <Select value={datePreset} onValueChange={(v) => applyPreset(v as DatePreset)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">7 Hari Terakhir</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                  <SelectItem value="last-month">Bulan Lalu</SelectItem>
                  <SelectItem value="custom">Kustom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Dari</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDatePreset('custom');
                  setCurrentPage(1);
                }}
                className="w-full sm:w-[150px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sampai</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setDatePreset('custom');
                  setCurrentPage(1);
                }}
                className="w-full sm:w-[150px]"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DIPINJAM">Dipinjam</SelectItem>
                  <SelectItem value="DIKEMBALIKAN">Dikembalikan</SelectItem>
                  <SelectItem value="TERLAMBAT">Terlambat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          {pagination && !loadingHistory && (
            <p className="text-sm text-muted-foreground">
              Menampilkan {borrowings.length} dari {pagination.total} data
              {dateFrom && dateTo && (
                <span>
                  {' '}({format(new Date(dateFrom), 'dd MMM yyyy', { locale: localeId })} —{' '}
                  {format(new Date(dateTo), 'dd MMM yyyy', { locale: localeId })})
                </span>
              )}
            </p>
          )}

          {/* Table */}
          <DataTable
            columns={columns as Column<Record<string, unknown>>[]}
            data={borrowings as unknown as Record<string, unknown>[]}
            loading={loadingHistory}
            emptyMessage="Tidak ada data peminjaman untuk periode ini"
            keyExtractor={(row) => row.id as string}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
