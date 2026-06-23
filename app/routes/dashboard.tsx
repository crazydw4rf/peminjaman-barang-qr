import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  PackageCheck,
  PackageX,
  AlertTriangle,
  ScanLine,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface SummaryStats {
  total: number;
  tersedia: number;
  dipinjam: number;
  rusak: number;
}

interface ActiveBorrowing {
  id: string;
  borrowedAt: string;
  dueDate?: string | null;
  status: string;
  item: {
    id: string;
    name: string;
    code: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [activeBorrowings, setActiveBorrowings] = useState<ActiveBorrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'ADMIN') {
          const summary = await apiFetch<SummaryStats>('/api/reports/summary');
          setStats(summary);
        } else {
          // For regular users, compute from items
          const data = await apiFetch<{ items: { id: string; status: string }[] }>('/api/items');
          const itemsList = data?.items || [];
          setStats({
            total: itemsList.length,
            tersedia: itemsList.filter((i) => i.status === 'TERSEDIA').length,
            dipinjam: itemsList.filter((i) => i.status === 'DIPINJAM').length,
            rusak: itemsList.filter((i) => i.status === 'RUSAK').length,
          });
        }

        // Fetch active borrowings
        try {
          const res = await apiFetch<{ borrowings: ActiveBorrowing[] }>('/api/borrowings/active');
          setActiveBorrowings(res?.borrowings || []);
        } catch {
          // Endpoint may not exist yet
        }
      } catch {
        // Fallback
        setStats({ total: 0, tersedia: 0, dipinjam: 0, rusak: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    {
      label: 'Total Barang',
      value: stats?.total ?? 0,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Tersedia',
      value: stats?.tersedia ?? 0,
      icon: PackageCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'Dipinjam',
      value: stats?.dipinjam ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: 'Rusak',
      value: stats?.rusak ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {user?.name}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                {loading ? (
                  <Skeleton className="h-6 w-6 rounded" />
                ) : (
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stat.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Active Borrowings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link to="/scan">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6">
                <ScanLine className="h-8 w-8 text-primary" />
                <span className="font-medium">Scan QR Code</span>
                <span className="text-xs text-muted-foreground">Pindai untuk pinjam/kembali</span>
              </Button>
            </Link>
            <Link to="/items">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6">
                <Package className="h-8 w-8 text-primary" />
                <span className="font-medium">Lihat Barang</span>
                <span className="text-xs text-muted-foreground">Jelajahi katalog barang</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Active Borrowings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Peminjaman Aktif</CardTitle>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="text-xs">
                Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : activeBorrowings.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <PackageX className="h-8 w-8 opacity-40" />
                <p className="text-sm">Tidak ada peminjaman aktif</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBorrowings.slice(0, 5).map((b) => (
                  <Link
                    key={b.id}
                    to={`/items/${b.item.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Dipinjam{' '}
                        {format(new Date(b.borrowedAt), 'dd MMM yyyy', { locale: localeId })}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
