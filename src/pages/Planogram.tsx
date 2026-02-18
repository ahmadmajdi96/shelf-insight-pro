import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, Plus, Minus, Package, Store, Trash2,
  GripVertical, Save, RotateCcw, Search, Filter,
  Pencil, HelpCircle, Ruler, Copy, Eye, History,
  CheckCircle2, XCircle, AlertTriangle, BarChart3,
  FileText, Clock, ArrowLeft, Upload, Loader2, TrendingUp,
  FolderOpen, MoreVertical, Image, Building2, Pause, Play,
  MapPin
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useStores } from '@/hooks/useStores';
import { useTenants } from '@/hooks/useTenants';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';

import { useShelves } from '@/hooks/useShelves';
import { usePlanogramTemplates, usePlanogramVersions, useComplianceScans, type PlanogramRow, type PlanogramTemplate } from '@/hooks/usePlanograms';
import { useRoboflowDetection } from '@/hooks/useRoboflowDetection';
import { useToast } from '@/hooks/use-toast';
import { AddProductModal } from '@/components/products/AddProductModal';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'text-muted-foreground bg-muted' },
  training: { icon: Clock, label: 'Training...', className: 'text-warning bg-warning/10' },
  completed: { icon: CheckCircle2, label: 'Trained', className: 'text-success bg-success/10' },
  failed: { icon: AlertTriangle, label: 'Failed', className: 'text-destructive bg-destructive/10' },
};




