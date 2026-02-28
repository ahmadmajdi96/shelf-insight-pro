import { useState, useMemo } from 'react';
import { Download, RefreshCw, Search, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmins } from '@/hooks/useAdmins';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type DataTab = 'admins' | 'tenants' | 'stores' | 'categories' | 'products' | 'shelves' | 'scans' | 'compliance';

const TAB_CONFIG: { value: DataTab; label: string; icon: string }[] = [
  { value: 'admins', label: 'Admins', icon: '👤' },
  { value: 'tenants', label: 'Tenants', icon: '🏢' },
  { value: 'stores', label: 'Stores', icon: '🏪' },
  { value: 'categories', label: 'Categories', icon: '🏷️' },
  { value: 'products', label: 'Products', icon: '📦' },
  { value: 'shelves', label: 'Shelves', icon: '🗄️' },
  { value: 'scans', label: 'Shelf Images', icon: '📷' },
  { value: 'compliance', label: 'Compliance', icon: '✅' },
];

export default function Data() {
  const { isAdmin } = useAuth();
  const { admins } = useAdmins();
  const [activeTab, setActiveTab] = useState<DataTab>(isAdmin ? 'admins' : 'stores');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewLimit, setViewLimit] = useState(50);

  // Fetch all data
  const { data: tenants = [], isLoading: tenantsLoading, refetch: refetchTenants } = useQuery({
    queryKey: ['data-tenants'],
    queryFn: async () => { const { data } = await rest.list('tenants', { select: '*', order: 'name.asc' }); return data || []; },
    enabled: isAdmin,
  });

  const { data: stores = [], isLoading: storesLoading, refetch: refetchStores } = useQuery({
    queryKey: ['data-stores'],
    queryFn: async () => { const { data } = await rest.list('stores', { select: '*,tenant:tenants(name)', order: 'name.asc' }); return data || []; },
  });

  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['data-categories'],
    queryFn: async () => { const { data } = await rest.list('product_categories', { select: '*,tenant:tenants(name)', order: 'name.asc' }); return data || []; },
  });

  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['data-products'],
    queryFn: async () => { const { data } = await rest.list('skus', { select: '*,tenant:tenants(name),category:product_categories(name)', order: 'name.asc' }); return data || []; },
  });

  const { data: shelves = [], isLoading: shelvesLoading, refetch: refetchShelves } = useQuery({
    queryKey: ['data-shelves'],
    queryFn: async () => { const { data } = await rest.list('shelves', { select: '*,tenant:tenants(name),store:stores(name)', order: 'name.asc' }); return data || []; },
  });

  // Enhanced shelf images query with admin, tenant, store, planogram info
  const { data: scans = [], isLoading: scansLoading, refetch: refetchScans } = useQuery({
    queryKey: ['data-scans-enhanced'],
    queryFn: async () => {
      const { data } = await rest.list('shelf_images', {
        select: '*,shelf:shelves(name,tenant_id,store_id,tenant:tenants(name,admin_id),store:stores(name))',
        order: 'created_at.desc',
        limit: 500,
      });
      return data || [];
    },
  });

  const { data: complianceScans = [], isLoading: complianceLoading, refetch: refetchCompliance } = useQuery({
    queryKey: ['data-compliance-scans'],
    queryFn: async () => {
      const { data } = await rest.list('compliance_scans', {
        select: '*,template:planogram_templates(name,tenant_id,store_id,tenant:tenants(name,admin_id),store:stores(name))',
        order: 'created_at.desc',
        limit: 500,
      });
      return data || [];
    },
  });

  // Cascading filter: admin → tenant → store
  const handleAdminChange = (v: string) => { setFilterAdmin(v); setFilterTenant('all'); setFilterStore('all'); };
  const handleTenantChange = (v: string) => { setFilterTenant(v); setFilterStore('all'); };

  const filteredTenantsByAdmin = useMemo(() => {
    if (filterAdmin === 'all') return tenants;
    return tenants.filter((t: any) => t.admin_id === filterAdmin);
  }, [tenants, filterAdmin]);

  const filteredTenants = useMemo(() => filteredTenantsByAdmin.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [filteredTenantsByAdmin, searchQuery]);

  const filteredStores = useMemo(() => stores.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = filterTenant === 'all' || s.tenant_id === filterTenant;
    const matchesAdmin = filterAdmin === 'all' || filteredTenantsByAdmin.some(t => t.id === s.tenant_id);
    return matchesSearch && matchesTenant && matchesAdmin;
  }), [stores, searchQuery, filterTenant, filterAdmin, filteredTenantsByAdmin]);

  const filteredCategories = useMemo(() => categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = filterTenant === 'all' || c.tenant_id === filterTenant;
    const matchesAdmin = filterAdmin === 'all' || filteredTenantsByAdmin.some(t => t.id === c.tenant_id);
    return matchesSearch && matchesTenant && matchesAdmin;
  }), [categories, searchQuery, filterTenant, filterAdmin, filteredTenantsByAdmin]);

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = filterTenant === 'all' || p.tenant_id === filterTenant;
    const matchesCategory = filterCategory === 'all' || p.category_id === filterCategory;
    const matchesAdmin = filterAdmin === 'all' || filteredTenantsByAdmin.some(t => t.id === p.tenant_id);
    return matchesSearch && matchesTenant && matchesCategory && matchesAdmin;
  }), [products, searchQuery, filterTenant, filterCategory, filterAdmin, filteredTenantsByAdmin]);

  const filteredShelves = useMemo(() => shelves.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = filterTenant === 'all' || s.tenant_id === filterTenant;
    const matchesStore = filterStore === 'all' || s.store_id === filterStore;
    const matchesAdmin = filterAdmin === 'all' || filteredTenantsByAdmin.some(t => t.id === s.tenant_id);
    return matchesSearch && matchesTenant && matchesStore && matchesAdmin;
  }), [shelves, searchQuery, filterTenant, filterStore, filterAdmin, filteredTenantsByAdmin]);

  const filteredScans = useMemo(() => scans.filter((s: any) => {
    const matchesTenant = filterTenant === 'all' || s.shelf?.tenant_id === filterTenant;
    const matchesStore = filterStore === 'all' || s.shelf?.store_id === filterStore;
    const matchesAdmin = filterAdmin === 'all' || s.shelf?.tenant?.admin_id === filterAdmin;
    return matchesTenant && matchesStore && matchesAdmin;
  }), [scans, filterTenant, filterStore, filterAdmin]);

  const filteredCompliance = useMemo(() => complianceScans.filter((c: any) => {
    const matchesTenant = filterTenant === 'all' || c.template?.tenant_id === filterTenant;
    const matchesAdmin = filterAdmin === 'all' || (c.template?.tenant?.admin_id === filterAdmin);
    return matchesTenant && matchesAdmin;
  }), [complianceScans, filterTenant, filterAdmin]);

  const filteredAdmins = useMemo(() => admins.filter(a =>
    a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || a.email.toLowerCase().includes(searchQuery.toLowerCase())
  ), [admins, searchQuery]);

  const getAdminName = (adminId: string | null) => {
    if (!adminId) return '—';
    return admins.find(a => a.id === adminId)?.full_name || '—';
  };

  const getCount = (tab: DataTab) => {
    switch (tab) {
      case 'admins': return filteredAdmins.length;
      case 'tenants': return filteredTenants.length;
      case 'stores': return filteredStores.length;
      case 'categories': return filteredCategories.length;
      case 'products': return filteredProducts.length;
      case 'shelves': return filteredShelves.length;
      case 'scans': return filteredScans.length;
      case 'compliance': return filteredCompliance.length;
    }
  };

  const exportToCSV = () => {
    const data = activeTab === 'admins' ? filteredAdmins :
      activeTab === 'tenants' ? filteredTenants :
      activeTab === 'stores' ? filteredStores :
      activeTab === 'categories' ? filteredCategories :
      activeTab === 'products' ? filteredProducts :
      activeTab === 'shelves' ? filteredShelves : activeTab === 'compliance' ? filteredCompliance : filteredScans;
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).filter(k => !['tenant', 'category', 'store', 'shelf', 'template'].includes(k));
    const csvContent = [headers.join(','), ...data.map(row => headers.map(h => {
      const val = (row as Record<string, unknown>)[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
      return String(val).replace(/,/g, ';');
    }).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
  };

  const handleRefresh = () => { refetchTenants(); refetchStores(); refetchCategories(); refetchProducts(); refetchShelves(); refetchScans(); refetchCompliance(); };
  const clearFilters = () => { setSearchQuery(''); setFilterAdmin('all'); setFilterTenant('all'); setFilterStore('all'); setFilterCategory('all'); };
  const isLoading = tenantsLoading || storesLoading || categoriesLoading || productsLoading || shelvesLoading || scansLoading || complianceLoading;
  const hasActiveFilters = searchQuery || filterAdmin !== 'all' || filterTenant !== 'all' || filterStore !== 'all' || filterCategory !== 'all';

  return (
    <MainLayout title="Data Explorer" subtitle="View and export all system data with advanced filtering.">
      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary border-border" />
          </div>
          {isAdmin && (
            <Select value={filterAdmin} onValueChange={handleAdminChange}>
              <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder="All Admins" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {isAdmin && (
            <Select value={filterTenant} onValueChange={handleTenantChange}>
              <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder="All Tenants" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {filteredTenantsByAdmin.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {(['shelves', 'scans'] as DataTab[]).includes(activeTab) && (
            <Select value={filterStore} onValueChange={setFilterStore}>
              <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder="All Stores" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {filteredStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {activeTab === 'products' && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-4 h-4 mr-1" />Clear</Button>}
          <div className="flex items-center gap-2 ml-auto">
            <Select value={String(viewLimit)} onValueChange={v => setViewLimit(Number(v))}>
              <SelectTrigger className="w-[80px] h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />Refresh
            </Button>
            <Button variant="default" size="sm" onClick={exportToCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DataTab)} className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="inline-flex h-12 items-center gap-1 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-1.5 shadow-lg shadow-primary/5">
            {TAB_CONFIG.filter(t => isAdmin || !['admins', 'tenants'].includes(t.value)).map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className={cn(
                "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary/50",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25"
              )}>
                <span>{tab.icon}</span><span className="hidden sm:inline">{tab.label}</span>
                <Badge variant="secondary" className="ml-1 text-[10px]">{getCount(tab.value)}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Admins */}
        {isAdmin && (
          <TabsContent value="admins">
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
                <Table>
                  <TableHeader><TableRow className="bg-secondary/50"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Monthly Limit</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredAdmins.slice(0, viewLimit).map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.full_name}</TableCell>
                        <TableCell>{a.email}</TableCell>
                        <TableCell>{a.phone || '—'}</TableCell>
                        <TableCell>{a.monthly_limit.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell>{format(new Date(a.created_at), 'PP')}</TableCell>
                      </TableRow>
                    ))}
                    {filteredAdmins.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No admins found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>
        )}

        {/* Tenants */}
        {isAdmin && (
          <TabsContent value="tenants">
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
                <Table>
                  <TableHeader><TableRow className="bg-secondary/50"><TableHead>Name</TableHead><TableHead>Admin</TableHead><TableHead>Status</TableHead><TableHead>Max SKUs</TableHead><TableHead>Monthly Limit</TableHead><TableHead>Weekly Limit</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredTenants.slice(0, viewLimit).map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{getAdminName((t as any).admin_id)}</TableCell>
                        <TableCell><Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{t.status}</Badge></TableCell>
                        <TableCell>{t.max_skus}</TableCell>
                        <TableCell>{t.max_images_per_month}</TableCell>
                        <TableCell>{t.max_images_per_week}</TableCell>
                        <TableCell>{format(new Date(t.created_at), 'PP')}</TableCell>
                      </TableRow>
                    ))}
                    {filteredTenants.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No tenants found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>
        )}

        {/* Stores */}
        <TabsContent value="stores">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <Table>
                <TableHeader><TableRow className="bg-secondary/50"><TableHead>Name</TableHead>{isAdmin && <TableHead>Tenant</TableHead>}<TableHead>City</TableHead><TableHead>Country</TableHead><TableHead>Address</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredStores.slice(0, viewLimit).map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      {isAdmin && <TableCell>{(s as any).tenant?.name || '—'}</TableCell>}
                      <TableCell>{s.city || '—'}</TableCell>
                      <TableCell>{s.country || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.address || '—'}</TableCell>
                      <TableCell>{format(new Date(s.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredStores.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No stores found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <Table>
                <TableHeader><TableRow className="bg-secondary/50"><TableHead>Name</TableHead>{isAdmin && <TableHead>Tenant</TableHead>}<TableHead>Description</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredCategories.slice(0, viewLimit).map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      {isAdmin && <TableCell>{(c as any).tenant?.name || '—'}</TableCell>}
                      <TableCell className="max-w-[300px] truncate">{c.description || '—'}</TableCell>
                      <TableCell>{format(new Date(c.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredCategories.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No categories found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <Table>
                <TableHeader><TableRow className="bg-secondary/50"><TableHead>Name</TableHead>{isAdmin && <TableHead>Tenant</TableHead>}<TableHead>Category</TableHead><TableHead>Barcode</TableHead><TableHead>Width (cm)</TableHead><TableHead>Training</TableHead><TableHead>Active</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredProducts.slice(0, viewLimit).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      {isAdmin && <TableCell>{(p as any).tenant?.name || '—'}</TableCell>}
                      <TableCell>{(p as any).category?.name || '—'}</TableCell>
                      <TableCell className="font-mono text-sm">{p.barcode || '—'}</TableCell>
                      <TableCell>{p.width_cm || '—'}</TableCell>
                      <TableCell><Badge variant={p.training_status === 'completed' ? 'default' : 'secondary'}>{p.training_status}</Badge></TableCell>
                      <TableCell><Badge variant={p.is_active ? 'default' : 'outline'}>{p.is_active ? 'Yes' : 'No'}</Badge></TableCell>
                      <TableCell>{format(new Date(p.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No products found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Shelves */}
        <TabsContent value="shelves">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <Table>
                <TableHeader><TableRow className="bg-secondary/50"><TableHead>Name</TableHead>{isAdmin && <TableHead>Tenant</TableHead>}<TableHead>Store</TableHead><TableHead>Location</TableHead><TableHead>Width (cm)</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredShelves.slice(0, viewLimit).map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      {isAdmin && <TableCell>{(s as any).tenant?.name || '—'}</TableCell>}
                      <TableCell>{(s as any).store?.name || '—'}</TableCell>
                      <TableCell>{s.location_in_store || '—'}</TableCell>
                      <TableCell>{s.width_cm || '—'}</TableCell>
                      <TableCell>{format(new Date(s.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredShelves.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No shelves found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Shelf Images (Scans) - Enhanced with admin, tenant, store, planogram info */}
        <TabsContent value="scans">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Image</TableHead>
                    {isAdmin && <TableHead>Admin</TableHead>}
                    <TableHead>Tenant</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Shelf</TableHead>
                    <TableHead>Detection</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScans.slice(0, viewLimit).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <a href={s.image_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                          {s.file_name || 'View Image'}
                        </a>
                      </TableCell>
                      {isAdmin && <TableCell className="text-sm">{getAdminName(s.shelf?.tenant?.admin_id)}</TableCell>}
                      <TableCell>{s.shelf?.tenant?.name || '—'}</TableCell>
                      <TableCell>{s.shelf?.store?.name || '—'}</TableCell>
                      <TableCell className="font-medium">{s.shelf?.name || '—'}</TableCell>
                      <TableCell>
                        {s.detection_result ? (
                          <Badge variant="default">Has Results</Badge>
                        ) : (
                          <Badge variant="secondary">No Results</Badge>
                        )}
                      </TableCell>
                      <TableCell>{s.processed_at ? format(new Date(s.processed_at), 'PP HH:mm') : '—'}</TableCell>
                      <TableCell>{format(new Date(s.created_at), 'PP')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredScans.length === 0 && <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-muted-foreground">No shelf images found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Compliance Scans */}
        <TabsContent value="compliance">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Score</TableHead>
                    <TableHead>Planogram</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Found</TableHead>
                    <TableHead>Missing</TableHead>
                    <TableHead>Extra</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Image</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompliance.slice(0, viewLimit).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell><Badge variant={c.compliance_score >= 80 ? 'default' : 'destructive'}>{c.compliance_score}%</Badge></TableCell>
                      <TableCell className="font-medium">{c.template?.name || '—'}</TableCell>
                      <TableCell>{c.template?.tenant?.name || '—'}</TableCell>
                      <TableCell>{c.total_expected}</TableCell>
                      <TableCell>{c.total_found}</TableCell>
                      <TableCell>{c.total_missing}</TableCell>
                      <TableCell>{c.total_extra}</TableCell>
                      <TableCell>{format(new Date(c.created_at), 'PP')}</TableCell>
                      <TableCell>{c.image_url && <a href={c.image_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View</a>}</TableCell>
                    </TableRow>
                  ))}
                  {filteredCompliance.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No compliance scans found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
