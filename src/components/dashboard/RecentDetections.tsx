import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Detection {
  id: string;
  storeName: string;
  timestamp: string;
  detectedSkus: number;
  missingSkus: number;
  shareOfShelf: number;
}

const mockDetections: Detection[] = [
  { 
    id: '1', 
    storeName: 'Walmart - Downtown', 
    timestamp: '2 min ago', 
    detectedSkus: 12, 
    missingSkus: 2,
    shareOfShelf: 34.5
  },
  { 
    id: '2', 
    storeName: 'Target - Mall Plaza', 
    timestamp: '15 min ago', 
    detectedSkus: 8, 
    missingSkus: 0,
    shareOfShelf: 28.2
  },
  { 
    id: '3', 
    storeName: 'Costco - Industrial', 
    timestamp: '1 hour ago', 
    detectedSkus: 15, 
    missingSkus: 3,
    shareOfShelf: 42.1
  },
  { 
    id: '4', 
    storeName: 'Kroger - East Side', 
    timestamp: '2 hours ago', 
    detectedSkus: 10, 
    missingSkus: 1,
    shareOfShelf: 31.8
  },
];

export function RecentDetections() {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Detections</h3>
      </div>
      <div className="divide-y divide-border">
        {mockDetections.map((detection, index) => (
          <div 
            key={detection.id}
            className={cn(
              "p-4 hover:bg-secondary/50 transition-colors cursor-pointer",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{detection.storeName}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {detection.timestamp}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="w-4 h-4" />
                {detection.detectedSkus} detected
              </span>
              {detection.missingSkus > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="w-4 h-4" />
                  {detection.missingSkus} missing
                </span>
              )}
              <span className="ml-auto text-primary font-medium">
                {detection.shareOfShelf}% SoS
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
