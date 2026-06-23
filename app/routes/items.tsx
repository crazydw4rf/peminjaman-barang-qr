import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { apiFetch } from '@/lib/api';
import { ItemCard, type ItemData } from '@/components/ItemCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

export default function ItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const query = params.toString();
      const data = await apiFetch<{ items: ItemData[] }>(`/api/items${query ? `?${query}` : ''}`);
      setItems(data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/api/categories')
      .then(res => setCategories(res?.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const debounce = setTimeout(fetchItems, 300);
    return () => clearTimeout(debounce);
  }, [fetchItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daftar Barang</h1>
        <p className="text-muted-foreground">Jelajahi semua barang yang tersedia</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="TERSEDIA">Tersedia</SelectItem>
            <SelectItem value="DIPINJAM">Dipinjam</SelectItem>
            <SelectItem value="RUSAK">Rusak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Package className="h-12 w-12 opacity-40" />
          <p className="text-sm">Tidak ada barang ditemukan</p>
          <p className="text-xs">Coba ubah filter pencarian Anda</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => navigate(`/items/${item.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
