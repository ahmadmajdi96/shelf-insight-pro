import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Plus, 
  Minus, 
  Package, 
  Store, 
  Trash2,
  GripVertical,
  Save,
  RotateCcw,
  Search,
  Filter,
  Pencil,
  MoreVertical,
  HelpCircle,
  Ruler
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useShelves } from '@/hooks/useShelves';
import { useStores } from '@/hooks/useStores';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import { AddShelfModal } from '@/components/shelves/AddShelfModal';
import { cn } from '@/lib/utils';

interface PlanogramProduct {
  instanceId: string; // unique per placement
  skuId: string | null; // null = unregistered
  name: string;
  facings: number;
}

interface PlanogramRow {
  id: string;
  label: string;
  products: PlanogramProduct[];
}

export default function Planogram() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { shelves, isLoading, deleteShelf, updateShelf } = useShelves();
  const { stores } = useStores();
  const { products } = useProducts();
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState('shelves');

  // Shelves tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStoreId, setFilterStoreId] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Planogram tab state
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedShelfId, setSelectedShelfId] = useState<string>('');
  const [rows, setRows] = useState<PlanogramRow[]>([]);
  const [dragProduct, setDragProduct] = useState<{ skuId: string | null; name: string } | null>(null);

  // Width editing
  const [editingWidthId, setEditingWidthId] = useState<string | null>(null);
  const [widthValue, setWidthValue] = useState('');
  const [widthUnit, setWidthUnit] = useState<'cm' | 'm'>('cm');

  // ---- Shelves tab logic ----
  const filteredShelves = shelves.filter((shelf) => {
    const matchesSearch = shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelf.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = filterStoreId === 'all' || shelf.store_id === filterStoreId;
    return matchesSearch && matchesStore;
  });

  const handleShelfSelect = (shelfId: string) => {
    navigate(`/shelves/${shelfId}`);
  };

  const handleDeleteShelf = async () => {
    if (deleteId) {
      await deleteShelf.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleSetWidth = async (shelfId: string) => {
    const cm = widthUnit === 'm' ? parseFloat(widthValue) * 100 : parseFloat(widthValue);
    if (isNaN(cm) || cm <= 0) {
      toast({ title: 'Invalid width', variant: 'destructive' });
      return;
    }
    await updateShelf.mutateAsync({ id: shelfId, width_cm: cm } as any);
    setEditingWidthId(null);
    setWidthValue('');
  };

  // ---- Planogram tab logic ----
  const planogramShelves = useMemo(() => {
    if (!selectedStoreId) return shelves;
    return shelves.filter(s => s.store_id === selectedStoreId);
  }, [shelves, selectedStoreId]);

  const selectedShelf = useMemo(() => 
    shelves.find(s => s.id === selectedShelfId), 
    [shelves, selectedShelfId]
  );

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

  const availableProducts = useMemo(() => {
    if (assignedProducts.length > 0) return assignedProducts;
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
    const shelf = shelves.find(s => s.id === shelfId);
    if (shelf?.products && shelf.products.length > 0) {
      setRows([{
        id: crypto.randomUUID(),
        label: 'Shelf 1',
        products: shelf.products
          .filter(sp => sp.sku)
          .map(sp => ({
            instanceId: crypto.randomUUID(),
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

  const addProductToRow = (rowId: string, skuId: string | null, name: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        products: [...r.products, { 
          instanceId: crypto.randomUUID(), 
          skuId, 
          name, 
          facings: 1 
        }],
      };
    }));
  };

  const removeProductFromRow = (rowId: string, instanceId: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, products: r.products.filter(p => p.instanceId !== instanceId) };
    }));
  };

  const updateProductFacings = (rowId: string, instanceId: string, facings: number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        products: r.products.map(p => 
          p.instanceId === instanceId ? { ...p, facings: Math.max(1, facings) } : p
        ),
      };
    }));
  };

  const handleDragStart = (skuId: string | null, name: string) => {
    setDragProduct({ skuId, name });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    if (dragProduct) {
      addProductToRow(rowId, dragProduct.skuId, dragProduct.name);
      setDragProduct(null);
    }
  };

  const resetPlanogram = () => setRows([]);

  const handleSave = () => {
    toast({
      title: 'Planogram saved',
      description: `Saved ${rows.length} shelf rows with ${rows.reduce((acc, r) => acc + r.products.length, 0)} product placements.`,
    });
  };

  const totalProducts = rows.reduce((acc, r) => acc + r.products.length, 0);
  const totalFacings = rows.reduce((acc, r) => acc + r.products.reduce((a, p) => a + p.facings, 0), 0);

  const formatWidth = (cm: number | null) => {
    if (!cm) return null;
    if (cm >= 100) return `${(cm / 100).toFixed(2)}m`;
    return `${cm}cm`;
  };

  return (
    <MainLayout
      title="Planogram & Shelves"
      subtitle="Manage shelves and design planogram layouts."
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="shelves">Shelves</TabsTrigger>
          <TabsTrigger value="designer">Planogram Designer</TabsTrigger>
        </TabsList>

        {/* ========== SHELVES TAB ========== */}
        <TabsContent value="shelves" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search shelves..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <div className="flex gap-3">
              <Select value={filterStoreId} onValueChange={setFilterStoreId}>
                <SelectTrigger className="w-[200px] bg-card border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="glow" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Shelf
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{shelves.length}</p>
                  <p className="text-sm text-muted-foreground">Total Shelves</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {shelves.reduce((acc, s) => acc + (s.products?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Assigned Products</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {shelves.filter(s => (s as any).width_cm).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Width Configured</p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-card border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredShelves.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || filterStoreId !== 'all' ? 'No shelves found' : 'No shelves yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterStoreId !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first shelf to start tracking products.'}
              </p>
              {!searchQuery && filterStoreId === 'all' && (
                <Button variant="glow" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Shelf
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShelves.map((shelf) => (
                <div key={shelf.id} className="relative">
                  <ShelfCard
                    shelf={shelf}
                    onSelect={() => handleShelfSelect(shelf.id)}
                    onDelete={() => setDeleteId(shelf.id)}
                  />
                  {/* Width badge & edit */}
                  <div className="absolute top-2 left-2 z-10">
                    {editingWidthId === shelf.id ? (
                      <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1.5 shadow-md" onClick={e => e.stopPropagation()}>
                        <Input
                          type="number"
                          value={widthValue}
                          onChange={e => setWidthValue(e.target.value)}
                          className="h-7 w-20 text-xs"
                          placeholder="Width"
                          autoFocus
                        />
                        <Select value={widthUnit} onValueChange={(v: 'cm' | 'm') => setWidthUnit(v)}>
                          <SelectTrigger className="h-7 w-16 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cm">cm</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSetWidth(shelf.id)}>
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingWidthId(null)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer text-[10px] gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWidthId(shelf.id);
                          const w = (shelf as any).width_cm;
                          setWidthValue(w ? String(w) : '');
                          setWidthUnit('cm');
                        }}
                      >
                        <Ruler className="w-3 h-3" />
                        {(shelf as any).width_cm ? formatWidth((shelf as any).width_cm) : 'Set width'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <AddShelfModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Shelf</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this shelf? All assigned products and detection history will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteShelf} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ========== PLANOGRAM DESIGNER TAB ========== */}
        <TabsContent value="designer" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel */}
            <div className="lg:col-span-1 space-y-4">
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
                          <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
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
                        {planogramShelves.map(shelf => (
                          <SelectItem key={shelf.id} value={shelf.id}>{shelf.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedShelf && (selectedShelf as any).width_cm && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
                      <Ruler className="w-3.5 h-3.5" />
                      Width: {formatWidth((selectedShelf as any).width_cm)}
                    </div>
                  )}
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
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1.5 pr-2">
                    {/* Unregistered Item - always available */}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(null, 'Unregistered Item')}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 cursor-grab active:cursor-grabbing hover:border-destructive/50 transition-colors group"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                      <HelpCircle className="w-3.5 h-3.5 text-destructive/70" />
                      <span className="text-sm text-foreground truncate flex-1">Unregistered Item</span>
                      <Badge variant="outline" className="text-[10px] shrink-0 border-destructive/30 text-destructive">
                        ?
                      </Badge>
                    </div>

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

            {/* Right Panel - Canvas */}
            <div className="lg:col-span-3 space-y-4">
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
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/50 border-b border-border">
                        <span className="text-xs font-mono text-muted-foreground w-6">{rowIndex + 1}</span>
                        <Input
                          value={row.label}
                          onChange={(e) => updateRowLabel(row.id, e.target.value)}
                          className="h-7 text-sm font-medium bg-transparent border-none shadow-none px-1 max-w-[200px] focus-visible:ring-1"
                        />
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          {row.products.length} items · {row.products.reduce((a, p) => a + p.facings, 0)} facings
                        </Badge>

                        {/* Add registered product */}
                        <Select onValueChange={(skuId) => {
                          const p = availableProducts.find(p => p.skuId === skuId);
                          if (p) addProductToRow(row.id, p.skuId, p.name);
                        }}>
                          <SelectTrigger className="w-auto h-7 text-xs bg-transparent border-dashed gap-1">
                            <Plus className="w-3 h-3" />
                            <SelectValue placeholder="Add" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts.map(p => (
                              <SelectItem key={p.skuId} value={p.skuId}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Add unregistered item button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive/70 hover:text-destructive"
                          onClick={() => addProductToRow(row.id, null, 'Unregistered Item')}
                        >
                          <HelpCircle className="w-3 h-3 mr-1" />
                          Unknown
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRow(row.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="p-3 min-h-[80px]">
                        {row.products.length === 0 ? (
                          <div className="flex items-center justify-center h-16 border-2 border-dashed border-border/50 rounded-lg text-sm text-muted-foreground">
                            Drag products here or use the + button above
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {row.products.map((product) => (
                              <div
                                key={product.instanceId}
                                className={cn(
                                  "group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                                  product.skuId 
                                    ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                                    : "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className={cn(
                                    "text-xs font-medium leading-tight",
                                    product.skuId ? "text-foreground" : "text-destructive"
                                  )}>
                                    {product.skuId ? product.name : '⚠ Unregistered'}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                      onClick={() => updateProductFacings(row.id, product.instanceId, product.facings - 1)}
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
                                      onClick={() => updateProductFacings(row.id, product.instanceId, product.facings + 1)}
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
                                  onClick={() => removeProductFromRow(row.id, product.instanceId)}
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="h-1.5 bg-gradient-to-r from-muted via-border to-muted" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
