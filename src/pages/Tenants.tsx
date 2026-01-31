import { useState } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TenantCard } from '@/components/tenants/TenantCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const mockTenants = [
  { id: '1', name: 'Coca-Cola Company', maxSkus: 100, usedSkus: 48, maxImagesPerMonth: 5000, processedImagesThisMonth: 2847, isActive: true },
  { id: '2', name: 'PepsiCo', maxSkus: 75, usedSkus: 62, maxImagesPerMonth: 3000, processedImagesThisMonth: 2156, isActive: true },
  { id: '3', name: 'Nestlé', maxSkus: 150, usedSkus: 89, maxImagesPerMonth: 10000, processedImagesThisMonth: 4521, isActive: true },
  { id: '4', name: 'Unilever', maxSkus: 50, usedSkus: 23, maxImagesPerMonth: 2000, processedImagesThisMonth: 890, isActive: true },
  { id: '5', name: 'P&G', maxSkus: 80, usedSkus: 45, maxImagesPerMonth: 4000, processedImagesThisMonth: 1234, isActive: false },
];

export default function Tenants() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTenants = mockTenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout 
      title="Tenant Management" 
      subtitle="Manage tenant accounts, quotas, and permissions."
      userRole="admin"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-foreground">{mockTenants.length}</p>
          <p className="text-sm text-muted-foreground">Total Tenants</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-success">{mockTenants.filter(t => t.isActive).length}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-foreground">{mockTenants.reduce((acc, t) => acc + t.usedSkus, 0)}</p>
          <p className="text-sm text-muted-foreground">Total SKUs</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-primary">{mockTenants.reduce((acc, t) => acc + t.processedImagesThisMonth, 0).toLocaleString()}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((tenant, index) => (
          <div 
            key={tenant.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <TenantCard
              id={tenant.id}
              name={tenant.name}
              maxSkus={tenant.maxSkus}
              usedSkus={tenant.usedSkus}
              maxImagesPerMonth={tenant.maxImagesPerMonth}
              processedImagesThisMonth={tenant.processedImagesThisMonth}
              isActive={tenant.isActive}
            />
          </div>
        ))}
      </div>

      {/* Add Tenant Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Add New Tenant
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>Tenant Name</Label>
              <Input placeholder="e.g., Acme Corporation" className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max SKUs</Label>
                <Input type="number" placeholder="100" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Images per Month</Label>
                <Input type="number" placeholder="5000" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Images per Week</Label>
                <Input type="number" placeholder="1500" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Images per Year</Label>
                <Input type="number" placeholder="50000" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow">
                <Plus className="w-4 h-4 mr-2" />
                Create Tenant
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
