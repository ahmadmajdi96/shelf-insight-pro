import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LayoutGrid, Plus, Minus, Package, Store, Trash2,
  GripVertical, Save, RotateCcw, Search, Filter,
  Pencil, HelpCircle, Ruler, Copy, Eye, History,
  CheckCircle2, XCircle, AlertTriangle, BarChart3,
  FileText, Clock, ArrowLeft, Upload, Loader2, TrendingUp,
  FolderOpen, MoreVertical, Image, Building2, Pause, Play,
  MapPin, Shield
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
import { useAdmins, type Admin } from '@/hooks/useAdmins';

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
  const [searchParams] = useSearchParams();
  const { isAdmin, isOwner, tenantId, adminId } = useAuth();
  const { stores, createStore, updateStore, deleteStore } = useStores();
  const { tenants, isLoading: tenantsLoading, createTenant, updateTenant, suspendTenant, deleteTenant } = useTenants();
  const { products, isLoading: productsLoading, deleteProduct, updateProduct } = useProducts();
  const { categories, isLoading: categoriesLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { templates, createTemplate, updateTemplate, duplicateTemplate, deleteTemplate } = usePlanogramTemplates();
  
  const { shelves } = useShelves();
  const { admins, isLoading: adminsLoading, createAdmin, updateAdmin, deleteAdmin, suspendAdmin } = useAdmins();
  const { toast } = useToast();
  const { detectWithRoboflow, isDetecting } = useRoboflowDetection();
  const [complianceImageUrl, setComplianceImageUrl] = useState('');

  // Support ?tab= query param
  const tabFromUrl = searchParams.get('tab');
  const defaultTab = isOwner ? 'admins' : 'tenants';
  const [activeTab, setActiveTab] = useState(tabFromUrl || defaultTab);

  useEffect(() => {
    const validTabs = isOwner 
      ? ['admins', 'tenants', 'stores', 'planograms', 'categories', 'products']
      : ['tenants', 'stores', 'planograms', 'categories', 'products'];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (tabFromUrl === 'admins' && !isOwner) {
      setActiveTab('tenants');
    }
  }, [tabFromUrl, isOwner]);

  // Search states for each tab
  const [tenantSearch, setTenantSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [storeTenantFilter, setStoreTenantFilter] = useState('all');
  const [storeAdminFilter, setStoreAdminFilter] = useState('all');
  const [storeStatusFilter, setStoreStatusFilter] = useState('all');
  const [planogramSearch, setPlanogramSearch] = useState('');
  const [planogramStatusFilter, setPlanogramStatusFilter] = useState('all');
  const [planogramAdminFilter, setPlanogramAdminFilter] = useState('all');
  const [planogramTenantFilter, setPlanogramTenantFilter] = useState('all');
  const [planogramStoreFilter, setPlanogramStoreFilter] = useState('all');
  const [complianceSearch, setComplianceSearch] = useState('');
  const [scanHistorySearch, setScanHistorySearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [versionSearch, setVersionSearch] = useState('');

  // Admin filters
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');

  // Tenant filters
  const [tenantAdminFilter, setTenantAdminFilter] = useState('all');
  const [tenantStatusFilter, setTenantStatusFilter] = useState('all');

  // Tenant state
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenantObj, setEditingTenantObj] = useState<any | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set());
  const [tenantFormData, setTenantFormData] = useState({ name: '', username: '', password: '', max_skus: 50, max_images_per_month: 1000, admin_id: '' });

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
  const [templateTenantId, setTemplateTenantId] = useState('');
  const [templateStatus, setTemplateStatus] = useState('draft');
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Designer state
  const [designerTemplateId, setDesignerTemplateId] = useState<string | null>(null);
  const [rows, setRows] = useState<PlanogramRow[]>([]);
  const [dragProduct, setDragProduct] = useState<{ skuId: string | null; name: string } | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [shelfWidths, setShelfWidths] = useState<Record<string, { value: string; unit: 'cm' | 'm' }>>({});
  const [designerCategoryFilter, setDesignerCategoryFilter] = useState('all');

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
  const [catFormData, setCatFormData] = useState({ name: '', description: '', tenant_id: '' });

  // Products state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', barcode: '', category_id: '', width_cm: '' });

  // Admin state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdminObj, setEditingAdminObj] = useState<Admin | null>(null);
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null);
  const [adminFormData, setAdminFormData] = useState({ full_name: '', email: '', phone: '', password: '', monthly_limit: 10000 });

  // Helper: get tenant IDs for an admin
  const getTenantIdsForAdmin = (adminId: string) => tenants.filter((t: any) => t.admin_id === adminId).map(t => t.id);

  // ---- Tenant logic ----
  const filteredTenants = useMemo(() => {
    return scopedTenants.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(tenantSearch.toLowerCase());
      const matchesAdmin = tenantAdminFilter === 'all' || (t as any).admin_id === tenantAdminFilter;
      const matchesStatus = tenantStatusFilter === 'all' || (tenantStatusFilter === 'active' ? t.is_active : !t.is_active);
      return matchesSearch && matchesAdmin && matchesStatus;
    });
  }, [scopedTenants, tenantSearch, tenantAdminFilter, tenantStatusFilter]);

  const getStoresForTenant = (tid: string) => stores.filter(s => s.tenant_id === tid);
  const toggleTenant = (tid: string) => {
    setExpandedTenants(prev => {
      const next = new Set(prev);
      if (next.has(tid)) next.delete(tid); else next.add(tid);
      return next;
    });
  };
  const toggleStore = (sid: string) => {
    setExpandedStores(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };
  const toggleCategory = (cid: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid); else next.add(cid);
      return next;
    });
  };
  const toggleAdmin = (aid: string) => {
    setExpandedAdmins(prev => {
      const next = new Set(prev);
      if (next.has(aid)) next.delete(aid); else next.add(aid);
      return next;
    });
  };
  const getTenantsForAdmin = (adminId: string) => tenants.filter((t: any) => t.admin_id === adminId);
  const handleAddTenantForAdmin = (adminId: string) => {
    resetTenantForm();
    setTenantFormData(prev => ({ ...prev, admin_id: adminId }));
    setEditingTenantObj(null);
    setIsTenantModalOpen(true);
  };
  const resetTenantForm = () => { setTenantFormData({ name: '', username: '', password: '', max_skus: 50, max_images_per_month: 1000, admin_id: '' }); setEditingTenantObj(null); };
  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { admin_id, ...rest } = tenantFormData;
    const payload = { ...rest, admin_id: admin_id || null };
    if (editingTenantObj) await updateTenant.mutateAsync({ id: editingTenantObj.id, ...payload });
    else await createTenant.mutateAsync(payload);
    resetTenantForm(); setIsTenantModalOpen(false);
  };
  const handleTenantEdit = (tenant: any) => {
    setTenantFormData({ name: tenant.name, username: tenant.username || '', password: tenant.password || '', max_skus: tenant.max_skus, max_images_per_month: tenant.max_images_per_month, admin_id: tenant.admin_id || '' });
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

  // Filtered stores with admin, tenant, status
  const filteredStores = useMemo(() => {
    return scopedStores.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(storeSearch.toLowerCase()) || (s.city || '').toLowerCase().includes(storeSearch.toLowerCase());
      const matchesTenant = storeTenantFilter === 'all' || s.tenant_id === storeTenantFilter;
      const matchesAdmin = storeAdminFilter === 'all' || getTenantIdsForAdmin(storeAdminFilter).includes(s.tenant_id);
      const tenant = scopedTenants.find(t => t.id === s.tenant_id);
      const matchesStatus = storeStatusFilter === 'all' || (storeStatusFilter === 'active' ? tenant?.is_active : !tenant?.is_active);
      return matchesSearch && matchesTenant && matchesAdmin && matchesStatus;
    });
  }, [stores, storeSearch, storeTenantFilter, storeAdminFilter, storeStatusFilter, tenants, admins]);

  // ---- Planogram CRUD ----
  const openNewTemplate = (presetStoreId?: string, presetTenantId?: string) => { setEditingTemplate(null); setTemplateName(''); setTemplateDesc(''); setTemplateStoreId(presetStoreId || ''); setTemplateTenantId(presetTenantId || tenantId || (tenants.length > 0 ? tenants[0].id : '')); setTemplateStatus('draft'); setShowTemplateDialog(true); };
  const openEditTemplate = (t: PlanogramTemplate) => { setEditingTemplate(t); setTemplateName(t.name); setTemplateDesc(t.description || ''); setTemplateStoreId(t.store_id || ''); setTemplateTenantId(t.tenant_id || ''); setTemplateStatus(t.status); setShowTemplateDialog(true); };
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    const selectedTenant = templateTenantId || tenantId;
    if (!selectedTenant) { toast({ title: 'Tenant required', description: 'Please select a tenant for this planogram.', variant: 'destructive' }); return; }
    if (editingTemplate) await updateTemplate.mutateAsync({ id: editingTemplate.id, name: templateName, description: templateDesc || undefined, store_id: templateStoreId || undefined, status: templateStatus });
    else await createTemplate.mutateAsync({ name: templateName, description: templateDesc || undefined, store_id: templateStoreId || undefined, status: templateStatus, layout: [], tenantIdOverride: selectedTenant });
    setShowTemplateDialog(false);
  };
  const handleDeleteTemplate = async () => { if (deleteTemplateId) { await deleteTemplate.mutateAsync(deleteTemplateId); setDeleteTemplateId(null); } };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(planogramSearch.toLowerCase());
      const matchesStatus = planogramStatusFilter === 'all' || t.status === planogramStatusFilter;
      const matchesTenant = planogramTenantFilter === 'all' || t.tenant_id === planogramTenantFilter;
      const matchesAdmin = planogramAdminFilter === 'all' || getTenantIdsForAdmin(planogramAdminFilter).includes(t.tenant_id);
      const matchesStore = planogramStoreFilter === 'all' || t.store_id === planogramStoreFilter;
      return matchesSearch && matchesStatus && matchesTenant && matchesAdmin && matchesStore;
    });
  }, [templates, planogramSearch, planogramStatusFilter, planogramTenantFilter, planogramAdminFilter, planogramStoreFilter, tenants, admins]);

  // ---- Designer ----
  const designerTemplate = templates.find(t => t.id === designerTemplateId);
  const normalizeRows = (layout: any[]): PlanogramRow[] => (layout || []).map(r => ({ ...r, products: (r.products || []).map((p: any) => ({ instanceId: p.instanceId || crypto.randomUUID(), skuId: p.skuId ?? null, name: p.name || 'Unknown', facings: p.facings ?? 1 })) }));
  const openDesigner = (t: PlanogramTemplate) => {
    setDesignerTemplateId(t.id); setRows(normalizeRows(t.layout)); setChangeNotes('');
    const widths: Record<string, { value: string; unit: 'cm' | 'm' }> = {};
    (t.layout || []).forEach(r => { if ((r as any).widthCm) widths[r.id] = { value: String((r as any).widthCm), unit: 'cm' }; });
    setShelfWidths(widths);
  };

  const availableProducts = useMemo(() => {
    const templateTenant = designerTemplate?.tenant_id;
    return products
      .filter(p => {
        if (templateTenant && p.tenant_id !== templateTenant) return false;
        if (designerCategoryFilter !== 'all' && p.category_id !== designerCategoryFilter) return false;
        return true;
      })
      .map(p => ({ skuId: p.id, name: p.name, widthCm: p.width_cm, expectedFacings: 1 }));
  }, [products, designerTemplate, designerCategoryFilter]);
  const addRow = () => { const newId = crypto.randomUUID(); setRows(prev => [...prev, { id: newId, label: `Shelf ${prev.length + 1}`, products: [] }]); };
  const removeRow = (rowId: string) => setRows(prev => prev.filter(r => r.id !== rowId));
  const updateRowLabel = (rowId: string, label: string) => setRows(prev => prev.map(r => r.id === rowId ? { ...r, label } : r));
  const addProductToRow = (rowId: string, skuId: string | null, name: string) => { setRows(prev => prev.map(r => r.id !== rowId ? r : { ...r, products: [...r.products, { instanceId: crypto.randomUUID(), skuId, name, facings: 1 }] })); };
  const removeProductFromRow = (rowId: string, instanceId: string) => { setRows(prev => prev.map(r => r.id !== rowId ? r : { ...r, products: r.products.filter(p => p.instanceId !== instanceId) })); };
  const updateProductFacings = (rowId: string, instanceId: string, facings: number) => { setRows(prev => prev.map(r => r.id !== rowId ? r : { ...r, products: r.products.map(p => p.instanceId === instanceId ? { ...p, facings: Math.max(1, facings) } : p) })); };
  const handleDragStart = (skuId: string | null, name: string) => setDragProduct({ skuId, name });
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDrop = (e: React.DragEvent, rowId: string) => { e.preventDefault(); e.stopPropagation(); if (dragProduct) { addProductToRow(rowId, dragProduct.skuId, dragProduct.name); setDragProduct(null); } };
  const updateShelfWidth = (rowId: string, value: string, unit: 'cm' | 'm') => { setShelfWidths(prev => ({ ...prev, [rowId]: { value, unit } })); };
  const getShelfWidthCm = (rowId: string): number | null => { const w = shelfWidths[rowId]; if (!w || !w.value) return null; const num = parseFloat(w.value); if (isNaN(num) || num <= 0) return null; return w.unit === 'm' ? num * 100 : num; };
  const formatWidth = (cm: number | null) => { if (!cm) return null; return cm >= 100 ? `${(cm / 100).toFixed(2)}m` : `${cm}cm`; };
  const handleSaveDesigner = async () => {
    if (!designerTemplateId) return;
    const enrichedRows = rows.map(r => ({ ...r, widthCm: getShelfWidthCm(r.id) }));
    await updateTemplate.mutateAsync({ id: designerTemplateId, layout: enrichedRows as any, changeNotes: changeNotes || undefined });
    setChangeNotes('');
  };
  const totalProducts = rows.reduce((acc, r) => acc + (r.products || []).length, 0);
  const totalFacings = rows.reduce((acc, r) => acc + (r.products || []).reduce((a, p) => a + p.facings, 0), 0);

  // ---- Compliance ----
  const runComplianceCheck = async (template: PlanogramTemplate, shelfImageUrl: string, shelfImageId?: string) => {
    const layout = normalizeRows(template.layout);
    const expectedProducts = new Map<string, { name: string; count: number }>();
    layout.forEach(row => { (row.products || []).forEach(p => { if (p.skuId) { const existing = expectedProducts.get(p.skuId); expectedProducts.set(p.skuId, { name: p.name, count: (existing?.count || 0) + p.facings }); } }); });
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
  const restoreVersion = async (version: { layout: any[]; version_number: number }) => {
    if (!versionTemplateId) return;
    await updateTemplate.mutateAsync({ id: versionTemplateId, layout: version.layout, changeNotes: `Restored from version ${version.version_number}` });
    toast({ title: 'Version restored', description: `Layout reverted to version ${version.version_number}.` });
  };

  const getScoreColor = (score: number) => score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const getScoreBg = (score: number) => score >= 80 ? 'bg-green-500/10 border-green-500/20' : score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

  // ---- Categories logic ----
  const resetCatForm = () => { setCatFormData({ name: '', description: '', tenant_id: '' }); setEditingCategory(null); };
  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const catTenantId = catFormData.tenant_id || tenantId;
    if (!catTenantId && !editingCategory) { toast({ title: 'Tenant required', description: 'Please select a tenant for this category.', variant: 'destructive' }); return; }
    if (editingCategory) await updateCategory.mutateAsync({ id: editingCategory.id, name: catFormData.name, description: catFormData.description || null });
    else await createCategory.mutateAsync({ name: catFormData.name, description: catFormData.description || null, tenant_id: catTenantId });
    resetCatForm(); setIsCatModalOpen(false);
  };
  const handleCatEdit = (cat: any) => { setCatFormData({ name: cat.name, description: cat.description || '', tenant_id: cat.tenant_id || '' }); setEditingCategory(cat); setIsCatModalOpen(true); };
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
  const handleProductEdit = (product: any) => { setEditFormData({ name: product.name, description: product.description || '', barcode: product.barcode || '', category_id: product.category_id || '', width_cm: product.width_cm ? String(product.width_cm) : '' }); setEditingProduct(product); };
  const handleProductEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) { await updateProduct.mutateAsync({ id: editingProduct.id, name: editFormData.name, description: editFormData.description || null, barcode: editFormData.barcode || null, category_id: editFormData.category_id || null, width_cm: editFormData.width_cm ? parseFloat(editFormData.width_cm) : null }); setEditingProduct(null); }
  };

  // Admin handlers
  const filteredAdmins = useMemo(() => {
    return admins.filter(a => {
      const matchesSearch = a.full_name.toLowerCase().includes(adminSearch.toLowerCase()) || a.email.toLowerCase().includes(adminSearch.toLowerCase());
      const matchesStatus = adminStatusFilter === 'all' || (adminStatusFilter === 'active' ? a.is_active : !a.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [admins, adminSearch, adminStatusFilter]);

  const resetAdminForm = () => { setAdminFormData({ full_name: '', email: '', phone: '', password: '', monthly_limit: 10000 }); setEditingAdminObj(null); };
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdminObj) {
      const updates: any = { full_name: adminFormData.full_name, email: adminFormData.email, phone: adminFormData.phone || null, monthly_limit: adminFormData.monthly_limit };
      if (adminFormData.password) updates.password = adminFormData.password;
      await updateAdmin.mutateAsync({ id: editingAdminObj.id, ...updates });
    } else {
      await createAdmin.mutateAsync({ full_name: adminFormData.full_name, email: adminFormData.email, phone: adminFormData.phone || null, password: adminFormData.password, monthly_limit: adminFormData.monthly_limit, is_active: true });
    }
    resetAdminForm(); setIsAdminModalOpen(false);
  };
  const handleAdminEdit = (admin: Admin) => {
    setAdminFormData({ full_name: admin.full_name, email: admin.email, phone: admin.phone || '', password: '', monthly_limit: admin.monthly_limit });
    setEditingAdminObj(admin); setIsAdminModalOpen(true);
  };
  const handleAdminDelete = async () => { if (deleteAdminId) { await deleteAdmin.mutateAsync(deleteAdminId); setDeleteAdminId(null); } };

  const allTabItems = [
    { value: 'admins', label: 'Admins', icon: Shield, ownerOnly: true },
    { value: 'tenants', label: 'Tenants', icon: Building2, ownerOnly: false },
    { value: 'stores', label: 'Stores', icon: Store, ownerOnly: false },
    { value: 'planograms', label: 'Planograms', icon: LayoutGrid, ownerOnly: false },
    { value: 'categories', label: 'Categories', icon: FolderOpen, ownerOnly: false },
    { value: 'products', label: 'Products', icon: Package, ownerOnly: false },
  ];
  const tabItems = isOwner ? allTabItems : allTabItems.filter(t => !t.ownerOnly);

  // For admin role users, filter data to their admin_id
  const scopedTenants = useMemo(() => {
    if (isOwner) return tenants;
    if (adminId) return tenants.filter((t: any) => t.admin_id === adminId);
    return tenants;
  }, [tenants, isOwner, adminId]);

  const scopedTenantIds = useMemo(() => new Set(scopedTenants.map(t => t.id)), [scopedTenants]);

  const scopedStores = useMemo(() => {
    if (isOwner) return stores;
    return stores.filter(s => scopedTenantIds.has(s.tenant_id));
  }, [stores, isOwner, scopedTenantIds]);

  const scopedProducts = useMemo(() => {
    if (isOwner) return products;
    return products.filter(p => scopedTenantIds.has(p.tenant_id));
  }, [products, isOwner, scopedTenantIds]);

  const scopedCategories = useMemo(() => {
    if (isOwner) return categories;
    return categories.filter((c: any) => scopedTenantIds.has(c.tenant_id));
  }, [categories, isOwner, scopedTenantIds]);

  const scopedTemplates = useMemo(() => {
    if (isOwner) return templates;
    return templates.filter(t => scopedTenantIds.has(t.tenant_id));
  }, [templates, isOwner, scopedTenantIds]);


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

        {/* ========== ADMINS TAB ========== */}
        <TabsContent value="admins" className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search admins..." className="pl-9 bg-card border-border" value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
            </div>
            <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
              <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="glow" onClick={() => { resetAdminForm(); setIsAdminModalOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Admin</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{admins.length}</p><p className="text-sm text-muted-foreground">Total Admins</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-success">{admins.filter(a => a.is_active).length}</p><p className="text-sm text-muted-foreground">Active</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-primary">{admins.reduce((acc, a) => acc + a.monthly_limit, 0).toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Monthly Limit</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{tenants.length}</p><p className="text-sm text-muted-foreground">Tenants Managed</p></div>
          </div>

          {adminsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
               {filteredAdmins.map((admin, index) => {
                const adminTenantsList = getTenantsForAdmin(admin.id);
                const usedLimit = adminTenantsList.reduce((acc, t) => acc + t.max_images_per_month, 0);
                const usagePercent = admin.monthly_limit > 0 ? (usedLimit / admin.monthly_limit) * 100 : 0;
                const isExpanded = expandedAdmins.has(admin.id);
                return (
                  <div key={admin.id} className={cn("rounded-xl bg-card border border-border transition-all duration-300 animate-fade-in", !admin.is_active && "opacity-60")} style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                          <div>
                            <h4 className="font-semibold text-foreground">{admin.full_name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{admin.email}</span>
                              {admin.phone && <span className="text-xs text-muted-foreground">· {admin.phone}</span>}
                              <Badge variant={admin.is_active ? 'default' : 'secondary'} className="text-xs">{admin.is_active ? 'Active' : 'Inactive'}</Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAdminEdit(admin)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddTenantForAdmin(admin.id)}><Plus className="w-4 h-4 mr-2" />Add Tenant</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => suspendAdmin.mutate({ id: admin.id, suspend: admin.is_active })}>
                              {admin.is_active ? <><Pause className="w-4 h-4 mr-2" />Suspend</> : <><Play className="w-4 h-4 mr-2" />Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteAdminId(admin.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Monthly Limit</span><span className="text-foreground font-medium">{admin.monthly_limit.toLocaleString()} images</span></div></div>
                        <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Allocated to Tenants</span><span className="text-foreground font-medium">{usedLimit.toLocaleString()} / {admin.monthly_limit.toLocaleString()}</span></div>
                          <Progress value={Math.min(usagePercent, 100)} className={cn("h-2", usagePercent >= 90 && "[&>div]:bg-destructive", usagePercent >= 80 && usagePercent < 90 && "[&>div]:bg-warning")} /></div>
                      </div>
                    </div>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleAdmin(admin.id)}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full px-5 py-3 border-t border-border flex items-center justify-between text-sm hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" />{adminTenantsList.length} Tenant{adminTenantsList.length !== 1 ? 's' : ''}</span>
                          <span className="text-xs text-muted-foreground">{isExpanded ? 'Collapse' : 'Expand'}</span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-5 pb-4 space-y-2">
                          {adminTenantsList.map(tenant => {
                            const imgPct = tenant.max_images_per_month > 0 ? (tenant.processed_images_this_month / tenant.max_images_per_month) * 100 : 0;
                            return (
                              <div key={tenant.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{tenant.name}</p>
                                    <p className="text-xs text-muted-foreground">{tenant.skuCount} SKUs · {tenant.processed_images_this_month.toLocaleString()} / {tenant.max_images_per_month.toLocaleString()} images</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={tenant.is_active ? 'default' : 'secondary'} className="text-[10px]">{tenant.is_active ? 'Active' : 'Suspended'}</Badge>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTenantEdit(tenant)}><Pencil className="w-3 h-3" /></Button>
                                </div>
                              </div>
                            );
                          })}
                          {adminTenantsList.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No tenants assigned</p>}
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddTenantForAdmin(admin.id)}><Plus className="w-3 h-3 mr-2" />Add Tenant</Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
              {filteredAdmins.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">{admins.length === 0 ? 'No admins yet. Create your first admin to get started.' : 'No admins found matching your search.'}</p></div>}
            </div>
          )}

          <Dialog open={isAdminModalOpen} onOpenChange={(open) => { setIsAdminModalOpen(open); if (!open) resetAdminForm(); }}>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />{editingAdminObj ? 'Edit Admin' : 'Add New Admin'}</DialogTitle></DialogHeader>
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Full Name</Label><Input placeholder="e.g., John Doe" className="bg-secondary border-border" value={adminFormData.full_name} onChange={e => setAdminFormData({ ...adminFormData, full_name: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="admin@example.com" className="bg-secondary border-border" value={adminFormData.email} onChange={e => setAdminFormData({ ...adminFormData, email: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input placeholder="+1234567890" className="bg-secondary border-border" value={adminFormData.phone} onChange={e => setAdminFormData({ ...adminFormData, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{editingAdminObj ? 'New Password (leave blank to keep)' : 'Password'}</Label><Input type="password" placeholder="••••••••" className="bg-secondary border-border" value={adminFormData.password} onChange={e => setAdminFormData({ ...adminFormData, password: e.target.value })} required={!editingAdminObj} /></div>
                  <div className="space-y-2"><Label>Monthly Image Limit</Label><Input type="number" className="bg-secondary border-border" value={adminFormData.monthly_limit} onChange={e => setAdminFormData({ ...adminFormData, monthly_limit: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setIsAdminModalOpen(false); resetAdminForm(); }}>Cancel</Button>
                  <Button type="submit" variant="glow" disabled={createAdmin.isPending || updateAdmin.isPending}>{(createAdmin.isPending || updateAdmin.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingAdminObj ? 'Save Changes' : 'Create Admin'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <AlertDialog open={!!deleteAdminId} onOpenChange={() => setDeleteAdminId(null)}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Admin</AlertDialogTitle><AlertDialogDescription>This will permanently delete the admin. Tenants will remain but become unassigned.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleAdminDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ========== TENANTS TAB ========== */}
        <TabsContent value="tenants" className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search tenants..." className="pl-9 bg-card border-border" value={tenantSearch} onChange={e => setTenantSearch(e.target.value)} />
            </div>
            <Select value={tenantAdminFilter} onValueChange={setTenantAdminFilter}>
              <SelectTrigger className="w-[180px] bg-card border-border"><Shield className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Admins" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tenantStatusFilter} onValueChange={setTenantStatusFilter}>
              <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="glow" onClick={() => { resetTenantForm(); setIsTenantModalOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Tenant</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{filteredTenants.length}</p><p className="text-sm text-muted-foreground">Tenants</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-success">{filteredTenants.filter(t => t.is_active).length}</p><p className="text-sm text-muted-foreground">Active</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{filteredTenants.reduce((acc, t) => acc + t.skuCount, 0)}</p><p className="text-sm text-muted-foreground">Total SKUs</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-primary">{filteredTenants.reduce((acc, t) => acc + t.processed_images_this_month, 0).toLocaleString()}</p><p className="text-sm text-muted-foreground">Images This Month</p></div>
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
                const adminName = admins.find(a => a.id === (tenant as any).admin_id)?.full_name;
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
                              {adminName && <span className="text-xs text-muted-foreground">· Admin: {adminName}</span>}
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
                            <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { setStoreTenantFilter(tenant.id); setActiveTab('stores'); }}>
                              <div className="flex items-center gap-3">
                                <Store className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground text-sm">{store.name}</p>
                                  <p className="text-xs text-muted-foreground">{store.city || 'Unknown'}{store.country ? `, ${store.country}` : ''}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px]">{templates.filter(t => t.store_id === store.id).length} planograms</Badge>
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
              {filteredTenants.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">{tenants.length === 0 ? 'No tenants yet. Create your first tenant to get started.' : 'No tenants found matching your filters.'}</p></div>}
            </div>
          )}

          {/* Tenant Modal */}
          <Dialog open={isTenantModalOpen} onOpenChange={(open) => { setIsTenantModalOpen(open); if (!open) resetTenantForm(); }}>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />{editingTenantObj ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle></DialogHeader>
              <form onSubmit={handleTenantSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Tenant Name</Label><Input placeholder="e.g., Acme Corporation" className="bg-secondary border-border" value={tenantFormData.name} onChange={e => setTenantFormData({ ...tenantFormData, name: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Assign to Admin</Label>
                  <Select value={tenantFormData.admin_id} onValueChange={v => setTenantFormData({ ...tenantFormData, admin_id: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select admin..." /></SelectTrigger>
                    <SelectContent>
                      {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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

        </TabsContent>

        {/* ========== STORES TAB ========== */}
        <TabsContent value="stores" className="space-y-4 animate-fade-in">
           <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search stores by name or city..." className="pl-9 bg-card border-border" value={storeSearch} onChange={e => setStoreSearch(e.target.value)} />
            </div>
            <Select value={storeAdminFilter} onValueChange={setStoreAdminFilter}>
              <SelectTrigger className="w-[180px] bg-card border-border"><Shield className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Admins" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={storeTenantFilter} onValueChange={setStoreTenantFilter}>
              <SelectTrigger className="w-[180px] bg-card border-border"><Building2 className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Tenants" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={storeStatusFilter} onValueChange={setStoreStatusFilter}>
              <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="glow" onClick={() => { setStoreTenantId(''); setStoreFormData({ name: '', address: '', city: '', country: '' }); setEditingStoreObj(null); setIsStoreModalOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Store</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{filteredStores.length}</p><p className="text-sm text-muted-foreground">Total Stores</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-primary">{filteredStores.reduce((a, s) => a + s.detectionCount, 0)}</p><p className="text-sm text-muted-foreground">Total Detections</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{templates.filter(t => filteredStores.some(s => s.id === t.store_id)).length}</p><p className="text-sm text-muted-foreground">Planograms</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-success">{filteredStores.length > 0 ? Math.round(filteredStores.reduce((a, s) => a + s.avgShareOfShelf, 0) / filteredStores.length) : 0}%</p><p className="text-sm text-muted-foreground">Avg. Share of Shelf</p></div>
          </div>

          <div className="space-y-4">
            {filteredStores.map((store, index) => {
              const storePlanograms = templates.filter(t => t.store_id === store.id);
              const isExpanded = expandedStores.has(store.id);
              const tenantName = tenants.find(t => t.id === store.tenant_id)?.name;
              return (
                <div key={store.id} className="rounded-xl bg-card border border-border transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Store className="w-5 h-5 text-primary" /></div>
                        <div>
                          <h4 className="font-semibold text-foreground">{store.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{store.city || 'Unknown'}{store.country ? `, ${store.country}` : ''}</span>
                            {tenantName && <Badge variant="secondary" className="text-xs">{tenantName}</Badge>}
                          </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Detections</span><span className="text-foreground font-medium">{store.detectionCount}</span></div></div>
                      <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Avg. Share of Shelf</span><span className="text-foreground font-medium">{store.avgShareOfShelf}%</span></div></div>
                      <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Last Scan</span><span className="text-foreground font-medium">{store.lastDetection ? formatDistanceToNow(new Date(store.lastDetection), { addSuffix: true }) : 'Never'}</span></div></div>
                    </div>
                  </div>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleStore(store.id)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full px-5 py-3 border-t border-border flex items-center justify-between text-sm hover:bg-muted/30 transition-colors">
                        <span className="text-muted-foreground flex items-center gap-2"><LayoutGrid className="w-4 h-4" />{storePlanograms.length} Planogram{storePlanograms.length !== 1 ? 's' : ''}</span>
                        <span className="text-xs text-muted-foreground">{isExpanded ? 'Collapse' : 'Expand'}</span>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 pb-4 space-y-2">
                        {storePlanograms.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { openDesigner(p); setActiveTab('planograms'); }}>
                            <div className="flex items-center gap-3">
                              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-foreground text-sm">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.layout.length} shelves · {p.status}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {p.latest_compliance !== null && <span className={cn("text-xs font-medium", getScoreColor(p.latest_compliance!))}>{p.latest_compliance}%</span>}
                              <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{p.status}</Badge>
                            </div>
                          </div>
                        ))}
                        {storePlanograms.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No planograms yet</p>}
                        <Button variant="outline" size="sm" className="w-full" onClick={() => openNewTemplate(store.id, store.tenant_id)}><Plus className="w-3 h-3 mr-2" />Add Planogram</Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
            {filteredStores.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">No stores found.</p></div>}
          </div>
        </TabsContent>

        {/* ========== PLANOGRAMS TAB ========== */}
        <TabsContent value="planograms" className="space-y-4 animate-fade-in">
          {!designerTemplateId ? (
            <>
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search planograms..." className="pl-9 bg-card border-border" value={planogramSearch} onChange={e => setPlanogramSearch(e.target.value)} />
                </div>
                <Select value={planogramAdminFilter} onValueChange={setPlanogramAdminFilter}>
                  <SelectTrigger className="w-[160px] bg-card border-border"><Shield className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Admins" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Admins</SelectItem>
                    {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={planogramTenantFilter} onValueChange={setPlanogramTenantFilter}>
                  <SelectTrigger className="w-[160px] bg-card border-border"><Building2 className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Tenants" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={planogramStoreFilter} onValueChange={setPlanogramStoreFilter}>
                  <SelectTrigger className="w-[160px] bg-card border-border"><Store className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Stores" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={planogramStatusFilter} onValueChange={setPlanogramStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="glow" onClick={() => openNewTemplate()}><Plus className="w-4 h-4 mr-2" />New Planogram</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                    <div><p className="text-2xl font-bold text-foreground">{filteredTemplates.length}</p><p className="text-sm text-muted-foreground">Planograms</p></div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-400" /></div>
                    <div><p className="text-2xl font-bold text-foreground">{filteredTemplates.filter(t => t.status === 'active').length}</p><p className="text-sm text-muted-foreground">Active</p></div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-yellow-400" /></div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {filteredTemplates.filter(t => t.latest_compliance !== null).length > 0
                          ? `${Math.round(filteredTemplates.filter(t => t.latest_compliance !== null).reduce((a, t) => a + (t.latest_compliance || 0), 0) / filteredTemplates.filter(t => t.latest_compliance !== null).length)}%`
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
                  {templates.length === 0 && <Button variant="glow" onClick={() => openNewTemplate()}><Plus className="w-4 h-4 mr-2" />Create Planogram</Button>}
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
                    <Select value={designerCategoryFilter} onValueChange={setDesignerCategoryFilter}>
                      <SelectTrigger className="mb-3 text-xs h-8"><SelectValue placeholder="Filter by category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.filter(c => !designerTemplate?.tenant_id || c.tenant_id === designerTemplate.tenant_id).map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1.5 pr-2">
                        <div draggable onDragStart={() => handleDragStart(null, 'Unregistered Item')} className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 cursor-grab active:cursor-grabbing hover:border-destructive/50 transition-colors">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" /><HelpCircle className="w-3.5 h-3.5 text-destructive/70" /><span className="text-sm text-foreground truncate flex-1">Unregistered Item</span>
                        </div>
                        {availableProducts.map(product => (
                          <div key={product.skuId} draggable onDragStart={() => handleDragStart(product.skuId, product.name)} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/50 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" /><span className="text-sm text-foreground truncate flex-1">{product.name}</span>
                            {product.widthCm && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{product.widthCm}cm</span>}
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
                  <ScrollArea className="h-[600px]">
                  {rows.length === 0 ? (
                    <div className="bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center py-24">
                      <LayoutGrid className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-1">No shelves yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">Click "Add Shelf" then drag products to design your planogram.</p>
                      <Button variant="glow" onClick={addRow}><Plus className="w-4 h-4 mr-1" />Add First Shelf</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rows.map((row, rowIndex) => {
                        const widthCm = getShelfWidthCm(row.id);
                        const rowWidthUsed = row.products.reduce((acc, p) => {
                          const prod = products.find(pr => pr.id === p.skuId);
                          return acc + (prod?.width_cm || 0) * p.facings;
                        }, 0);
                        const fillPercent = widthCm ? Math.min((rowWidthUsed / widthCm) * 100, 100) : null;
                        return (
                          <div key={row.id} className="bg-card border border-border rounded-xl p-4" onDragOver={handleDragOver} onDrop={e => handleDrop(e, row.id)}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1">
                                <Input value={row.label} onChange={e => updateRowLabel(row.id, e.target.value)} className="h-7 text-xs font-medium w-32 bg-secondary border-border" />
                                <div className="flex items-center gap-1">
                                  <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                                  <Input placeholder="Width" value={shelfWidths[row.id]?.value || ''} onChange={e => updateShelfWidth(row.id, e.target.value, shelfWidths[row.id]?.unit || 'cm')} className="h-7 w-16 text-xs bg-secondary border-border" />
                                  <Select value={shelfWidths[row.id]?.unit || 'cm'} onValueChange={v => updateShelfWidth(row.id, shelfWidths[row.id]?.value || '', v as 'cm' | 'm')}>
                                    <SelectTrigger className="h-7 w-14 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="m">m</SelectItem></SelectContent>
                                  </Select>
                                </div>
                                {fillPercent !== null && <span className={cn("text-[10px] ml-2 font-medium", fillPercent > 100 ? 'text-destructive' : fillPercent > 80 ? 'text-warning' : 'text-success')}>{Math.round(fillPercent)}% full</span>}
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRow(row.id)}><Minus className="w-3.5 h-3.5" /></Button>
                            </div>
                            {fillPercent !== null && <Progress value={Math.min(fillPercent, 100)} className={cn("h-1.5 mb-3", fillPercent > 100 && "[&>div]:bg-destructive")} />}
                            <div className="min-h-[48px] rounded-lg border border-dashed border-border/60 p-2 flex flex-wrap gap-1.5">
                              {row.products.map(p => (
                                <div key={p.instanceId} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs", p.skuId ? "bg-secondary/50 border-border" : "bg-destructive/5 border-destructive/20")}>
                                  <span className="truncate max-w-[100px]">{p.name}</span>
                                  <div className="flex items-center gap-0.5 border-l border-border pl-1.5 ml-1">
                                    <button onClick={() => updateProductFacings(row.id, p.instanceId, p.facings - 1)} className="hover:text-primary"><Minus className="w-3 h-3" /></button>
                                    <span className="w-4 text-center font-semibold">{p.facings}</span>
                                    <button onClick={() => updateProductFacings(row.id, p.instanceId, p.facings + 1)} className="hover:text-primary"><Plus className="w-3 h-3" /></button>
                                  </div>
                                  <button onClick={() => removeProductFromRow(row.id, p.instanceId)} className="ml-1 hover:text-destructive"><XCircle className="w-3.5 h-3.5" /></button>
                                </div>
                              ))}
                              {row.products.length === 0 && <p className="text-xs text-muted-foreground/50 w-full text-center py-2">Drag products here</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </ScrollArea>
                </div>
              </div>
            </>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{categories.length}</p><p className="text-sm text-muted-foreground">Total Categories</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-primary">{categories.reduce((acc, c) => acc + c.productCount, 0)}</p><p className="text-sm text-muted-foreground">Total Products</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-success">{categories.reduce((acc, c) => acc + c.trainedCount, 0)}</p><p className="text-sm text-muted-foreground">Trained</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-muted-foreground">{categories.reduce((acc, c) => acc + c.productCount - c.trainedCount, 0)}</p><p className="text-sm text-muted-foreground">Pending</p></div>
          </div>

          {categoriesLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category, index) => {
                const catProducts = products.filter(p => p.category_id === category.id);
                const isExpanded = expandedCategories.has(category.id);
                const trainPercent = category.productCount > 0 ? Math.round((category.trainedCount / category.productCount) * 100) : 0;
                return (
                  <div key={category.id} className="rounded-xl bg-card border border-border transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="p-5">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Products</span><span className="text-foreground font-medium">{category.productCount}</span></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Training</span><span className="text-foreground font-medium">{trainPercent}% complete</span></div>
                          <Progress value={trainPercent} className="h-2" />
                        </div>
                      </div>
                    </div>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full px-5 py-3 border-t border-border flex items-center justify-between text-sm hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4" />{category.productCount} Product{category.productCount !== 1 ? 's' : ''}</span>
                          <span className="text-xs text-muted-foreground">{isExpanded ? 'Collapse' : 'Expand'}</span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-5 pb-4 space-y-2">
                          {catProducts.map(product => {
                            const status = statusConfig[product.training_status];
                            const StatusIcon = status.icon;
                            return (
                              <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                                <div className="flex items-center gap-3">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.barcode || 'No barcode'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", status.className)}><StatusIcon className="w-3 h-3" />{status.label}</span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleProductEdit(product)}><Pencil className="w-3 h-3" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteProductId(product.id)}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                              </div>
                            );
                          })}
                          {catProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No products yet</p>}
                          <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddProductOpen(true)}><Plus className="w-3 h-3 mr-2" />Add Product</Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
              {filteredCategories.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">{categories.length === 0 ? 'No categories yet.' : 'No categories found.'}</p></div>}
            </div>
          )}

          <Dialog open={isCatModalOpen} onOpenChange={(open) => { setIsCatModalOpen(open); if (!open) resetCatForm(); }}>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle></DialogHeader>
              <form onSubmit={handleCatSubmit} className="space-y-4">
                {!editingCategory && (
                  <div className="space-y-2"><Label>Tenant *</Label>
                    <Select value={catFormData.tenant_id} onValueChange={v => setCatFormData({ ...catFormData, tenant_id: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a tenant" /></SelectTrigger>
                      <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
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
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-center">Width (cm)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => {
                    const status = statusConfig[product.training_status];
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.product_categories?.name || 'Uncategorized'}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{product.barcode || '—'}</TableCell>
                        <TableCell className="text-center">{product.width_cm ? `${product.width_cm}` : '—'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={cn("text-xs", status.className)}>
                            <StatusIcon className="w-3 h-3 mr-1" />{status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleProductEdit(product)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteProductId(product.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{products.length === 0 ? 'No products yet.' : 'No products found matching your criteria.'}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <AddProductModal open={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} />
          <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) setEditingProduct(null); }}>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
              <form onSubmit={handleProductEditSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Product Name</Label><Input value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="bg-secondary border-border" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Barcode</Label><Input value={editFormData.barcode} onChange={e => setEditFormData({ ...editFormData, barcode: e.target.value })} className="bg-secondary border-border font-mono" /></div>
                  <div className="space-y-2"><Label>Width (cm)</Label><Input type="number" step="0.1" min="0" value={editFormData.width_cm} onChange={e => setEditFormData({ ...editFormData, width_cm: e.target.value })} className="bg-secondary border-border" placeholder="e.g., 8.5" /></div>
                </div>
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

        {/* Planogram Create/Edit Dialog - placed outside TabsContent so it works from any tab */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingTemplate ? 'Edit Planogram' : 'New Planogram'}</DialogTitle><DialogDescription>Configure the planogram details.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Name</Label><Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Aisle 3 - Beverages" /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} placeholder="Optional description..." rows={2} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>Tenant</Label>
                  <Select value={templateTenantId} onValueChange={(v) => { setTemplateTenantId(v); setTemplateStoreId(''); }}><SelectTrigger><SelectValue placeholder="Select tenant..." /></SelectTrigger><SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label>Store</Label>
                  <Select value={templateStoreId} onValueChange={setTemplateStoreId}><SelectTrigger><SelectValue placeholder="Select store..." /></SelectTrigger><SelectContent>{stores.filter(s => !templateTenantId || s.tenant_id === templateTenantId).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
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

        {/* Store Modal - shared across tabs */}
        <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editingStoreObj ? 'Edit Store' : 'Add New Store'}</DialogTitle></DialogHeader>
            <form onSubmit={handleStoreSubmit} className="space-y-4">
              {!editingStoreObj && !storeTenantId && (
                <div className="space-y-2"><Label>Tenant *</Label>
                  <Select value={storeTenantId} onValueChange={setStoreTenantId}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a tenant" /></SelectTrigger>
                    <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
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
      </Tabs>
    </MainLayout>
  );
}