export default function Planogram() {
  const navigate = useNavigate();
  const { isAdmin, tenantId } = useAuth();
  const { stores, createStore, updateStore, deleteStore } = useStores();
  const { tenants, isLoading: tenantsLoading, createTenant, updateTenant, suspendTenant, deleteTenant } = useTenants();
  const { products, isLoading: productsLoading, deleteProduct, updateProduct } = useProducts();
  const { categories, isLoading: categoriesLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { templates, createTemplate, updateTemplate, duplicateTemplate, deleteTemplate } = usePlanogramTemplates();
  
  const { shelves } = useShelves();
  const { toast } = useToast();
  const { detectWithRoboflow, isDetecting } = useRoboflowDetection();
  const [complianceImageUrl, setComplianceImageUrl] = useState('');

  const [activeTab, setActiveTab] = useState('tenants');

  // Search states for each tab
  const [tenantSearch, setTenantSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [storeTenantFilter, setStoreTenantFilter] = useState('all');
  const [planogramSearch, setPlanogramSearch] = useState('');
  const [planogramStatusFilter, setPlanogramStatusFilter] = useState('all');
  const [complianceSearch, setComplianceSearch] = useState('');
  const [scanHistorySearch, setScanHistorySearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [versionSearch, setVersionSearch] = useState('');

  // Tenant state
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenantObj, setEditingTenantObj] = useState<any | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  const [tenantFormData, setTenantFormData] = useState({ name: '', username: '', password: '', max_skus: 50, max_images_per_month: 1000 });

  // Store modal state
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStoreObj, setEditingStoreObj] = useState<any | null>(null);
  const [deleteStoreId, setDeleteStoreId] = useState<string | null>(null);
  const [storeTenantId, setStoreTenantId] = useState('');
  const [storeFormData, setStoreFormData] = useState({ name: '', address: '', city: '', country: '' });

  // Planogram CRUD state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PlanogramTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateStoreId, setTemplateStoreId] = useState('');
  const [templateStatus, setTemplateStatus] = useState('draft');
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Designer state
  const [designerTemplateId, setDesignerTemplateId] = useState<string | null>(null);
  const [rows, setRows] = useState<PlanogramRow[]>([]);
  const [dragProduct, setDragProduct] = useState<{ skuId: string | null; name: string } | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [shelfWidths, setShelfWidths] = useState<Record<string, { value: string; unit: 'cm' | 'm' }>>({});

  // Version history state
  const [versionTemplateId, setVersionTemplateId] = useState<string | null>(null);
  const { versions } = usePlanogramVersions(versionTemplateId);

  // Compliance state
  const [complianceTemplateId, setComplianceTemplateId] = useState<string | null>(null);
  const { scans, createScan } = useComplianceScans(complianceTemplateId || undefined);
  const allScans = useComplianceScans();

  // Categories state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [catFormData, setCatFormData] = useState({ name: '', description: '' });

  // Products state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', barcode: '', category_id: '' });




  // ---- Tenant logic ----
  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(tenantSearch.toLowerCase()));
  const getStoresForTenant = (tid: string) => stores.filter(s => s.tenant_id === tid);
  const toggleTenant = (tid: string) => {
    setExpandedTenants(prev => {
      const next = new Set(prev);
      if (next.has(tid)) next.delete(tid); else next.add(tid);
      return next;
    });
  };
  const resetTenantForm = () => { setTenantFormData({ name: '', username: '', password: '', max_skus: 50, max_images_per_month: 1000 }); setEditingTenantObj(null); };
  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenantObj) await updateTenant.mutateAsync({ id: editingTenantObj.id, ...tenantFormData });
    else await createTenant.mutateAsync(tenantFormData);
    resetTenantForm(); setIsTenantModalOpen(false);
  };
  const handleTenantEdit = (tenant: any) => {
    setTenantFormData({ name: tenant.name, username: tenant.username || '', password: tenant.password || '', max_skus: tenant.max_skus, max_images_per_month: tenant.max_images_per_month });
    setEditingTenantObj(tenant); setIsTenantModalOpen(true);
  };
  const handleTenantDelete = async () => { if (deleteTenantId) { await deleteTenant.mutateAsync(deleteTenantId); setDeleteTenantId(null); } };

  // Store handlers
  const handleAddStore = (tid: string) => { setStoreTenantId(tid); setStoreFormData({ name: '', address: '', city: '', country: '' }); setEditingStoreObj(null); setIsStoreModalOpen(true); };
  const handleEditStore = (store: any) => { setStoreTenantId(store.tenant_id); setStoreFormData({ name: store.name, address: store.address || '', city: store.city || '', country: store.country || '' }); setEditingStoreObj(store); setIsStoreModalOpen(true); };
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStoreObj) await updateStore.mutateAsync({ id: editingStoreObj.id, name: storeFormData.name, address: storeFormData.address || null, city: storeFormData.city || null, country: storeFormData.country || null });
    else await createStore.mutateAsync({ name: storeFormData.name, address: storeFormData.address || null, city: storeFormData.city || null, country: storeFormData.country || null, tenant_id: storeTenantId });
    setIsStoreModalOpen(false);
  };
  const handleStoreDelete = async () => { if (deleteStoreId) { await deleteStore.mutateAsync(deleteStoreId); setDeleteStoreId(null); } };

  // Filtered stores
  const filteredStores = stores.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(storeSearch.toLowerCase()) || (s.city || '').toLowerCase().includes(storeSearch.toLowerCase());
    const matchesTenant = storeTenantFilter === 'all' || s.tenant_id === storeTenantFilter;
    return matchesSearch && matchesTenant;
  });

  // ---- Planogram CRUD ----
  const openNewTemplate = () => { setEditingTemplate(null); setTemplateName(''); setTemplateDesc(''); setTemplateStoreId(''); setTemplateStatus('draft'); setShowTemplateDialog(true); };
  const openEditTemplate = (t: PlanogramTemplate) => { setEditingTemplate(t); setTemplateName(t.name); setTemplateDesc(t.description || ''); setTemplateStoreId(t.store_id || ''); setTemplateStatus(t.status); setShowTemplateDialog(true); };
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    if (editingTemplate) await updateTemplate.mutateAsync({ id: editingTemplate.id, name: templateName, description: templateDesc || undefined, store_id: templateStoreId || undefined, status: templateStatus });
    else await createTemplate.mutateAsync({ name: templateName, description: templateDesc || undefined, store_id: templateStoreId || undefined, status: templateStatus, layout: [] });
    setShowTemplateDialog(false);
  };
  const handleDeleteTemplate = async () => { if (deleteTemplateId) { await deleteTemplate.mutateAsync(deleteTemplateId); setDeleteTemplateId(null); } };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(planogramSearch.toLowerCase());
    const matchesStatus = planogramStatusFilter === 'all' || t.status === planogramStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // ---- Designer ----
  const designerTemplate = templates.find(t => t.id === designerTemplateId);
  const openDesigner = (t: PlanogramTemplate) => {
    setDesignerTemplateId(t.id); setRows(t.layout || []); setChangeNotes('');
    const widths: Record<string, { value: string; unit: 'cm' | 'm' }> = {};
    (t.layout || []).forEach(r => { if ((r as any).widthCm) widths[r.id] = { value: String((r as any).widthCm), unit: 'cm' }; });
    setShelfWidths(widths);
  };

  const availableProducts = useMemo(() => products.map(p => ({ skuId: p.id, name: p.name, expectedFacings: 1 })), [products]);
  const addRow = () => { const newId = crypto.randomUUID(); setRows(prev => [...prev, { id: newId, label: `Shelf ${prev.length + 1}`, products: [] }]); };
  const removeRow = (rowId: string) => setRows(prev => prev.filter(r => r.id !== rowId));
  const updateRowLabel = (rowId: string, label: string) => setRows(prev => prev.map(r => r.id === rowId ? { ...r, label } : r));
  const addProductToRow = (rowId: string, skuId: string | null, name: string) => { setRows(prev => prev.map(r => r.id !== rowId ? r : { ...r, products: [...r.products, { instanceId: crypto.randomUUID(), skuId, name, facings: 1 }] })); };
  const removeProductFromRow = (rowId: string, instanceId: string) => { setRows(prev => prev.map(r => r.id !== rowId ? r : { ...r, products: r.products.filter(p => p.instanceId !== instanceId) })); };
  const updateProductFacings = (rowId: string, instanceId: string, facings: number) => { setRows(prev => prev.map(r => r.id !== rowId ? r : { ...r, products: r.products.map(p => p.instanceId === instanceId ? { ...p, facings: Math.max(1, facings) } : p) })); };
  const handleDragStart = (skuId: string | null, name: string) => setDragProduct({ skuId, name });
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDrop = (e: React.DragEvent, rowId: string) => { e.preventDefault(); if (dragProduct) { addProductToRow(rowId, dragProduct.skuId, dragProduct.name); setDragProduct(null); } };
  const updateShelfWidth = (rowId: string, value: string, unit: 'cm' | 'm') => { setShelfWidths(prev => ({ ...prev, [rowId]: { value, unit } })); };
  const getShelfWidthCm = (rowId: string): number | null => { const w = shelfWidths[rowId]; if (!w || !w.value) return null; const num = parseFloat(w.value); if (isNaN(num) || num <= 0) return null; return w.unit === 'm' ? num * 100 : num; };
  const formatWidth = (cm: number | null) => { if (!cm) return null; return cm >= 100 ? `${(cm / 100).toFixed(2)}m` : `${cm}cm`; };
  const handleSaveDesigner = async () => {
    if (!designerTemplateId) return;
    const enrichedRows = rows.map(r => ({ ...r, widthCm: getShelfWidthCm(r.id) }));
    await updateTemplate.mutateAsync({ id: designerTemplateId, layout: enrichedRows as any, changeNotes: changeNotes || undefined });
    setChangeNotes('');
  };
  const totalProducts = rows.reduce((acc, r) => acc + r.products.length, 0);
  const totalFacings = rows.reduce((acc, r) => acc + r.products.reduce((a, p) => a + p.facings, 0), 0);

  // ---- Compliance ----
  const runComplianceCheck = async (template: PlanogramTemplate, shelfImageUrl: string, shelfImageId?: string) => {
    const layout = template.layout || [];
    const expectedProducts = new Map<string, { name: string; count: number }>();
    layout.forEach(row => { row.products.forEach(p => { if (p.skuId) { const existing = expectedProducts.get(p.skuId); expectedProducts.set(p.skuId, { name: p.name, count: (existing?.count || 0) + p.facings }); } }); });
    const detectionResult = await detectWithRoboflow(shelfImageUrl, template.shelf_id || undefined, tenantId || undefined);
    if (!detectionResult.success || !detectionResult.result) { toast({ title: 'Compliance scan failed', description: 'Could not detect products in the image.', variant: 'destructive' }); return; }
    const detectedCounts = new Map<string, number>();
    const outputs = detectionResult.result?.outputs || detectionResult.result;
    const predictions = Array.isArray(outputs) ? outputs.flatMap((o: any) => o?.predictions || []) : outputs?.predictions || [];
    predictions.forEach((pred: any) => { const label = pred.class || pred.label || 'unknown'; detectedCounts.set(label, (detectedCounts.get(label) || 0) + 1); });
    const totalExpected = Array.from(expectedProducts.values()).reduce((a, b) => a + b.count, 0);
    const details = Array.from(expectedProducts.entries()).map(([skuId, { name, count }]) => {
      const matchingLabel = Array.from(detectedCounts.entries()).find(([label]) => name.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(name.toLowerCase()));
      const actual = matchingLabel ? Math.min(matchingLabel[1], count + 2) : 0;
      return { skuId, skuName: name, expected: count, actual, status: actual >= count ? 'compliant' : actual > 0 ? 'partial' : 'missing' };
    });
    const totalFound = details.reduce((a, d) => a + d.actual, 0);
    const totalMissing = details.filter(d => d.status === 'missing').reduce((a, d) => a + d.expected, 0);
    const totalDetected = predictions.length;
    const totalExtra = Math.max(0, totalDetected - totalFound);
    const score = totalExpected > 0 ? Math.round((totalFound / totalExpected) * 100) : 0;
    await createScan.mutateAsync({ template_id: template.id, shelf_image_id: shelfImageId, image_url: shelfImageUrl, compliance_score: Math.min(score, 100), total_expected: totalExpected, total_found: totalFound, total_missing: totalMissing, total_extra: totalExtra, details });
  };

  // ---- Version restore ----
  const restoreVersion = async (version: { layout: PlanogramRow[]; version_number: number }) => {
    if (!versionTemplateId) return;
    await updateTemplate.mutateAsync({ id: versionTemplateId, layout: version.layout, changeNotes: `Restored from version ${version.version_number}` });
    toast({ title: 'Version restored', description: `Layout reverted to version ${version.version_number}.` });
  };

  const getScoreColor = (score: number) => score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const getScoreBg = (score: number) => score >= 80 ? 'bg-green-500/10 border-green-500/20' : score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

  // ---- Categories logic ----
  const resetCatForm = () => { setCatFormData({ name: '', description: '' }); setEditingCategory(null); };
  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) await updateCategory.mutateAsync({ id: editingCategory.id, name: catFormData.name, description: catFormData.description || null });
    else await createCategory.mutateAsync({ name: catFormData.name, description: catFormData.description || null });
    resetCatForm(); setIsCatModalOpen(false);
  };
  const handleCatEdit = (cat: any) => { setCatFormData({ name: cat.name, description: cat.description || '' }); setEditingCategory(cat); setIsCatModalOpen(true); };
  const handleCatDelete = async () => { if (deleteCatId) { await deleteCategory.mutateAsync(deleteCatId); setDeleteCatId(null); } };
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  // ---- Products logic ----
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.training_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const handleProductDelete = async () => { if (deleteProductId) { await deleteProduct.mutateAsync(deleteProductId); setDeleteProductId(null); } };
  const handleProductEdit = (product: any) => { setEditFormData({ name: product.name, description: product.description || '', barcode: product.barcode || '', category_id: product.category_id || '' }); setEditingProduct(product); };
  const handleProductEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) { await updateProduct.mutateAsync({ id: editingProduct.id, name: editFormData.name, description: editFormData.description || null, barcode: editFormData.barcode || null, category_id: editFormData.category_id || null }); setEditingProduct(null); }
  };




  const tabItems = [
    { value: 'tenants', label: 'Tenants', icon: Building2 },
    { value: 'stores', label: 'Stores', icon: Store },
    { value: 'planograms', label: 'Planograms', icon: LayoutGrid },
    { value: 'compliance', label: 'Compliance', icon: BarChart3 },
    { value: 'scan-history', label: 'Scan History', icon: TrendingUp },
    { value: 'categories', label: 'Categories', icon: FolderOpen },
    { value: 'products', label: 'Products', icon: Package },
    { value: 'versions', label: 'Version History', icon: History },
  ];

  return (
    <MainLayout title="Management" subtitle="Tenants, stores, planograms, compliance, and more — all in one place.">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Modern centered navbar */}
        <div className="flex justify-center">
          <TabsList className="inline-flex h-12 items-center gap-1 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-1.5 shadow-lg shadow-primary/5">
            {tabItems.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary/50",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ========== TENANTS TAB ========== */}
        <TabsContent value="tenants" className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search tenants..." className="pl-9 bg-card border-border" value={tenantSearch} onChange={e => setTenantSearch(e.target.value)} />
            </div>
            <Button variant="glow" onClick={() => { resetTenantForm(); setIsTenantModalOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Tenant</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{tenants.length}</p><p className="text-sm text-muted-foreground">Total Tenants</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-success">{tenants.filter(t => t.is_active).length}</p><p className="text-sm text-muted-foreground">Active</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{tenants.reduce((acc, t) => acc + t.skuCount, 0)}</p><p className="text-sm text-muted-foreground">Total SKUs</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-primary">{tenants.reduce((acc, t) => acc + t.processed_images_this_month, 0).toLocaleString()}</p><p className="text-sm text-muted-foreground">Images This Month</p></div>
          </div>

          {tenantsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant, index) => {
                const skuPercentage = (tenant.skuCount / tenant.max_skus) * 100;
                const imagePercentage = (tenant.processed_images_this_month / tenant.max_images_per_month) * 100;
                const tenantStores = getStoresForTenant(tenant.id);
                const isExpanded = expandedTenants.has(tenant.id);
                return (
                  <div key={tenant.id} className={cn("rounded-xl bg-card border border-border transition-all duration-300 animate-fade-in", !tenant.is_active && "opacity-60")} style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                          <div>
                            <h4 className="font-semibold text-foreground">{tenant.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={tenant.is_active ? 'default' : 'secondary'} className="text-xs">{tenant.is_active ? 'Active' : 'Suspended'}</Badge>
                              {tenant.username && <span className="text-xs text-muted-foreground">@{tenant.username}</span>}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTenantEdit(tenant)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddStore(tenant.id)}><Store className="w-4 h-4 mr-2" />Add Store</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => suspendTenant.mutate({ id: tenant.id, suspend: tenant.is_active })}>
                              {tenant.is_active ? <><Pause className="w-4 h-4 mr-2" />Suspend</> : <><Play className="w-4 h-4 mr-2" />Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTenantId(tenant.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">SKUs</span><span className="text-foreground font-medium">{tenant.skuCount} / {tenant.max_skus}</span></div><Progress value={skuPercentage} className="h-2" /></div>
                        <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Images (Monthly)</span><span className="text-foreground font-medium">{tenant.processed_images_this_month.toLocaleString()} / {tenant.max_images_per_month.toLocaleString()}</span></div>
                          <Progress value={imagePercentage} className={cn("h-2", imagePercentage >= 90 && "[&>div]:bg-destructive", imagePercentage >= 80 && imagePercentage < 90 && "[&>div]:bg-warning")} /></div>
                      </div>
                    </div>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleTenant(tenant.id)}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full px-5 py-3 border-t border-border flex items-center justify-between text-sm hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground flex items-center gap-2"><Store className="w-4 h-4" />{tenantStores.length} Store{tenantStores.length !== 1 ? 's' : ''}</span>
                          <span className="text-xs text-muted-foreground">{isExpanded ? 'Collapse' : 'Expand'}</span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-5 pb-4 space-y-2">
                          {tenantStores.map(store => (
                            <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                              <div className="flex items-center gap-3">
                                <Store className="w-4 h-4 text-muted-foreground" />
                                <div><p className="font-medium text-foreground text-sm">{store.name}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{store.city || 'Unknown'}{store.country ? `, ${store.country}` : ''}</p></div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditStore(store)}><Pencil className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteStoreId(store.id)}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            </div>
                          ))}
                          {tenantStores.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No stores yet</p>}
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddStore(tenant.id)}><Plus className="w-3 h-3 mr-2" />Add Store</Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
              {filteredTenants.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">{tenants.length === 0 ? 'No tenants yet. Create your first tenant to get started.' : 'No tenants found matching your search.'}</p></div>}
            </div>
          )}

          {/* Tenant Modal */}
          <Dialog open={isTenantModalOpen} onOpenChange={(open) => { setIsTenantModalOpen(open); if (!open) resetTenantForm(); }}>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />{editingTenantObj ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle></DialogHeader>
              <form onSubmit={handleTenantSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Tenant Name</Label><Input placeholder="e.g., Acme Corporation" className="bg-secondary border-border" value={tenantFormData.name} onChange={e => setTenantFormData({ ...tenantFormData, name: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Username</Label><Input placeholder="tenant_username" className="bg-secondary border-border" value={tenantFormData.username} onChange={e => setTenantFormData({ ...tenantFormData, username: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Password</Label><Input type="password" placeholder="••••••••" className="bg-secondary border-border" value={tenantFormData.password} onChange={e => setTenantFormData({ ...tenantFormData, password: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Max SKUs</Label><Input type="number" className="bg-secondary border-border" value={tenantFormData.max_skus} onChange={e => setTenantFormData({ ...tenantFormData, max_skus: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>Max Images/Month</Label><Input type="number" className="bg-secondary border-border" value={tenantFormData.max_images_per_month} onChange={e => setTenantFormData({ ...tenantFormData, max_images_per_month: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setIsTenantModalOpen(false); resetTenantForm(); }}>Cancel</Button>
                  <Button type="submit" variant="glow" disabled={createTenant.isPending || updateTenant.isPending}>{(createTenant.isPending || updateTenant.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingTenantObj ? 'Save Changes' : 'Create Tenant'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <AlertDialog open={!!deleteTenantId} onOpenChange={() => setDeleteTenantId(null)}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Tenant</AlertDialogTitle><AlertDialogDescription>This will permanently delete the tenant and all associated data.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleTenantDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>

          {/* Store Modal */}
          <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{editingStoreObj ? 'Edit Store' : 'Add New Store'}</DialogTitle></DialogHeader>
              <form onSubmit={handleStoreSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Store Name</Label><Input placeholder="e.g., Walmart - Downtown" className="bg-secondary border-border" value={storeFormData.name} onChange={e => setStoreFormData({ ...storeFormData, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Address</Label><Input placeholder="Street address" className="bg-secondary border-border" value={storeFormData.address} onChange={e => setStoreFormData({ ...storeFormData, address: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>City</Label><Input placeholder="City" className="bg-secondary border-border" value={storeFormData.city} onChange={e => setStoreFormData({ ...storeFormData, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Country</Label><Input placeholder="Country" className="bg-secondary border-border" value={storeFormData.country} onChange={e => setStoreFormData({ ...storeFormData, country: e.target.value })} /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsStoreModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="glow" disabled={createStore.isPending || updateStore.isPending}>{(createStore.isPending || updateStore.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingStoreObj ? 'Save' : 'Add Store'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <AlertDialog open={!!deleteStoreId} onOpenChange={() => setDeleteStoreId(null)}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Store</AlertDialogTitle><AlertDialogDescription>This will remove the store and all associated data.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleStoreDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ========== STORES TAB ========== */}
        <TabsContent value="stores" className="space-y-4 animate-fade-in">
           <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search stores by name or city..." className="pl-9 bg-card border-border" value={storeSearch} onChange={e => setStoreSearch(e.target.value)} />
            </div>
            <Select value={storeTenantFilter} onValueChange={setStoreTenantFilter}>
              <SelectTrigger className="w-[200px] bg-card border-border"><Building2 className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Tenants" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStores.map((store, index) => (
              <div key={store.id} className={cn("rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all duration-300 animate-fade-in")} style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"><Store className="w-6 h-6 text-primary" /></div>
                    <div>
                      <h4 className="font-semibold text-foreground">{store.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{store.city || 'Unknown'}{store.country ? `, ${store.country}` : ''}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditStore(store)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteStoreId(store.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{store.address || 'No address'}</p>
                <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-secondary/50">
                  <div className="text-center"><p className="text-lg font-semibold text-foreground">{store.detectionCount}</p><p className="text-xs text-muted-foreground">Detections</p></div>
                  <div className="text-center border-x border-border"><p className="text-lg font-semibold text-primary">{store.avgShareOfShelf}%</p><p className="text-xs text-muted-foreground">Avg. SoS</p></div>
                  <div className="text-center"><p className="text-sm font-medium text-foreground">{store.lastDetection ? formatDistanceToNow(new Date(store.lastDetection), { addSuffix: true }) : 'Never'}</p><p className="text-xs text-muted-foreground">Last Scan</p></div>
                </div>
              </div>
            ))}
            {filteredStores.length === 0 && <div className="col-span-full text-center py-12"><p className="text-muted-foreground">No stores found.</p></div>}
          </div>
        </TabsContent>

        {/* ========== PLANOGRAMS TAB ========== */}
        <TabsContent value="planograms" className="space-y-4 animate-fade-in">
          {!designerTemplateId ? (
            <>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search planograms..." className="pl-9 bg-card border-border" value={planogramSearch} onChange={e => setPlanogramSearch(e.target.value)} />
                </div>
                <Select value={planogramStatusFilter} onValueChange={setPlanogramStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="glow" onClick={openNewTemplate}><Plus className="w-4 h-4 mr-2" />New Planogram</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                    <div><p className="text-2xl font-bold text-foreground">{templates.length}</p><p className="text-sm text-muted-foreground">Total Planograms</p></div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-400" /></div>
                    <div><p className="text-2xl font-bold text-foreground">{templates.filter(t => t.status === 'active').length}</p><p className="text-sm text-muted-foreground">Active</p></div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-yellow-400" /></div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {templates.filter(t => t.latest_compliance !== null).length > 0
                          ? `${Math.round(templates.filter(t => t.latest_compliance !== null).reduce((a, t) => a + (t.latest_compliance || 0), 0) / templates.filter(t => t.latest_compliance !== null).length)}%`
                          : 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Compliance</p>
                    </div>
                  </div>
                </div>
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-xl">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No planograms found</h3>
                  <p className="text-muted-foreground mb-4">{templates.length === 0 ? 'Create your first planogram to start designing shelf layouts.' : 'Try adjusting your search or filters.'}</p>
                  {templates.length === 0 && <Button variant="glow" onClick={openNewTemplate}><Plus className="w-4 h-4 mr-2" />Create Planogram</Button>}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Shelves</TableHead>
                        <TableHead className="text-center">Versions</TableHead>
                        <TableHead className="text-center">Compliance</TableHead>
                        <TableHead className="text-center">Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map(t => (
                        <TableRow key={t.id} className="cursor-pointer" onClick={() => openDesigner(t)}>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{t.name}</p>
                              {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{t.store?.name || '—'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={t.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{t.status}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{t.layout.length}</TableCell>
                          <TableCell className="text-center text-sm">{t.versions_count}</TableCell>
                          <TableCell className="text-center text-sm">
                            {t.latest_compliance !== null ? <span className={getScoreColor(t.latest_compliance!)}>{t.latest_compliance}%</span> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}</TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDesigner(t)}><Pencil className="w-4 h-4 mr-2" />Design</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditTemplate(t)}><Pencil className="w-4 h-4 mr-2" />Edit Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setVersionTemplateId(t.id); setActiveTab('versions'); }}><History className="w-4 h-4 mr-2" />History</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setComplianceTemplateId(t.id); setActiveTab('compliance'); }}><BarChart3 className="w-4 h-4 mr-2" />Scan</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicateTemplate.mutate(t.id)}><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTemplateId(t.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          ) : (
            /* ========== INLINE DESIGNER ========== */
            <>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDesignerTemplateId(null)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{designerTemplate?.name}</h2>
                  <p className="text-xs text-muted-foreground">{designerTemplate?.store?.name || 'No store'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-primary" />Available Products<Badge variant="secondary" className="ml-auto text-xs">{availableProducts.length}</Badge></h3>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1.5 pr-2">
                        <div draggable onDragStart={() => handleDragStart(null, 'Unregistered Item')} className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 cursor-grab active:cursor-grabbing hover:border-destructive/50 transition-colors">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" /><HelpCircle className="w-3.5 h-3.5 text-destructive/70" /><span className="text-sm text-foreground truncate flex-1">Unregistered Item</span>
                        </div>
                        {availableProducts.map(product => (
                          <div key={product.skuId} draggable onDragStart={() => handleDragStart(product.skuId, product.name)} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/50 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" /><span className="text-sm text-foreground truncate flex-1">{product.name}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shelves</span><span className="font-medium">{rows.length}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Products</span><span className="font-medium">{totalProducts}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Facings</span><span className="font-medium">{totalFacings}</span></div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <Label className="text-xs">Change Notes</Label>
                    <Textarea value={changeNotes} onChange={e => setChangeNotes(e.target.value)} placeholder="Describe your changes..." rows={3} className="text-xs" />
                  </div>
                </div>
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="glow" size="sm" onClick={addRow}><Plus className="w-4 h-4 mr-1" />Add Shelf</Button>
                      <Button variant="outline" size="sm" onClick={() => setRows([])}><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>
                    </div>
                    <Button variant="default" size="sm" onClick={handleSaveDesigner} disabled={rows.length === 0}><Save className="w-4 h-4 mr-1" />Save & Version</Button>
                  </div>
                  {rows.length === 0 ? (
                    <div className="bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center py-24">
                      <LayoutGrid className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-1">No shelves yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">Click "Add Shelf" then drag products to design your planogram.</p>
                      <Button variant="glow" size="sm" onClick={addRow}><Plus className="w-4 h-4 mr-1" />Add First Shelf</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rows.map((row, rowIndex) => (
                        <div key={row.id} className="bg-card border border-border rounded-xl overflow-hidden" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, row.id)}>
                          <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/50 border-b border-border">
                            <span className="text-xs font-mono text-muted-foreground w-6">{rowIndex + 1}</span>
                            <Input value={row.label} onChange={(e) => updateRowLabel(row.id, e.target.value)} className="h-7 text-sm font-medium bg-transparent border-none shadow-none px-1 max-w-[200px] focus-visible:ring-1" />
                            <div className="flex items-center gap-1 ml-auto">
                              <Ruler className="w-3 h-3 text-muted-foreground" />
                              <Input type="number" value={shelfWidths[row.id]?.value || ''} onChange={e => updateShelfWidth(row.id, e.target.value, shelfWidths[row.id]?.unit || 'cm')} className="h-7 w-16 text-xs" placeholder="Width" />
                              <Select value={shelfWidths[row.id]?.unit || 'cm'} onValueChange={(v: 'cm' | 'm') => updateShelfWidth(row.id, shelfWidths[row.id]?.value || '', v)}>
                                <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="m">m</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">{row.products.length} items · {row.products.reduce((a, p) => a + p.facings, 0)} facings</Badge>
                            <Select onValueChange={(skuId) => { const p = availableProducts.find(p => p.skuId === skuId); if (p) addProductToRow(row.id, p.skuId, p.name); }}>
                              <SelectTrigger className="w-auto h-7 text-xs bg-transparent border-dashed gap-1"><Plus className="w-3 h-3" /><SelectValue placeholder="Add" /></SelectTrigger>
                              <SelectContent>{availableProducts.map(p => <SelectItem key={p.skuId} value={p.skuId}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive/70 hover:text-destructive" onClick={() => addProductToRow(row.id, null, 'Unregistered Item')}><HelpCircle className="w-3 h-3 mr-1" />Unknown</Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRow(row.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                          <div className="p-3 min-h-[80px]">
                            {row.products.length === 0 ? (
                              <div className="flex items-center justify-center h-16 border-2 border-dashed border-border/50 rounded-lg text-sm text-muted-foreground">Drag products here</div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {row.products.map((product) => (
                                  <div key={product.instanceId} className={cn("group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors", product.skuId ? "bg-primary/5 border-primary/20 hover:border-primary/40" : "bg-destructive/5 border-destructive/20 hover:border-destructive/40")}>
                                    <div className="flex flex-col">
                                      <span className={cn("text-xs font-medium leading-tight", product.skuId ? "text-foreground" : "text-destructive")}>{product.skuId ? product.name : '⚠ Unregistered'}</span>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateProductFacings(row.id, product.instanceId, product.facings - 1)}><Minus className="w-3 h-3" /></Button>
                                        <span className="text-xs font-mono text-primary min-w-[20px] text-center">{product.facings}</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateProductFacings(row.id, product.instanceId, product.facings + 1)}><Plus className="w-3 h-3" /></Button>
                                        <span className="text-[10px] text-muted-foreground">facings</span>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 bg-card border border-border rounded-full shadow-sm" onClick={() => removeProductFromRow(row.id, product.instanceId)}><Trash2 className="w-2.5 h-2.5" /></Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {getShelfWidthCm(row.id) && (
                            <div className="px-4 py-1.5 bg-secondary/30 border-t border-border text-xs text-muted-foreground flex items-center gap-1"><Ruler className="w-3 h-3" /> Width: {formatWidth(getShelfWidthCm(row.id))}</div>
                          )}
                          <div className="h-1.5 bg-gradient-to-r from-muted via-border to-muted" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Planogram Create/Edit Dialog */}
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingTemplate ? 'Edit Planogram' : 'New Planogram'}</DialogTitle><DialogDescription>Configure the planogram details.</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Name</Label><Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Aisle 3 - Beverages" /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} placeholder="Optional description..." rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Store</Label>
                    <Select value={templateStoreId} onValueChange={setTemplateStoreId}><SelectTrigger><SelectValue placeholder="Select store..." /></SelectTrigger><SelectContent>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-1.5"><Label>Status</Label>
                    <Select value={templateStatus} onValueChange={setTemplateStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select>
                  </div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button><Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>{editingTemplate ? 'Save Changes' : 'Create Planogram'}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Planogram</AlertDialogTitle><AlertDialogDescription>This will permanently delete the planogram, all versions, and compliance scan history.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ========== COMPLIANCE TAB ========== */}
        <TabsContent value="compliance" className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Compliance Scoring</h2>
            <Select value={complianceTemplateId || ''} onValueChange={setComplianceTemplateId}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select planogram..." /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {!complianceTemplateId ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a planogram</h3>
              <p className="text-muted-foreground">Choose a planogram to run compliance checks against shelf images.</p>
            </div>
          ) : (
            <>
              {(() => {
                const template = templates.find(t => t.id === complianceTemplateId);
                if (!template) return null;
                return (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">Run Compliance Scan</h3>
                    <p className="text-sm text-muted-foreground">Provide a shelf image URL to compare against the planogram layout using AI detection.{template.layout.length === 0 && ' ⚠️ This planogram has no layout — design it first.'}</p>
                    <div className="flex items-center gap-2">
                      <Input value={complianceImageUrl} onChange={e => setComplianceImageUrl(e.target.value)} placeholder="Enter shelf image URL..." className="flex-1" />
                      <Button variant="glow" disabled={template.layout.length === 0 || !complianceImageUrl.trim() || isDetecting} onClick={() => { runComplianceCheck(template, complianceImageUrl.trim()); setComplianceImageUrl(''); }}>
                        {isDetecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}{isDetecting ? 'Scanning...' : 'Run Scan'}
                      </Button>
                    </div>
                  </div>
                );
              })()}
              {scans.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Scan Results</h3>
                  {scans.map(scan => (
                    <div key={scan.id} className={cn("bg-card border rounded-xl p-4", getScoreBg(scan.compliance_score))}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("text-3xl font-bold", getScoreColor(scan.compliance_score))}>{scan.compliance_score}%</div>
                          <div><p className="text-sm font-medium text-foreground">Compliance Score</p><p className="text-xs text-muted-foreground">{format(new Date(scan.created_at), 'MMM d, yyyy HH:mm')}</p></div>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <div className="text-center"><p className="text-lg font-bold text-foreground">{scan.total_expected}</p><p className="text-muted-foreground">Expected</p></div>
                          <div className="text-center"><p className="text-lg font-bold text-green-400">{scan.total_found}</p><p className="text-muted-foreground">Found</p></div>
                          <div className="text-center"><p className="text-lg font-bold text-red-400">{scan.total_missing}</p><p className="text-muted-foreground">Missing</p></div>
                          <div className="text-center"><p className="text-lg font-bold text-yellow-400">{scan.total_extra}</p><p className="text-muted-foreground">Extra</p></div>
                        </div>
                      </div>
                      <Progress value={scan.compliance_score} className="h-2" />
                      {Array.isArray(scan.details) && scan.details.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <Table>
                            <TableHeader><TableRow><TableHead className="text-xs">Product</TableHead><TableHead className="text-xs text-center">Expected</TableHead><TableHead className="text-xs text-center">Actual</TableHead><TableHead className="text-xs text-center">Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {scan.details.map((d: any, i: number) => (
                                <TableRow key={i}>
                                  <TableCell className="text-xs">{d.skuName}</TableCell>
                                  <TableCell className="text-xs text-center">{d.expected}</TableCell>
                                  <TableCell className="text-xs text-center">{d.actual}</TableCell>
                                  <TableCell className="text-xs text-center">
                                    {d.status === 'compliant' ? <Badge variant="default" className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>
                                      : d.status === 'partial' ? <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Partial</Badge>
                                      : <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />Missing</Badge>}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ========== SCAN HISTORY TAB ========== */}
        <TabsContent value="scan-history" className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Scan History & Compliance Trends</h2>
          </div>

          {allScans.scans.length > 1 && (() => {
            const templateNames = new Map<string, string>();
            allScans.scans.forEach(s => { if (s.template?.name && !templateNames.has(s.template_id)) templateNames.set(s.template_id, s.template.name); });
            const sortedScans = [...allScans.scans].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const chartData = sortedScans.map(s => { const point: any = { date: format(new Date(s.created_at), 'MMM d HH:mm') }; point[s.template?.name || 'Unknown'] = s.compliance_score; return point; });
            const colors = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(48, 96%, 53%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)'];
            return (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Compliance Score Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    {Array.from(templateNames.entries()).map(([, name], idx) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={colors[idx % colors.length]} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {allScans.scans.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No scans yet</h3>
              <p className="text-muted-foreground">Run compliance scans from the Compliance tab to see history here.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Planogram</TableHead><TableHead className="text-center">Score</TableHead><TableHead className="text-center">Expected</TableHead>
                  <TableHead className="text-center">Found</TableHead><TableHead className="text-center">Missing</TableHead><TableHead className="text-center">Extra</TableHead><TableHead>Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {allScans.scans.map(scan => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium">{scan.template?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-center"><span className={cn("font-bold", getScoreColor(scan.compliance_score))}>{scan.compliance_score}%</span></TableCell>
                      <TableCell className="text-center">{scan.total_expected}</TableCell>
                      <TableCell className="text-center text-green-400">{scan.total_found}</TableCell>
                      <TableCell className="text-center text-red-400">{scan.total_missing}</TableCell>
                      <TableCell className="text-center text-yellow-400">{scan.total_extra}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(scan.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ========== CATEGORIES TAB ========== */}
        <TabsContent value="categories" className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search categories..." className="pl-9 bg-card border-border" value={categorySearch} onChange={e => setCategorySearch(e.target.value)} />
            </div>
            <Button variant="glow" onClick={() => { resetCatForm(); setIsCatModalOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Category</Button>
          </div>

          <p className="text-sm text-muted-foreground">{categories.length} categories • {categories.reduce((acc, c) => acc + c.productCount, 0)} total products</p>

          {categoriesLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category, index) => (
                <div key={category.id} className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-primary" /></div>
                      <div>
                        <h4 className="font-semibold text-foreground">{category.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{category.description || 'No description'}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCatEdit(category)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteCatId(category.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Package className="w-4 h-4" /><span>{category.productCount} products</span></div>
                    <span className="text-success">{category.trainedCount} trained</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: `${category.productCount > 0 ? (category.trainedCount / category.productCount) * 100 : 0}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{category.productCount > 0 ? `${Math.round((category.trainedCount / category.productCount) * 100)}% training complete` : 'No products yet'}</p>
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && <div className="col-span-full text-center py-12"><p className="text-muted-foreground">{categories.length === 0 ? 'No categories yet.' : 'No categories found.'}</p></div>}
            </div>
          )}

          <Dialog open={isCatModalOpen} onOpenChange={(open) => { setIsCatModalOpen(open); if (!open) resetCatForm(); }}>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle></DialogHeader>
              <form onSubmit={handleCatSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Category Name</Label><Input placeholder="e.g., Beverages" value={catFormData.name} onChange={e => setCatFormData({ ...catFormData, name: e.target.value })} className="bg-secondary border-border" required /></div>
                <div className="space-y-2"><Label>Description (Optional)</Label><Textarea placeholder="Brief description..." value={catFormData.description} onChange={e => setCatFormData({ ...catFormData, description: e.target.value })} className="bg-secondary border-border" /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setIsCatModalOpen(false); resetCatForm(); }}>Cancel</Button>
                  <Button type="submit" variant="glow" disabled={createCategory.isPending || updateCategory.isPending}>{(createCategory.isPending || updateCategory.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingCategory ? 'Save Changes' : 'Create Category'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <AlertDialog open={!!deleteCatId} onOpenChange={() => setDeleteCatId(null)}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Category</AlertDialogTitle><AlertDialogDescription>Products in this category will become uncategorized.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleCatDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ========== PRODUCTS TAB ========== */}
        <TabsContent value="products" className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-9 bg-card border-border" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Trained</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="glow" onClick={() => setIsAddProductOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Product</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{products.length}</p><p className="text-sm text-muted-foreground">Total Products</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-success">{products.filter(p => p.training_status === 'completed').length}</p><p className="text-sm text-muted-foreground">Trained</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-warning">{products.filter(p => p.training_status === 'training').length}</p><p className="text-sm text-muted-foreground">Training</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-muted-foreground">{products.filter(p => p.training_status === 'pending').length}</p><p className="text-sm text-muted-foreground">Pending</p></div>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product, index) => {
                  const status = statusConfig[product.training_status];
                  const StatusIcon = status.icon;
                  const imageUrl = product.sku_images?.[0]?.image_url;
                  const imageCount = product.sku_images?.length || 0;
                  return (
                    <div key={product.id} className="rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="aspect-square bg-secondary relative overflow-hidden">
                        {imageUrl ? <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><Package className="w-12 h-12 text-muted-foreground/50" /></div>}
                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleProductEdit(product)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteProductId(product.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs"><Image className="w-3 h-3" />{imageCount} images</div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div><h4 className="font-medium text-foreground truncate">{product.name}</h4><p className="text-sm text-muted-foreground">{product.product_categories?.name || 'Uncategorized'}</p></div>
                        {product.barcode && <p className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded inline-block">{product.barcode}</p>}
                        <div className="flex items-center pt-2"><span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", status.className)}><StatusIcon className="w-3 h-3" />{status.label}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredProducts.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">{products.length === 0 ? 'No products yet. Add your first product to get started.' : 'No products found matching your criteria.'}</p></div>}
            </>
          )}

          <AddProductModal open={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} />
          <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) setEditingProduct(null); }}>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
              <form onSubmit={handleProductEditSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Product Name</Label><Input value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="bg-secondary border-border" required /></div>
                <div className="space-y-2"><Label>Barcode</Label><Input value={editFormData.barcode} onChange={e => setEditFormData({ ...editFormData, barcode: e.target.value })} className="bg-secondary border-border font-mono" /></div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={editFormData.category_id} onValueChange={v => setEditFormData({ ...editFormData, category_id: v })}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                  <Button type="submit" variant="glow" disabled={updateProduct.isPending}>{updateProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Product</AlertDialogTitle><AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleProductDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ========== VERSION HISTORY TAB ========== */}
        <TabsContent value="versions" className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Version History</h2>
            <Select value={versionTemplateId || ''} onValueChange={setVersionTemplateId}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select planogram..." /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {!versionTemplateId ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a planogram</h3>
              <p className="text-muted-foreground">Choose a planogram to view its version history.</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No versions yet</h3>
              <p className="text-muted-foreground">Save the planogram designer to create the first version.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v, idx) => {
                const vProducts = v.layout.reduce((acc, r) => acc + r.products.length, 0);
                const vFacings = v.layout.reduce((acc, r) => acc + r.products.reduce((a, p) => a + p.facings, 0), 0);
                return (
                  <div key={v.id} className={cn("bg-card border rounded-xl p-4", idx === 0 ? "border-primary/30" : "border-border")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm", idx === 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>v{v.version_number}</div>
                        <div>
                          <div className="flex items-center gap-2"><span className="font-medium text-foreground">Version {v.version_number}</span>{idx === 0 && <Badge variant="default" className="text-[10px]">Current</Badge>}</div>
                          <p className="text-xs text-muted-foreground">{format(new Date(v.created_at), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{v.layout.length} shelves</span><span>{vProducts} products</span><span>{vFacings} facings</span>
                        {idx > 0 && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => restoreVersion(v)}><RotateCcw className="w-3 h-3 mr-1" />Restore</Button>}
                      </div>
                    </div>
                    {v.change_notes && <p className="text-xs text-muted-foreground mt-2 pl-[52px]">📝 {v.change_notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
