import { useState } from 'react';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { AddProductModal } from '@/components/products/AddProductModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const mockProducts = [
  { id: '1', name: 'Cola Classic 500ml', category: 'Beverages', barcode: '5901234123457', imageCount: 8, trainingStatus: 'completed' as const },
  { id: '2', name: 'Cola Zero 500ml', category: 'Beverages', barcode: '5901234123458', imageCount: 6, trainingStatus: 'completed' as const },
  { id: '3', name: 'Lemon Fizz 330ml', category: 'Beverages', barcode: '5901234123459', imageCount: 4, trainingStatus: 'training' as const },
  { id: '4', name: 'Orange Burst 500ml', category: 'Beverages', imageCount: 5, trainingStatus: 'completed' as const },
  { id: '5', name: 'Cola Classic 2L', category: 'Beverages', barcode: '5901234123460', imageCount: 3, trainingStatus: 'pending' as const },
  { id: '6', name: 'Sparkling Water 1L', category: 'Beverages', imageCount: 7, trainingStatus: 'completed' as const },
  { id: '7', name: 'Crunchy Chips Original', category: 'Snacks', barcode: '5901234123461', imageCount: 5, trainingStatus: 'completed' as const },
  { id: '8', name: 'Chocolate Bar Premium', category: 'Snacks', imageCount: 2, trainingStatus: 'failed' as const },
];

export default function Products() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.trainingStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <MainLayout title="Products" subtitle="Manage your product catalog and training data.">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            className="pl-9 bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] bg-card border-border">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Beverages">Beverages</SelectItem>
              <SelectItem value="Snacks">Snacks</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-card border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Trained</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="glow" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-foreground">{mockProducts.length}</p>
          <p className="text-sm text-muted-foreground">Total Products</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-success">{mockProducts.filter(p => p.trainingStatus === 'completed').length}</p>
          <p className="text-sm text-muted-foreground">Trained</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-warning">{mockProducts.filter(p => p.trainingStatus === 'training').length}</p>
          <p className="text-sm text-muted-foreground">Training</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-2xl font-bold text-muted-foreground">{mockProducts.filter(p => p.trainingStatus === 'pending').length}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product, index) => (
          <div 
            key={product.id} 
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProductCard
              id={product.id}
              name={product.name}
              category={product.category}
              barcode={product.barcode}
              imageCount={product.imageCount}
              trainingStatus={product.trainingStatus}
            />
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}

      <AddProductModal 
        open={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </MainLayout>
  );
}
