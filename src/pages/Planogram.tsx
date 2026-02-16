import { useState, useMemo } from 'react';
import { 
  LayoutGrid, 
  Plus, 
  Minus, 
  Package, 
  Store, 
  Trash2,
  GripVertical,
  Save,
  RotateCcw
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useShelves } from '@/hooks/useShelves';
import { useStores } from '@/hooks/useStores';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PlanogramProduct {
  skuId: string;
  name: string;
  facings: number;
}

interface PlanogramRow {
  id: string;
  label: string;
  products: PlanogramProduct[];
}

export default function Planogram() {
  const { isAdmin } = useAuth();
  const { shelves } = useShelves();
  const { stores } = useStores();
  const { products } = useProducts();
  const { toast } = useToast();

  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedShelfId, setSelectedShelfId] = useState<string>('');
  const [rows, setRows] = useState<PlanogramRow[]>([]);
  const [dragProduct, setDragProduct] = useState<{ skuId: string; name: string } | null>(null);

  // Filter shelves by selected store
  const filteredShelves = useMemo(() => {
    if (!selectedStoreId) return shelves;
    return shelves.filter(s => s.store_id === selectedStoreId);
  }, [shelves, selectedStoreId]);

  // Get the selected shelf
  const selectedShelf = useMemo(() => 
    shelves.find(s => s.id === selectedShelfId), 
    [shelves, selectedShelfId]
  );

  // Get products assigned to the selected shelf
  const assignedProducts = useMemo(() => {
    if (!selectedShelf?.products) return [];
    return selectedShelf.products
      .filter(sp => sp.sku)
      .map(sp => ({
        skuId: sp.sku_id,
        name: sp.sku?.name || 'Unknown',
        expectedFacings: sp.expected_facings || 1,
      }));
  }, [selectedShelf]);

  // All available products (for adding to rows)
  const availableProducts = useMemo(() => {
    if (assignedProducts.length > 0) return assignedProducts;
    // Fallback to all products if no shelf selected
    return products.map(p => ({
      skuId: p.id,
      name: p.name,
      expectedFacings: 1,
    }));
  }, [assignedProducts, products]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedShelfId('');
    setRows([]);
  };

  const handleShelfChange = (shelfId: string) => {
    setSelectedShelfId(shelfId);
    // Auto-populate rows from shelf products
    const shelf = shelves.find(s => s.id === shelfId);
    if (shelf?.products && shelf.products.length > 0) {
      setRows([{
        id: crypto.randomUUID(),
        label: 'Shelf 1',
        products: shelf.products
          .filter(sp => sp.sku)
          .map(sp => ({
            skuId: sp.sku_id,
            name: sp.sku?.name || 'Unknown',
            facings: sp.expected_facings || 1,
          })),
      }]);
    } else {
      setRows([]);
    }
  };

  const addRow = () => {
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      label: `Shelf ${prev.length + 1}`,
      products: [],
    }]);
  };

  const removeRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const updateRowLabel = (rowId: string, label: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, label } : r));
  };

  const addProductToRow = (rowId: string, skuId: string) => {
    const product = availableProducts.find(p => p.skuId === skuId);
    if (!product) return;

    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      // Check if product already in row
      const existing = r.products.find(p => p.skuId === skuId);
      if (existing) {
        return {
          ...r,
          products: r.products.map(p => 
            p.skuId === skuId ? { ...p, facings: p.facings + 1 } : p
          ),
        };
      }
      return {
        ...r,
        products: [...r.products, { skuId, name: product.name, facings: 1 }],
      };
    }));
  };

  const removeProductFromRow = (rowId: string, skuId: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, products: r.products.filter(p => p.skuId !== skuId) };
    }));
  };

  const updateProductFacings = (rowId: string, skuId: string, facings: number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        products: r.products.map(p => 
          p.skuId === skuId ? { ...p, facings: Math.max(1, facings) } : p
        ),
      };
    }));
  };

  const handleDragStart = (skuId: string, name: string) => {
    setDragProduct({ skuId, name });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    if (dragProduct) {
      addProductToRow(rowId, dragProduct.skuId);
      setDragProduct(null);
    }
  };

  const resetPlanogram = () => {
    setRows([]);
  };

  const handleSave = () => {
    toast({
      title: 'Planogram saved',
      description: `Saved ${rows.length} shelf rows with ${rows.reduce((acc, r) => acc + r.products.length, 0)} product placements.`,
    });
  };

  const totalProducts = rows.reduce((acc, r) => acc + r.products.length, 0);
  const totalFacings = rows.reduce((acc, r) => acc + r.products.reduce((a, p) => a + p.facings, 0), 0);

  return (
    <MainLayout
      title="Planogram Designer"
      subtitle="Design shelf layouts and assign products to shelf positions."
      
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Configuration & Products */}
        <div className="lg:col-span-1 space-y-4">
          {/* Store & Shelf Selection */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Configuration
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Store</Label>
                <Select value={selectedStoreId} onValueChange={handleStoreChange}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Shelf</Label>
                <Select value={selectedShelfId} onValueChange={handleShelfChange}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select shelf..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredShelves.map(shelf => (
                      <SelectItem key={shelf.id} value={shelf.id}>
                        {shelf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Available Products */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-primary" />
              Available Products
              <Badge variant="secondary" className="ml-auto text-xs">
                {availableProducts.length}
              </Badge>
            </h3>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-1.5 pr-2">
                {availableProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {selectedShelfId 
                      ? 'No products assigned to this shelf.' 
                      : 'Select a shelf to see assigned products.'}
                  </p>
                ) : (
                  availableProducts.map(product => (
                    <div
                      key={product.skuId}
                      draggable
                      onDragStart={() => handleDragStart(product.skuId, product.name)}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/50 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                      <span className="text-sm text-foreground truncate flex-1">{product.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {product.expectedFacings}f
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shelf Rows</span>
              <span className="font-medium text-foreground">{rows.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Products Placed</span>
              <span className="font-medium text-foreground">{totalProducts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Facings</span>
              <span className="font-medium text-foreground">{totalFacings}</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Planogram Canvas */}
        <div className="lg:col-span-3 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="glow" size="sm" onClick={addRow}>
                <Plus className="w-4 h-4 mr-1" />
                Add Shelf Row
              </Button>
              <Button variant="outline" size="sm" onClick={resetPlanogram}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
            <Button variant="default" size="sm" onClick={handleSave} disabled={rows.length === 0}>
              <Save className="w-4 h-4 mr-1" />
              Save Planogram
            </Button>
          </div>

          {/* Planogram Grid */}
          {rows.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center py-24">
              <LayoutGrid className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No shelf rows yet</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Click "Add Shelf Row" to create rows, then drag products from the left panel to design your planogram.
              </p>
              <Button variant="glow" size="sm" onClick={addRow}>
                <Plus className="w-4 h-4 mr-1" />
                Add First Row
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, rowIndex) => (
                <div
                  key={row.id}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, row.id)}
                >
                  {/* Row Header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/50 border-b border-border">
                    <span className="text-xs font-mono text-muted-foreground w-6">
                      {rowIndex + 1}
                    </span>
                    <Input
                      value={row.label}
                      onChange={(e) => updateRowLabel(row.id, e.target.value)}
                      className="h-7 text-sm font-medium bg-transparent border-none shadow-none px-1 max-w-[200px] focus-visible:ring-1"
                    />
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {row.products.length} products · {row.products.reduce((a, p) => a + p.facings, 0)} facings
                    </Badge>

                    {/* Add product dropdown */}
                    <Select onValueChange={(skuId) => addProductToRow(row.id, skuId)}>
                      <SelectTrigger className="w-auto h-7 text-xs bg-transparent border-dashed gap-1">
                        <Plus className="w-3 h-3" />
                        <SelectValue placeholder="Add" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map(p => (
                          <SelectItem key={p.skuId} value={p.skuId}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Row Products - Visual Shelf */}
                  <div className="p-3 min-h-[80px]">
                    {row.products.length === 0 ? (
                      <div className="flex items-center justify-center h-16 border-2 border-dashed border-border/50 rounded-lg text-sm text-muted-foreground">
                        Drag products here or use the + button above
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {row.products.map((product) => (
                          <div
                            key={product.skuId}
                            className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground leading-tight">
                                {product.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => updateProductFacings(row.id, product.skuId, product.facings - 1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-xs font-mono text-primary min-w-[20px] text-center">
                                  {product.facings}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => updateProductFacings(row.id, product.skuId, product.facings + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <span className="text-[10px] text-muted-foreground">facings</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive absolute -top-1.5 -right-1.5 bg-card border border-border rounded-full shadow-sm"
                              onClick={() => removeProductFromRow(row.id, product.skuId)}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Visual shelf edge */}
                  <div className="h-1.5 bg-gradient-to-r from-muted via-border to-muted" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
