import { useState } from 'react';
import { Search, Store, LayoutGrid, Plus, X, KeyRound, Shield } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { useStores } from '@/hooks/useStores';
import { useShelves } from '@/hooks/useShelves';
import { useTenants } from '@/hooks/useTenants';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  tenant_admin: { label: 'Tenant Admin', variant: 'secondary' },
  tenant_user: { label: 'User', variant: 'outline' },
};

export default function AccessControl() {
  const { users, useUserStoreAccess, useUserShelfAccess, assignStore, revokeStore, assignShelf, revokeShelf } = useUsers();
  const { stores } = useStores();
  const { shelves } = useShelves();
  const { tenants } = useTenants();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [storeToAssign, setStoreToAssign] = useState('');
  const [shelfToAssign, setShelfToAssign] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const storeAccess = useUserStoreAccess(selectedUserId);
  const shelfAccess = useUserShelfAccess(selectedUserId);
  const currentUser = users.find(u => u.userId === selectedUserId);

  const filteredUsers = users.filter(u =>
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout title="Access Control" subtitle="Manage user access to stores and planograms.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Selection */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-primary" /> Select User
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-secondary border-border" />
            </div>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.map(u => (
                  <SelectItem key={u.userId} value={u.userId}>
                    {u.fullName || u.username || u.userId.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentUser && (
              <div className="mt-3 p-3 bg-secondary/50 rounded-lg space-y-1">
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
            )}
          </div>
        </div>

        {/* Store Access */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-primary" /> Store Access
          </h3>
          {!selectedUserId ? (
            <p className="text-sm text-muted-foreground">Select a user first.</p>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Select value={storeToAssign} onValueChange={setStoreToAssign}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Select store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.filter(s => !storeAccess.data?.some(sa => sa.storeId === s.id)).map(s => (
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
            </>
          )}
        </div>

        {/* Shelf/Planogram Access */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <LayoutGrid className="w-4 h-4 text-primary" /> Planogram Access
          </h3>
          {!selectedUserId ? (
            <p className="text-sm text-muted-foreground">Select a user first.</p>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Select value={shelfToAssign} onValueChange={setShelfToAssign}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Select shelf..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shelves.filter(s => !shelfAccess.data?.some(sa => sa.shelfId === s.id)).map(s => (
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
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
