import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useShelves } from '@/hooks/useShelves';
import { useStores } from '@/hooks/useStores';
import { useProducts } from '@/hooks/useProducts';
import { Loader2, Package, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const shelfSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  store_id: z.string().optional(),
  description: z.string().optional(),
  location_in_store: z.string().optional(),
});

type ShelfFormData = z.infer<typeof shelfSchema>;

interface AddShelfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddShelfModal({ open, onOpenChange }: AddShelfModalProps) {
  const { createShelf, assignProducts } = useShelves();
  const { stores } = useStores();
  const { products } = useProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

  const form = useForm<ShelfFormData>({
    resolver: zodResolver(shelfSchema),
    defaultValues: {
      name: '',
      store_id: 'none',
      description: '',
      location_in_store: '',
    },
  });

  const handleProductToggle = (skuId: string) => {
    setSelectedProducts(prev => {
      if (prev[skuId] !== undefined) {
        const { [skuId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [skuId]: 1 };
    });
  };

  const handleQuantityChange = (skuId: string, delta: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [skuId]: Math.max(1, (prev[skuId] || 1) + delta),
    }));
  };

  const onSubmit = async (data: ShelfFormData) => {
    setIsSubmitting(true);
    try {
      const shelf = await createShelf.mutateAsync({
        name: data.name,
        store_id: data.store_id && data.store_id !== 'none' ? data.store_id : null,
        description: data.description || null,
        location_in_store: data.location_in_store || null,
      });

      // Assign products if any selected
      if (Object.keys(selectedProducts).length > 0) {
        await assignProducts.mutateAsync({
          shelfId: shelf.id,
          skuIds: Object.keys(selectedProducts),
          quantities: selectedProducts,
        });
      }

      form.reset();
      setSelectedProducts({});
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = Object.keys(selectedProducts).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Shelf</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 pb-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shelf Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Aisle 3 - Beverages" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="store_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store (Optional)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a store" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No store</SelectItem>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location_in_store"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location in Store (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Near entrance, Aisle 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add notes about this shelf..." 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Assignment Section */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">Assign Products</h4>
                      <p className="text-sm text-muted-foreground">
                        Select products and set expected quantities for this shelf.
                      </p>
                    </div>
                    {selectedCount > 0 && (
                      <Badge variant="secondary">
                        {selectedCount} selected
                      </Badge>
                    )}
                  </div>

                  {products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-lg">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No products available. Add products first.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                      {products.map((product) => {
                        const isSelected = selectedProducts[product.id] !== undefined;
                        const quantity = selectedProducts[product.id] || 1;
                        const productImage = product.sku_images?.[0]?.image_url;
                        
                        return (
                          <div
                            key={product.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => handleProductToggle(product.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleProductToggle(product.id)}
                            />
                            
                            {/* Product Image */}
                            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                              {productImage ? (
                                <img 
                                  src={productImage} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-muted-foreground/50" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">
                                {product.name}
                              </p>
                              {product.barcode && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {product.barcode}
                                </p>
                              )}
                            </div>
                            
                            {/* Quantity controls */}
                            {isSelected && (
                              <div 
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleQuantityChange(product.id, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-medium text-sm">
                                  {quantity}
                                </span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleQuantityChange(product.id, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedProducts({});
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="glow" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Shelf
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}