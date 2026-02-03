import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Image as ImageIcon, 
  Settings, 
  Plus,
  Eye,
  Loader2,
  MapPin,
  Clock,
  Trash2,
  Save,
  Upload,
  X
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useShelves, useShelfImages } from '@/hooks/useShelves';
import { useProducts } from '@/hooks/useProducts';
import { useRoboflowDetection } from '@/hooks/useRoboflowDetection';
import { useAuth } from '@/contexts/AuthContext';
import { ImageCapture } from '@/components/shared/ImageCapture';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Tables, Json } from '@/integrations/supabase/types';

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
  h1: 'detection-box-h1',
  h2: 'detection-box-h2',
  h3: 'detection-box-h3',
};

const classBgColors: Record<string, string> = {
  h1: 'bg-success',
  h2: 'bg-primary',
  h3: 'bg-warning',
};

export default function ShelfDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { shelves, assignProducts, deleteShelf, updateShelf } = useShelves();
  const { images, isLoading: imagesLoading, addImage, deleteImage } = useShelfImages(id || null);
  const { products } = useProducts();
  const { detectWithRoboflow, isDetecting } = useRoboflowDetection();
  const { tenantId, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('images');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<Tables<'shelf_images'> | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const shelf = useMemo(() => shelves.find(s => s.id === id), [shelves, id]);

  // Initialize selected products from shelf data
  useMemo(() => {
    if (shelf?.products && !isInitialized) {
      const initial: Record<string, number> = {};
      shelf.products.forEach(p => {
        if (p.sku_id) {
          initial[p.sku_id] = p.expected_facings || 1;
        }
      });
      setSelectedProducts(initial);
      setIsInitialized(true);
    }
  }, [shelf, isInitialized]);

  const handleImageCapture = async (file: File, base64: string) => {
    if (!shelf || !id) return;
    
    setPreviewImage(base64);
    setIsUploading(true);

    try {
      // Upload to Supabase storage
      const fileName = `${id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shelf-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shelf-images')
        .getPublicUrl(fileName);

      // Run Roboflow detection
      const detectionResult = await detectWithRoboflow(publicUrl, id, tenantId || undefined);

      if (detectionResult.success) {
        toast({
          title: 'Detection complete',
          description: 'Image analyzed and saved successfully.',
        });
      }

      setPreviewImage(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProductToggle = (skuId: string) => {
    setSelectedProducts(prev => {
      if (prev[skuId] !== undefined) {
        const { [skuId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [skuId]: 1 };
    });
  };

  const handleQuantityChange = (skuId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [skuId]: Math.max(1, quantity),
    }));
  };

  const handleSaveProducts = async () => {
    if (!id) return;
    await assignProducts.mutateAsync({
      shelfId: id,
      skuIds: Object.keys(selectedProducts),
      quantities: selectedProducts,
    });
  };

  const handleDeleteShelf = async () => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this shelf? This action cannot be undone.')) {
      await deleteShelf.mutateAsync(id);
      navigate('/shelves');
    }
  };

  const MIN_CONFIDENCE = 0.95;

  // Parse detection results from image - return ALL predictions above confidence threshold
  const parseDetectionResults = (detectionResult: Json | null): RoboflowPrediction[] => {
    if (!detectionResult) return [];
    
    try {
      const result = detectionResult as RoboflowResult;
      const predictions = result.outputs?.[0]?.predictions?.predictions || [];
      
      // Filter by minimum confidence and return all
      return predictions
        .filter(p => p.confidence >= MIN_CONFIDENCE)
        .sort((a, b) => b.confidence - a.confidence);
    } catch (e) {
      console.error('Error parsing detection results:', e);
      return [];
    }
  };

  // Get all predictions with counts per class
  const getProductCounts = (detectionResult: Json | null): Record<string, number> => {
    if (!detectionResult) return {};
    
    try {
      const result = detectionResult as RoboflowResult;
      const predictions = result.outputs?.[0]?.predictions?.predictions || [];
      
      // Filter by minimum confidence and count per class
      const counts: Record<string, number> = {};
      predictions
        .filter(p => p.confidence >= MIN_CONFIDENCE)
        .forEach(pred => {
          counts[pred.class] = (counts[pred.class] || 0) + 1;
        });
      
      return counts;
    } catch {
      return {};
    }
  };

  const getImageDimensions = (detectionResult: Json | null): { width: number; height: number } | null => {
    if (!detectionResult) return null;
    
    try {
      const result = detectionResult as RoboflowResult;
      return result.outputs?.[0]?.predictions?.image || null;
    } catch {
      return null;
    }
  };

  if (!shelf) {
    return (
      <MainLayout title="Loading..." userRole={isAdmin ? 'admin' : 'tenant'}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={shelf.name}
      subtitle={shelf.store ? `${shelf.store.name}${shelf.location_in_store ? ` • ${shelf.location_in_store}` : ''}` : 'Shelf Management'}
      userRole={isAdmin ? 'admin' : 'tenant'}
    >
      {/* Back button and stats */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/shelves')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shelves
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {shelf.imageCount} scans
          </Badge>
          <Badge variant="outline" className="text-sm">
            {shelf.products?.length || 0} products
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-fit grid-cols-3 bg-card border border-border">
          <TabsTrigger value="images" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Images & Detection
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          {/* Image Capture */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Capture New Image</h3>
            <ImageCapture
              onImageCapture={handleImageCapture}
              isProcessing={isUploading || isDetecting}
              preview={previewImage}
              onClear={() => setPreviewImage(null)}
              processingText={isDetecting ? 'Analyzing shelf...' : 'Uploading...'}
              className="max-h-64"
            />
          </div>

          {/* Image History */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Image History ({images.length})
            </h3>
            
            {imagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">No images yet</p>
                <p className="text-sm">Upload your first scan above to start detection.</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                  {images.map((image) => {
                    const predictions = parseDetectionResults(image.detection_result);
                    const productCounts = getProductCounts(image.detection_result);
                    const imageDimensions = getImageDimensions(image.detection_result);
                    
                    return (
                      <div
                        key={image.id}
                        className="group relative rounded-xl overflow-hidden border border-border bg-secondary cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setViewingImage(image)}
                      >
                        <div className="relative aspect-video">
                          <img
                            src={image.image_url}
                            alt="Shelf scan"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          
                          {/* Detection overlays */}
                          {predictions.length > 0 && imageDimensions && (
                            <>
                              {predictions.map((pred, idx) => {
                                const left = ((pred.x - pred.width / 2) / imageDimensions.width) * 100;
                                const top = ((pred.y - pred.height / 2) / imageDimensions.height) * 100;
                                const width = (pred.width / imageDimensions.width) * 100;
                                const height = (pred.height / imageDimensions.height) * 100;
                                const count = productCounts[pred.class] || 0;
                                
                                return (
                                  <div
                                    key={pred.detection_id || idx}
                                    className={cn(
                                      "absolute border-2 rounded-sm pointer-events-none",
                                      classColors[pred.class] || 'detection-box'
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
                                      {pred.class.toUpperCase()} ({count})
                                    </span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                          
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                        
                        {/* Info bar */}
                        <div className="p-3 bg-card flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
                          </div>
                          {Object.keys(productCounts).length > 0 && (
                            <div className="flex gap-1">
                              {Object.entries(productCounts).map(([cls, count]) => (
                                <Badge 
                                  key={cls} 
                                  variant="secondary" 
                                  className={cn("text-xs", classBgColors[cls], "text-white")}
                                >
                                  {cls}: {count}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage.mutate(image.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Assigned Products</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select products and set expected facings for this shelf.
                </p>
              </div>
              <Button 
                variant="glow"
                onClick={handleSaveProducts}
                disabled={assignProducts.isPending}
              >
                {assignProducts.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>

            <ScrollArea className="h-[500px]">
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">No products available</p>
                  <p className="text-sm">Add products first to assign them to shelves.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/products')}
                  >
                    Go to Products
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {products.map((product) => {
                    const isSelected = selectedProducts[product.id] !== undefined;
                    const quantity = selectedProducts[product.id] || 1;
                    const productImage = product.sku_images?.[0]?.image_url;
                    
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 bg-card"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                        
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-muted-foreground/50" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {product.name}
                          </p>
                          {product.barcode && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {product.barcode}
                            </p>
                          )}
                        </div>
                        
                        {/* Quantity input */}
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Qty:</span>
                            <Input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        
                        <Badge
                          variant={product.training_status === 'completed' ? 'default' : 'secondary'}
                        >
                          {product.training_status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Shelf Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground font-medium">
                  {format(new Date(shelf.created_at), 'PPP')}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-foreground font-medium">
                  {format(new Date(shelf.updated_at), 'PPP')}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground">Total Scans</span>
                <span className="text-foreground font-medium">{shelf.imageCount}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground">Assigned Products</span>
                <span className="text-foreground font-medium">{Object.keys(selectedProducts).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-destructive/30 rounded-xl p-6">
            <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Deleting this shelf will remove all associated images and product assignments.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteShelf}
              disabled={deleteShelf.isPending}
            >
              {deleteShelf.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Shelf
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Full Image Viewer Modal */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden bg-card">
          {viewingImage && (() => {
            const predictions = parseDetectionResults(viewingImage.detection_result);
            const productCounts = getProductCounts(viewingImage.detection_result);
            const imageDimensions = getImageDimensions(viewingImage.detection_result);
            
            return (
              <>
                <div className="relative">
                  <div className="relative w-full" style={{ maxHeight: '70vh' }}>
                    <img
                      src={viewingImage.image_url}
                      alt="Shelf scan"
                      className="w-full h-auto max-h-[70vh] object-contain bg-background"
                    />
                    
                    {/* Detection overlays - positioned relative to image */}
                    {predictions.length > 0 && imageDimensions && (
                      <div className="absolute inset-0 pointer-events-none">
                        {predictions.map((pred, idx) => {
                          const left = ((pred.x - pred.width / 2) / imageDimensions.width) * 100;
                          const top = ((pred.y - pred.height / 2) / imageDimensions.height) * 100;
                          const width = (pred.width / imageDimensions.width) * 100;
                          const height = (pred.height / imageDimensions.height) * 100;
                          const count = productCounts[pred.class] || 0;
                          
                          return (
                            <div
                              key={pred.detection_id || idx}
                              className={cn(
                                "absolute border-2 rounded-sm",
                                classColors[pred.class] || 'detection-box'
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
                                  "absolute -top-6 left-0 text-xs px-2 py-1 rounded font-medium text-white whitespace-nowrap shadow-lg",
                                  classBgColors[pred.class] || 'bg-primary'
                                )}
                              >
                                {pred.class.toUpperCase()} ({count}) - {(pred.confidence * 100).toFixed(2)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-4 right-4 z-10"
                    onClick={() => setViewingImage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Detection Results Panel */}
                <div className="p-6 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-foreground">Detection Results (≥{(MIN_CONFIDENCE * 100).toFixed(2)}% confidence)</h4>
                    <span className="text-sm text-muted-foreground">
                      Captured {formatDistanceToNow(new Date(viewingImage.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {Object.keys(productCounts).length > 0 ? (
                    <div className="space-y-3">
                      {predictions.map((pred, idx) => {
                        const count = productCounts[pred.class] || 0;
                        return (
                          <div 
                            key={pred.detection_id || idx}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                          >
                            <div 
                              className={cn(
                                "w-3 h-3 rounded-full",
                                classBgColors[pred.class] || 'bg-primary'
                              )}
                            />
                            <span className="font-medium text-foreground">{pred.class.toUpperCase()}</span>
                            <Badge variant="outline" className="font-bold">
                              {count} units
                            </Badge>
                            <Badge variant="secondary">
                              {(pred.confidence * 100).toFixed(2)}% confidence
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              Top detection position: ({Math.round(pred.x)}, {Math.round(pred.y)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No detections with ≥{(MIN_CONFIDENCE * 100).toFixed(2)}% confidence found.</p>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}