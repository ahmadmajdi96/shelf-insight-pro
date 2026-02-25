import { useState, useMemo } from 'react';
import { Search, Store, LayoutGrid, Plus, X, KeyRound, Shield, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useUsers } from '@/hooks/useUsers';
import { useStores } from '@/hooks/useStores';
import { useShelves } from '@/hooks/useShelves';
import { useTenants } from '@/hooks/useTenants';
import { useAdmins } from '@/hooks/useAdmins';
import { usePlanogramTemplates } from '@/hooks/usePlanograms';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  tenant_admin: { label: 'Tenant Admin', variant: 'secondary' },
  tenant_user: { label: 'User', variant: 'outline' },
};

const ROW_LIMITS = [10, 25, 50, 100];

export default function AccessControl() {
  const { users, useUserStoreAccess, useUserShelfAccess, assignStore, revokeStore, assignShelf, revokeShelf } = useUsers();
  const { stores } = useStores();
  const { shelves } = useShelves();
  const { tenants } = useTenants();
  const { admins } = useAdmins();
  const { templates } = usePlanogramTemplates();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [storeToAssign, setStoreToAssign] = useState('');
  const [shelfToAssign, setShelfToAssign] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [rowLimit, setRowLimit] = useState(25);

  // Filters
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [filterTenant, setFilterTenant] = useState('all');
  const [filterStore, setFilterStore] = useState('all');
  const [filterPlanogram, setFilterPlanogram] = useState('all');

  const storeAccess = useUserStoreAccess(selectedUserId);
  const shelfAccess = useUserShelfAccess(selectedUserId);
  const currentUser = users.find(u => u.userId === selectedUserId);

  // Get tenant IDs for a given admin
  const getTenantIdsForAdmin = (adminId: string) => tenants.filter((t: any) => t.admin_id === adminId).map(t => t.id);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTenant = filterTenant === 'all' || u.tenantId === filterTenant;
      const matchesAdmin = filterAdmin === 'all' || (u.tenantId && getTenantIdsForAdmin(filterAdmin).includes(u.tenantId));
      return matchesSearch && matchesTenant && matchesAdmin;
    }).slice(0, rowLimit);
  }, [users, searchQuery, filterTenant, filterAdmin, rowLimit, tenants, admins]);

  // Dynamic stores based on user's tenant
  const userTenantStores = useMemo(() => {
    if (!currentUser?.tenantId) return stores;
    return stores.filter(s => s.tenant_id === currentUser.tenantId);
  }, [currentUser, stores]);

  // Dynamic planograms based on user's tenant
  const userTenantPlanograms = useMemo(() => {
    if (!currentUser?.tenantId) return templates;
    return templates.filter(t => t.tenant_id === currentUser.tenantId);
  }, [currentUser, templates]);

  // Dynamic shelves based on user's tenant stores
  const userTenantShelves = useMemo(() => {
    if (!currentUser?.tenantId) return shelves;
    const tenantStoreIds = stores.filter(s => s.tenant_id === currentUser.tenantId).map(s => s.id);
    return shelves.filter(s => s.store_id && tenantStoreIds.includes(s.store_id));
  }, [currentUser, shelves, stores]);

  const hasActiveFilters = searchQuery || filterAdmin !== 'all' || filterTenant !== 'all';
  const clearFilters = () => { setSearchQuery(''); setFilterAdmin('all'); setFilterTenant('all'); };

  return (
    <MainLayout title="Access Control" subtitle="Manage user access to stores and planograms.">
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-secondary border-border" />
            </div>
            <Select value={filterAdmin} onValueChange={setFilterAdmin}>
              <SelectTrigger className="w-[170px] bg-secondary border-border"><Shield className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Admins" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTenant} onValueChange={setFilterTenant}>
              <SelectTrigger className="w-[170px] bg-secondary border-border"><Building2 className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All Tenants" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(rowLimit)} onValueChange={v => setRowLimit(Number(v))}>
              <SelectTrigger className="w-[120px] bg-secondary border-border"><SelectValue placeholder="Rows" /></SelectTrigger>
              <SelectContent>
                {ROW_LIMITS.map(l => <SelectItem key={l} value={String(l)}>{l} rows</SelectItem>)}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-4 h-4 mr-1" /> Clear</Button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(u => (
                <TableRow
                  key={u.userId}
                  className={selectedUserId === u.userId ? 'bg-primary/5 border-primary/20' : 'cursor-pointer'}
                  onClick={() => setSelectedUserId(u.userId)}
                >
                  <TableCell className="font-medium">{u.fullName || 'Unnamed'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">@{u.username || 'no-username'}</TableCell>
                  <TableCell className="text-sm">{tenants.find(t => t.id === u.tenantId)?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={roleLabels[u.role]?.variant || 'outline'} className="text-xs">
                      {roleLabels[u.role]?.label || u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant={selectedUserId === u.userId ? 'default' : 'outline'} size="sm" onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.userId); }}>
                      {selectedUserId === u.userId ? 'Selected' : 'Manage'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found matching your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Access Management */}
        {selectedUserId && currentUser && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Info */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <KeyRound className="w-4 h-4 text-primary" /> User Details
              </h3>
              <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
                <p className="text-sm font-medium text-foreground">{currentUser.fullName}</p>
                <p className="text-xs text-muted-foreground">@{currentUser.username || 'no-username'}</p>
                <Badge variant={roleLabels[currentUser.role]?.variant || 'outline'} className="mt-1">
                  {roleLabels[currentUser.role]?.label || currentUser.role}
                </Badge>
                {currentUser.tenantId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tenant: {tenants.find(t => t.id === currentUser.tenantId)?.name || 'Unknown'}
                  </p>
                )}
              </div>
            </div>

            {/* Store Access */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-primary" /> Store Access
              </h3>
              <div className="flex gap-2 mb-3">
                <Select value={storeToAssign} onValueChange={setStoreToAssign}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Select store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userTenantStores.filter(s => !storeAccess.data?.some(sa => sa.storeId === s.id)).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" disabled={!storeToAssign || assignStore.isPending} onClick={() => { assignStore.mutate({ userId: selectedUserId, storeId: storeToAssign }); setStoreToAssign(''); }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {storeAccess.data?.map(sa => (
                  <div key={sa.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{sa.storeName}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => revokeStore.mutate({ id: sa.id, userId: selectedUserId })}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {storeAccess.data?.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No stores assigned.</p>}
              </div>
            </div>

            {/* Shelf/Planogram Access */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-primary" /> Planogram Access
              </h3>
              <div className="flex gap-2 mb-3">
                <Select value={shelfToAssign} onValueChange={setShelfToAssign}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Select shelf..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userTenantShelves.filter(s => !shelfAccess.data?.some(sa => sa.shelfId === s.id)).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" disabled={!shelfToAssign || assignShelf.isPending} onClick={() => { assignShelf.mutate({ userId: selectedUserId, shelfId: shelfToAssign }); setShelfToAssign(''); }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {shelfAccess.data?.map(sa => (
                  <div key={sa.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{sa.shelfName}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => revokeShelf.mutate({ id: sa.id, userId: selectedUserId })}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {shelfAccess.data?.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No shelves assigned.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
