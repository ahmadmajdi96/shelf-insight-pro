import { Building2, Package, ImageIcon, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TenantCardProps {
  id: string;
  name: string;
  logo?: string;
  maxSkus: number;
  usedSkus: number;
  maxImagesPerMonth: number;
  processedImagesThisMonth: number;
  isActive: boolean;
  onEdit?: () => void;
  onManage?: () => void;
}

export function TenantCard({
  name,
  maxSkus,
  usedSkus,
  maxImagesPerMonth,
  processedImagesThisMonth,
  isActive,
  onEdit,
  onManage,
}: TenantCardProps) {
  const skuUsagePercent = (usedSkus / maxSkus) * 100;
  const imageUsagePercent = (processedImagesThisMonth / maxImagesPerMonth) * 100;

  return (
    <div className={cn(
      "rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all duration-300",
      !isActive && "opacity-60"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{name}</h4>
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              isActive ? "text-success" : "text-destructive"
            )}>
              {isActive ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Inactive
                </>
              )}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* SKU Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              SKUs
            </span>
            <span className="font-medium text-foreground">
              {usedSkus} / {maxSkus}
            </span>
          </div>
          <Progress value={skuUsagePercent} className="h-2" />
        </div>

        {/* Image Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              Images (Monthly)
            </span>
            <span className="font-medium text-foreground">
              {processedImagesThisMonth.toLocaleString()} / {maxImagesPerMonth.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={imageUsagePercent} 
            className={cn("h-2", imageUsagePercent > 80 && "[&>div]:bg-warning")}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-5 pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          Edit Limits
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={onManage}>
          View Details
        </Button>
      </div>
    </div>
  );
}
