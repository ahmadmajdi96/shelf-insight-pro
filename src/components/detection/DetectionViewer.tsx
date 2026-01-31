import { useState } from 'react';
import { Check, X, Eye, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DetectionBox {
  id: string;
  skuName: string;
  isAvailable: boolean;
  facings: number;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const mockDetections: DetectionBox[] = [
  { id: '1', skuName: 'Cola Classic 500ml', isAvailable: true, facings: 4, confidence: 0.96, x: 10, y: 15, width: 18, height: 25 },
  { id: '2', skuName: 'Cola Zero 500ml', isAvailable: true, facings: 3, confidence: 0.94, x: 30, y: 15, width: 14, height: 25 },
  { id: '3', skuName: 'Lemon Fizz 330ml', isAvailable: false, facings: 0, confidence: 0, x: 46, y: 15, width: 12, height: 25 },
  { id: '4', skuName: 'Orange Burst 500ml', isAvailable: true, facings: 2, confidence: 0.91, x: 60, y: 15, width: 10, height: 25 },
  { id: '5', skuName: 'Cola Classic 2L', isAvailable: true, facings: 3, confidence: 0.98, x: 10, y: 45, width: 20, height: 35 },
  { id: '6', skuName: 'Sparkling Water 1L', isAvailable: true, facings: 5, confidence: 0.89, x: 32, y: 45, width: 24, height: 35 },
];

interface DetectionViewerProps {
  imageUrl?: string;
}

export function DetectionViewer({ imageUrl }: DetectionViewerProps) {
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const selectedDetection = mockDetections.find(d => d.id === selectedBox);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Image Viewer */}
      <div className="lg:col-span-2 rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Shelf Image</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={showAnnotations ? 'text-primary' : 'text-muted-foreground'}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative aspect-video bg-secondary overflow-hidden">
          {/* Placeholder shelf image with grid pattern */}
          <div 
            className="absolute inset-0 grid-pattern flex items-center justify-center"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            <div className="absolute inset-4 rounded-lg bg-secondary/80 flex items-center justify-center">
              <span className="text-muted-foreground">Shelf Image Preview</span>
            </div>
            
            {/* Detection boxes */}
            {showAnnotations && mockDetections.map((detection) => (
              <div
                key={detection.id}
                className={cn(
                  "absolute border-2 rounded-sm cursor-pointer transition-all duration-200",
                  detection.isAvailable 
                    ? "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" 
                    : "border-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.5)]",
                  selectedBox === detection.id && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                )}
                style={{
                  left: `${detection.x}%`,
                  top: `${detection.y}%`,
                  width: `${detection.width}%`,
                  height: `${detection.height}%`,
                }}
                onClick={() => setSelectedBox(detection.id)}
              >
                {detection.isAvailable && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">{detection.facings}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detection Details */}
      <div className="space-y-4">
        {/* Summary */}
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3">Detection Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total SKUs Trained</span>
              <span className="font-medium text-foreground">6</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Detected</span>
              <span className="font-medium text-success">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Missing</span>
              <span className="font-medium text-destructive">1</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Facings</span>
              <span className="font-medium text-foreground">17</span>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Share of Shelf</span>
                <span className="text-xl font-bold text-primary">34.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Detection Info */}
        {selectedDetection && (
          <div className="rounded-xl bg-card border border-primary/30 p-4 animate-scale-in">
            <h4 className="font-semibold text-foreground mb-3">Selected Product</h4>
            <div className="space-y-2">
              <p className="font-medium text-foreground">{selectedDetection.skuName}</p>
              <div className="flex items-center gap-2">
                {selectedDetection.isAvailable ? (
                  <span className="flex items-center gap-1 text-success text-sm">
                    <Check className="w-4 h-4" />
                    Available
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive text-sm">
                    <X className="w-4 h-4" />
                    Not Found
                  </span>
                )}
              </div>
              {selectedDetection.isAvailable && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Facings</span>
                    <span className="font-medium">{selectedDetection.facings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{(selectedDetection.confidence * 100).toFixed(0)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* All Detections List */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-foreground">All Products</h4>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {mockDetections.map((detection) => (
              <div 
                key={detection.id}
                className={cn(
                  "p-3 cursor-pointer hover:bg-secondary/50 transition-colors",
                  selectedBox === detection.id && "bg-primary/10"
                )}
                onClick={() => setSelectedBox(detection.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                    {detection.skuName}
                  </span>
                  {detection.isAvailable ? (
                    <span className="flex items-center gap-1 text-success text-xs">
                      <Check className="w-3 h-3" />
                      {detection.facings}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive text-xs">
                      <X className="w-3 h-3" />
                      Missing
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
