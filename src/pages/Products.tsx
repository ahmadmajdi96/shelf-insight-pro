import { useState } from 'react';
import { Plus, Search, Loader2, Pencil, Trash2, MoreVertical, Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AddProductModal } from '@/components/products/AddProductModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'text-muted-foreground bg-muted' },
  training: { icon: Clock, label: 'Training...', className: 'text-warning bg-warning/10' },
  completed: { icon: CheckCircle2, label: 'Trained', className: 'text-success bg-success/10' },
  failed: { icon: AlertCircle, label: 'Failed', className: 'text-destructive bg-destructive/10' },
};

export default function Products() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', barcode: '', category_id: '', width_cm: '' });
  
  const { products, isLoading, deleteProduct, updateProduct } = useProducts();
  const { categories } = useCategories();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.training_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const trainedCount = products.filter(p => p.training_status === 'completed').length;
  const trainingCount = products.filter(p => p.training_status === 'training').length;
  const pendingCount = products.filter(p => p.training_status === 'pending').length;

  const handleDelete = async () => {
    if (deleteId) { await deleteProduct.mutateAsync(deleteId); setDeleteId(null); }
  };

  const handleEdit = (product: any) => {
    setEditFormData({
      name: product.name,
      description: product.description || '',
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      width_cm: product.width_cm ? String(product.width_cm) : '',
    });
    setEditingProduct(product);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await updateProduct.mutateAsync({
        id: editingProduct.id,
        name: editFormData.name,
        description: editFormData.description || null,
        barcode: editFormData.barcode || null,
        category_id: editFormData.category_id || null,
        width_cm: editFormData.width_cm ? parseFloat(editFormData.width_cm) : null,
      });
      setEditingProduct(null);
    }
  };

  return (
    <MainLayout title="Products" subtitle="Manage your product catalog and training data.">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9 bg-card border-border" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
          <Button variant="glow" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{products.length}</p><p className="text-sm text-muted-foreground">Total Products</p></div>
        <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-success">{trainedCount}</p><p className="text-sm text-muted-foreground">Trained</p></div>
        <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-warning">{trainingCount}</p><p className="text-sm text-muted-foreground">Training</p></div>
        <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p><p className="text-sm text-muted-foreground">Pending</p></div>
      </div>

      {isLoading ? (
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
                          <DropdownMenuItem onClick={() => handleEdit(product)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(product.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{products.length === 0 ? 'No products yet. Add your first product to get started.' : 'No products found matching your criteria.'}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddProductModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) setEditingProduct(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Product Name</Label><Input value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="bg-secondary border-border" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Barcode</Label><Input value={editFormData.barcode} onChange={(e) => setEditFormData({ ...editFormData, barcode: e.target.value })} className="bg-secondary border-border font-mono" /></div>
              <div className="space-y-2"><Label>Width (cm)</Label><Input type="number" step="0.1" min="0" value={editFormData.width_cm} onChange={(e) => setEditFormData({ ...editFormData, width_cm: e.target.value })} className="bg-secondary border-border" placeholder="e.g., 8.5" /></div>
            </div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={editFormData.category_id} onValueChange={(v) => setEditFormData({ ...editFormData, category_id: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <Button type="submit" variant="glow" disabled={updateProduct.isPending}>{updateProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Product</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this product? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
