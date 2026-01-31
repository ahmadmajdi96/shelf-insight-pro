import { useState } from 'react';
import { Plus, Store as StoreIcon, MapPin, MoreVertical, ScanLine, BarChart3 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  lastDetection?: string;
  totalDetections: number;
  avgShareOfShelf: number;
}

const mockStores: Store[] = [
  { id: '1', name: 'Walmart - Downtown', address: '123 Main St', city: 'New York', country: 'USA', lastDetection: '2 hours ago', totalDetections: 156, avgShareOfShelf: 34.2 },
  { id: '2', name: 'Target - Mall Plaza', address: '456 Commerce Ave', city: 'Los Angeles', country: 'USA', lastDetection: '4 hours ago', totalDetections: 89, avgShareOfShelf: 28.7 },
  { id: '3', name: 'Costco - Industrial', address: '789 Warehouse Blvd', city: 'Chicago', country: 'USA', lastDetection: '1 day ago', totalDetections: 234, avgShareOfShelf: 42.1 },
  { id: '4', name: 'Kroger - East Side', address: '321 Market St', city: 'Houston', country: 'USA', lastDetection: '3 days ago', totalDetections: 67, avgShareOfShelf: 31.5 },
];

export default function Stores() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <MainLayout title="Stores" subtitle="Manage your retail locations and view detection analytics.">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {mockStores.length} stores monitored
        </p>
        <Button variant="glow" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Store
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockStores.map((store, index) => (
          <div 
            key={store.id}
            className={cn(
              "rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all duration-300",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <StoreIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{store.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {store.city}, {store.country}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{store.address}</p>

            <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-secondary/50">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{store.totalDetections}</p>
                <p className="text-xs text-muted-foreground">Detections</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-lg font-semibold text-primary">{store.avgShareOfShelf}%</p>
                <p className="text-xs text-muted-foreground">Avg. SoS</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{store.lastDetection}</p>
                <p className="text-xs text-muted-foreground">Last Scan</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">
                <ScanLine className="w-4 h-4 mr-2" />
                New Scan
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input placeholder="e.g., Walmart - Downtown" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Street address" className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input placeholder="Country" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow">
                <Plus className="w-4 h-4 mr-2" />
                Add Store
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
