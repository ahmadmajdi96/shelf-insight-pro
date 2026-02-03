import { Package, CheckCircle2, Clock, AlertCircle, MoreVertical, Image, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  imageCount: number;
  imageUrl?: string;
  trainingStatus: 'pending' | 'training' | 'completed' | 'failed';
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'text-muted-foreground bg-muted' },
  training: { icon: Clock, label: 'Training...', className: 'text-warning bg-warning/10' },
  completed: { icon: CheckCircle2, label: 'Trained', className: 'text-success bg-success/10' },
  failed: { icon: AlertCircle, label: 'Failed', className: 'text-destructive bg-destructive/10' },
};

export function ProductCard({ 
  id,
  name, 
  category, 
  barcode, 
  imageCount,
  imageUrl,
  trainingStatus,
  onView,
  onEdit,
  onDelete
}: ProductCardProps) {
  const status = statusConfig[trainingStatus];
  const StatusIcon = status.icon;

  return (
    <div className="rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden group">
      {/* Image area */}
      <div className="aspect-square bg-secondary relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete} 
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs">
          <Image className="w-3 h-3" />
          {imageCount} images
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-medium text-foreground truncate">{name}</h4>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>

        {barcode && (
          <p className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded inline-block">
            {barcode}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
            status.className
          )}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
          <Button variant="ghost" size="sm" onClick={onView}>
            View
          </Button>
        </div>
      </div>
    </div>
  );
}