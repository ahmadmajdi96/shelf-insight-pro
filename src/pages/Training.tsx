import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, Upload, Trash2, Search, Pencil, Tag,
  Loader2, Image as ImageIcon, Brain, FolderOpen,
  Play, Clock, CheckCircle2, AlertTriangle, X,
  ZoomIn, ZoomOut, MousePointer2, Square
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTenants } from '@/hooks/useTenants';
import {
  useDatasets, useDatasetImages, useDatasetClasses, useTrainingJobs,
  type Dataset, type DatasetImage, type DatasetClass,
} from '@/hooks/useDatasets';

const CLASS_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
];

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending', className: 'text-muted-foreground bg-muted' },
  training: { icon: Loader2, label: 'Training...', className: 'text-warning bg-warning/10' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'text-success bg-success/10' },
  failed: { icon: AlertTriangle, label: 'Failed', className: 'text-destructive bg-destructive/10' },
};

// ─── Annotation types ────────────────────────────────────
interface BBox {
  id: string;
  classId: string;
  className: string;
  color: string;
  x: number; y: number; w: number; h: number; // normalized 0-1
}

export default function Training() {
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const { tenants } = useTenants();
  const [activeTab, setActiveTab] = useState('datasets');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  // Datasets
  const { datasets, isLoading: datasetsLoading, createDataset, updateDataset, deleteDataset } = useDatasets();
  const { images, isLoading: imagesLoading, uploadImages, updateAnnotations, deleteImage } = useDatasetImages(selectedDatasetId);
  const { classes, createClass, updateClass, deleteClass } = useDatasetClasses(selectedDatasetId);
  const { jobs, createJob } = useTrainingJobs(selectedDatasetId);

  // Dataset modal
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [datasetForm, setDatasetForm] = useState({ name: '', description: '', tenant_id: '' });
  const [deleteDatasetId, setDeleteDatasetId] = useState<string | null>(null);
  const [datasetSearch, setDatasetSearch] = useState('');

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Annotator
  const [annotatingImage, setAnnotatingImage] = useState<DatasetImage | null>(null);
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Class modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<DatasetClass | null>(null);
  const [classForm, setClassForm] = useState({ name: '', color: CLASS_COLORS[0] });
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);

  // Training modal
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [trainForm, setTrainForm] = useState({ epochs: 100, batch_size: 16 });

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  // ─── Dataset CRUD ──────────────────────────────────────
  const openNewDataset = () => {
    setEditingDataset(null);
    setDatasetForm({ name: '', description: '', tenant_id: tenantId || (tenants.length > 0 ? tenants[0].id : '') });
    setShowDatasetModal(true);
  };
  const openEditDataset = (d: Dataset) => {
    setEditingDataset(d);
    setDatasetForm({ name: d.name, description: d.description || '', tenant_id: d.tenant_id || '' });
    setShowDatasetModal(true);
  };
  const handleDatasetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetForm.name.trim()) return;
    if (!datasetForm.tenant_id) {
      toast({ title: 'Tenant required', description: 'Please select a tenant.', variant: 'destructive' });
      return;
    }
    if (editingDataset) {
      await updateDataset.mutateAsync({ id: editingDataset.id, name: datasetForm.name, description: datasetForm.description || undefined });
    } else {
      const result = await createDataset.mutateAsync({ name: datasetForm.name, description: datasetForm.description || undefined, tenant_id: datasetForm.tenant_id });
      if (result) setSelectedDatasetId(result.id);
    }
    setShowDatasetModal(false);
  };
  const handleDeleteDataset = async () => {
    if (deleteDatasetId) {
      await deleteDataset.mutateAsync(deleteDatasetId);
      if (selectedDatasetId === deleteDatasetId) setSelectedDatasetId(null);
      setDeleteDatasetId(null);
    }
  };

  const filteredDatasets = datasets.filter(d =>
    d.name.toLowerCase().includes(datasetSearch.toLowerCase())
  );

  // ─── Upload ────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDatasetId || !e.target.files?.length) return;
    const files = Array.from(e.target.files).slice(0, 500);
    if (files.length === 0) return;

    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast({ title: 'No valid images', description: 'Only image files are accepted.', variant: 'destructive' });
      return;
    }
    if (validFiles.length > 500) {
      toast({ title: 'Too many files', description: 'Maximum 500 images per upload.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      await uploadImages.mutateAsync({ datasetId: selectedDatasetId, files: validFiles });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Annotator ─────────────────────────────────────────
  const openAnnotator = (img: DatasetImage) => {
    setAnnotatingImage(img);
    setBboxes((img.annotations as any as BBox[]) || []);
    setActiveTab('annotate');
  };

  const getRelativePos = (e: React.MouseEvent): { x: number; y: number } | null => {
    if (!imgRef.current) return null;
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!activeClassId) {
      toast({ title: 'Select a class', description: 'Choose a class before drawing.', variant: 'destructive' });
      return;
    }
    const pos = getRelativePos(e);
    if (!pos) return;
    setDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getRelativePos(e);
    if (pos) setDrawCurrent(pos);
  };

  const handleCanvasMouseUp = () => {
    if (!drawing || !drawStart || !drawCurrent || !activeClassId) {
      setDrawing(false);
      return;
    }

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);

    if (w < 0.01 || h < 0.01) {
      setDrawing(false);
      return;
    }

    const cls = classes.find(c => c.id === activeClassId);
    if (!cls) { setDrawing(false); return; }

    const newBox: BBox = {
      id: crypto.randomUUID(),
      classId: cls.id,
      className: cls.name,
      color: cls.color,
      x, y, w, h,
    };

    setBboxes(prev => [...prev, newBox]);
    setDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const removeBbox = (id: string) => {
    setBboxes(prev => prev.filter(b => b.id !== id));
  };

  const saveAnnotations = async () => {
    if (!annotatingImage) return;
    await updateAnnotations.mutateAsync({ imageId: annotatingImage.id, annotations: bboxes as any });
    toast({ title: 'Annotations saved' });
  };

  // ─── Classes ───────────────────────────────────────────
  const openNewClass = () => {
    setEditingClass(null);
    const nextColor = CLASS_COLORS[classes.length % CLASS_COLORS.length];
    setClassForm({ name: '', color: nextColor });
    setShowClassModal(true);
  };
  const openEditClass = (c: DatasetClass) => {
    setEditingClass(c);
    setClassForm({ name: c.name, color: c.color });
    setShowClassModal(true);
  };
  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim() || !selectedDatasetId) return;
    if (editingClass) {
      await updateClass.mutateAsync({ id: editingClass.id, name: classForm.name, color: classForm.color });
    } else {
      await createClass.mutateAsync({ dataset_id: selectedDatasetId, name: classForm.name, color: classForm.color });
    }
    setShowClassModal(false);
  };
  const handleDeleteClass = async () => {
    if (deleteClassId) {
      await deleteClass.mutateAsync(deleteClassId);
      if (activeClassId === deleteClassId) setActiveClassId(null);
      setDeleteClassId(null);
    }
  };

  // ─── Training ──────────────────────────────────────────
  const startTraining = async () => {
    if (!selectedDatasetId) return;
    await createJob.mutateAsync({
      dataset_id: selectedDatasetId,
      epochs: trainForm.epochs,
      batch_size: trainForm.batch_size,
    });
    setShowTrainModal(false);
    toast({ title: 'Training job queued', description: 'The dataset will be packaged and sent for training.' });
  };

  // Set active class to first class if none selected
  useEffect(() => {
    if (!activeClassId && classes.length > 0) {
      setActiveClassId(classes[0].id);
    }
  }, [classes, activeClassId]);

  return (
    <MainLayout title="Training" subtitle="Manage datasets, annotate images, and train YOLOv8 models">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="datasets" className="gap-1.5">
            <FolderOpen className="w-4 h-4" /> Datasets
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-1.5" disabled={!selectedDatasetId}>
            <ImageIcon className="w-4 h-4" /> Images
          </TabsTrigger>
          <TabsTrigger value="annotate" className="gap-1.5" disabled={!selectedDatasetId}>
            <Square className="w-4 h-4" /> Annotate
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-1.5" disabled={!selectedDatasetId}>
            <Tag className="w-4 h-4" /> Classes
          </TabsTrigger>
          <TabsTrigger value="train" className="gap-1.5" disabled={!selectedDatasetId}>
            <Brain className="w-4 h-4" /> Train
          </TabsTrigger>
        </TabsList>

        {/* ─── Datasets Tab ─────────────────────────────── */}
        <TabsContent value="datasets" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets..."
                value={datasetSearch}
                onChange={e => setDatasetSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openNewDataset}>
              <Plus className="w-4 h-4 mr-2" /> New Dataset
            </Button>
          </div>

          {datasetsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No datasets yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDatasets.map(d => (
                <div
                  key={d.id}
                  className={cn(
                    "page-section cursor-pointer hover:border-primary/30 transition-colors",
                    selectedDatasetId === d.id && "border-primary ring-1 ring-primary/20"
                  )}
                  onClick={() => setSelectedDatasetId(d.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{d.name}</h3>
                      {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> {d.image_count} images</span>
                    <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {d.class_count} classes</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEditDataset(d); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDatasetId(d.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Images Tab ───────────────────────────────── */}
        <TabsContent value="images" className="space-y-4">
          {selectedDataset && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-foreground">
                  {selectedDataset.name} — Images ({images.length})
                </h3>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Images
                  </Button>
                </div>
              </div>

              {imagesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Upload className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No images yet. Upload up to 500 images.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {images.map(img => (
                    <div
                      key={img.id}
                      className="relative group rounded-lg overflow-hidden border border-border bg-card aspect-square cursor-pointer"
                      onClick={() => openAnnotator(img)}
                    >
                      <img src={img.image_url} alt={img.file_name || ''} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                        <Square className="w-6 h-6 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {img.is_annotated && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute bottom-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteImage.mutate(img.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── Annotate Tab ─────────────────────────────── */}
        <TabsContent value="annotate" className="space-y-4">
          {!annotatingImage ? (
            <div className="text-center py-16 text-muted-foreground">
              <MousePointer2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Select an image from the Images tab to start annotating.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              {/* Canvas */}
              <div className="page-section p-2">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-sm font-medium text-foreground">{annotatingImage.file_name}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setAnnotatingImage(null); setBboxes([]); }}>
                      <X className="w-3.5 h-3.5 mr-1" /> Close
                    </Button>
                    <Button size="sm" onClick={saveAnnotations}>
                      Save Annotations
                    </Button>
                  </div>
                </div>
                <div
                  ref={canvasRef}
                  className="relative select-none cursor-crosshair border border-border rounded overflow-hidden"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={() => { if (drawing) { setDrawing(false); setDrawStart(null); setDrawCurrent(null); } }}
                >
                  <img
                    ref={imgRef}
                    src={annotatingImage.image_url}
                    alt=""
                    className="w-full h-auto block"
                    draggable={false}
                  />
                  {/* Existing bboxes */}
                  {bboxes.map(box => (
                    <div
                      key={box.id}
                      className="absolute border-2 group/box"
                      style={{
                        left: `${box.x * 100}%`,
                        top: `${box.y * 100}%`,
                        width: `${box.w * 100}%`,
                        height: `${box.h * 100}%`,
                        borderColor: box.color,
                        backgroundColor: `${box.color}15`,
                      }}
                    >
                      <span
                        className="absolute -top-5 left-0 text-[10px] font-medium px-1 rounded text-white whitespace-nowrap"
                        style={{ backgroundColor: box.color }}
                      >
                        {box.className}
                      </span>
                      <button
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover/box:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); removeBbox(box.id); }}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {/* Drawing preview */}
                  {drawing && drawStart && drawCurrent && (
                    <div
                      className="absolute border-2 border-dashed pointer-events-none"
                      style={{
                        left: `${Math.min(drawStart.x, drawCurrent.x) * 100}%`,
                        top: `${Math.min(drawStart.y, drawCurrent.y) * 100}%`,
                        width: `${Math.abs(drawCurrent.x - drawStart.x) * 100}%`,
                        height: `${Math.abs(drawCurrent.y - drawStart.y) * 100}%`,
                        borderColor: classes.find(c => c.id === activeClassId)?.color || '#3B82F6',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Sidebar: classes + annotations list */}
              <div className="space-y-4">
                <div className="page-section">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Active Class</h4>
                  {classes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Add classes in the Classes tab first.</p>
                  ) : (
                    <div className="space-y-1">
                      {classes.map(c => (
                        <button
                          key={c.id}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left",
                            activeClassId === c.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"
                          )}
                          onClick={() => setActiveClassId(c.id)}
                        >
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="page-section">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Annotations ({bboxes.length})</h4>
                  {bboxes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Draw bounding boxes on the image.</p>
                  ) : (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                      {bboxes.map(b => (
                        <div key={b.id} className="flex items-center justify-between text-xs px-1 py-1 rounded hover:bg-secondary">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: b.color }} />
                            <span className="text-foreground">{b.className}</span>
                          </div>
                          <button onClick={() => removeBbox(b.id)} className="text-muted-foreground hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Classes Tab ──────────────────────────────── */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-foreground">
              SKU Classes ({classes.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                <Brain className="w-4 h-4 mr-2" /> Auto Detect Classes
              </Button>
              <Button onClick={openNewClass}>
                <Plus className="w-4 h-4 mr-2" /> Add Class
              </Button>
            </div>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No classes defined. Add classes to annotate images.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {classes.map(c => (
                <div key={c.id} className="page-section flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-foreground text-sm">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEditClass(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive" onClick={() => setDeleteClassId(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Train Tab ────────────────────────────────── */}
        <TabsContent value="train" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-foreground">Training Jobs</h3>
            <Button onClick={() => setShowTrainModal(true)} disabled={!selectedDatasetId || images.length === 0}>
              <Play className="w-4 h-4 mr-2" /> Start Training
            </Button>
          </div>

          {selectedDataset && (
            <div className="page-section">
              <h4 className="text-sm font-semibold text-foreground mb-3">Dataset Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Images</p>
                  <p className="font-semibold text-foreground">{images.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Annotated</p>
                  <p className="font-semibold text-foreground">{images.filter(i => i.is_annotated).length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Classes</p>
                  <p className="font-semibold text-foreground">{classes.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Annotations</p>
                  <p className="font-semibold text-foreground">{images.reduce((a, img) => a + ((img.annotations as any[])?.length || 0), 0)}</p>
                </div>
              </div>
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No training jobs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => {
                const cfg = statusConfig[job.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
                  <div key={job.id} className="page-section flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={cn("w-5 h-5", cfg.className.split(' ')[0], job.status === 'training' && 'animate-spin')} />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {job.model_type.toUpperCase()} — {job.epochs} epochs
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(job.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-[10px]", cfg.className)}>{cfg.label}</Badge>
                      {job.status === 'training' && (
                        <div className="w-24">
                          <Progress value={Number(job.progress)} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Dataset Modal ────────────────────────────────── */}
      <Dialog open={showDatasetModal} onOpenChange={setShowDatasetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDataset ? 'Edit Dataset' : 'New Dataset'}</DialogTitle>
            <DialogDescription>
              {editingDataset ? 'Update dataset details.' : 'Create a new training dataset.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDatasetSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={datasetForm.name} onChange={e => setDatasetForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={datasetForm.description} onChange={e => setDatasetForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDatasetModal(false)}>Cancel</Button>
              <Button type="submit">{editingDataset ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Class Modal ──────────────────────────────────── */}
      <Dialog open={showClassModal} onOpenChange={setShowClassModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Class' : 'New Class'}</DialogTitle>
            <DialogDescription>Define a class for object annotation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleClassSubmit} className="space-y-4">
            <div>
              <Label>Class Name</Label>
              <Input value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {CLASS_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={cn("w-8 h-8 rounded border-2 transition-all", classForm.color === color ? "border-foreground scale-110" : "border-transparent")}
                    style={{ backgroundColor: color }}
                    onClick={() => setClassForm(p => ({ ...p, color }))}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowClassModal(false)}>Cancel</Button>
              <Button type="submit">{editingClass ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Training Modal ───────────────────────────────── */}
      <Dialog open={showTrainModal} onOpenChange={setShowTrainModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Training</DialogTitle>
            <DialogDescription>Configure and start a YOLOv8 training job.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Epochs</Label>
              <Input type="number" value={trainForm.epochs} onChange={e => setTrainForm(p => ({ ...p, epochs: parseInt(e.target.value) || 100 }))} min={1} max={1000} />
            </div>
            <div>
              <Label>Batch Size</Label>
              <Input type="number" value={trainForm.batch_size} onChange={e => setTrainForm(p => ({ ...p, batch_size: parseInt(e.target.value) || 16 }))} min={1} max={128} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrainModal(false)}>Cancel</Button>
            <Button onClick={startTraining}>
              <Play className="w-4 h-4 mr-2" /> Start Training
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmations ─────────────────────────── */}
      <AlertDialog open={!!deleteDatasetId} onOpenChange={() => setDeleteDatasetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the dataset and all its images, annotations, and classes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDataset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteClassId} onOpenChange={() => setDeleteClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the class. Existing annotations using this class will keep their data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
