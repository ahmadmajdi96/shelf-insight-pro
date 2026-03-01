import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Plus, Upload, Trash2, Search, Pencil, Tag,
  Loader2, Image as ImageIcon, Brain, FolderOpen,
  Play, Clock, CheckCircle2, AlertTriangle, X,
  MousePointer2, Square, Download, RefreshCw, Filter,
  ChevronLeft, ChevronRight, Settings, Wand2,
  MoreVertical, Pause, BarChart3, Save, Eye,
  FolderPlus, Package, FileJson
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthImage } from '@/components/shared/AuthImage';
import { AnnotationCanvasImage } from '@/components/shared/AnnotationCanvasImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { invoke } from '@/lib/api-client';
import {
  useDatasets, useDatasetImages, useDatasetClasses, useTrainingJobs,
  type Dataset, type DatasetImage, type DatasetClass,
} from '@/hooks/useDatasets';
import { useImageSets, useImageSetUpload, type ImageSet } from '@/hooks/useImageSets';
import { getApiBaseUrl } from '@/lib/api-config';


const CLASS_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#84CC16', '#D946EF', '#0EA5E9', '#F43F5E', '#A855F7',
  '#22D3EE', '#FB923C', '#818CF8', '#2DD4BF', '#FACC15',
];

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending', className: 'text-muted-foreground bg-muted' },
  training: { icon: Loader2, label: 'Training...', className: 'text-warning bg-warning/10' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'text-success bg-success/10' },
  failed: { icon: AlertTriangle, label: 'Failed', className: 'text-destructive bg-destructive/10' },
};

interface BBox {
  id: string;
  classId: string;
  className: string;
  color: string;
  x: number; y: number; w: number; h: number;
  isRegistered: boolean;
}

type AutoAnnotateStage = 'idle' | 'submitting' | 'queued' | 'polling' | 'saving';

type AutoAnnotateBatchStatus = 'pending' | 'submitting' | 'queued' | 'polling' | 'saving' | 'completed' | 'failed';

interface AutoAnnotateBatchProgress {
  index: number;
  total: number;
  processed: number;
  saved: number;
  failed: number;
  status: AutoAnnotateBatchStatus;
  jobId: string | null;
  error: string | null;
}

const SELECTED_SETS_AUTO_ANNOTATE_INITIAL = {
  running: false,
  stage: 'idle' as AutoAnnotateStage,
  jobId: null as string | null,
  total: 0,
  processed: 0,
  saved: 0,
  failed: 0,
  currentBatch: 0,
  totalBatches: 0,
  batches: [] as AutoAnnotateBatchProgress[],
};

const AUTO_ANNOTATE_BATCH_STATUS_CONFIG: Record<AutoAnnotateBatchStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground border-border' },
  submitting: { label: 'Submitting', className: 'bg-warning/10 text-warning border-warning/30' },
  queued: { label: 'Queued', className: 'bg-secondary text-secondary-foreground border-border' },
  polling: { label: 'Running', className: 'bg-primary/10 text-primary border-primary/30' },
  saving: { label: 'Saving', className: 'bg-primary/10 text-primary border-primary/30' },
  completed: { label: 'Done', className: 'bg-success/10 text-success border-success/30' },
  failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const INFERENCING_ENDPOINT_STORAGE_KEY = 'shelfvision_inferencing_endpoint';
const AUTO_ANNOTATE_POLL_INTERVAL_MS = 5000;
const AUTO_ANNOTATE_MAX_POLL_ATTEMPTS = 360;
const AUTO_ANNOTATE_BATCH_SIZE = 100;

const DEFAULT_TRAINING_CONFIG = {
  seed: 42,
  data: {
    root: './dataset',
    mode: 'pre_split',
    train_dir: 'train',
    val_dir: 'val',
    test_dir: 'test',
    all_dir: 'all',
    image_size_w: 224,
    image_size_h: 224,
    num_workers: 8,
    batch_size: 54,
    val_batch_size: 128,
    split: { val_ratio: 0.25, test_ratio: 0.25 },
    augment: {
      enabled: true,
      hflip_prob: 0.12,
      brightness_contrast_prob: 0.3,
      brightness_contrast: 0.07,
      hue_saturation_prob: 0.2,
      hue_saturation: 0.07,
      blur_prob: 0.06,
      perspective_prob: 0.05,
      jpeg_prob: 0.05,
    },
    balance: {
      unknown_class_name: 'UNKNOWN',
      max_unknown_train_samples: '',
    },
  },
  model: {
    backbone: 'eva02_small_patch14_224.mim_in22k',
    pretrained: true,
    dropout: 0.3,
    num_classes: 'auto',
  },
  train: {
    start_from: 'pretrained',
    epochs: 200,
    lr: 0.0005,
    weight_decay: 0.02,
    optimizer: 'adamw',
    scheduler: 'cosine',
    warmup_epochs: 5,
    label_smoothing: 0.01,
    use_weighted_sampler: false,
    unknown_class_name: 'UNKNOWN',
    open_set_loss_weight: 0.05,
    matmul_precision: 'high',
    precision: '16-mixed',
    accumulate_grad_batches: 1,
    gradient_clip_val: 1.0,
    early_stop_patience: 50,
    early_stop_min_epochs: 50,
    monitor_metric: 'val/f1_macro',
    stop_metric: 'val/f1_macro',
    stop_threshold: 0.985,
    stop_min_epochs: 50,
  },
  logging: {
    out_dir: './runs',
    use_wandb: false,
    wandb_project: 'sku-classifier',
    log_every_n_steps: 10,
  },
  inference: {
    reject_threshold: '',
  },
};

