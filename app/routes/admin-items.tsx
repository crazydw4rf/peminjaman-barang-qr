import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, QrCode, Loader2 } from 'lucide-react';

interface ItemEntry {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  photoUrl?: string | null;
  status: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface ItemFormData {
  name: string;
  code: string;
  categoryId: string;
  description: string;
  photoUrl: string;
  status: string;
}

const emptyForm: ItemFormData = {
  name: '',
  code: '',
  categoryId: '',
  description: '',
  photoUrl: '',
  status: 'TERSEDIA',
};

export default function ManageItemsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemEntry | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemEntry | null>(null);
  const [qrItem, setQrItem] = useState<ItemEntry | null>(null);
  const [formData, setFormData] = useState<ItemFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items: ItemEntry[] }>('/api/items');
      setItems(data?.items || []);
    } catch {
      toast.error('Gagal memuat data barang');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    apiFetch<{ categories: Category[] }>('/api/categories')
      .then((res) => setCategories(res?.categories || []))
      .catch(() => {});
  }, [fetchItems]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setSelectedFile(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: ItemEntry) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      categoryId: item.categoryId,
      description: item.description || '',
      photoUrl: item.photoUrl || '',
      status: item.status,
    });
    setSelectedFile(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.categoryId) {
      toast.error('Nama, kode, dan kategori wajib diisi');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoUrl = formData.photoUrl;

      if (selectedFile) {
        const presignRes = await apiFetch<{ signedUrl: string; publicUrl: string }>(
          `/api/storage/presigned-url?fileName=${encodeURIComponent(
            selectedFile.name
          )}&contentType=${encodeURIComponent(selectedFile.type)}`
        );

        const uploadRes = await fetch(presignRes.signedUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error('Gagal mengunggah foto');
        }

        finalPhotoUrl = presignRes.publicUrl;
      }

      const submitData = { ...formData, photoUrl: finalPhotoUrl };

      if (editingItem) {
        await apiFetch(`/api/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(submitData),
        });
        toast.success('Barang berhasil diperbarui');
      } else {
        await apiFetch('/api/items', {
          method: 'POST',
          body: JSON.stringify(submitData),
        });
        toast.success('Barang berhasil ditambahkan');
      }
      setFormOpen(false);
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan barang');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    try {
      await apiFetch(`/api/items/${deletingItem.id}`, { method: 'DELETE' });
      toast.success('Barang berhasil dihapus');
      setDeleteOpen(false);
      setDeletingItem(null);
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus barang');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<ItemEntry>[] = [
    {
      key: 'name',
      header: 'Nama Barang',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-sm">{row.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (row) => row.category?.name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setQrItem(row);
              setQrOpen(true);
            }}
          >
            <QrCode className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingItem(row);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Barang</h1>
          <p className="text-muted-foreground">Tambah, edit, dan hapus barang</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Barang
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Column<Record<string, unknown>>[]}
        data={items as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="Belum ada barang"
        keyExtractor={(row) => row.id as string}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Perbarui informasi barang'
                : 'Isi form di bawah untuk menambahkan barang baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Nama Barang *</Label>
              <Input
                id="itemName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama barang"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCode">Kode Barang *</Label>
              <Input
                id="itemCode"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="BRG-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TERSEDIA">Tersedia</SelectItem>
                  <SelectItem value="DIPINJAM">Dipinjam</SelectItem>
                  <SelectItem value="RUSAK">Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemDesc">Deskripsi</Label>
              <Textarea
                id="itemDesc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi barang..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemPhoto">Foto Barang</Label>
              <Input
                id="itemPhoto"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
              />
              {formData.photoUrl && !selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Foto saat ini sudah tersedia. Unggah foto baru untuk menggantinya.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Barang</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deletingItem?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code - {qrItem?.name}</DialogTitle>
            <DialogDescription>QR code untuk barang ini</DialogDescription>
          </DialogHeader>
          {qrItem && (
            <div className="flex justify-center py-4">
              <QRCodeDisplay itemId={qrItem.id} itemCode={qrItem.code} size={250} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
