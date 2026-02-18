import { useState, useMemo } from 'react';
import { Download, Filter, RefreshCw, Database, Search, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type DataTab = 'tenants' | 'stores' | 'categories' | 'products' | 'shelves' | 'scans';

export default function Data() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<DataTab>(isAdmin ? 'tenants' : 'stores');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Fetch all data
  const { data: tenants = [], isLoading: tenantsLoading, refetch: refetchTenants } = useQuery({
    queryKey: ['data-tenants'],
    queryFn: async () => {
      const { data } = await rest.list('tenants', { order: 'name.asc' });
      return data;
    },
    enabled: isAdmin,
  });

  const { data: stores = [], isLoading: storesLoading, refetch: refetchStores } = useQuery({
    queryKey: ['data-stores'],
    queryFn: async () => {
      const { data } = await rest.list('stores', { select: '*,tenant:tenants(name)', order: 'name.asc' });
      return data;
    },
  });

  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['data-categories'],
    queryFn: async () => {
      const { data } = await rest.list('product_categories', { select: '*,tenant:tenants(name)', order: 'name.asc' });
      return data;
    },
  });

  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['data-products'],
    queryFn: async () => {
      const { data } = await rest.list('skus', { select: '*,tenant:tenants(name),category:product_categories(name)', order: 'name.asc' });
      return data;
    },
  });

  const { data: shelves = [], isLoading: shelvesLoading, refetch: refetchShelves } = useQuery({
    queryKey: ['data-shelves'],
    queryFn: async () => {
      const { data } = await rest.list('shelves', { select: '*,tenant:tenants(name),store:stores(name)', order: 'name.asc' });
      return data;
    },
  });

  const { data: scans = [], isLoading: scansLoading, refetch: refetchScans } = useQuery({
    queryKey: ['data-scans'],
    queryFn: async () => {
      const { data } = await rest.list('shelf_images', {
        select: '*,shelf:shelves(name,tenant:tenants(name),store:stores(name))',
        order: 'created_at.desc',
        limit: 500,
      });
      return data;
    },
  });

  // Filtered data
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tenants, searchQuery]);

  const filteredStores = useMemo(() => {
    return stores.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTenant = filterTenant === 'all' || s.tenant_id === filterTenant;
      return matchesSearch && matchesTenant;
    });
  }, [stores, searchQuery, filterTenant]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTenant = filterTenant === 'all' || c.tenant_id === filterTenant;
      return matchesSearch && matchesTenant;
    });
  }, [categories, searchQuery, filterTenant]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTenant = filterTenant === 'all' || p.tenant_id === filterTenant;
      const matchesCategory = filterCategory === 'all' || p.category_id === filterCategory;
      return matchesSearch && matchesTenant && matchesCategory;
    });
  }, [products, searchQuery, filterTenant, filterCategory]);

  const filteredShelves = useMemo(() => {
    return shelves.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location_in_store?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTenant = filterTenant === 'all' || s.tenant_id === filterTenant;
      const matchesStore = filterStore === 'all' || s.store_id === filterStore;
      return matchesSearch && matchesTenant && matchesStore;
    });
  }, [shelves, searchQuery, filterTenant, filterStore]);

  const filteredScans = useMemo(() => {
    return scans.filter(s => {
      const matchesSearch = s.shelf?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTenant = filterTenant === 'all' || s.shelf?.tenant?.name === tenants.find(t => t.id === filterTenant)?.name;
      return matchesSearch && (filterTenant === 'all' || matchesTenant);
    });
  }, [scans, searchQuery, filterTenant, tenants]);

  // Get current data based on tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'tenants': return filteredTenants;
      case 'stores': return filteredStores;
      case 'categories': return filteredCategories;
      case 'products': return filteredProducts;
      case 'shelves': return filteredShelves;
      case 'scans': return filteredScans;
      default: return [];
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const data = getCurrentData();
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).filter(k => 
      !['tenant', 'category', 'store', 'shelf'].includes(k)
    );
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const val = (row as Record<string, unknown>)[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
          return String(val).replace(/,/g, ';');
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
  };

  const handleRefresh = () => {
    refetchTenants();
    refetchStores();
    refetchCategories();
    refetchProducts();
    refetchShelves();
    refetchScans();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterTenant('all');
    setFilterStore('all');
    setFilterCategory('all');
  };

  const isLoading = tenantsLoading || storesLoading || categoriesLoading || 
    productsLoading || shelvesLoading || scansLoading;

  const hasActiveFilters = searchQuery || filterTenant !== 'all' || 
    filterStore !== 'all' || filterCategory !== 'all';

  return (
    <MainLayout 
      title="Data Explorer" 
      subtitle="View and export all system data with advanced filtering."
      
    >
      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>

          {/* Tenant Filter (Admin only) */}
          {isAdmin && (
            <Select value={filterTenant} onValueChange={setFilterTenant}>
              <SelectTrigger className="w-[180px] bg-secondary border-border">
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Store Filter */}
          {(activeTab === 'shelves' || activeTab === 'scans') && (
            <Select value={filterStore} onValueChange={setFilterStore}>
              <SelectTrigger className="w-[180px] bg-secondary border-border">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Category Filter */}
          {activeTab === 'products' && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] bg-secondary border-border">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="default" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Data Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DataTab)}>
        <TabsList className="grid w-full grid-cols-6 bg-card border border-border mb-6">
          {isAdmin && (
            <TabsTrigger value="tenants" className="gap-2">
              Tenants
              <Badge variant="secondary" className="ml-1">{filteredTenants.length}</Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="stores" className="gap-2">
            Stores
            <Badge variant="secondary" className="ml-1">{filteredStores.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            Categories
            <Badge variant="secondary" className="ml-1">{filteredCategories.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            Products
            <Badge variant="secondary" className="ml-1">{filteredProducts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shelves" className="gap-2">
            Shelves
            <Badge variant="secondary" className="ml-1">{filteredShelves.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="scans" className="gap-2">
            Scans
            <Badge variant="secondary" className="ml-1">{filteredScans.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tenants Table */}
        {isAdmin && (
          <TabsContent value="tenants">
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Max SKUs</TableHead>
                      <TableHead>Monthly Limit</TableHead>
                      <TableHead>Weekly Limit</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map(tenant => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{tenant.max_skus}</TableCell>
                        <TableCell>{tenant.max_images_per_month}</TableCell>
                        <TableCell>{tenant.max_images_per_week}</TableCell>
                        <TableCell>{format(new Date(tenant.created_at), 'PP')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>
        )}

        {/* Stores Table */}
        <TabsContent value="stores">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Name</TableHead>
                    {isAdmin && <TableHead>Tenant</TableHead>}
                    <TableHead>City</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map(store => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      {isAdmin && <TableCell>{(store as any).tenant?.name || '-'}</TableCell>}
                      <TableCell>{store.city || '-'}</TableCell>
                      <TableCell>{store.country || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{store.address || '-'}</TableCell>
                      <TableCell>{format(new Date(store.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Categories Table */}
        <TabsContent value="categories">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Name</TableHead>
                    {isAdmin && <TableHead>Tenant</TableHead>}
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      {isAdmin && <TableCell>{(cat as any).tenant?.name || '-'}</TableCell>}
                      <TableCell className="max-w-[300px] truncate">{cat.description || '-'}</TableCell>
                      <TableCell>{format(new Date(cat.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Products Table */}
        <TabsContent value="products">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Name</TableHead>
                    {isAdmin && <TableHead>Tenant</TableHead>}
                    <TableHead>Category</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Training Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      {isAdmin && <TableCell>{(product as any).tenant?.name || '-'}</TableCell>}
                      <TableCell>{(product as any).category?.name || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{product.barcode || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={product.training_status === 'completed' ? 'default' : 'secondary'}>
                          {product.training_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'outline'}>
                          {product.is_active ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(product.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Shelves Table */}
        <TabsContent value="shelves">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Name</TableHead>
                    {isAdmin && <TableHead>Tenant</TableHead>}
                    <TableHead>Store</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShelves.map(shelf => (
                    <TableRow key={shelf.id}>
                      <TableCell className="font-medium">{shelf.name}</TableCell>
                      {isAdmin && <TableCell>{(shelf as any).tenant?.name || '-'}</TableCell>}
                      <TableCell>{(shelf as any).store?.name || '-'}</TableCell>
                      <TableCell>{shelf.location_in_store || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{shelf.description || '-'}</TableCell>
                      <TableCell>{format(new Date(shelf.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Scans Table */}
        <TabsContent value="scans">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Shelf</TableHead>
                    {isAdmin && <TableHead>Tenant</TableHead>}
                    <TableHead>Store</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Image URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScans.map(scan => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium">{scan.shelf?.name || '-'}</TableCell>
                      {isAdmin && <TableCell>{(scan.shelf as any)?.tenant?.name || '-'}</TableCell>}
                      <TableCell>{(scan.shelf as any)?.store?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={scan.processed_at ? 'default' : 'secondary'}>
                          {scan.processed_at ? 'Yes' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(scan.created_at), 'PP p')}</TableCell>
                      <TableCell>
                        <a 
                          href={scan.image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
