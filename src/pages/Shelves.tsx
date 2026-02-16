import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, Search, Filter, Package, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShelves } from '@/hooks/useShelves';
import { useStores } from '@/hooks/useStores';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import { AddShelfModal } from '@/components/shelves/AddShelfModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export default function Shelves() {
  const navigate = useNavigate();
  const { shelves, isLoading, deleteShelf } = useShelves();
  const { stores } = useStores();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStoreId, setFilterStoreId] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredShelves = shelves.filter((shelf) => {
    const matchesSearch = shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelf.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = filterStoreId === 'all' || shelf.store_id === filterStoreId;
    return matchesSearch && matchesStore;
  });

  const handleShelfSelect = (shelfId: string) => {
    navigate(`/shelves/${shelfId}`);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteShelf.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <MainLayout
      title="Shelf Management"
      subtitle="Assign products to shelves and track detection history."
    >
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search shelves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-3">
          <Select value={filterStoreId} onValueChange={setFilterStoreId}>
            <SelectTrigger className="w-[200px] bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stores</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="glow" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Shelf
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{shelves.length}</p>
              <p className="text-sm text-muted-foreground">Total Shelves</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {shelves.reduce((acc, s) => acc + (s.products?.length || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Assigned Products</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {shelves.reduce((acc, s) => acc + s.imageCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Detections</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredShelves.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery || filterStoreId !== 'all' ? 'No shelves found' : 'No shelves yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterStoreId !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first shelf to start tracking products.'}
          </p>
          {!searchQuery && filterStoreId === 'all' && (
            <Button variant="glow" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Shelf
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShelves.map((shelf) => (
            <ShelfCard
              key={shelf.id}
              shelf={shelf}
              onSelect={() => handleShelfSelect(shelf.id)}
              onDelete={() => setDeleteId(shelf.id)}
            />
          ))}
        </div>
      )}

      <AddShelfModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shelf</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shelf? All assigned products and detection history will be removed.
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
    </MainLayout>
  );
}
