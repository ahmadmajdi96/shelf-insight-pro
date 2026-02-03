import { Package, MapPin, Image, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

interface ShelfWithDetails extends Tables<'shelves'> {
  store?: Tables<'stores'> | null;
  products?: Array<Tables<'shelf_products'> & { sku?: Tables<'skus'> | null }>;
  imageCount: number;
  lastImage?: Tables<'shelf_images'> | null;
}

interface ShelfCardProps {
  shelf: ShelfWithDetails;
  onSelect: () => void;
}

export function ShelfCard({ shelf, onSelect }: ShelfCardProps) {
  const productCount = shelf.products?.length || 0;
  const lastImageTime = shelf.lastImage?.created_at
    ? formatDistanceToNow(new Date(shelf.lastImage.created_at), { addSuffix: true })
    : null;

  return (
    <Card 
      className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
      onClick={onSelect}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
              {shelf.name}
            </h3>
            {shelf.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {shelf.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="ml-2">
            {shelf.imageCount} scans
          </Badge>
        </div>

        {/* Store Info */}
        {shelf.store && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4" />
            <span>{shelf.store.name}</span>
            {shelf.location_in_store && (
              <span className="text-muted-foreground/60">• {shelf.location_in_store}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{productCount}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Image className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{shelf.imageCount}</p>
              <p className="text-xs text-muted-foreground">Images</p>
            </div>
          </div>
        </div>

        {/* Last Activity */}
        {lastImageTime && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
            <Clock className="w-3 h-3" />
            <span>Last scan {lastImageTime}</span>
          </div>
        )}

        {/* Product Preview */}
        {productCount > 0 && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
            <div className="flex -space-x-2">
              {shelf.products?.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center"
                >
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {p.sku?.name?.charAt(0) || '?'}
                  </span>
                </div>
              ))}
            </div>
            {productCount > 4 && (
              <span className="text-xs text-muted-foreground ml-2">
                +{productCount - 4} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
