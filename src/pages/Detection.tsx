import { useState, useMemo } from 'react';
import { Upload, History, Settings2, Download, Copy, Check } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ImageUploader } from '@/components/detection/ImageUploader';
import { DetectionResults } from '@/components/detection/DetectionResults';
import { Button } from '@/components/ui/button';
import { useDetection } from '@/hooks/useDetection';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock SKUs for demo - in production these would come from the database
const mockSkusToDetect = [
  { id: '1', name: 'Cola Classic 500ml', imageUrls: [] },
  { id: '2', name: 'Cola Zero 500ml', imageUrls: [] },
  { id: '3', name: 'Lemon Fizz 330ml', imageUrls: [] },
  { id: '4', name: 'Orange Burst 500ml', imageUrls: [] },
  { id: '5', name: 'Cola Classic 2L', imageUrls: [] },
  { id: '6', name: 'Sparkling Water 1L', imageUrls: [] },
];

// Mock tenant ID - in production this would come from auth context
const MOCK_TENANT_ID = 'demo-tenant';

export default function Detection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { isDetecting, result, detectSkus, reset } = useDetection();

  const handleImageSelect = async (base64: string) => {
    setSelectedImage(base64);
    // Automatically start detection
    await detectSkus(base64, MOCK_TENANT_ID, mockSkusToDetect);
  };

  const handleNewImage = () => {
    setSelectedImage(null);
    setSelectedSkuId(null);
    reset();
  };

  const jsonOutput = useMemo(() => {
    if (!result) return null;
    return JSON.stringify({
      detectionId: `det_${Date.now()}`,
      timestamp: new Date().toISOString(),
      skus: result.detections.map(d => ({
        id: d.skuId,
        name: d.skuName,
        available: d.isAvailable,
        facings: d.facings,
        confidence: d.confidence,
        boundingBox: d.boundingBox,
      })),
      missingSkus: result.missingSkus,
      shareOfShelf: result.shareOfShelf,
    }, null, 2);
  }, [result]);

  const copyJson = () => {
    if (jsonOutput) {
      navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <MainLayout title="Shelf Detection" subtitle="Upload an image to detect products and analyze shelf presence.">
      {/* Controls */}
      {selectedImage && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleNewImage}>
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

      {/* Upload or Results */}
      {!selectedImage ? (
        <ImageUploader onImageSelect={handleImageSelect} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Viewer */}
          <div className="lg:col-span-2 rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Shelf Image</h3>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="Shelf" 
                className="w-full aspect-video object-cover"
              />
              
              {/* Detection boxes overlay */}
              {result?.detections.map((detection) => (
                <div
                  key={detection.skuId}
                  className={cn(
                    "absolute border-2 rounded-sm cursor-pointer transition-all duration-200",
                    "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]",
                    selectedSkuId === detection.skuId && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                  )}
                  style={{
                    left: `${detection.boundingBox.x}%`,
                    top: `${detection.boundingBox.y}%`,
                    width: `${detection.boundingBox.width}%`,
                    height: `${detection.boundingBox.height}%`,
                  }}
                  onClick={() => setSelectedSkuId(detection.skuId === selectedSkuId ? null : detection.skuId)}
                >
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">
                      {detection.facings}
                    </span>
                  </div>
                </div>
              ))}

              {/* Loading overlay */}
              {isDetecting && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-foreground font-medium">Analyzing shelf...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div>
            {result ? (
              <DetectionResults
                detections={result.detections}
                missingSkus={result.missingSkus}
                shareOfShelf={result.shareOfShelf}
                totalFacings={result.totalFacings}
                summary={result.summary}
                selectedSkuId={selectedSkuId}
                onSelectSku={setSelectedSkuId}
              />
            ) : (
              <div className="rounded-xl bg-card border border-border p-6 text-center">
                <p className="text-muted-foreground">
                  {isDetecting ? 'Processing...' : 'Upload an image to see detection results'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* JSON Output */}
      {jsonOutput && (
        <div className="mt-6 rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Detection Response (JSON)</h3>
            <Button variant="ghost" size="sm" onClick={copyJson}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className="p-4 text-sm font-mono text-muted-foreground overflow-x-auto max-h-64">
            {jsonOutput}
          </pre>
        </div>
      )}
    </MainLayout>
  );
}
