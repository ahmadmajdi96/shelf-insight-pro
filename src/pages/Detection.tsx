import { useState, useMemo, useCallback } from 'react';
import { Upload, History, Settings2, Download, Copy, Check, AlertCircle, Loader2, X, ZoomIn } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ImageUploader } from '@/components/detection/ImageUploader';
import { Button } from '@/components/ui/button';
import { useRoboflowDetection } from '@/hooks/useRoboflowDetection';
import { useStores } from '@/hooks/useStores';
import { useQuota } from '@/hooks/useQuota';
import { useAuth } from '@/contexts/AuthContext';
import { useConfidenceSettings } from '@/hooks/useConfidenceSettings';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

export default function Detection() {
  const [searchParams] = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(searchParams.get('storeId') || 'all');
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  const { toast } = useToast();
  const { isDetecting, result, detectWithRoboflow, reset } = useRoboflowDetection();
  const { stores } = useStores();
  const { quota, canProcess, isNearLimit } = useQuota();
  const { tenantId, isAdmin } = useAuth();
  const { confidence } = useConfidenceSettings();

  const MIN_CONFIDENCE = confidence;

  // Parse result
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
  }, [result, MIN_CONFIDENCE]);

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

      // Run detection
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
    setIsFullView(false);
    reset();
  };

  const handleDownload = useCallback(() => {
    if (!selectedImage) return;
    
    // Create a link element
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `detection-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'Image downloaded' });
  }, [selectedImage, toast]);

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

  // Render detection boxes overlay
  const renderDetectionBoxes = (containerClass?: string) => {
    if (!parsedResult?.predictions || !parsedResult.imageDimensions) return null;
    
    return (
      <div className={cn("absolute inset-0 pointer-events-none", containerClass)}>
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
                "absolute border-2 rounded-sm",
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
      </div>
    );
  };

  return (
    <MainLayout 
      title="Shelf Detection" 
      subtitle="Upload an image to detect products and analyze shelf presence."
      
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
            <Button variant="outline" size="sm" onClick={() => setIsFullView(true)}>
              <ZoomIn className="w-4 h-4 mr-2" />
              Full View
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
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
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsFullView(true)}>
                  <ZoomIn className="w-4 h-4 mr-2" />
                  Full View
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="relative aspect-video cursor-pointer" onClick={() => setIsFullView(true)}>
              <img 
                src={selectedImage} 
                alt="Shelf" 
                className="absolute inset-0 w-full h-full object-contain bg-background"
              />
              
              {/* Detection boxes overlay */}
              {renderDetectionBoxes()}

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

      {/* Full View Modal */}
      <Dialog open={isFullView} onOpenChange={setIsFullView}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-background">
          <div className="relative w-full h-full">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-background/90 to-transparent flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Full Image View</h3>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsFullView(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Image Container */}
            <div className="relative w-full h-[85vh] flex items-center justify-center bg-background p-8">
              {selectedImage && (
                <div className="relative max-w-full max-h-full">
                  <img 
                    src={selectedImage} 
                    alt="Shelf - Full View" 
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                  
                  {/* Detection boxes overlay on full view */}
                  {renderDetectionBoxes()}
                </div>
              )}
            </div>
            
            {/* Detection Summary Footer */}
            {parsedResult && Object.keys(parsedResult.counts).length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-background/90 to-transparent">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    {parsedResult.totalDetections} detections (≥{(MIN_CONFIDENCE * 100).toFixed(0)}% confidence)
                  </span>
                  {Object.entries(parsedResult.counts).map(([cls, count]) => (
                    <Badge 
                      key={cls} 
                      className={cn(classBgColors[cls], "text-white")}
                    >
                      {cls.toUpperCase()}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
