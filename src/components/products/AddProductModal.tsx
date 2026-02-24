import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useTenants } from '@/hooks/useTenants';
import { useQuota } from '@/hooks/useQuota';
import { useToast } from '@/hooks/use-toast';

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddProductModal({ open, onClose }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    barcode: '',
    tenantId: '',
    widthCm: '',
  });
  
  const { createProduct } = useProducts();
  const { categories } = useCategories();
  const { tenants } = useTenants();
  const { canAddSku, quota } = useQuota();
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({ name: '', description: '', categoryId: '', barcode: '', tenantId: '', widthCm: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantId) {
      toast({ title: 'Tenant required', description: 'Please select a tenant for this product.', variant: 'destructive' });
      return;
    }

    if (!canAddSku) {
      toast({ title: 'SKU Limit Reached', description: `You have reached your limit of ${quota?.skuLimit} SKUs.`, variant: 'destructive' });
      return;
    }

    await createProduct.mutateAsync({
      name: formData.name,
      description: formData.description || null,
      category_id: formData.categoryId || null,
      barcode: formData.barcode || null,
      tenant_id: formData.tenantId,
      width_cm: formData.widthCm ? parseFloat(formData.widthCm) : null,
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Filter categories by selected tenant
  const filteredCategories = formData.tenantId
    ? categories.filter(cat => cat.tenant_id === formData.tenantId)
    : categories;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tenant *</Label>
            <Select
              value={formData.tenantId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tenantId: value, categoryId: '' }))}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select a tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Cola Classic 500ml"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-secondary border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                placeholder="e.g., 5901234123457"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                className="bg-secondary border-border font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="widthCm">Width (cm)</Label>
              <Input
                id="widthCm"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g., 8.5"
                value={formData.widthCm}
                onChange={(e) => setFormData(prev => ({ ...prev, widthCm: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief product description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-secondary border-border min-h-[60px]"
            />
          </div>

          {quota && (
            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
              <p className="text-muted-foreground">
                SKU Usage: <span className="text-foreground font-medium">{quota.skuCount} / {quota.skuLimit}</span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="glow" disabled={createProduct.isPending || !canAddSku}>
              {createProduct.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