export default function Training() {
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const qc = useQueryClient();

  // Tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-for-training'],
    queryFn: async () => {
      const { data } = await rest.list('tenants', { select: 'id,name,admin_id', order: 'name.asc' });
      return data || [];
    },
  });

  // Admins
  const { data: adminsForTraining = [] } = useQuery({
    queryKey: ['admins-for-training'],
    queryFn: async () => {
      const { data } = await rest.list('admins', { select: 'id,full_name', order: 'full_name.asc' });
      return data || [];
    },
  });

  // Categories
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories-for-training'],
    queryFn: async () => {
      const { data } = await rest.list('product_categories', { select: 'id,name,tenant_id', order: 'name.asc' });
      return data || [];
    },
  });

  const [activeTab, setActiveTab] = useState('datasets');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data hooks
  const { datasets, isLoading: datasetsLoading, createDataset, updateDataset, deleteDataset } = useDatasets();
  const { images, isLoading: imagesLoading, uploadImages, updateAnnotations, deleteImage } = useDatasetImages(selectedDatasetId);
  const { classes, createClass, updateClass, deleteClass } = useDatasetClasses(selectedDatasetId);
  const { jobs, createJob } = useTrainingJobs(selectedDatasetId);
  const { imageSets, createImageSet, updateImageSet, deleteImageSet } = useImageSets(selectedDatasetId);
  const { uploadToSet } = useImageSetUpload();

  const selectedDatasetForAnnotation = datasets.find(d => d.id === selectedDatasetId);

  // Fetch products for the selected dataset's tenant (for classes tab & annotation)
  const { data: tenantProducts = [] } = useQuery({
    queryKey: ['products-for-annotation', selectedDatasetForAnnotation?.tenant_id],
    queryFn: async () => {
      if (!selectedDatasetForAnnotation?.tenant_id) return [];
      const { data } = await rest.list('skus', { select: '*', order: 'name.asc', filters: { tenant_id: `eq.${selectedDatasetForAnnotation.tenant_id}` } });
      return data || [];
    },
    enabled: !!selectedDatasetForAnnotation?.tenant_id,
  });

  // Categories for the selected dataset's tenant
  const tenantCategories = useMemo(() => {
    if (!selectedDatasetForAnnotation?.tenant_id) return [];
    return allCategories.filter((c: any) => c.tenant_id === selectedDatasetForAnnotation.tenant_id);
  }, [allCategories, selectedDatasetForAnnotation?.tenant_id]);

  // Products grouped by category for class selection
  const productsByCategory = useMemo(() => {
    const groups: { categoryId: string | null; categoryName: string; products: any[] }[] = [];
    const categorized = new Set<string>();

    for (const cat of tenantCategories) {
      const prods = tenantProducts.filter((p: any) => p.category_id === cat.id);
      if (prods.length > 0) {
        groups.push({ categoryId: cat.id, categoryName: cat.name, products: prods });
        prods.forEach((p: any) => categorized.add(p.id));
      }
    }

    const uncategorized = tenantProducts.filter((p: any) => !categorized.has(p.id));
    if (uncategorized.length > 0) {
      groups.push({ categoryId: null, categoryName: 'Uncategorized', products: uncategorized });
    }

    return groups;
  }, [tenantProducts, tenantCategories]);

  // Track which SKUs are selected as classes (checkbox state)
  const [selectedSkuIds, setSelectedSkuIds] = useState<Set<string>>(new Set());
  const [savingClasses, setSavingClasses] = useState(false);

  // Initialize selectedSkuIds from existing dataset classes when dataset changes
  useEffect(() => {
    if (classes.length > 0 && tenantProducts.length > 0) {
      const existingNames = new Set(classes.map(c => c.name.toLowerCase()));
      const matched = new Set<string>();
      tenantProducts.forEach((p: any) => {
        if (existingNames.has(p.name.toLowerCase())) matched.add(p.id);
      });
      setSelectedSkuIds(matched);
    } else {
      setSelectedSkuIds(new Set());
    }
  }, [classes, tenantProducts, selectedDatasetId]);

  // Combine dataset classes with products as annotation classes
  const annotationClasses = useMemo(() => {
    // Use saved classes as the source of truth for annotation
    return classes.map((c, idx) => ({
      ...c,
      color: c.color || CLASS_COLORS[idx % CLASS_COLORS.length],
    }));
  }, [classes]);

  // Dataset modal
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [datasetForm, setDatasetForm] = useState({ name: '', description: '', tenant_id: '', admin_id: '' });
  const [deleteDatasetId, setDeleteDatasetId] = useState<string | null>(null);

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
  const imgRef = useRef<HTMLImageElement>(null);

  // Class modal (kept for manual add)
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<DatasetClass | null>(null);
  const [classForm, setClassForm] = useState({ name: '', color: CLASS_COLORS[0] });
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);

  // Training modal
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [trainForm, setTrainForm] = useState({ epochs: 100, batch_size: 16 });
  const [exporting, setExporting] = useState(false);
  const [trainingStarting, setTrainingStarting] = useState(false);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [trainingConfig, setTrainingConfig] = useState(DEFAULT_TRAINING_CONFIG);

  // Auto-annotate
  const [autoAnnotating, setAutoAnnotating] = useState(false);

  // Image preview navigation
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  // Double-click class change
  const [changingClassBboxId, setChangingClassBboxId] = useState<string | null>(null);

  // Model versioning
  const [evaluationJobId, setEvaluationJobId] = useState<string | null>(null);

  // Image sets
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSetName, setUploadSetName] = useState('');
  const [uploadSetFiles, setUploadSetFiles] = useState<File[]>([]);
  const [uploadingSet, setUploadingSet] = useState(false);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [selectedSetsAutoAnnotate, setSelectedSetsAutoAnnotate] = useState(SELECTED_SETS_AUTO_ANNOTATE_INITIAL);
  const [autoAnnotatingSetId, setAutoAnnotatingSetId] = useState<string | null>(null);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [annotatingSetId, setAnnotatingSetId] = useState<string | null>(null);

  // Preview request
  const [showPreviewRequest, setShowPreviewRequest] = useState(false);
  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  // Filtered tenants based on selected admin in dataset form
  const filteredTenantsForForm = useMemo(() => {
    if (!datasetForm.admin_id) return [];
    return tenants.filter((t: any) => t.admin_id === datasetForm.admin_id);
  }, [tenants, datasetForm.admin_id]);

  // Filtered datasets
  const getTenantIdsForAdmin = (adminId: string) => tenants.filter((t: any) => t.admin_id === adminId).map((t: any) => t.id);

  // Dynamic filter: tenants filtered by selected admin filter
  const filteredTenantsForFilter = useMemo(() => {
    if (filterAdmin === 'all') return tenants;
    return tenants.filter((t: any) => t.admin_id === filterAdmin);
  }, [tenants, filterAdmin]);

  const filteredDatasets = useMemo(() => {
    return datasets.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTenant = filterTenant === 'all' || d.tenant_id === filterTenant;
      const matchesAdmin = filterAdmin === 'all' || (d.tenant_id && getTenantIdsForAdmin(filterAdmin).includes(d.tenant_id));
      const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
      return matchesSearch && matchesTenant && matchesAdmin && matchesStatus;
    });
  }, [datasets, searchQuery, filterTenant, filterAdmin, filterStatus, tenants]);

  const hasActiveFilters = searchQuery || filterTenant !== 'all' || filterAdmin !== 'all' || filterStatus !== 'all';
  const clearFilters = () => { setSearchQuery(''); setFilterTenant('all'); setFilterAdmin('all'); setFilterStatus('all'); };

  // Reset tenant filter when admin filter changes
  useEffect(() => {
    if (filterAdmin !== 'all') {
      const adminTenantIds = getTenantIdsForAdmin(filterAdmin);
      if (filterTenant !== 'all' && !adminTenantIds.includes(filterTenant)) {
        setFilterTenant('all');
      }
    }
  }, [filterAdmin]);

  // ─── Dataset CRUD ──────────────────────────────────────
  const openNewDataset = () => {
    setEditingDataset(null);
    setDatasetForm({ name: '', description: '', tenant_id: '', admin_id: '' });
    setShowDatasetModal(true);
  };
  const openEditDataset = (d: Dataset) => {
    setEditingDataset(d);
    // Find admin_id from tenant
    const tenant = tenants.find((t: any) => t.id === d.tenant_id);
    setDatasetForm({ name: d.name, description: d.description || '', tenant_id: d.tenant_id || '', admin_id: tenant?.admin_id || '' });
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

  // ─── Save selected SKUs as classes ─────────────────────
  const saveSelectedClasses = async () => {
    if (!selectedDatasetId) return;
    setSavingClasses(true);
    try {
      // Get existing class names
      const existingClassNames = new Set(classes.map(c => c.name.toLowerCase()));

      // Get selected products
      const selectedProducts = tenantProducts.filter((p: any) => selectedSkuIds.has(p.id));

      // Add new classes that don't exist yet
      let colorIdx = classes.length;
      for (const product of selectedProducts) {
        if (!existingClassNames.has(product.name.toLowerCase())) {
          await createClass.mutateAsync({
            dataset_id: selectedDatasetId,
            name: product.name,
            color: CLASS_COLORS[colorIdx % CLASS_COLORS.length],
          });
          colorIdx++;
        }
      }

      // Delete classes that are no longer selected (only if they came from products)
      const selectedNames = new Set(selectedProducts.map((p: any) => p.name.toLowerCase()));
      for (const cls of classes) {
        const isProductClass = tenantProducts.some((p: any) => p.name.toLowerCase() === cls.name.toLowerCase());
        if (isProductClass && !selectedNames.has(cls.name.toLowerCase())) {
          await deleteClass.mutateAsync(cls.id);
        }
      }

      // Update dataset class_count
      await updateDataset.mutateAsync({ id: selectedDatasetId, class_count: selectedSkuIds.size });

      qc.invalidateQueries({ queryKey: ['dataset-classes', selectedDatasetId] });
      toast({ title: 'Classes saved', description: `${selectedSkuIds.size} classes selected.` });
    } catch (err: any) {
      toast({ title: 'Error saving classes', description: err.message, variant: 'destructive' });
    } finally {
      setSavingClasses(false);
    }
  };

  const toggleSkuSelection = (skuId: string) => {
    setSelectedSkuIds(prev => {
      const next = new Set(prev);
      if (next.has(skuId)) next.delete(skuId);
      else next.add(skuId);
      return next;
    });
  };

  const toggleCategorySelection = (products: any[]) => {
    setSelectedSkuIds(prev => {
      const next = new Set(prev);
      const allSelected = products.every(p => next.has(p.id));
      if (allSelected) {
        products.forEach(p => next.delete(p.id));
      } else {
        products.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const selectAllSkus = () => {
    setSelectedSkuIds(new Set(tenantProducts.map((p: any) => p.id)));
  };

  const deselectAllSkus = () => {
    setSelectedSkuIds(new Set());
  };

  // ─── Upload (Supabase storage) ─────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDatasetId || !e.target.files?.length) return;
    const files = Array.from(e.target.files).slice(0, 500);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast({ title: 'No valid images', description: 'Only image files are accepted.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      await uploadImages.mutateAsync({ datasetId: selectedDatasetId, files: validFiles });
      toast({ title: 'Images uploaded', description: `${validFiles.length} image(s) uploaded successfully.` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Image Set Upload ─────────────────────────────────
  const openUploadSetModal = () => {
    setUploadSetName(`Set ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
    setUploadSetFiles([]);
    setShowUploadModal(true);
  };

  const handleSetFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    setUploadSetFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeUploadFile = (index: number) => {
    setUploadSetFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveImageSet = async () => {
    if (!selectedDatasetId || !uploadSetName.trim() || uploadSetFiles.length === 0) {
      toast({ title: 'Missing info', description: 'Provide a name and at least one image.', variant: 'destructive' });
      return;
    }
    setUploadingSet(true);
    try {
      const set = await createImageSet.mutateAsync({ dataset_id: selectedDatasetId, name: uploadSetName.trim() });
      await uploadToSet.mutateAsync({ datasetId: selectedDatasetId, imageSetId: set.id, files: uploadSetFiles });
      await updateImageSet.mutateAsync({ id: set.id, image_count: uploadSetFiles.length });
      // Update dataset image_count
      const totalImages = (images?.length || 0) + uploadSetFiles.length;
      await rest.update('datasets', { id: `eq.${selectedDatasetId}` }, { image_count: totalImages });
      qc.invalidateQueries({ queryKey: ['datasets'] });
      qc.invalidateQueries({ queryKey: ['dataset-images', selectedDatasetId] });
      setShowUploadModal(false);
      toast({ title: 'Image set saved', description: `${uploadSetFiles.length} images uploaded to "${uploadSetName}".` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingSet(false);
    }
  };

  const toggleSetSelection = (setId: string) => {
    setSelectedSetIds(prev => {
      const next = new Set(prev);
      if (next.has(setId)) next.delete(setId);
      else next.add(setId);
      return next;
    });
  };

  const handleDeleteImageSet = async () => {
    if (!deleteSetId) return;
    await deleteImageSet.mutateAsync(deleteSetId);
    setSelectedSetIds(prev => { const n = new Set(prev); n.delete(deleteSetId); return n; });
    setDeleteSetId(null);
  };

  // Get images for a specific set
  const getSetImages = (setId: string) => images.filter(img => (img as any).image_set_id === setId);
  const getSetAnnotatedCount = (setId: string) => getSetImages(setId).filter(img => img.is_annotated).length;

  // Auto-annotate entire set
  const autoAnnotateSet = async (setId: string) => {
    const setImages = getSetImages(setId);
    if (setImages.length === 0) {
      toast({ title: 'No images', description: 'This set has no images.', variant: 'destructive' });
      return;
    }
    setAutoAnnotatingSetId(setId);
    try {
      let annotatedCount = 0;
      for (const img of setImages) {
        try {
          const res = await invoke('roboflow-detect', { image_url: img.image_url });
          const predictions = res?.predictions || res?.outputs?.flatMap((o: any) => o?.predictions || []) || [];
          const newBboxes = predictions.map((pred: any) => {
            const predLabel = pred.class || pred.label || 'unknown';
            const matchedClass = annotationClasses.find(c => c.name.toLowerCase() === predLabel.toLowerCase());
            const imgWidth = pred.image?.width || 640;
            const imgHeight = pred.image?.height || 640;
            return {
              id: crypto.randomUUID(),
              classId: matchedClass?.id || '',
              className: matchedClass?.name || predLabel,
              color: matchedClass?.color || '#9CA3AF',
              x: Math.max(0, ((pred.x || 0) - (pred.width || 0) / 2) / imgWidth),
              y: Math.max(0, ((pred.y || 0) - (pred.height || 0) / 2) / imgHeight),
              w: Math.min(1, (pred.width || 0) / imgWidth),
              h: Math.min(1, (pred.height || 0) / imgHeight),
              isRegistered: !!matchedClass,
            };
          });
          const registeredBboxes = newBboxes.filter((b: any) => b.isRegistered);
          if (registeredBboxes.length > 0) {
            await updateAnnotations.mutateAsync({ imageId: img.id, annotations: registeredBboxes });
            annotatedCount++;
          }
        } catch { /* continue */ }
      }
      toast({ title: 'Auto-annotation complete', description: `${annotatedCount}/${setImages.length} images annotated.` });
    } catch (err: any) {
      toast({ title: 'Auto-annotate failed', description: err.message, variant: 'destructive' });
    } finally {
      setAutoAnnotatingSetId(null);
    }
  };

  const toInferencingImageUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      parsed.pathname = parsed.pathname.replace('/storage/v1/object/dataset-images/', '/storage/v1/object/public/dataset-images/');
      return parsed.toString();
    } catch {
      return url.replace('/storage/v1/object/dataset-images/', '/storage/v1/object/public/dataset-images/');
    }
  };

  const toAnnotationBoxes = (predictions: any[], imageMeta?: { width?: number; height?: number }): BBox[] => predictions.map((pred: any) => {
    const predLabel = pred.pred_label || pred.class || pred.label || 'unknown';
    const matchedClass = annotationClasses.find(c => c.name.toLowerCase() === String(predLabel).toLowerCase());
    const imgWidth = Number(pred.image?.width || pred.image_width || imageMeta?.width || 640);
    const imgHeight = Number(pred.image?.height || pred.image_height || imageMeta?.height || 640);

    let bx = 0;
    let by = 0;
    let bw = 0;
    let bh = 0;

    if (Array.isArray(pred.bbox) && pred.bbox.length === 4) {
      const [x1, y1, x2, y2] = pred.bbox.map((v: any) => Number(v) || 0);
      bx = x1 / imgWidth;
      by = y1 / imgHeight;
      bw = Math.max(0, x2 - x1) / imgWidth;
      bh = Math.max(0, y2 - y1) / imgHeight;
    } else {
      bx = ((Number(pred.x) || 0) - (Number(pred.width) || 0) / 2) / imgWidth;
      by = ((Number(pred.y) || 0) - (Number(pred.height) || 0) / 2) / imgHeight;
      bw = (Number(pred.width) || 0) / imgWidth;
      bh = (Number(pred.height) || 0) / imgHeight;
    }

    const safeX = Math.max(0, Math.min(1, bx));
    const safeY = Math.max(0, Math.min(1, by));

    return {
      id: crypto.randomUUID(),
      classId: matchedClass?.id || '',
      className: matchedClass?.name || String(predLabel),
      color: matchedClass?.color || '#9CA3AF',
      x: safeX,
      y: safeY,
      w: Math.max(0, Math.min(1 - safeX, bw)),
      h: Math.max(0, Math.min(1 - safeY, bh)),
      isRegistered: !!matchedClass,
    };
  });

  const autoAnnotateSelectedSets = async () => {
    if (!selectedDatasetId) return;

    const selectedImages = images.filter(img => selectedSetIds.has((img as any).image_set_id));
    if (selectedImages.length === 0) {
      toast({ title: 'No images', description: 'Selected sets have no images.', variant: 'destructive' });
      return;
    }

    const endpoint = localStorage.getItem(INFERENCING_ENDPOINT_STORAGE_KEY)?.replace(/\/+$/, '');
    if (!endpoint) {
      toast({
        title: 'Inferencing endpoint missing',
        description: 'Open Training Settings and set an inferencing endpoint first.',
        variant: 'destructive',
      });
      return;
    }

    const statusIsSuccess = (status: string) => ['completed', 'done', 'success', 'succeeded', 'finished'].some(token => status.includes(token));
    const statusIsFailure = (status: string) => ['failed', 'error', 'cancelled', 'canceled', 'timeout'].some(token => status.includes(token));

    const imageChunks: DatasetImage[][] = [];
    for (let index = 0; index < selectedImages.length; index += AUTO_ANNOTATE_BATCH_SIZE) {
      imageChunks.push(selectedImages.slice(index, index + AUTO_ANNOTATE_BATCH_SIZE));
    }

    setSelectedSetsAutoAnnotate({
      running: true,
      stage: 'submitting',
      jobId: null,
      total: selectedImages.length,
      processed: 0,
      saved: 0,
      failed: 0,
    });

    try {
      const imagesById = new Map(selectedImages.map(img => [img.id, img]));
      const imagesByFileName = new Map(selectedImages.map(img => [img.file_name, img]));

      // Extract image_id from image_rel path pattern: {jobId}/input/{idx}_{imageId}_{fileName}
      const extractImageId = (result: any): string | null => {
        const rel = result.image_rel || '';
        const match = rel.match(/\d+_([0-9a-f-]{36})_/);
        return match ? match[1] : null;
      };

      let saved = 0;
      let failed = 0;
      let processedOverall = 0;

      for (const chunk of imageChunks) {
        setSelectedSetsAutoAnnotate(prev => ({ ...prev, stage: 'submitting' }));

        const chunkSetIds = Array.from(new Set(chunk.map(img => (img as any).image_set_id).filter(Boolean)));

        const submitResponse = await fetch(`${endpoint}/v1/jobs/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataset_id: selectedDatasetId,
            image_set_ids: chunkSetIds,
            images: chunk.map(img => ({
              image_id: img.id,
              image_url: toInferencingImageUrl(img.image_url),
              file_name: img.file_name,
            })),
            classes: annotationClasses.map(c => ({ id: c.id, name: c.name })),
          }),
        });

        const submitData = await submitResponse.json();
        if (!submitResponse.ok) {
          throw new Error(submitData?.error || submitData?.detail || submitData?.message || 'Failed to submit auto-annotation job');
        }

        const jobId = submitData.job_id || submitData.jobId;
        if (!jobId) throw new Error('Inference job response did not include job_id');

        setSelectedSetsAutoAnnotate(prev => ({ ...prev, stage: 'queued', jobId }));

        let statusData: any = null;
        let attempts = 0;
        const maxAttemptsForChunk = Math.max(AUTO_ANNOTATE_MAX_POLL_ATTEMPTS, Math.ceil(chunk.length / 10) * 60);

        while (attempts < maxAttemptsForChunk) {
          attempts += 1;
          setSelectedSetsAutoAnnotate(prev => ({ ...prev, stage: 'polling' }));

          await new Promise(resolve => setTimeout(resolve, AUTO_ANNOTATE_POLL_INTERVAL_MS));

          const statusResponse = await fetch(`${endpoint}/v1/jobs/${jobId}`);
          statusData = await statusResponse.json();
          if (!statusResponse.ok) {
            throw new Error(statusData?.error || statusData?.detail || 'Failed to poll auto-annotation job');
          }

          const processedChunk = Number(statusData.processed ?? statusData.progress?.processed ?? 0);
          const safeProcessedChunk = Math.max(0, Math.min(chunk.length, processedChunk));
          setSelectedSetsAutoAnnotate(prev => ({
            ...prev,
            processed: Math.min(prev.total, processedOverall + safeProcessedChunk),
          }));

          const jobStatus = String(statusData.status ?? statusData.state ?? statusData.job_status ?? '').toLowerCase();
          console.log(`[auto-annotate] poll #${attempts} status=${jobStatus}`, statusData);
          if (statusIsSuccess(jobStatus)) break;
          if (statusIsFailure(jobStatus)) {
            throw new Error(statusData?.error || statusData?.detail || 'Auto-annotation job failed');
          }
        }

        const finalStatus = String(statusData?.status ?? statusData?.state ?? statusData?.job_status ?? '').toLowerCase();
        const results = (statusData?.results || statusData?.images || []) as any[];

        if (!statusIsSuccess(finalStatus)) {
          throw new Error('Auto-annotation job timed out');
        }

        setSelectedSetsAutoAnnotate(prev => ({
          ...prev,
          stage: 'saving',
          processed: Math.min(prev.total, processedOverall + chunk.length),
        }));

        for (const result of results) {
          const extractedId = extractImageId(result);
          const resolvedImage =
            imagesById.get(result.image_id || result.imageId || extractedId) ||
            imagesByFileName.get(result.file_name || result.fileName);
          if (!resolvedImage) {
            failed += 1;
            continue;
          }

          // Load actual image dimensions for accurate bbox normalization
          let imgWidth = result.image?.width || result.image_width;
          let imgHeight = result.image?.height || result.image_height;
          if (!imgWidth || !imgHeight) {
            try {
              const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = () => reject(new Error('Failed to load image for dimensions'));
                // Use authenticated fetch to get image as blob
                const token = localStorage.getItem('shelfvision_access_token');
                const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
                const headers: Record<string, string> = {};
                if (apiKey) headers['apikey'] = apiKey;
                if (token) headers['Authorization'] = `Bearer ${token}`;
                fetch(resolvedImage.image_url, { headers })
                  .then(r => r.blob())
                  .then(blob => { img.src = URL.createObjectURL(blob); })
                  .catch(reject);
              });
              imgWidth = dims.w;
              imgHeight = dims.h;
            } catch {
              // fallback: leave undefined, toAnnotationBoxes will use 640
            }
          }

          const predictions = result.predictions || result.annotations || result.objects || [];
          const boxes = toAnnotationBoxes(predictions, { width: imgWidth, height: imgHeight });

          // Save ALL boxes (registered + unregistered) so they appear in annotation view
          try {
            await updateAnnotations.mutateAsync({ imageId: resolvedImage.id, annotations: boxes });
            saved += 1;
          } catch {
            failed += 1;
          }

          setSelectedSetsAutoAnnotate(prev => ({ ...prev, saved, failed }));
        }

        processedOverall += chunk.length;
      }

      qc.invalidateQueries({ queryKey: ['dataset-images', selectedDatasetId] });
      toast({
        title: 'Auto-annotation complete',
        description: `Saved annotations for ${saved}/${selectedImages.length} images${failed ? ` (${failed} failed)` : ''}.`,
      });
    } catch (err: any) {
      toast({ title: 'Auto-annotate failed', description: err.message || 'Request failed', variant: 'destructive' });
    } finally {
      setSelectedSetsAutoAnnotate(SELECTED_SETS_AUTO_ANNOTATE_INITIAL);
    }
  };

  // Build training request preview JSON
  const buildTrainingRequestPayload = () => {
    const selectedImages = selectedSetIds.size > 0
      ? images.filter(img => selectedSetIds.has((img as any).image_set_id))
      : images;
    
    return {
      dataset_id: selectedDatasetId,
      dataset_name: selectedDataset?.name,
      config: trainingConfig,
      classes: annotationClasses.map(c => ({ id: c.id, name: c.name, color: c.color })),
      images: selectedImages.map(img => ({
        id: img.id,
        image_url: img.image_url,
        file_name: img.file_name,
        is_annotated: img.is_annotated,
        annotations: (img.annotations as any[]) || [],
      })),
      summary: {
        total_images: selectedImages.length,
        annotated_images: selectedImages.filter(i => i.is_annotated).length,
        total_classes: annotationClasses.length,
        total_annotations: selectedImages.reduce((a, img) => a + ((img.annotations as any[])?.length || 0), 0),
      },
    };
  };

  // ─── Annotator ─────────────────────────────────────────
  const openAnnotator = (img: DatasetImage) => {
    setAnnotatingImage(img);
    setBboxes((img.annotations as any as BBox[]) || []);
    setActiveTab('annotate');
  };

  // Get the scoped image list (set-scoped or all)
  const annotationScopeImages = useMemo(() => {
    if (annotatingSetId === '__selected__') return images.filter(img => selectedSetIds.has((img as any).image_set_id));
    if (annotatingSetId) return images.filter(img => (img as any).image_set_id === annotatingSetId);
    return images;
  }, [images, annotatingSetId, selectedSetIds]);

  const startManualAnnotation = (setId: string) => {
    const setImgs = images.filter(img => (img as any).image_set_id === setId);
    if (setImgs.length === 0) {
      toast({ title: 'No images', description: 'This set has no images.', variant: 'destructive' });
      return;
    }
    // Start with first unannotated image, or first image if all annotated
    const firstUnannotated = setImgs.find(img => !img.is_annotated) || setImgs[0];
    setAnnotatingSetId(setId);
    setAnnotatingImage(firstUnannotated);
    setBboxes((firstUnannotated.annotations as any as BBox[]) || []);
    setActiveTab('annotate');
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const scopeImages = annotationScopeImages;
    if (!annotatingImage || scopeImages.length === 0) return;
    const currentIndex = scopeImages.findIndex(img => img.id === annotatingImage.id);
    if (currentIndex === -1) return;
    const newIndex = direction === 'prev'
      ? (currentIndex - 1 + scopeImages.length) % scopeImages.length
      : (currentIndex + 1) % scopeImages.length;
    const newImg = scopeImages[newIndex];
    if (annotatingImage) {
      updateAnnotations.mutateAsync({ imageId: annotatingImage.id, annotations: bboxes as any }).catch(() => {});
    }
    setAnnotatingImage(newImg);
    setBboxes((newImg.annotations as any as BBox[]) || []);
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
    if (w < 0.01 || h < 0.01) { setDrawing(false); return; }

    const cls = annotationClasses.find(c => c.id === activeClassId);
    if (!cls) { setDrawing(false); return; }

    setBboxes(prev => [...prev, {
      id: crypto.randomUUID(),
      classId: cls.id, className: cls.name, color: cls.color,
      x, y, w, h,
      isRegistered: true,
    }]);
    setDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const removeBbox = (id: string) => setBboxes(prev => prev.filter(b => b.id !== id));

  const handleBboxDoubleClick = (bboxId: string) => {
    setChangingClassBboxId(bboxId);
  };

  const changeBboxClass = (bboxId: string, newClassId: string) => {
    const cls = annotationClasses.find(c => c.id === newClassId);
    if (!cls) return;
    setBboxes(prev => prev.map(b => b.id === bboxId ? { ...b, classId: cls.id, className: cls.name, color: cls.color } : b));
    setChangingClassBboxId(null);
  };

  const saveAnnotations = async () => {
    if (!annotatingImage) return;
    const registeredOnly = bboxes.filter(b => b.isRegistered);
    await updateAnnotations.mutateAsync({ imageId: annotatingImage.id, annotations: registeredOnly as any });
    toast({ title: 'Annotations saved', description: registeredOnly.length < bboxes.length ? `${bboxes.length - registeredOnly.length} unregistered detection(s) excluded.` : undefined });
  };

  // ─── Auto-annotate ────────────────────────────────────
  const autoAnnotate = async (img: DatasetImage) => {
    setAutoAnnotating(true);
    try {
      const res = await invoke('roboflow-detect', { image_url: img.image_url });
      
      const predictions = res?.predictions || res?.outputs?.flatMap((o: any) => o?.predictions || []) || [];
      
      const newBboxes: BBox[] = predictions.map((pred: any) => {
        const predLabel = pred.class || pred.label || 'unknown';
        const matchedClass = annotationClasses.find(c => c.name.toLowerCase() === predLabel.toLowerCase());
        
        const imgWidth = pred.image?.width || 640;
        const imgHeight = pred.image?.height || 640;
        const bx = ((pred.x || 0) - (pred.width || 0) / 2) / imgWidth;
        const by = ((pred.y || 0) - (pred.height || 0) / 2) / imgHeight;
        const bw = (pred.width || 0) / imgWidth;
        const bh = (pred.height || 0) / imgHeight;
        
        return {
          id: crypto.randomUUID(),
          classId: matchedClass?.id || '',
          className: matchedClass?.name || predLabel,
          color: matchedClass?.color || '#9CA3AF',
          x: Math.max(0, bx),
          y: Math.max(0, by),
          w: Math.min(1 - Math.max(0, bx), bw),
          h: Math.min(1 - Math.max(0, by), bh),
          isRegistered: !!matchedClass,
        };
      });

      setAnnotatingImage(img);
      setBboxes(newBboxes);
      setActiveTab('annotate');
      toast({ title: 'Auto-annotation complete', description: `${newBboxes.length} annotations detected.` });
    } catch (err: any) {
      toast({ title: 'Auto-annotate failed', description: err.message, variant: 'destructive' });
    } finally {
      setAutoAnnotating(false);
    }
  };

  // ─── Image Preview Navigation ─────────────────────────
  const openImagePreview = (index: number) => {
    setPreviewImageIndex(index);
  };
  const closeImagePreview = () => setPreviewImageIndex(null);
  const navigatePreview = (direction: 'prev' | 'next') => {
    if (previewImageIndex === null || images.length === 0) return;
    const newIndex = direction === 'prev'
      ? (previewImageIndex - 1 + images.length) % images.length
      : (previewImageIndex + 1) % images.length;
    setPreviewImageIndex(newIndex);
  };

  // ─── Classes (manual add - kept for custom classes) ────
  const openNewClass = () => {
    setEditingClass(null);
    setClassForm({ name: '', color: CLASS_COLORS[classes.length % CLASS_COLORS.length] });
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

  // ─── Export ────────────────────────────────────────────
  const exportDataset = async () => {
    if (!selectedDatasetId) return;
    setExporting(true);
    try {
      const res = await invoke('export-dataset', { dataset_id: selectedDatasetId });
      const blob = new Blob([res], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset-${selectedDataset?.name || selectedDatasetId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Dataset exported', description: 'YOLOv8-format ZIP downloaded.' });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // ─── Model versioning ─────────────────────────────────
  const handleActivateModel = async (jobId: string) => {
    try {
      await rest.update('training_jobs', { id: `eq.${jobId}` }, { status: 'completed' });
      if (selectedDatasetId) {
        // Deactivate other completed jobs for this dataset
        const otherJobs = jobs.filter(j => j.id !== jobId && j.status === 'completed');
        for (const j of otherJobs) {
          await rest.update('training_jobs', { id: `eq.${j.id}` }, { status: 'pending' });
        }
      }
      qc.invalidateQueries({ queryKey: ['training-jobs'] });
      toast({ title: 'Model activated', description: 'This model version is now active.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleSuspendModel = async (jobId: string) => {
    try {
      await rest.update('training_jobs', { id: `eq.${jobId}` }, { status: 'pending' });
      qc.invalidateQueries({ queryKey: ['training-jobs'] });
      toast({ title: 'Model suspended' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteTraining = async (jobId: string) => {
    try {
      await rest.remove('training_jobs', jobId);
      qc.invalidateQueries({ queryKey: ['training-jobs'] });
      toast({ title: 'Training removed' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // ─── Training ──────────────────────────────────────────
  const startTraining = async () => {
    if (!selectedDatasetId) return;
    setTrainingStarting(true);
    try {
      const data = await invoke('start-training', {
        dataset_id: selectedDatasetId,
        epochs: trainForm.epochs,
        batch_size: trainForm.batch_size,
        config: trainingConfig,
      });
      setShowTrainModal(false);
      toast({ title: 'Training job started', description: data?.message || 'The model is being trained.' });
      qc.invalidateQueries({ queryKey: ['training-jobs'] });
    } catch (e: any) {
      toast({ title: 'Training failed', description: e.message, variant: 'destructive' });
    } finally {
      setTrainingStarting(false);
    }
  };

  useEffect(() => {
    if (!activeClassId && annotationClasses.length > 0) setActiveClassId(annotationClasses[0].id);
  }, [annotationClasses, activeClassId]);

  const TAB_CONFIG = [
    { value: 'datasets', label: 'Datasets', icon: FolderOpen },
    { value: 'classes', label: 'Classes', icon: Tag, disabled: !selectedDatasetId },
    { value: 'images', label: 'Images', icon: ImageIcon, disabled: !selectedDatasetId },
    { value: 'annotate', label: 'Annotate', icon: Square, disabled: !selectedDatasetId },
    { value: 'train', label: 'Train', icon: Brain, disabled: !selectedDatasetId },
  ];

  return (
    <MainLayout title="Training" subtitle="Manage datasets, annotate images, and train models">
      {/* Filters bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Select value={filterAdmin} onValueChange={v => { setFilterAdmin(v); if (v !== 'all') setFilterTenant('all'); }}>
            <SelectTrigger className="w-[170px] bg-secondary border-border">
              <SelectValue placeholder="All Admins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Admins</SelectItem>
              {adminsForTraining.map((a: any) => (
                <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTenant} onValueChange={setFilterTenant}>
            <SelectTrigger className="w-[170px] bg-secondary border-border">
              <SelectValue placeholder="All Tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {filteredTenantsForFilter.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(true)}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
          {selectedDataset && (
            <div className="ml-auto">
              <Badge variant="outline" className="text-xs">
                Selected: <span className="font-semibold ml-1">{selectedDataset.name}</span>
              </Badge>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="inline-flex h-12 items-center gap-1 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-1.5 shadow-lg shadow-primary/5">
            {TAB_CONFIG.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary/50",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.value === 'datasets' && <Badge variant="secondary" className="ml-1">{filteredDatasets.length}</Badge>}
                {tab.value === 'classes' && selectedDatasetId && <Badge variant="secondary" className="ml-1">{classes.length}</Badge>}
                {tab.value === 'images' && selectedDatasetId && <Badge variant="secondary" className="ml-1">{images.length}</Badge>}
                {tab.value === 'train' && selectedDatasetId && <Badge variant="secondary" className="ml-1">{jobs.length}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ─── Datasets Tab ─────────────────────── */}
        <TabsContent value="datasets">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">All Datasets</h3>
            <Button onClick={openNewDataset} size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Dataset
            </Button>
          </div>
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasetsLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredDatasets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16 text-muted-foreground">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No datasets yet. Create one to get started.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDatasets.map(d => {
                      const tenant = tenants.find((t: any) => t.id === d.tenant_id);
                      const admin = tenant?.admin_id ? adminsForTraining.find((a: any) => a.id === tenant.admin_id) : null;
                      return (
                        <TableRow
                          key={d.id}
                          className={cn(
                            "cursor-pointer transition-colors",
                            selectedDatasetId === d.id && "bg-primary/5 border-l-2 border-l-primary"
                          )}
                          onClick={() => setSelectedDatasetId(d.id)}
                        >
                          <TableCell>
                            <input
                              type="radio"
                              name="dataset"
                              checked={selectedDatasetId === d.id}
                              onChange={() => setSelectedDatasetId(d.id)}
                              className="accent-primary"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell>
                            {admin ? (
                              <Badge variant="outline" className="text-xs">{admin.full_name}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {tenant ? (
                              <Badge variant="outline" className="text-xs">{tenant.name}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {d.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={d.status === 'ready' ? 'default' : 'secondary'} className="text-[10px]">
                              {d.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{d.image_count}</TableCell>
                          <TableCell>{d.class_count}</TableCell>
                          <TableCell>{format(new Date(d.created_at), 'PP')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={(e) => { e.stopPropagation(); openEditDataset(d); }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDatasetId(d.id); }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* ─── Classes Tab ──────────────────────────────── */}
        <TabsContent value="classes">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-semibold text-foreground">
              SKU Classes — {selectedDataset?.name}
              <span className="text-muted-foreground ml-2">({selectedSkuIds.size} selected, {classes.length} saved)</span>
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllSkus} disabled={tenantProducts.length === 0}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllSkus} disabled={selectedSkuIds.size === 0}>
                Deselect All
              </Button>
              <Button onClick={saveSelectedClasses} size="sm" disabled={savingClasses || tenantProducts.length === 0}>
                {savingClasses ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Classes
              </Button>
            </div>
          </div>

          {tenantProducts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground rounded-xl bg-card border border-border">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No products found for this tenant. Add products in Management first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {productsByCategory.map(group => {
                const allSelected = group.products.every(p => selectedSkuIds.has(p.id));
                const someSelected = group.products.some(p => selectedSkuIds.has(p.id));
                return (
                  <div key={group.categoryId || 'uncategorized'} className="rounded-xl bg-card border border-border overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 bg-secondary/50 border-b border-border cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => toggleCategorySelection(group.products)}
                    >
                      <Checkbox
                        checked={allSelected}
                        className={someSelected && !allSelected ? 'opacity-50' : ''}
                        onCheckedChange={() => toggleCategorySelection(group.products)}
                      />
                      <h4 className="text-sm font-semibold text-foreground">{group.categoryName}</h4>
                      <Badge variant="secondary" className="text-[10px] ml-auto">
                        {group.products.filter(p => selectedSkuIds.has(p.id)).length}/{group.products.length}
                      </Badge>
                    </div>
                    <div className="divide-y divide-border">
                      {group.products.map((product: any, idx: number) => {
                        const colorIdx = tenantProducts.indexOf(product);
                        const color = CLASS_COLORS[colorIdx % CLASS_COLORS.length];
                        const isSelected = selectedSkuIds.has(product.id);
                        return (
                          <div
                            key={product.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                              isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
                            )}
                            onClick={() => toggleSkuSelection(product.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSkuSelection(product.id)}
                            />
                            <span
                              className="w-4 h-4 rounded-sm shrink-0 border border-border"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm text-foreground font-medium flex-1">{product.name}</span>
                            {product.barcode && (
                              <span className="text-[10px] text-muted-foreground">{product.barcode}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Saved classes section */}
              {classes.length > 0 && (
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="px-4 py-3 bg-secondary/50 border-b border-border">
                    <h4 className="text-sm font-semibold text-foreground">Saved Classes ({classes.length})</h4>
                  </div>
                  <div className="divide-y divide-border">
                    {classes.map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-sm text-foreground font-medium flex-1">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), 'PP')}</span>
                        <Button size="icon" variant="ghost" className="w-6 h-6 text-destructive" onClick={() => setDeleteClassId(c.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── Images Tab (Sets-based) ───────────────────── */}
        <TabsContent value="images" className="space-y-4">
          {selectedDataset && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-foreground">
                  {selectedDataset.name} — Image Sets ({imageSets.length})
                  <span className="text-muted-foreground ml-2 text-sm font-normal">Total: {images.length} images</span>
                </h3>
                <div className="flex gap-2">
                  <Button onClick={openUploadSetModal} size="sm">
                    <FolderPlus className="w-4 h-4 mr-2" /> Upload Images
                  </Button>
                </div>
              </div>

              {imageSets.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground rounded-xl bg-card border border-border">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No image sets yet. Click "Upload Images" to create a set.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {imageSets.map(set => {
                    const setImgs = getSetImages(set.id);
                    const annotatedCount = getSetAnnotatedCount(set.id);
                    const isSelected = selectedSetIds.has(set.id);
                    const isAutoAnnotating = autoAnnotatingSetId === set.id;
                    const progressPct = set.image_count > 0 ? (annotatedCount / set.image_count) * 100 : 0;
                    return (
                      <div
                        key={set.id}
                        className={cn(
                          "rounded-2xl bg-card border-2 transition-all duration-200 overflow-hidden group",
                          isSelected ? "border-primary shadow-lg shadow-primary/10" : "border-border hover:border-primary/40 hover:shadow-md"
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-start gap-3 p-4 pb-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSetSelection(set.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-semibold text-foreground text-sm truncate">{set.name}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Created {format(new Date(set.created_at), 'PPp')}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="w-7 h-7 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startManualAnnotation(set.id)} disabled={set.image_count === 0}>
                                <Square className="w-3.5 h-3.5 mr-2" /> Manual Annotate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => autoAnnotateSet(set.id)} disabled={isAutoAnnotating || set.image_count === 0}>
                                <Wand2 className="w-3.5 h-3.5 mr-2" /> Auto Annotate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteSetId(set.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Set
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Stats badges */}
                        <div className="flex items-center gap-1.5 px-4 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <ImageIcon className="w-3 h-3" />{set.image_count}
                          </Badge>
                          <Badge
                            variant={progressPct === 100 && set.image_count > 0 ? 'default' : 'outline'}
                            className="text-[10px] gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />{annotatedCount}/{set.image_count}
                          </Badge>
                          {set.is_trained && (
                            <Badge className="text-[10px] gap-1 bg-success/80 text-success-foreground">
                              <Brain className="w-3 h-3" /> Trained
                            </Badge>
                          )}
                          {isAutoAnnotating && (
                            <Badge variant="outline" className="text-[10px] gap-1 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" /> Annotating...
                            </Badge>
                          )}
                        </div>

                        {/* Annotation progress bar */}
                        <div className="px-4 pt-2">
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progressPct}%`,
                                background: progressPct === 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))',
                              }}
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{Math.round(progressPct)}% annotated</p>
                        </div>

                        {/* Preview thumbnails */}
                        {setImgs.length > 0 && (
                          <div className="px-4 pt-2 pb-3">
                            <div className="flex gap-1 overflow-x-auto">
                              {setImgs.slice(0, 8).map((img) => (
                                <div
                                  key={img.id}
                                  className="relative w-12 h-12 shrink-0 rounded-lg border border-border overflow-hidden cursor-pointer hover:ring-2 ring-primary/50 transition-all"
                                  onClick={() => openImagePreview(images.indexOf(img))}
                                >
                                  <AuthImage src={img.image_url} alt="" className="w-full h-full object-cover" />
                                  {img.is_annotated && (
                                    <div className="absolute inset-0 bg-success/10 flex items-center justify-center">
                                      <CheckCircle2 className="w-3 h-3 text-success drop-shadow" />
                                    </div>
                                  )}
                                </div>
                              ))}
                              {setImgs.length > 8 && (
                                <div className="w-12 h-12 shrink-0 rounded-lg border border-dashed border-border bg-secondary/50 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                                  +{setImgs.length - 8}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selection action bar */}
              {selectedSetIds.size > 0 && (
                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-sm text-foreground font-semibold">
                      {selectedSetIds.size} set(s) selected
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({images.filter(img => selectedSetIds.has((img as any).image_set_id)).length} total images)
                    </span>
                    {selectedSetsAutoAnnotate.running && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> {selectedSetsAutoAnnotate.stage}
                        </Badge>
                        {selectedSetsAutoAnnotate.jobId && (
                          <Badge variant="secondary" className="text-[10px]">
                            Job: {selectedSetsAutoAnnotate.jobId.slice(0, 8)}…
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">Processed: {selectedSetsAutoAnnotate.processed}/{selectedSetsAutoAnnotate.total}</Badge>
                        <Badge variant="default" className="text-[10px]">Saved: {selectedSetsAutoAnnotate.saved}</Badge>
                        {selectedSetsAutoAnnotate.failed > 0 && (
                          <Badge variant="destructive" className="text-[10px]">Failed: {selectedSetsAutoAnnotate.failed}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={selectedSetsAutoAnnotate.running}
                      onClick={() => {
                        // Start manual annotation for selected sets combined
                        const selectedImages = images.filter(img => selectedSetIds.has((img as any).image_set_id));
                        if (selectedImages.length === 0) {
                          toast({ title: 'No images', description: 'Selected sets have no images.', variant: 'destructive' });
                          return;
                        }
                        const firstUnannotated = selectedImages.find(img => !img.is_annotated) || selectedImages[0];
                        setAnnotatingSetId('__selected__');
                        setAnnotatingImage(firstUnannotated);
                        setBboxes((firstUnannotated.annotations as any as BBox[]) || []);
                        setActiveTab('annotate');
                      }}
                    >
                      <Square className="w-3.5 h-3.5 mr-1.5" />
                      Manual Annotate Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={autoAnnotateSelectedSets}
                      disabled={selectedSetsAutoAnnotate.running}
                    >
                      {selectedSetsAutoAnnotate.running ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Auto Annotate Selected
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedSetIds(new Set())} disabled={selectedSetsAutoAnnotate.running}>
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  </div>
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
              <div className="rounded-xl bg-card border border-border p-2">
                <div className="flex items-center justify-between mb-2 px-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => navigateImage('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{annotatingImage.file_name}</span>
                      {annotatingSetId && (() => {
                        const scopeImgs = annotationScopeImages;
                        const currentIdx = scopeImgs.findIndex(img => img.id === annotatingImage.id);
                        const annotatedInScope = scopeImgs.filter(i => i.is_annotated).length;
                        const setName = annotatingSetId === '__selected__'
                          ? `${selectedSetIds.size} Selected Sets`
                          : imageSets.find(s => s.id === annotatingSetId)?.name;
                        return (
                          <span className="text-[10px] text-muted-foreground">
                            {setName} — Image {currentIdx + 1} of {scopeImgs.length} • {annotatedInScope}/{scopeImgs.length} annotated
                          </span>
                        );
                      })()}
                    </div>
                    <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => navigateImage('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setAnnotatingImage(null); setBboxes([]); setAnnotatingSetId(null); }}>
                      <X className="w-3.5 h-3.5 mr-1" /> Close
                    </Button>
                    <Button size="sm" onClick={saveAnnotations}>Save Annotations</Button>
                  </div>
                </div>
                <div
                  className="relative select-none cursor-crosshair border border-border rounded overflow-hidden"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={() => { if (drawing) { setDrawing(false); setDrawStart(null); setDrawCurrent(null); } }}
                >
                  <AnnotationCanvasImage imgRef={imgRef} src={annotatingImage.image_url} />
                  {bboxes.map(box => (
                    <div
                      key={box.id}
                      className={`absolute group/box ${box.isRegistered ? 'border-2' : 'border-2 border-dashed'}`}
                      style={{
                        left: `${box.x * 100}%`, top: `${box.y * 100}%`,
                        width: `${box.w * 100}%`, height: `${box.h * 100}%`,
                        borderColor: box.color, backgroundColor: `${box.color}15`,
                      }}
                      onDoubleClick={(e) => { e.stopPropagation(); handleBboxDoubleClick(box.id); }}
                    >
                      <span className="absolute -top-5 left-0 text-[10px] font-medium px-1 rounded text-white whitespace-nowrap" style={{ backgroundColor: box.color }}>
                        {box.className}{!box.isRegistered && ' (unregistered)'}
                      </span>
                      <button
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover/box:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); removeBbox(box.id); }}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {drawing && drawStart && drawCurrent && (
                    <div
                      className="absolute border-2 border-dashed pointer-events-none"
                      style={{
                        left: `${Math.min(drawStart.x, drawCurrent.x) * 100}%`,
                        top: `${Math.min(drawStart.y, drawCurrent.y) * 100}%`,
                        width: `${Math.abs(drawCurrent.x - drawStart.x) * 100}%`,
                        height: `${Math.abs(drawCurrent.y - drawStart.y) * 100}%`,
                        borderColor: annotationClasses.find(c => c.id === activeClassId)?.color || '#3B82F6',
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Set annotation progress */}
                {annotatingSetId && (() => {
                  const scopeImgs = annotationScopeImages;
                  const annotatedCount = scopeImgs.filter(i => i.is_annotated).length;
                  const progressPct = scopeImgs.length > 0 ? (annotatedCount / scopeImgs.length) * 100 : 0;
                  return (
                    <div className="rounded-xl bg-card border border-border p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Annotation Progress</h4>
                      <Progress value={progressPct} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {annotatedCount} of {scopeImgs.length} images annotated ({Math.round(progressPct)}%)
                      </p>
                    </div>
                  );
                })()}
                <div className="rounded-xl bg-card border border-border p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Active Class</h4>
                  {annotationClasses.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No classes saved. Go to the Classes tab to select and save classes first.</p>
                  ) : (
                    <div className="space-y-1">
                      {annotationClasses.map(c => (
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
                <div className="rounded-xl bg-card border border-border p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Annotations ({bboxes.length})</h4>
                  <p className="text-[10px] text-muted-foreground mb-2">Double-click annotation to change class</p>
                  {bboxes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Draw bounding boxes on the image.</p>
                  ) : (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                      {bboxes.map(b => (
                        <div key={b.id} className="flex items-center justify-between text-xs px-1 py-1 rounded hover:bg-secondary">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: b.color }} />
                            <span className="text-foreground">{b.className}{!b.isRegistered && <span className="text-muted-foreground ml-1 italic">(unregistered)</span>}</span>
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

        {/* ─── Train Tab ────────────────────────────────── */}
        <TabsContent value="train" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-foreground">Training Jobs — {selectedDataset?.name}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreviewRequest(true)} disabled={!selectedDatasetId || images.length === 0}>
                <FileJson className="w-4 h-4 mr-2" /> Preview Request
              </Button>
              <Button variant="outline" size="sm" onClick={exportDataset} disabled={!selectedDatasetId || images.length === 0 || exporting}>
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export ZIP
              </Button>
              <Button size="sm" onClick={() => setShowTrainModal(true)} disabled={!selectedDatasetId || images.length === 0}>
                <Play className="w-4 h-4 mr-2" /> Start Training
              </Button>
            </div>
          </div>

          {selectedDataset && (
            <div className="rounded-xl bg-card border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Dataset Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Images</p><p className="font-semibold text-foreground">{images.length}</p></div>
                <div><p className="text-muted-foreground">Annotated</p><p className="font-semibold text-foreground">{images.filter(i => i.is_annotated).length}</p></div>
                <div><p className="text-muted-foreground">Classes</p><p className="font-semibold text-foreground">{annotationClasses.length}</p></div>
                <div><p className="text-muted-foreground">Total Annotations</p><p className="font-semibold text-foreground">{images.reduce((a, img) => a + ((img.annotations as any[])?.length || 0), 0)}</p></div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Model</TableHead>
                    <TableHead>Epochs</TableHead>
                    <TableHead>Batch Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No training jobs yet.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map(job => {
                      const cfg = statusConfig[job.status] || statusConfig.pending;
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.model_type.toUpperCase()}</TableCell>
                          <TableCell>{job.epochs}</TableCell>
                          <TableCell>{job.batch_size}</TableCell>
                          <TableCell><Badge className={cn("text-[10px]", cfg.className)}>{cfg.label}</Badge></TableCell>
                          <TableCell>
                            {job.status === 'training' ? (
                              <div className="w-24"><Progress value={Number(job.progress)} className="h-1.5" /></div>
                            ) : job.status === 'completed' ? (
                              <span className="text-xs text-success">100%</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{format(new Date(job.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {job.status === 'completed' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleActivateModel(job.id)}>
                                      <Play className="w-4 h-4 mr-2" />Activate Model
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSuspendModel(job.id)}>
                                      <Pause className="w-4 h-4 mr-2" />Suspend Model
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => setEvaluationJobId(job.id)}>
                                  <BarChart3 className="w-4 h-4 mr-2" />View Evaluation
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTraining(job.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />Remove Training
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Model Evaluation Details */}
          {evaluationJobId && (() => {
            const evalJob = jobs.find(j => j.id === evaluationJobId);
            if (!evalJob) return null;
            return (
              <div className="rounded-xl bg-card border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Model Evaluation — {evalJob.model_type.toUpperCase()}
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => setEvaluationJobId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold text-foreground">{evalJob.status}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground">Epochs</p>
                    <p className="font-semibold text-foreground">{evalJob.epochs}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground">Batch Size</p>
                    <p className="font-semibold text-foreground">{evalJob.batch_size}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="font-semibold text-foreground">{evalJob.progress || 0}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="text-sm text-foreground">{evalJob.started_at ? format(new Date(evalJob.started_at), 'PPpp') : 'Not started'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-sm text-foreground">{evalJob.completed_at ? format(new Date(evalJob.completed_at), 'PPpp') : 'In progress'}</p>
                  </div>
                </div>
                {evalJob.result_url && (
                  <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                    <p className="text-xs text-muted-foreground mb-1">Model Artifact</p>
                    <a href={evalJob.result_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">{evalJob.result_url}</a>
                  </div>
                )}
                {evalJob.error_message && (
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-xs text-muted-foreground mb-1">Error</p>
                    <p className="text-sm text-destructive">{evalJob.error_message}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground italic">
                  Detailed evaluation metrics (accuracy, F1, confusion matrix) will be populated by the training endpoint when available.
                </p>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* ─── Image Preview Dialog with Navigation ─────────── */}
      <Dialog open={previewImageIndex !== null} onOpenChange={() => closeImagePreview()}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Image Preview
              {previewImageIndex !== null && images[previewImageIndex] && (
                <span className="text-sm font-normal text-muted-foreground">
                  {images[previewImageIndex].file_name} ({previewImageIndex + 1} / {images.length})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewImageIndex !== null && images[previewImageIndex] && (
            <div className="relative">
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-card/80 backdrop-blur-sm"
                  onClick={() => navigatePreview('prev')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <AuthImage
                  src={images[previewImageIndex].image_url}
                  alt={images[previewImageIndex].file_name || ''}
                  className="max-h-[70vh] object-contain rounded-lg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-card/80 backdrop-blur-sm"
                  onClick={() => navigatePreview('next')}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex justify-center gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => { openAnnotator(images[previewImageIndex!]); closeImagePreview(); }}>
                  <Square className="w-4 h-4 mr-2" /> Annotate
                </Button>
                <Button size="sm" variant="outline" disabled={autoAnnotating} onClick={() => { autoAnnotate(images[previewImageIndex!]); closeImagePreview(); }}>
                  {autoAnnotating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Auto Annotate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Change Class Dialog ──────────────────────────── */}
      <Dialog open={!!changingClassBboxId} onOpenChange={() => setChangingClassBboxId(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change Annotation Class</DialogTitle>
            <DialogDescription>Select a new class for this annotation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {annotationClasses.map(c => (
              <button
                key={c.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left hover:bg-secondary"
                onClick={() => changingClassBboxId && changeBboxClass(changingClassBboxId, c.id)}
              >
                <span className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-foreground font-medium">{c.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Dataset Modal ────────────────────────────────── */}
      <Dialog open={showDatasetModal} onOpenChange={setShowDatasetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDataset ? 'Edit Dataset' : 'New Dataset'}</DialogTitle>
            <DialogDescription>{editingDataset ? 'Update dataset details.' : 'Create a new training dataset.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDatasetSubmit} className="space-y-4">
            <div><Label>Name</Label><Input value={datasetForm.name} onChange={e => setDatasetForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div><Label>Description</Label><Textarea value={datasetForm.description} onChange={e => setDatasetForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
            {!editingDataset && (
              <>
                <div>
                  <Label>Admin</Label>
                  <Select value={datasetForm.admin_id} onValueChange={v => setDatasetForm(p => ({ ...p, admin_id: v, tenant_id: '' }))}>
                    <SelectTrigger><SelectValue placeholder="Select admin..." /></SelectTrigger>
                    <SelectContent>
                      {adminsForTraining.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tenant</Label>
                  <Select
                    value={datasetForm.tenant_id}
                    onValueChange={v => setDatasetForm(p => ({ ...p, tenant_id: v }))}
                    disabled={!datasetForm.admin_id}
                  >
                    <SelectTrigger><SelectValue placeholder={datasetForm.admin_id ? "Select tenant..." : "Select admin first..."} /></SelectTrigger>
                    <SelectContent>
                      {filteredTenantsForForm.map((t: any) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDatasetModal(false)}>Cancel</Button>
              <Button type="submit">{editingDataset ? 'Update' : 'Create'}</Button>
            </div>
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
            <div><Label>Class Name</Label><Input value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {CLASS_COLORS.map(color => (
                  <button
                    key={color} type="button"
                    className={cn("w-8 h-8 rounded border-2 transition-all", classForm.color === color ? "border-foreground scale-110" : "border-transparent")}
                    style={{ backgroundColor: color }}
                    onClick={() => setClassForm(p => ({ ...p, color }))}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowClassModal(false)}>Cancel</Button>
              <Button type="submit">{editingClass ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Training Modal ───────────────────────────────── */}
      <Dialog open={showTrainModal} onOpenChange={setShowTrainModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Training</DialogTitle>
            <DialogDescription>Configure and start a training job.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Epochs</Label><Input type="number" value={trainForm.epochs} onChange={e => setTrainForm(p => ({ ...p, epochs: parseInt(e.target.value) || 100 }))} min={1} max={1000} /></div>
            <div><Label>Batch Size</Label><Input type="number" value={trainForm.batch_size} onChange={e => setTrainForm(p => ({ ...p, batch_size: parseInt(e.target.value) || 16 }))} min={1} max={128} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowTrainModal(false)}>Cancel</Button>
            <Button onClick={startTraining} disabled={trainingStarting}>
              {trainingStarting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Start Training
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Settings Modal ───────────────────────────────── */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Training Configuration</DialogTitle>
            <DialogDescription>Configure training parameters that will be sent to the training endpoint.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {/* General */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">General</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Seed</Label><Input type="number" value={trainingConfig.seed} onChange={e => setTrainingConfig(p => ({ ...p, seed: parseInt(e.target.value) || 42 }))} className="h-8 text-xs" /></div>
                </div>
              </div>

              {/* Data */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Data</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Root</Label><Input value={trainingConfig.data.root} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, root: e.target.value } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Mode</Label>
                    <Select value={trainingConfig.data.mode} onValueChange={v => setTrainingConfig(p => ({ ...p, data: { ...p.data, mode: v } }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pre_split">pre_split</SelectItem><SelectItem value="auto_split">auto_split</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Image Size W</Label><Input type="number" value={trainingConfig.data.image_size_w} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, image_size_w: parseInt(e.target.value) || 224 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Image Size H</Label><Input type="number" value={trainingConfig.data.image_size_h} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, image_size_h: parseInt(e.target.value) || 224 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Num Workers</Label><Input type="number" value={trainingConfig.data.num_workers} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, num_workers: parseInt(e.target.value) || 8 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Batch Size</Label><Input type="number" value={trainingConfig.data.batch_size} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, batch_size: parseInt(e.target.value) || 54 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Val Batch Size</Label><Input type="number" value={trainingConfig.data.val_batch_size} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, val_batch_size: parseInt(e.target.value) || 128 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Val Ratio</Label><Input type="number" step="0.05" value={trainingConfig.data.split.val_ratio} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, split: { ...p.data.split, val_ratio: parseFloat(e.target.value) || 0.25 } } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Test Ratio</Label><Input type="number" step="0.05" value={trainingConfig.data.split.test_ratio} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, split: { ...p.data.split, test_ratio: parseFloat(e.target.value) || 0.25 } } }))} className="h-8 text-xs" /></div>
                </div>
              </div>

              {/* Augmentation */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Augmentation</h4>
                <div className="flex items-center gap-2 mb-3">
                  <Switch checked={trainingConfig.data.augment.enabled} onCheckedChange={v => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, enabled: v } } }))} />
                  <Label className="text-xs">Enabled</Label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">HFlip Prob</Label><Input type="number" step="0.01" value={trainingConfig.data.augment.hflip_prob} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, hflip_prob: parseFloat(e.target.value) || 0 } } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Brightness/Contrast Prob</Label><Input type="number" step="0.01" value={trainingConfig.data.augment.brightness_contrast_prob} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, brightness_contrast_prob: parseFloat(e.target.value) || 0 } } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Brightness/Contrast</Label><Input type="number" step="0.01" value={trainingConfig.data.augment.brightness_contrast} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, brightness_contrast: parseFloat(e.target.value) || 0 } } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Hue/Sat Prob</Label><Input type="number" step="0.01" value={trainingConfig.data.augment.hue_saturation_prob} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, hue_saturation_prob: parseFloat(e.target.value) || 0 } } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Hue/Sat</Label><Input type="number" step="0.01" value={trainingConfig.data.augment.hue_saturation} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, hue_saturation: parseFloat(e.target.value) || 0 } } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Blur Prob</Label><Input type="number" step="0.01" value={trainingConfig.data.augment.blur_prob} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, blur_prob: parseFloat(e.target.value) || 0 } } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Perspective Prob</Label><Input type="number" step="0.01" value={trainingConfig.data.augment.perspective_prob} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, perspective_prob: parseFloat(e.target.value) || 0 } } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">JPEG Prob</Label><Input type="number" step="0.01" value={trainingConfig.data.augment.jpeg_prob} onChange={e => setTrainingConfig(p => ({ ...p, data: { ...p.data, augment: { ...p.data.augment, jpeg_prob: parseFloat(e.target.value) || 0 } } }))} className="h-8 text-xs" /></div>
                </div>
              </div>

              {/* Model */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Model</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Backbone</Label><Input value={trainingConfig.model.backbone} onChange={e => setTrainingConfig(p => ({ ...p, model: { ...p.model, backbone: e.target.value } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Dropout</Label><Input type="number" step="0.05" value={trainingConfig.model.dropout} onChange={e => setTrainingConfig(p => ({ ...p, model: { ...p.model, dropout: parseFloat(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                  <div className="flex items-center gap-2"><Switch checked={trainingConfig.model.pretrained} onCheckedChange={v => setTrainingConfig(p => ({ ...p, model: { ...p.model, pretrained: v } }))} /><Label className="text-xs">Pretrained</Label></div>
                </div>
              </div>

              {/* Train */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Training</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Start From</Label>
                    <Select value={trainingConfig.train.start_from} onValueChange={v => setTrainingConfig(p => ({ ...p, train: { ...p.train, start_from: v } }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pretrained">pretrained</SelectItem><SelectItem value="latest">latest</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Epochs</Label><Input type="number" value={trainingConfig.train.epochs} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, epochs: parseInt(e.target.value) || 200 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Learning Rate</Label><Input type="number" step="0.0001" value={trainingConfig.train.lr} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, lr: parseFloat(e.target.value) || 0.0005 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Weight Decay</Label><Input type="number" step="0.001" value={trainingConfig.train.weight_decay} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, weight_decay: parseFloat(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Optimizer</Label><Input value={trainingConfig.train.optimizer} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, optimizer: e.target.value } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Scheduler</Label><Input value={trainingConfig.train.scheduler} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, scheduler: e.target.value } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Warmup Epochs</Label><Input type="number" value={trainingConfig.train.warmup_epochs} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, warmup_epochs: parseInt(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Label Smoothing</Label><Input type="number" step="0.01" value={trainingConfig.train.label_smoothing} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, label_smoothing: parseFloat(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Open Set Loss Weight</Label><Input type="number" step="0.01" value={trainingConfig.train.open_set_loss_weight} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, open_set_loss_weight: parseFloat(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Precision</Label><Input value={trainingConfig.train.precision} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, precision: e.target.value } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Grad Clip Val</Label><Input type="number" step="0.1" value={trainingConfig.train.gradient_clip_val} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, gradient_clip_val: parseFloat(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Early Stop Patience</Label><Input type="number" value={trainingConfig.train.early_stop_patience} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, early_stop_patience: parseInt(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Early Stop Min Epochs</Label><Input type="number" value={trainingConfig.train.early_stop_min_epochs} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, early_stop_min_epochs: parseInt(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Monitor Metric</Label><Input value={trainingConfig.train.monitor_metric} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, monitor_metric: e.target.value } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Stop Threshold</Label><Input type="number" step="0.001" value={trainingConfig.train.stop_threshold} onChange={e => setTrainingConfig(p => ({ ...p, train: { ...p.train, stop_threshold: parseFloat(e.target.value) || 0 } }))} className="h-8 text-xs" /></div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Switch checked={trainingConfig.train.use_weighted_sampler} onCheckedChange={v => setTrainingConfig(p => ({ ...p, train: { ...p.train, use_weighted_sampler: v } }))} />
                  <Label className="text-xs">Use Weighted Sampler</Label>
                </div>
              </div>

              {/* Logging */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Logging</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Output Dir</Label><Input value={trainingConfig.logging.out_dir} onChange={e => setTrainingConfig(p => ({ ...p, logging: { ...p.logging, out_dir: e.target.value } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">WandB Project</Label><Input value={trainingConfig.logging.wandb_project} onChange={e => setTrainingConfig(p => ({ ...p, logging: { ...p.logging, wandb_project: e.target.value } }))} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Log Every N Steps</Label><Input type="number" value={trainingConfig.logging.log_every_n_steps} onChange={e => setTrainingConfig(p => ({ ...p, logging: { ...p.logging, log_every_n_steps: parseInt(e.target.value) || 10 } }))} className="h-8 text-xs" /></div>
                  <div className="flex items-center gap-2"><Switch checked={trainingConfig.logging.use_wandb} onCheckedChange={v => setTrainingConfig(p => ({ ...p, logging: { ...p.logging, use_wandb: v } }))} /><Label className="text-xs">Use WandB</Label></div>
                </div>
              </div>

              {/* Inference */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Inference</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Reject Threshold (empty = null)</Label><Input type="number" step="0.05" value={trainingConfig.inference.reject_threshold} onChange={e => setTrainingConfig(p => ({ ...p, inference: { ...p.inference, reject_threshold: e.target.value } }))} className="h-8 text-xs" placeholder="e.g., 0.7" /></div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setTrainingConfig(DEFAULT_TRAINING_CONFIG)}>Reset to Defaults</Button>
            <Button size="sm" onClick={() => { setShowSettingsModal(false); toast({ title: 'Settings saved' }); }}>Save Settings</Button>
          </div>
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

      {/* ─── Upload Image Set Modal (Full-page) ──────────── */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FolderPlus className="w-5 h-5 text-primary" /> Upload Image Set</DialogTitle>
            <DialogDescription>Name your set, add images, remove unwanted ones, then save.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Set Name</Label>
              <Input
                value={uploadSetName}
                onChange={e => setUploadSetName(e.target.value)}
                placeholder="e.g. Store A - Shelf 3"
              />
            </div>
            <div>
              <Label>Images ({uploadSetFiles.length})</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="set-file-input"
                  onChange={handleSetFileSelect}
                />
                <label htmlFor="set-file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select images or drag & drop</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WebP</p>
                </label>
              </div>
            </div>
            {uploadSetFiles.length > 0 && (
              <ScrollArea className="h-[40vh]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {uploadSetFiles.map((file, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border bg-secondary aspect-square">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeUploadFile(idx)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <span className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background text-[8px] px-1 truncate">
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">{uploadSetFiles.length} image(s) ready</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button onClick={handleSaveImageSet} disabled={uploadingSet || uploadSetFiles.length === 0 || !uploadSetName.trim()}>
                {uploadingSet ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Set
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Preview Request Dialog ───────────────────────── */}
      <Dialog open={showPreviewRequest} onOpenChange={setShowPreviewRequest}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileJson className="w-5 h-5 text-primary" /> Training Request Preview</DialogTitle>
            <DialogDescription>This JSON payload will be sent to the training endpoint.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="text-xs text-foreground bg-secondary/50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words font-mono">
              {JSON.stringify(buildTrainingRequestPayload(), null, 2)}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(buildTrainingRequestPayload(), null, 2));
                toast({ title: 'Copied to clipboard' });
              }}
            >
              Copy JSON
            </Button>
            <Button size="sm" onClick={() => setShowPreviewRequest(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Image Set Confirmation ────────────────── */}
      <AlertDialog open={!!deleteSetId} onOpenChange={() => setDeleteSetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image Set?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the set and all its images.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImageSet} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
