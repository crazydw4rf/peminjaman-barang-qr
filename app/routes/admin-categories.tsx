import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { DataTable } from "@/components/DataTable";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Category = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { items: number };
};

export default function ManageCategoriesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ categories: Category[] }>("/api/categories");
      setCategories(data?.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Gagal mengambil data kategori");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setDescription(category.description || "");
    } else {
      setEditingCategory(null);
      setName("");
      setDescription("");
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kategori harus diisi");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await apiFetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          body: JSON.stringify({ name, description }),
        });
        toast.success("Kategori berhasil diperbarui");
      } else {
        await apiFetch("/api/categories", {
          method: "POST",
          body: JSON.stringify({ name, description }),
        });
        toast.success("Kategori berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan kategori");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) return;

    try {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      toast.success("Kategori berhasil dihapus");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kategori");
    }
  };

  const columns = [
    {
      header: "Nama Kategori",
      accessor: "name",
    },
    {
      header: "Deskripsi",
      accessor: (row: Category) => row.description || "-",
    },
    {
      header: "Jumlah Barang",
      accessor: (row: Category) => row._count.items,
    },
    {
      header: "Dibuat Pada",
      accessor: (row: Category) => format(new Date(row.createdAt), "dd MMM yyyy", { locale: id }),
    },
    {
      header: "Aksi",
      accessor: (row: Category) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenDialog(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => handleDelete(row.id, row.name)}
            disabled={row._count.items > 0}
            title={row._count.items > 0 ? "Tidak dapat menghapus kategori yang memiliki barang" : "Hapus kategori"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Kategori</h1>
          <p className="text-muted-foreground">
            Manajemen kategori barang dalam sistem.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Ubah detail kategori di bawah ini." : "Masukkan detail untuk kategori barang yang baru."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Kategori</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Elektronik"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Penjelasan singkat mengenai kategori ini"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categories}
            loading={loading}
            emptyMessage="Tidak ada kategori ditemukan."
          />
        </CardContent>
      </Card>
    </div>
  );
}
