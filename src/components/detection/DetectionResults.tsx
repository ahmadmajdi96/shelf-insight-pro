import { Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Detection {
  skuId: string;
  skuName: string;
  isAvailable: boolean;
  facings: number;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface DetectionResultsProps {
  detections: Detection[];
  missingSkus: Array<{ skuId: string; skuName: string }>;
  shareOfShelf: {
    totalShelfArea: number;
    trainedProductsArea: number;
    percentage: number;
  };
  totalFacings: number;
  summary?: string;
  selectedSkuId?: string | null;
  onSelectSku?: (skuId: string | null) => void;
}

export function DetectionResults({
  detections,
  missingSkus,
  shareOfShelf,
  totalFacings,
  summary,
  selectedSkuId,
  onSelectSku,
}: DetectionResultsProps) {
  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="font-semibold text-foreground mb-3">Detection Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total SKUs Trained</span>
            <span className="font-medium text-foreground">{detections.length + missingSkus.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Detected</span>
            <span className="font-medium text-success">{detections.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Missing</span>
            <span className="font-medium text-destructive">{missingSkus.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Facings</span>
            <span className="font-medium text-foreground">{totalFacings}</span>
          </div>
          <div className="pt-3 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Share of Shelf</span>
              <span className="text-xl font-bold text-primary">
                {shareOfShelf.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-primary mt-0.5" />
            <p className="text-sm text-foreground">{summary}</p>
          </div>
        </div>
      )}

      {/* Detected Products */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="font-semibold text-foreground">Detected Products</h4>
        </div>
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {detections.map((detection) => (
            <div 
              key={detection.skuId}
              className={cn(
                "p-3 cursor-pointer hover:bg-secondary/50 transition-colors",
                selectedSkuId === detection.skuId && "bg-primary/10"
              )}
              onClick={() => onSelectSku?.(detection.skuId === selectedSkuId ? null : detection.skuId)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {detection.skuName}
                </span>
                <span className="flex items-center gap-1 text-success text-xs">
                  <Check className="w-3 h-3" />
                  {detection.facings} facing{detection.facings !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  Confidence: {(detection.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Products */}
      {missingSkus.length > 0 && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 overflow-hidden">
          <div className="p-4 border-b border-destructive/20">
            <h4 className="font-semibold text-destructive">Missing Products</h4>
          </div>
          <div className="divide-y divide-destructive/10 max-h-40 overflow-y-auto">
            {missingSkus.map((sku) => (
              <div key={sku.skuId} className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {sku.skuName}
                  </span>
                  <span className="flex items-center gap-1 text-destructive text-xs">
                    <X className="w-3 h-3" />
                    Not found
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
