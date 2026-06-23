import { Link, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ScanLine,
  History,
  Settings,
  Tags,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Daftar Barang', href: '/items', icon: Package },
  { label: 'Scan QR', href: '/scan', icon: ScanLine },
  { label: 'Riwayat', href: '/history', icon: History },
];

const adminItems: NavItem[] = [
  { label: 'Kelola Barang', href: '/admin/items', icon: Settings, adminOnly: true },
  { label: 'Kelola Kategori', href: '/admin/categories', icon: Tags, adminOnly: true },
  { label: 'Statistik & Laporan', href: '/admin/reports', icon: BarChart3, adminOnly: true },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  const renderNavItem = (item: NavItem) => {
    const isActive =
      location.pathname === item.href ||
      (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ScanLine className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight">SiPinjam</h2>
          <p className="text-[10px] text-muted-foreground leading-none">Sistem Peminjaman</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-2">
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu Utama
        </p>
        {navItems.map(renderNavItem)}

        {isAdmin && (
          <>
            <div className="my-3 h-px bg-border" />
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            {adminItems.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          © 2026 SiPinjam v1.0
        </p>
      </div>
    </div>
  );
}
