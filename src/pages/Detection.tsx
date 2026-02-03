import { useState, useMemo } from 'react';
import { Upload, History, Settings2, Download, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ImageUploader } from '@/components/detection/ImageUploader';
import { Button } from '@/components/ui/button';
import { useRoboflowDetection } from '@/hooks/useRoboflowDetection';
import { useStores } from '@/hooks/useStores';
import { useQuota } from '@/hooks/useQuota';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
}

interface RoboflowResult {
  outputs?: Array<{
    predictions?: {
      image?: { width: number; height: number };
      predictions?: RoboflowPrediction[];
    };
  }>;
}

// Color mapping for detection classes
const classColors: Record<string, string> = {
  h1: 'border-success shadow-[0_0_8px_hsl(var(--success)/0.5)]',
  h2: 'border-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]',
  h3: 'border-warning shadow-[0_0_8px_hsl(var(--warning)/0.5)]',
};

const classBgColors: Record<string, string> = {
  h1: 'bg-success',
  h2: 'bg-primary',
  h3: 'bg-warning',
};

const MIN_CONFIDENCE = 0.95;

export default function Detection() {
  const [searchParams] = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(searchParams.get('storeId') || 'all');
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { isDetecting, result, detectWithRoboflow, reset } = useRoboflowDetection();
  const { stores } = useStores();
  const { quota, canProcess, isNearLimit } = useQuota();
  const { tenantId, isAdmin } = useAuth();

  // Parse Roboflow result
  const parsedResult = useMemo(() => {
    if (!result) return null;
    
    const roboflowResult = result as RoboflowResult;
    const predictions = roboflowResult.outputs?.[0]?.predictions?.predictions || [];
    const imageDimensions = roboflowResult.outputs?.[0]?.predictions?.image;
    
    // Filter by minimum confidence
    const filtered = predictions.filter(p => p.confidence >= MIN_CONFIDENCE);
    
    // Count per class
    const counts: Record<string, number> = {};
    filtered.forEach(pred => {
      counts[pred.class] = (counts[pred.class] || 0) + 1;
    });
    
    return {
      predictions: filtered,
      imageDimensions,
      counts,
      totalDetections: filtered.length,
    };
  }, [result]);

  const handleImageSelect = async (base64: string) => {
    if (!canProcess && !isAdmin) {
      toast({
        title: 'Quota Exceeded',
        description: 'You have reached your image processing limit. Please contact your administrator.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(base64);
    setIsUploading(true);

    try {
      // Convert base64 to blob
      const response = await fetch(base64);
      const blob = await response.blob();
      const file = new File([blob], `detection-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Upload to Supabase storage
      const fileName = `detections/${tenantId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('shelf-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shelf-images')
        .getPublicUrl(fileName);

      setIsUploading(false);

      // Run detection with raw Roboflow response
      await detectWithRoboflow(
        publicUrl,
        undefined,
        tenantId || undefined
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  const handleNewImage = () => {
    setSelectedImage(null);
    reset();
  };

  const jsonOutput = useMemo(() => {
    if (!result) return null;
    return JSON.stringify(result, null, 2);
  }, [result]);

  const copyJson = () => {
    if (jsonOutput) {
      navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isProcessing = isUploading || isDetecting;

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
              <SelectItem value="all">All stores</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            
            <div className="relative aspect-video">
              <img 
                src={selectedImage} 
                alt="Shelf" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Detection boxes overlay */}
              {parsedResult?.predictions && parsedResult.imageDimensions && (
                <>
                  {parsedResult.predictions.map((pred, idx) => {
                    const imgDims = parsedResult.imageDimensions!;
                    const left = ((pred.x - pred.width / 2) / imgDims.width) * 100;
                    const top = ((pred.y - pred.height / 2) / imgDims.height) * 100;
                    const width = (pred.width / imgDims.width) * 100;
                    const height = (pred.height / imgDims.height) * 100;
                    
                    return (
                      <div
                        key={pred.detection_id || idx}
                        className={cn(
                          "absolute border-2 rounded-sm pointer-events-none",
                          classColors[pred.class] || 'border-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]'
                        )}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        }}
                      >
                        <span 
                          className={cn(
                            "absolute -top-5 left-0 text-[10px] px-1.5 py-0.5 rounded font-medium text-white whitespace-nowrap",
                            classBgColors[pred.class] || 'bg-primary'
                          )}
                        >
                          {pred.class.toUpperCase()} {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Loading overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-foreground font-medium">
                      {isUploading ? 'Uploading image...' : 'Analyzing shelf...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {parsedResult ? (
              <>
                {/* Summary */}
                <div className="rounded-xl bg-card border border-border p-4">
                  <h3 className="font-semibold text-foreground mb-3">Detection Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Detections</span>
                      <span className="font-medium text-foreground">{parsedResult.totalDetections}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Min Confidence</span>
                      <span className="font-medium text-foreground">{(MIN_CONFIDENCE * 100).toFixed(0)}%</span>
                    </div>
                    <div className="pt-3 border-t border-border space-y-2">
                      {Object.entries(parsedResult.counts).map(([cls, count]) => (
                        <div key={cls} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", classBgColors[cls] || 'bg-primary')} />
                            <span className="text-sm font-medium text-foreground">{cls.toUpperCase()}</span>
                          </div>
                          <Badge variant="secondary">{count} units</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* All Detections List */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h4 className="font-semibold text-foreground">All Detections</h4>
                  </div>
                  <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {parsedResult.predictions.map((pred, idx) => (
                      <div 
                        key={pred.detection_id || idx}
                        className="p-3 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", classBgColors[pred.class] || 'bg-primary')} />
                            <span className="text-sm font-medium text-foreground">
                              {pred.class.toUpperCase()}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {(pred.confidence * 100).toFixed(2)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Position: ({Math.round(pred.x)}, {Math.round(pred.y)}) | Size: {Math.round(pred.width)}x{Math.round(pred.height)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-card border border-border p-6 text-center">
                <p className="text-muted-foreground">
                  {isProcessing ? 'Processing...' : 'Upload an image to see detection results'}
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
