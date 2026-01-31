import { useState, useMemo, useEffect } from 'react';
import { Upload, History, Settings2, Download, Copy, Check, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ImageUploader } from '@/components/detection/ImageUploader';
import { DetectionResults } from '@/components/detection/DetectionResults';
import { Button } from '@/components/ui/button';
import { useDetection } from '@/hooks/useDetection';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useQuota } from '@/hooks/useQuota';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Detection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(searchParams.get('storeId') || '');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { isDetecting, result, detectSkus, reset } = useDetection();
  const { products } = useProducts();
  const { stores } = useStores();
  const { quota, canProcess, isNearLimit } = useQuota();
  const { tenantId, isAdmin } = useAuth();

  // Get trained SKUs for detection
  const trainedSkus = useMemo(() => {
    return products
      .filter(p => p.training_status === 'completed')
      .map(p => ({
        id: p.id,
        name: p.name,
        imageUrls: p.sku_images?.map(img => img.image_url) || [],
      }));
  }, [products]);

  const handleImageSelect = async (base64: string) => {
    if (!canProcess && !isAdmin) {
      toast({
        title: 'Quota Exceeded',
        description: 'You have reached your image processing limit. Please contact your administrator.',
        variant: 'destructive',
      });
      return;
    }

    if (trainedSkus.length === 0) {
      toast({
        title: 'No Trained Products',
        description: 'Please train at least one product before running detection.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(base64);
    
    // Use actual tenant ID
    if (tenantId) {
      await detectSkus(
        base64, 
        tenantId, 
        trainedSkus,
        selectedStoreId || undefined
      );
    }
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
      storeId: selectedStoreId || null,
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
  }, [result, selectedStoreId]);

  const copyJson = () => {
    if (jsonOutput) {
      navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <MainLayout 
      title="Shelf Detection" 
      subtitle="Upload an image to detect products and analyze shelf presence."
      userRole={isAdmin ? 'admin' : 'tenant'}
    >
      {/* Quota Warning */}
      {isNearLimit && !isAdmin && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are approaching your monthly image limit ({quota?.monthlyUsage} / {quota?.monthlyLimit} used).
          </AlertDescription>
        </Alert>
      )}

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

      {/* Store Selection */}
      {!selectedImage && stores.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select Store (Optional)
          </label>
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-[280px] bg-card border-border">
              <SelectValue placeholder="All stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All stores</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Trained Products Info */}
      {!selectedImage && (
        <div className="mb-6 p-4 rounded-lg bg-card border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{trainedSkus.length}</span> trained products ready for detection.
            {trainedSkus.length === 0 && (
              <span className="ml-2 text-warning">Add and train products to enable detection.</span>
            )}
          </p>
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
