import { useState } from 'react';
import { Plus, FolderOpen, Package, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  trainedCount: number;
}

const mockCategories: Category[] = [
  { id: '1', name: 'Beverages', description: 'Soft drinks, juices, and water products', productCount: 24, trainedCount: 20 },
  { id: '2', name: 'Snacks', description: 'Chips, crackers, and packaged snacks', productCount: 18, trainedCount: 15 },
  { id: '3', name: 'Dairy', description: 'Milk, cheese, and yogurt products', productCount: 12, trainedCount: 10 },
  { id: '4', name: 'Personal Care', description: 'Hygiene and beauty products', productCount: 8, trainedCount: 6 },
];

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  return (
    <MainLayout title="Categories" subtitle="Organize your products into categories for better management.">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {mockCategories.length} categories • {mockCategories.reduce((acc, c) => acc + c.productCount, 0)} total products
        </p>
        <Button variant="glow" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCategories.map((category, index) => (
          <div 
            key={category.id}
            className={cn(
              "rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all duration-300",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{category.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
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
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>{category.productCount} products</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-success">{category.trainedCount} trained</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  style={{ width: `${(category.trainedCount / category.productCount) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {Math.round((category.trainedCount / category.productCount) * 100)}% training complete
              </p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="e.g., Beverages"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDesc">Description (Optional)</Label>
              <Textarea
                id="categoryDesc"
                placeholder="Brief description of this category..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow">
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
