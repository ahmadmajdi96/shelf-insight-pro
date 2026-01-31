import { useState } from 'react';
import { Plus, Search, Building2, Loader2, MoreVertical, Pause, Play, Settings } from 'lucide-react';
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
import { useTenants } from '@/hooks/useTenants';
import { cn } from '@/lib/utils';

export default function Tenants() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    max_skus: 50,
    max_images_per_month: 1000,
    max_images_per_week: 300,
    max_images_per_year: 10000,
  });

  const { tenants, isLoading, createTenant, suspendTenant } = useTenants();

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTenant.mutateAsync(formData);
    setFormData({
      name: '',
      max_skus: 50,
      max_images_per_month: 1000,
      max_images_per_week: 300,
      max_images_per_year: 10000,
    });
    setIsModalOpen(false);
  };

  const activeTenants = tenants.filter(t => t.is_active).length;
  const totalSkus = tenants.reduce((acc, t) => acc + t.skuCount, 0);
  const totalImages = tenants.reduce((acc, t) => acc + t.processed_images_this_month, 0);

  return (
    <MainLayout 
      title="Tenant Management" 
      subtitle="Manage tenant accounts, quotas, and permissions."
      userRole="admin"
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
        <Button variant="glow" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Tenants Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant, index) => {
            const skuPercentage = (tenant.skuCount / tenant.max_skus) * 100;
            const imagePercentage = (tenant.processed_images_this_month / tenant.max_images_per_month) * 100;
            
            return (
              <div 
                key={tenant.id}
                className={cn(
                  "rounded-xl bg-card border border-border p-5 transition-all duration-300 animate-fade-in",
                  !tenant.is_active && "opacity-60"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{tenant.name}</h4>
                      <Badge 
                        variant={tenant.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {tenant.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Quotas
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => suspendTenant.mutate({ id: tenant.id, suspend: tenant.is_active })}
                      >
                        {tenant.is_active ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
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

                  <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Users</span>
                      <p className="font-medium text-foreground">{tenant.userCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Weekly Limit</span>
                      <p className="font-medium text-foreground">{tenant.max_images_per_week.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTenants.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                {tenants.length === 0 
                  ? 'No tenants yet. Create your first tenant to get started.'
                  : 'No tenants found matching your search.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Tenant Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Add New Tenant
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
                <Label>Max SKUs</Label>
                <Input 
                  type="number" 
                  placeholder="100" 
                  className="bg-secondary border-border"
                  value={formData.max_skus}
                  onChange={(e) => setFormData({ ...formData, max_skus: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Images per Month</Label>
                <Input 
                  type="number" 
                  placeholder="5000" 
                  className="bg-secondary border-border"
                  value={formData.max_images_per_month}
                  onChange={(e) => setFormData({ ...formData, max_images_per_month: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Images per Week</Label>
                <Input 
                  type="number" 
                  placeholder="1500" 
                  className="bg-secondary border-border"
                  value={formData.max_images_per_week}
                  onChange={(e) => setFormData({ ...formData, max_images_per_week: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Images per Year</Label>
                <Input 
                  type="number" 
                  placeholder="50000" 
                  className="bg-secondary border-border"
                  value={formData.max_images_per_year}
                  onChange={(e) => setFormData({ ...formData, max_images_per_year: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow" disabled={createTenant.isPending}>
                {createTenant.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Tenant
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
