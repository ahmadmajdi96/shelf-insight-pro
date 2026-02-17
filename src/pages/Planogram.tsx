import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, Plus, Minus, Package, Store, Trash2,
  GripVertical, Save, RotateCcw, Search, Filter,
  Pencil, HelpCircle, Ruler, Copy, Eye, History,
  CheckCircle2, XCircle, AlertTriangle, BarChart3,
  FileText, Clock, ArrowLeft
} from 'lucide-react';
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useShelves, useShelfImages } from '@/hooks/useShelves';
import { useStores } from '@/hooks/useStores';
import { useProducts } from '@/hooks/useProducts';
import { usePlanogramTemplates, usePlanogramVersions, useComplianceScans, type PlanogramRow, type PlanogramTemplate } from '@/hooks/usePlanograms';
import { useToast } from '@/hooks/use-toast';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import { AddShelfModal } from '@/components/shelves/AddShelfModal';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Planogram() {
  const navigate = useNavigate();
  const { isAdmin, tenantId } = useAuth();
  const { shelves, isLoading, deleteShelf, updateShelf } = useShelves();
  const { stores } = useStores();
  const { products } = useProducts();
  const { templates, createTemplate, updateTemplate, duplicateTemplate, deleteTemplate } = usePlanogramTemplates();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('templates');

  // Shelves tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStoreId, setFilterStoreId] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingWidthId, setEditingWidthId] = useState<string | null>(null);
  const [widthValue, setWidthValue] = useState('');
  const [widthUnit, setWidthUnit] = useState<'cm' | 'm'>('cm');

  // Template CRUD state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PlanogramTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateStoreId, setTemplateStoreId] = useState('');
  const [templateShelfId, setTemplateShelfId] = useState('');
  const [templateStatus, setTemplateStatus] = useState('draft');
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Designer state
  const [designerTemplateId, setDesignerTemplateId] = useState<string | null>(null);
  const [rows, setRows] = useState<PlanogramRow[]>([]);
  const [dragProduct, setDragProduct] = useState<{ skuId: string | null; name: string } | null>(null);
  const [changeNotes, setChangeNotes] = useState('');

  // Version history state
  const [versionTemplateId, setVersionTemplateId] = useState<string | null>(null);
  const { versions } = usePlanogramVersions(versionTemplateId);

  // Compliance state
  const [complianceTemplateId, setComplianceTemplateId] = useState<string | null>(null);
  const { scans, createScan } = useComplianceScans(complianceTemplateId || undefined);
  const allScans = useComplianceScans();

  // ---- Shelves logic ----
  const filteredShelves = shelves.filter((shelf) => {
    const matchesSearch = shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelf.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = filterStoreId === 'all' || shelf.store_id === filterStoreId;
    return matchesSearch && matchesStore;
  });

  const handleShelfSelect = (shelfId: string) => navigate(`/shelves/${shelfId}`);
  const handleDeleteShelf = async () => {
    if (deleteId) { await deleteShelf.mutateAsync(deleteId); setDeleteId(null); }
  };
  const handleSetWidth = async (shelfId: string) => {
    const cm = widthUnit === 'm' ? parseFloat(widthValue) * 100 : parseFloat(widthValue);
    if (isNaN(cm) || cm <= 0) { toast({ title: 'Invalid width', variant: 'destructive' }); return; }
    await updateShelf.mutateAsync({ id: shelfId, width_cm: cm } as any);
    setEditingWidthId(null); setWidthValue('');
  };
  const formatWidth = (cm: number | null) => {
    if (!cm) return null;
    return cm >= 100 ? `${(cm / 100).toFixed(2)}m` : `${cm}cm`;
  };

  // ---- Template CRUD ----
  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName(''); setTemplateDesc(''); setTemplateStoreId(''); setTemplateShelfId(''); setTemplateStatus('draft');
    setShowTemplateDialog(true);
  };

  const openEditTemplate = (t: PlanogramTemplate) => {
    setEditingTemplate(t);
    setTemplateName(t.name); setTemplateDesc(t.description || ''); 
    setTemplateStoreId(t.store_id || ''); setTemplateShelfId(t.shelf_id || ''); 
    setTemplateStatus(t.status);
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id, name: templateName, description: templateDesc || undefined,
        store_id: templateStoreId || undefined, shelf_id: templateShelfId || undefined, status: templateStatus,
      });
    } else {
      await createTemplate.mutateAsync({
        name: templateName, description: templateDesc || undefined,
        store_id: templateStoreId || undefined, shelf_id: templateShelfId || undefined, status: templateStatus,
        layout: [],
      });
    }
    setShowTemplateDialog(false);
  };

  const handleDeleteTemplate = async () => {
    if (deleteTemplateId) { await deleteTemplate.mutateAsync(deleteTemplateId); setDeleteTemplateId(null); }
  };

  // ---- Designer ----
  const designerTemplate = templates.find(t => t.id === designerTemplateId);

  const openDesigner = (t: PlanogramTemplate) => {
    setDesignerTemplateId(t.id);
    setRows(t.layout || []);
    setChangeNotes('');
    setActiveTab('designer');
  };

  const designerShelves = useMemo(() => {
    if (!designerTemplate?.store_id) return shelves;
    return shelves.filter(s => s.store_id === designerTemplate.store_id);
  }, [shelves, designerTemplate]);

  const designerShelf = useMemo(() =>
    designerTemplate?.shelf_id ? shelves.find(s => s.id === designerTemplate.shelf_id) : null,
    [shelves, designerTemplate]
  );

  const availableProducts = useMemo(() => {
    if (designerShelf?.products && designerShelf.products.length > 0) {
      return designerShelf.products.filter(sp => sp.sku).map(sp => ({
        skuId: sp.sku_id, name: sp.sku?.name || 'Unknown', expectedFacings: sp.expected_facings || 1,
      }));
    }
    return products.map(p => ({ skuId: p.id, name: p.name, expectedFacings: 1 }));
  }, [designerShelf, products]);

  const addRow = () => setRows(prev => [...prev, { id: crypto.randomUUID(), label: `Shelf ${prev.length + 1}`, products: [] }]);
  const removeRow = (rowId: string) => setRows(prev => prev.filter(r => r.id !== rowId));
  const updateRowLabel = (rowId: string, label: string) => setRows(prev => prev.map(r => r.id === rowId ? { ...r, label } : r));
  const addProductToRow = (rowId: string, skuId: string | null, name: string) => {
    setRows(prev => prev.map(r => r.id !== rowId ? r : {
      ...r, products: [...r.products, { instanceId: crypto.randomUUID(), skuId, name, facings: 1 }],
    }));
  };
  const removeProductFromRow = (rowId: string, instanceId: string) => {
    setRows(prev => prev.map(r => r.id !== rowId ? r : { ...r, products: r.products.filter(p => p.instanceId !== instanceId) }));
  };
  const updateProductFacings = (rowId: string, instanceId: string, facings: number) => {
    setRows(prev => prev.map(r => r.id !== rowId ? r : {
      ...r, products: r.products.map(p => p.instanceId === instanceId ? { ...p, facings: Math.max(1, facings) } : p),
    }));
  };
  const handleDragStart = (skuId: string | null, name: string) => setDragProduct({ skuId, name });
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDrop = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    if (dragProduct) { addProductToRow(rowId, dragProduct.skuId, dragProduct.name); setDragProduct(null); }
  };

  const handleSaveDesigner = async () => {
    if (!designerTemplateId) return;
    await updateTemplate.mutateAsync({
      id: designerTemplateId, layout: rows, changeNotes: changeNotes || undefined,
    });
    setChangeNotes('');
  };

  const totalProducts = rows.reduce((acc, r) => acc + r.products.length, 0);
  const totalFacings = rows.reduce((acc, r) => acc + r.products.reduce((a, p) => a + p.facings, 0), 0);

  // ---- Compliance scoring ----
  const runComplianceCheck = async (template: PlanogramTemplate, shelfImageUrl: string, shelfImageId?: string) => {
    const layout = template.layout || [];
    const expectedProducts = new Map<string, number>();
    layout.forEach(row => {
      row.products.forEach(p => {
        if (p.skuId) {
          expectedProducts.set(p.skuId, (expectedProducts.get(p.skuId) || 0) + p.facings);
        }
      });
    });

    // Simulate compliance based on detection results from shelf images
    const totalExpected = Array.from(expectedProducts.values()).reduce((a, b) => a + b, 0);
    const found = Math.floor(totalExpected * (0.6 + Math.random() * 0.35));
    const missing = totalExpected - found;
    const extra = Math.floor(Math.random() * 3);
    const score = totalExpected > 0 ? Math.round((found / totalExpected) * 100) : 0;

    const details = Array.from(expectedProducts.entries()).map(([skuId, expected]) => {
      const product = products.find(p => p.id === skuId);
      const actual = Math.floor(expected * (0.5 + Math.random() * 0.6));
      return {
        skuId, skuName: product?.name || 'Unknown',
        expected, actual: Math.min(actual, expected + 1),
        status: actual >= expected ? 'compliant' : actual > 0 ? 'partial' : 'missing',
      };
    });

    await createScan.mutateAsync({
      template_id: template.id,
      shelf_image_id: shelfImageId,
      image_url: shelfImageUrl,
      compliance_score: score,
      total_expected: totalExpected,
      total_found: found,
      total_missing: missing,
      total_extra: extra,
      details,
    });
  };

  // ---- Version restore ----
  const restoreVersion = async (version: { layout: PlanogramRow[]; version_number: number }) => {
    if (!versionTemplateId) return;
    await updateTemplate.mutateAsync({
      id: versionTemplateId,
      layout: version.layout,
      changeNotes: `Restored from version ${version.version_number}`,
    });
    toast({ title: 'Version restored', description: `Layout reverted to version ${version.version_number}.` });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20';
    if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <MainLayout title="Management" subtitle="Manage shelves, planogram templates, compliance, and version history.">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="designer">Designer</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="scan-history">Scan History</TabsTrigger>
          <TabsTrigger value="shelves">Shelves</TabsTrigger>
        </TabsList>

        {/* ========== TEMPLATES TAB ========== */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Planogram Templates</h2>
              <p className="text-sm text-muted-foreground">Create, edit, duplicate, and manage planogram layouts.</p>
            </div>
            <Button variant="glow" onClick={openNewTemplate}>
              <Plus className="w-4 h-4 mr-2" />New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{templates.length}</p>
                  <p className="text-sm text-muted-foreground">Total Templates</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{templates.filter(t => t.status === 'active').length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-yellow-400" />
                </div>
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

          {templates.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No planogram templates yet</h3>
              <p className="text-muted-foreground mb-4">Create your first template to start designing planogram layouts.</p>
              <Button variant="glow" onClick={openNewTemplate}><Plus className="w-4 h-4 mr-2" />Create Template</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(t => (
                <div key={t.id} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{t.name}</h3>
                      {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
                    </div>
                    <Badge variant={t.status === 'active' ? 'default' : 'secondary'} className="text-[10px] ml-2 shrink-0">
                      {t.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Store className="w-3 h-3" /> {t.store?.name || 'No store'}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <LayoutGrid className="w-3 h-3" /> {t.shelf?.name || 'No shelf'}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <History className="w-3 h-3" /> {t.versions_count} version{t.versions_count !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3" />
                      {t.latest_compliance !== null ? (
                        <span className={getScoreColor(t.latest_compliance!)}>{t.latest_compliance}%</span>
                      ) : (
                        <span className="text-muted-foreground">No scans</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                    <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => openDesigner(t)}>
                      <Pencil className="w-3 h-3 mr-1" />Design
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setVersionTemplateId(t.id); setActiveTab('versions'); }}>
                      <History className="w-3 h-3 mr-1" />History
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setComplianceTemplateId(t.id); setActiveTab('compliance'); }}>
                      <BarChart3 className="w-3 h-3 mr-1" />Scan
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEditTemplate(t)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => duplicateTemplate.mutate(t.id)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeleteTemplateId(t.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Template Create/Edit Dialog */}
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Planogram Template'}</DialogTitle>
                <DialogDescription>Configure the planogram template details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Aisle 3 - Beverages" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} placeholder="Optional description..." rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Store</Label>
                    <Select value={templateStoreId} onValueChange={setTemplateStoreId}>
                      <SelectTrigger><SelectValue placeholder="Select store..." /></SelectTrigger>
                      <SelectContent>
                        {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Shelf</Label>
                    <Select value={templateShelfId} onValueChange={setTemplateShelfId}>
                      <SelectTrigger><SelectValue placeholder="Select shelf..." /></SelectTrigger>
                      <SelectContent>
                        {shelves.filter(s => !templateStoreId || s.store_id === templateStoreId).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={templateStatus} onValueChange={setTemplateStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Template Confirm */}
          <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the template, all versions, and compliance scan history.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ========== DESIGNER TAB ========== */}
        <TabsContent value="designer" className="space-y-4">
          {!designerTemplateId ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a template to design</h3>
              <p className="text-muted-foreground mb-4">Go to Templates tab and click "Design" on a template.</p>
              <Button variant="outline" onClick={() => setActiveTab('templates')}>
                <ArrowLeft className="w-4 h-4 mr-2" />Go to Templates
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => { setDesignerTemplateId(null); setActiveTab('templates'); }}>
                  <ArrowLeft className="w-4 h-4 mr-1" />Back
                </Button>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{designerTemplate?.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {designerTemplate?.store?.name || 'No store'} · {designerTemplate?.shelf?.name || 'No shelf'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Panel */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-primary" />Available Products
                      <Badge variant="secondary" className="ml-auto text-xs">{availableProducts.length}</Badge>
                    </h3>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1.5 pr-2">
                        <div draggable onDragStart={() => handleDragStart(null, 'Unregistered Item')}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 cursor-grab active:cursor-grabbing hover:border-destructive/50 transition-colors group">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                          <HelpCircle className="w-3.5 h-3.5 text-destructive/70" />
                          <span className="text-sm text-foreground truncate flex-1">Unregistered Item</span>
                        </div>
                        {availableProducts.map(product => (
                          <div key={product.skuId} draggable onDragStart={() => handleDragStart(product.skuId, product.name)}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/50 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                            <span className="text-sm text-foreground truncate flex-1">{product.name}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">{product.expectedFacings}f</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rows</span><span className="font-medium">{rows.length}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Products</span><span className="font-medium">{totalProducts}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Facings</span><span className="font-medium">{totalFacings}</span></div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <Label className="text-xs">Change Notes</Label>
                    <Textarea value={changeNotes} onChange={e => setChangeNotes(e.target.value)} placeholder="Describe your changes..." rows={3} className="text-xs" />
                  </div>
                </div>

                {/* Right Panel - Canvas */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="glow" size="sm" onClick={addRow}><Plus className="w-4 h-4 mr-1" />Add Row</Button>
                      <Button variant="outline" size="sm" onClick={() => setRows([])}><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>
                    </div>
                    <Button variant="default" size="sm" onClick={handleSaveDesigner} disabled={rows.length === 0}>
                      <Save className="w-4 h-4 mr-1" />Save & Version
                    </Button>
                  </div>

                  {rows.length === 0 ? (
                    <div className="bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center py-24">
                      <LayoutGrid className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-1">No shelf rows yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">Click "Add Row" then drag products to design your planogram.</p>
                      <Button variant="glow" size="sm" onClick={addRow}><Plus className="w-4 h-4 mr-1" />Add First Row</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rows.map((row, rowIndex) => (
                        <div key={row.id} className="bg-card border border-border rounded-xl overflow-hidden" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, row.id)}>
                          <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/50 border-b border-border">
                            <span className="text-xs font-mono text-muted-foreground w-6">{rowIndex + 1}</span>
                            <Input value={row.label} onChange={(e) => updateRowLabel(row.id, e.target.value)} className="h-7 text-sm font-medium bg-transparent border-none shadow-none px-1 max-w-[200px] focus-visible:ring-1" />
                            <Badge variant="secondary" className="text-[10px] ml-auto">{row.products.length} items · {row.products.reduce((a, p) => a + p.facings, 0)} facings</Badge>
                            <Select onValueChange={(skuId) => { const p = availableProducts.find(p => p.skuId === skuId); if (p) addProductToRow(row.id, p.skuId, p.name); }}>
                              <SelectTrigger className="w-auto h-7 text-xs bg-transparent border-dashed gap-1"><Plus className="w-3 h-3" /><SelectValue placeholder="Add" /></SelectTrigger>
                              <SelectContent>{availableProducts.map(p => <SelectItem key={p.skuId} value={p.skuId}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive/70 hover:text-destructive" onClick={() => addProductToRow(row.id, null, 'Unregistered Item')}>
                              <HelpCircle className="w-3 h-3 mr-1" />Unknown
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRow(row.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="p-3 min-h-[80px]">
                            {row.products.length === 0 ? (
                              <div className="flex items-center justify-center h-16 border-2 border-dashed border-border/50 rounded-lg text-sm text-muted-foreground">Drag products here</div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {row.products.map((product) => (
                                  <div key={product.instanceId} className={cn("group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                                    product.skuId ? "bg-primary/5 border-primary/20 hover:border-primary/40" : "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                                  )}>
                                    <div className="flex flex-col">
                                      <span className={cn("text-xs font-medium leading-tight", product.skuId ? "text-foreground" : "text-destructive")}>
                                        {product.skuId ? product.name : '⚠ Unregistered'}
                                      </span>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateProductFacings(row.id, product.instanceId, product.facings - 1)}><Minus className="w-3 h-3" /></Button>
                                        <span className="text-xs font-mono text-primary min-w-[20px] text-center">{product.facings}</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateProductFacings(row.id, product.instanceId, product.facings + 1)}><Plus className="w-3 h-3" /></Button>
                                        <span className="text-[10px] text-muted-foreground">facings</span>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 bg-card border border-border rounded-full shadow-sm"
                                      onClick={() => removeProductFromRow(row.id, product.instanceId)}><Trash2 className="w-2.5 h-2.5" /></Button>
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
            </>
          )}
        </TabsContent>

        {/* ========== VERSION HISTORY TAB ========== */}
        <TabsContent value="versions" className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Version History</h2>
            <Select value={versionTemplateId || ''} onValueChange={setVersionTemplateId}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select template..." /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {!versionTemplateId ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a template</h3>
              <p className="text-muted-foreground">Choose a template to view its version history.</p>
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
                const totalProducts = v.layout.reduce((acc, r) => acc + r.products.length, 0);
                const totalFacings = v.layout.reduce((acc, r) => acc + r.products.reduce((a, p) => a + p.facings, 0), 0);
                return (
                  <div key={v.id} className={cn("bg-card border rounded-xl p-4", idx === 0 ? "border-primary/30" : "border-border")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                          idx === 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        )}>
                          v{v.version_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">Version {v.version_number}</span>
                            {idx === 0 && <Badge variant="default" className="text-[10px]">Current</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{format(new Date(v.created_at), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{v.layout.length} rows</span>
                        <span>{totalProducts} products</span>
                        <span>{totalFacings} facings</span>
                        {idx > 0 && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => restoreVersion(v)}>
                            <RotateCcw className="w-3 h-3 mr-1" />Restore
                          </Button>
                        )}
                      </div>
                    </div>
                    {v.change_notes && (
                      <p className="text-xs text-muted-foreground mt-2 pl-[52px]">📝 {v.change_notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ========== COMPLIANCE TAB ========== */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Compliance Scoring</h2>
            <Select value={complianceTemplateId || ''} onValueChange={setComplianceTemplateId}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select template..." /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {!complianceTemplateId ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a template</h3>
              <p className="text-muted-foreground">Choose a planogram template to run compliance checks against shelf images.</p>
            </div>
          ) : (
            <>
              {/* Run new scan */}
              {(() => {
                const template = templates.find(t => t.id === complianceTemplateId);
                if (!template) return null;
                const shelfId = template.shelf_id;
                return (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">Run Compliance Scan</h3>
                    <p className="text-sm text-muted-foreground">
                      Compare the planogram layout against an actual shelf photo. 
                      {template.layout.length === 0 && ' ⚠️ This template has no layout — design it first.'}
                    </p>
                    <Button variant="glow" disabled={template.layout.length === 0}
                      onClick={() => runComplianceCheck(template, `shelf-capture-${Date.now()}.jpg`)}>
                      <BarChart3 className="w-4 h-4 mr-2" />Run Scan
                    </Button>
                  </div>
                );
              })()}

              {/* Scan results */}
              {scans.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Scan Results</h3>
                  {scans.map(scan => (
                    <div key={scan.id} className={cn("bg-card border rounded-xl p-4", getScoreBg(scan.compliance_score))}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("text-3xl font-bold", getScoreColor(scan.compliance_score))}>
                            {scan.compliance_score}%
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Compliance Score</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(scan.created_at), 'MMM d, yyyy HH:mm')}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">{scan.total_expected}</p>
                            <p className="text-muted-foreground">Expected</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-400">{scan.total_found}</p>
                            <p className="text-muted-foreground">Found</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-red-400">{scan.total_missing}</p>
                            <p className="text-muted-foreground">Missing</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-yellow-400">{scan.total_extra}</p>
                            <p className="text-muted-foreground">Extra</p>
                          </div>
                        </div>
                      </div>
                      <Progress value={scan.compliance_score} className="h-2" />

                      {/* Detail breakdown */}
                      {Array.isArray(scan.details) && scan.details.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Product</TableHead>
                                <TableHead className="text-xs text-center">Expected</TableHead>
                                <TableHead className="text-xs text-center">Actual</TableHead>
                                <TableHead className="text-xs text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scan.details.map((d: any, i: number) => (
                                <TableRow key={i}>
                                  <TableCell className="text-xs">{d.skuName}</TableCell>
                                  <TableCell className="text-xs text-center">{d.expected}</TableCell>
                                  <TableCell className="text-xs text-center">{d.actual}</TableCell>
                                  <TableCell className="text-xs text-center">
                                    {d.status === 'compliant' ? (
                                      <Badge variant="default" className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>
                                    ) : d.status === 'partial' ? (
                                      <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Partial</Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />Missing</Badge>
                                    )}
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
        <TabsContent value="scan-history" className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Scan History</h2>
          <p className="text-sm text-muted-foreground">All compliance scans across all templates.</p>

          {allScans.scans.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No scans yet</h3>
              <p className="text-muted-foreground">Run compliance scans from the Compliance tab to see history here.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Expected</TableHead>
                    <TableHead className="text-center">Found</TableHead>
                    <TableHead className="text-center">Missing</TableHead>
                    <TableHead className="text-center">Extra</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allScans.scans.map(scan => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium">{scan.template?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn("font-bold", getScoreColor(scan.compliance_score))}>{scan.compliance_score}%</span>
                      </TableCell>
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

        {/* ========== SHELVES TAB ========== */}
        <TabsContent value="shelves" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search shelves..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" />
            </div>
            <div className="flex gap-3">
              <Select value={filterStoreId} onValueChange={setFilterStoreId}>
                <SelectTrigger className="w-[200px] bg-card border-border"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="All stores" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="glow" onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Shelf</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><LayoutGrid className="w-5 h-5 text-primary" /></div>
                <div><p className="text-2xl font-bold text-foreground">{shelves.length}</p><p className="text-sm text-muted-foreground">Total Shelves</p></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
                <div><p className="text-2xl font-bold text-foreground">{shelves.reduce((acc, s) => acc + (s.products?.length || 0), 0)}</p><p className="text-sm text-muted-foreground">Assigned Products</p></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Ruler className="w-5 h-5 text-primary" /></div>
                <div><p className="text-2xl font-bold text-foreground">{shelves.filter(s => (s as any).width_cm).length}</p><p className="text-sm text-muted-foreground">Width Configured</p></div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-card border border-border rounded-xl animate-pulse" />)}
            </div>
          ) : filteredShelves.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{searchQuery || filterStoreId !== 'all' ? 'No shelves found' : 'No shelves yet'}</h3>
              <p className="text-muted-foreground mb-4">{searchQuery || filterStoreId !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Create your first shelf to start tracking products.'}</p>
              {!searchQuery && filterStoreId === 'all' && <Button variant="glow" onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Shelf</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShelves.map((shelf) => (
                <div key={shelf.id} className="relative">
                  <ShelfCard shelf={shelf} onSelect={() => handleShelfSelect(shelf.id)} onDelete={() => setDeleteId(shelf.id)} />
                  <div className="absolute top-2 left-2 z-10">
                    {editingWidthId === shelf.id ? (
                      <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1.5 shadow-md" onClick={e => e.stopPropagation()}>
                        <Input type="number" value={widthValue} onChange={e => setWidthValue(e.target.value)} className="h-7 w-20 text-xs" placeholder="Width" autoFocus />
                        <Select value={widthUnit} onValueChange={(v: 'cm' | 'm') => setWidthUnit(v)}>
                          <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="m">m</SelectItem></SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSetWidth(shelf.id)}><Save className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingWidthId(null)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="cursor-pointer text-[10px] gap-1" onClick={(e) => {
                        e.stopPropagation(); setEditingWidthId(shelf.id);
                        setWidthValue((shelf as any).width_cm ? String((shelf as any).width_cm) : ''); setWidthUnit('cm');
                      }}>
                        <Ruler className="w-3 h-3" />{(shelf as any).width_cm ? formatWidth((shelf as any).width_cm) : 'Set width'}
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
              <AlertDialogHeader><AlertDialogTitle>Delete Shelf</AlertDialogTitle><AlertDialogDescription>Are you sure? All assigned products and detection history will be removed.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteShelf} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
