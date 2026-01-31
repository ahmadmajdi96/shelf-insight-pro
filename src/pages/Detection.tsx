import { useState } from 'react';
import { Upload, Camera, History, Settings2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DetectionViewer } from '@/components/detection/DetectionViewer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Detection() {
  const [hasImage, setHasImage] = useState(true); // Set to true for demo

  return (
    <MainLayout title="Shelf Detection" subtitle="Upload an image to detect products and analyze shelf presence.">
      {/* Upload Section */}
      {!hasImage && (
        <div className="mb-6">
          <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Upload Shelf Image</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Drag and drop an image of your retail shelf, or click to browse. 
                  Supports JPG, PNG up to 10MB.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="glow">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detection Controls */}
      {hasImage && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              New Image
            </Button>
            <Button variant="outline" size="sm">
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Settings2 className="w-4 h-4 mr-2" />
            Detection Settings
          </Button>
        </div>
      )}

      {/* Detection Viewer */}
      {hasImage && <DetectionViewer />}

      {/* JSON Output Preview */}
      {hasImage && (
        <div className="mt-6 rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Detection Response (JSON)</h3>
            <Button variant="ghost" size="sm">
              Copy
            </Button>
          </div>
          <pre className="p-4 text-sm font-mono text-muted-foreground overflow-x-auto">
{`{
  "detectionId": "det_abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "skus": [
    {
      "id": "sku_001",
      "name": "Cola Classic 500ml",
      "available": true,
      "facings": 4,
      "confidence": 0.96,
      "boundingBox": { "x": 120, "y": 80, "width": 180, "height": 250 }
    },
    {
      "id": "sku_002",
      "name": "Cola Zero 500ml",
      "available": true,
      "facings": 3,
      "confidence": 0.94
    },
    {
      "id": "sku_003",
      "name": "Lemon Fizz 330ml",
      "available": false,
      "facings": 0
    }
  ],
  "shareOfShelf": {
    "totalArea": 1920,
    "trainedProductsArea": 662,
    "percentage": 34.5
  }
}`}
          </pre>
        </div>
      )}
    </MainLayout>
  );
}
