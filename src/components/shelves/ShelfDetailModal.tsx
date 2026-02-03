import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trash2, 
  Package, 
  Image as ImageIcon, 
  Settings, 
  Plus,
  Eye,
  Loader2,
  MapPin,
  Clock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useShelves, useShelfImages } from '@/hooks/useShelves';
import { useProducts } from '@/hooks/useProducts';
import { useRoboflowDetection } from '@/hooks/useRoboflowDetection';
import { useAuth } from '@/contexts/AuthContext';
import { ImageCapture } from '@/components/shared/ImageCapture';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface ShelfWithDetails extends Tables<'shelves'> {
  store?: Tables<'stores'> | null;
  products?: Array<Tables<'shelf_products'> & { sku?: Tables<'skus'> | null }>;
  imageCount: number;
  lastImage?: Tables<'shelf_images'> | null;
}

interface ShelfDetailModalProps {
  shelf: ShelfWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShelfDetailModal({ shelf, open, onOpenChange }: ShelfDetailModalProps) {
  const [activeTab, setActiveTab] = useState('images');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    shelf.products?.map(p => p.sku_id).filter(Boolean) as string[] || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<Tables<'shelf_images'> | null>(null);

  const { images, isLoading: imagesLoading, addImage, deleteImage } = useShelfImages(shelf.id);
  const { products } = useProducts();
  const { assignProducts, deleteShelf } = useShelves();
  const { detectWithRoboflow, isDetecting } = useRoboflowDetection();
  const { tenantId } = useAuth();
  const { toast } = useToast();

  const handleImageCapture = async (file: File, base64: string) => {
    setPreviewImage(base64);
    setIsUploading(true);

    try {
      // Upload to Supabase storage
      const fileName = `${shelf.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shelf-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shelf-images')
        .getPublicUrl(fileName);

      // Run Roboflow detection
      const detectionResult = await detectWithRoboflow(publicUrl, shelf.id, tenantId || undefined);

      if (detectionResult.success) {
        toast({
          title: 'Detection complete',
          description: 'Image analyzed and saved successfully.',
        });
      }

      // Save image record
      await addImage.mutateAsync({
        shelfId: shelf.id,
        imageUrl: publicUrl,
      });

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
    setSelectedProducts(prev =>
      prev.includes(skuId)
        ? prev.filter(id => id !== skuId)
        : [...prev, skuId]
    );
  };

  const handleSaveProducts = async () => {
    await assignProducts.mutateAsync({
      shelfId: shelf.id,
      skuIds: selectedProducts,
    });
  };

  const handleDeleteShelf = async () => {
    if (confirm('Are you sure you want to delete this shelf? This action cannot be undone.')) {
      await deleteShelf.mutateAsync(shelf.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{shelf.name}</DialogTitle>
              {shelf.store && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{shelf.store.name}</span>
                  {shelf.location_in_store && (
                    <span>• {shelf.location_in_store}</span>
                  )}
                </div>
              )}
            </div>
            <Badge variant="outline">{shelf.imageCount} scans</Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="mx-6 grid w-fit grid-cols-3">
            <TabsTrigger value="images" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Images
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

          <div className="flex-1 overflow-hidden">
            {/* Images Tab */}
            <TabsContent value="images" className="h-full m-0 p-6 pt-4">
              <div className="space-y-4">
                {/* Image Capture */}
                <ImageCapture
                  onImageCapture={handleImageCapture}
                  isProcessing={isUploading || isDetecting}
                  preview={previewImage}
                  onClear={() => setPreviewImage(null)}
                  processingText={isDetecting ? 'Running detection...' : 'Uploading...'}
                  className="max-h-64"
                />

                {/* Image History */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">
                    Image History ({images.length})
                  </h4>
                  <ScrollArea className="h-[300px] pr-4">
                    {imagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : images.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No images yet. Upload your first scan above.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((image) => (
                          <div
                            key={image.id}
                            className="group relative rounded-lg overflow-hidden border border-border bg-secondary cursor-pointer"
                            onClick={() => setViewingImage(image)}
                          >
                            <img
                              src={image.image_url}
                              alt="Shelf scan"
                              className="w-full aspect-square object-cover"
                            />
                            <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="sm" variant="secondary">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteImage.mutate(image.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="h-full m-0 p-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Select products to assign to this shelf.
                  </p>
                  <Button 
                    size="sm" 
                    variant="glow"
                    onClick={handleSaveProducts}
                    disabled={assignProducts.isPending}
                  >
                    {assignProducts.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  {products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No products available. Add products first.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedProducts.includes(product.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => handleProductToggle(product.id)}
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => handleProductToggle(product.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {product.name}
                            </p>
                            {product.barcode && (
                              <p className="text-xs text-muted-foreground">
                                {product.barcode}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={product.training_status === 'completed' ? 'default' : 'secondary'}
                          >
                            {product.training_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="h-full m-0 p-6 pt-4">
              <div className="space-y-6">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h4 className="font-medium text-foreground mb-2">Shelf Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-foreground">
                        {format(new Date(shelf.created_at), 'PPP')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="text-foreground">
                        {format(new Date(shelf.updated_at), 'PPP')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Scans</span>
                      <span className="text-foreground">{shelf.imageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assigned Products</span>
                      <span className="text-foreground">{shelf.products?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
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
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Image Viewer Modal */}
        {viewingImage && (
          <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden">
              <img
                src={viewingImage.image_url}
                alt="Shelf scan"
                className="w-full max-h-[80vh] object-contain"
              />
              {viewingImage.detection_result && (
                <div className="p-4 border-t border-border">
                  <h4 className="font-medium mb-2">Detection Results</h4>
                  <pre className="text-xs bg-secondary p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(viewingImage.detection_result, null, 2)}
                  </pre>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
