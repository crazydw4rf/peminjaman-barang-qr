import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ItemData {
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
}

interface ItemCardProps {
  item: ItemData;
  onClick?: (item: ItemData) => void;
  className?: string;
}

export function ItemCard({ item, onClick, className }: ItemCardProps) {
  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={() => onClick?.(item)}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={item.status} />
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1">{item.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground font-mono">{item.code}</p>
        {item.category && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {item.category.name}
          </p>
        )}
        {item.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
