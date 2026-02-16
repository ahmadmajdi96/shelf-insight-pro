import { useState } from 'react';
import { Plus, Search, Building2, Loader2, MoreVertical, Pause, Play, Pencil, Trash2, Store as StoreIcon, MapPin } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useTenants } from '@/hooks/useTenants';
import { useStores } from '@/hooks/useStores';
import { cn } from '@/lib/utils';

export default function Tenants() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    max_skus: 50,
    max_images_per_month: 1000,
  });

  // Store modal
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [deleteStoreId, setDeleteStoreId] = useState<string | null>(null);
  const [storeTenantId, setStoreTenantId] = useState<string>('');
  const [storeFormData, setStoreFormData] = useState({ name: '', address: '', city: '', country: '' });

  const { tenants, isLoading, createTenant, updateTenant, suspendTenant, deleteTenant } = useTenants();
  const { stores, createStore, updateStore, deleteStore } = useStores();

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStoresForTenant = (tenantId: string) => 
    stores.filter(s => s.tenant_id === tenantId);

  const toggleTenant = (tenantId: string) => {
    setExpandedTenants(prev => {
      const next = new Set(prev);
      if (next.has(tenantId)) next.delete(tenantId);
      else next.add(tenantId);
      return next;
    });
  };

  const resetForm = () => {
    setFormData({ name: '', username: '', password: '', max_skus: 50, max_images_per_month: 1000 });
    setEditingTenant(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenant) {
      await updateTenant.mutateAsync({ id: editingTenant.id, ...formData });
    } else {
      await createTenant.mutateAsync(formData);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (tenant: any) => {
    setFormData({
      name: tenant.name,
      username: tenant.username || '',
      password: tenant.password || '',
      max_skus: tenant.max_skus,
      max_images_per_month: tenant.max_images_per_month,
    });
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTenant.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // Store handlers
  const handleAddStore = (tenantId: string) => {
    setStoreTenantId(tenantId);
    setStoreFormData({ name: '', address: '', city: '', country: '' });
    setEditingStore(null);
    setIsStoreModalOpen(true);
  };

  const handleEditStore = (store: any) => {
    setStoreTenantId(store.tenant_id);
    setStoreFormData({ name: store.name, address: store.address || '', city: store.city || '', country: store.country || '' });
    setEditingStore(store);
    setIsStoreModalOpen(true);
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStore) {
      await updateStore.mutateAsync({
        id: editingStore.id,
        name: storeFormData.name,
        address: storeFormData.address || null,
        city: storeFormData.city || null,
        country: storeFormData.country || null,
      });
    } else {
      await createStore.mutateAsync({
        name: storeFormData.name,
        address: storeFormData.address || null,
        city: storeFormData.city || null,
        country: storeFormData.country || null,
        tenant_id: storeTenantId,
      });
    }
    setIsStoreModalOpen(false);
  };

  const handleDeleteStore = async () => {
    if (deleteStoreId) {
      await deleteStore.mutateAsync(deleteStoreId);
      setDeleteStoreId(null);
    }
  };

  const activeTenants = tenants.filter(t => t.is_active).length;
  const totalSkus = tenants.reduce((acc, t) => acc + t.skuCount, 0);
  const totalImages = tenants.reduce((acc, t) => acc + t.processed_images_this_month, 0);

  return (
    <MainLayout 
      title="Tenant Management" 
      subtitle="Manage tenant accounts, quotas, stores, and permissions."
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-foreground">{tenants.length}</p>
          <p className="text-sm text-muted-foreground">Total Tenants</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-success">{activeTenants}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-foreground">{totalSkus}</p>
          <p className="text-sm text-muted-foreground">Total SKUs</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-primary">{totalImages.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Images This Month</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search tenants..." 
            className="pl-9 bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="glow" onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Tenants List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTenants.map((tenant, index) => {
            const skuPercentage = (tenant.skuCount / tenant.max_skus) * 100;
            const imagePercentage = (tenant.processed_images_this_month / tenant.max_images_per_month) * 100;
            const tenantStores = getStoresForTenant(tenant.id);
            const isExpanded = expandedTenants.has(tenant.id);
            
            return (
              <div 
                key={tenant.id}
                className={cn(
                  "rounded-xl bg-card border border-border transition-all duration-300 animate-fade-in",
                  !tenant.is_active && "opacity-60"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{tenant.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={tenant.is_active ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {tenant.is_active ? 'Active' : 'Suspended'}
                          </Badge>
                          {tenant.username && (
                            <span className="text-xs text-muted-foreground">@{tenant.username}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddStore(tenant.id)}>
                          <StoreIcon className="w-4 h-4 mr-2" />
                          Add Store
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => suspendTenant.mutate({ id: tenant.id, suspend: tenant.is_active })}
                        >
                          {tenant.is_active ? (
                            <><Pause className="w-4 h-4 mr-2" />Suspend</>
                          ) : (
                            <><Play className="w-4 h-4 mr-2" />Activate</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteId(tenant.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">SKUs</span>
                        <span className="text-foreground font-medium">{tenant.skuCount} / {tenant.max_skus}</span>
                      </div>
                      <Progress value={skuPercentage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Images (Monthly)</span>
                        <span className="text-foreground font-medium">
                          {tenant.processed_images_this_month.toLocaleString()} / {tenant.max_images_per_month.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={imagePercentage} 
                        className={cn(
                          "h-2",
                          imagePercentage >= 90 && "[&>div]:bg-destructive",
                          imagePercentage >= 80 && imagePercentage < 90 && "[&>div]:bg-warning"
                        )} 
                      />
                    </div>
                  </div>
                </div>

                {/* Stores Section */}
                <Collapsible open={isExpanded} onOpenChange={() => toggleTenant(tenant.id)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full px-5 py-3 border-t border-border flex items-center justify-between text-sm hover:bg-muted/30 transition-colors">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <StoreIcon className="w-4 h-4" />
                        {tenantStores.length} Store{tenantStores.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">{isExpanded ? 'Collapse' : 'Expand'}</span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-4 space-y-2">
                      {tenantStores.map(store => (
                        <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-3">
                            <StoreIcon className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground text-sm">{store.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {store.city || 'Unknown'}{store.country ? `, ${store.country}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditStore(store)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteStoreId(store.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {tenantStores.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">No stores yet</p>
                      )}
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddStore(tenant.id)}>
                        <Plus className="w-3 h-3 mr-2" />
                        Add Store
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}

          {filteredTenants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {tenants.length === 0 
                  ? 'No tenants yet. Create your first tenant to get started.'
                  : 'No tenants found matching your search.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Tenant Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tenant Name</Label>
              <Input 
                placeholder="e.g., Acme Corporation" 
                className="bg-secondary border-border"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input 
                  placeholder="tenant_username" 
                  className="bg-secondary border-border"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  className="bg-secondary border-border"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max SKUs</Label>
                <Input 
                  type="number" 
                  className="bg-secondary border-border"
                  value={formData.max_skus}
                  onChange={(e) => setFormData({ ...formData, max_skus: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Images per Month</Label>
                <Input 
                  type="number" 
                  className="bg-secondary border-border"
                  value={formData.max_images_per_month}
                  onChange={(e) => setFormData({ ...formData, max_images_per_month: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" variant="glow" disabled={createTenant.isPending || updateTenant.isPending}>
                {(createTenant.isPending || updateTenant.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {editingTenant ? 'Save Changes' : 'Create Tenant'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Store Modal */}
      <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStoreSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input 
                placeholder="e.g., Walmart - Downtown" 
                className="bg-secondary border-border"
                value={storeFormData.name}
                onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                placeholder="Street address" 
                className="bg-secondary border-border"
                value={storeFormData.address}
                onChange={(e) => setStoreFormData({ ...storeFormData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input 
                  placeholder="City" 
                  className="bg-secondary border-border"
                  value={storeFormData.city}
                  onChange={(e) => setStoreFormData({ ...storeFormData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input 
                  placeholder="Country" 
                  className="bg-secondary border-border"
                  value={storeFormData.country}
                  onChange={(e) => setStoreFormData({ ...storeFormData, country: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsStoreModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow" disabled={createStore.isPending || updateStore.isPending}>
                {(createStore.isPending || updateStore.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingStore ? 'Save Changes' : 'Add Store'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Tenant Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tenant? This will remove all associated data including stores, products, and detection history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Store Confirmation */}
      <AlertDialog open={!!deleteStoreId} onOpenChange={() => setDeleteStoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this store? This will also remove all associated detection history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStore} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
