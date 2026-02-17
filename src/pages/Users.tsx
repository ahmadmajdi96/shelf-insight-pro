import { useState } from 'react';
import { Search, UserPlus, MoreVertical, Shield, Trash2, Store, LayoutGrid, Loader2, X, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useUsers } from '@/hooks/useUsers';
import { useStores } from '@/hooks/useStores';
import { useShelves } from '@/hooks/useShelves';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  tenant_admin: { label: 'Tenant Admin', variant: 'secondary' },
  tenant_user: { label: 'User', variant: 'outline' },
};

export default function Users() {
  const { users, isLoading, updateUserRole, deleteUser } = useUsers();
  const { stores } = useStores();
  const { shelves } = useShelves();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('users');

  // Role change
  const [roleChangeUser, setRoleChangeUser] = useState<{ userId: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState('');

  // Delete confirm
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Access management
  const [accessUser, setAccessUser] = useState<{ userId: string; fullName: string } | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = () => {
    if (roleChangeUser && newRole) {
      updateUserRole.mutate({ userId: roleChangeUser.userId, role: newRole });
      setRoleChangeUser(null);
      setNewRole('');
    }
  };

  const handleDelete = () => {
    if (deleteUserId) {
      deleteUser.mutate(deleteUserId);
      setDeleteUserId(null);
    }
  };

  return (
    <MainLayout title="User Management" subtitle="Manage user accounts, roles, and access permissions.">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        {/* ========== USERS TAB ========== */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 bg-card border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px] bg-card border-border">
                <Shield className="w-3.5 h-3.5 mr-2" />
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                <SelectItem value="tenant_user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="stat-card">
              <p className="text-2xl font-bold text-primary">{users.filter(u => u.role === 'admin').length}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
            <div className="stat-card">
              <p className="text-2xl font-bold text-accent">{users.filter(u => u.role === 'tenant_admin').length}</p>
              <p className="text-sm text-muted-foreground">Tenant Admins</p>
            </div>
            <div className="stat-card">
              <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'tenant_user').length}</p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Username</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tenant</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-medium text-primary">
                                  {(user.fullName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.fullName || 'Unnamed'}</p>
                              <p className="text-xs text-muted-foreground">{user.userId.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-foreground">{user.username || '—'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={roleLabels[user.role]?.variant || 'outline'}>
                            {roleLabels[user.role]?.label || user.role}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {user.tenantId ? user.tenantId.slice(0, 8) + '...' : '—'}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setRoleChangeUser({ userId: user.userId, currentRole: user.role });
                                setNewRole(user.role);
                              }}>
                                <Shield className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setAccessUser({ userId: user.userId, fullName: user.fullName || 'User' });
                                setActiveTab('access');
                              }}>
                                <Store className="w-4 h-4 mr-2" />
                                Manage Access
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUserId(user.userId)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========== ACCESS CONTROL TAB ========== */}
        <TabsContent value="access" className="space-y-4">
          <AccessControlPanel 
            users={users} 
            stores={stores} 
            shelves={shelves}
            selectedUser={accessUser}
            onSelectUser={setAccessUser}
          />
        </TabsContent>
      </Tabs>

      {/* Change Role Dialog */}
      <Dialog open={!!roleChangeUser} onOpenChange={() => setRoleChangeUser(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Change User Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  <SelectItem value="tenant_user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRoleChangeUser(null)}>Cancel</Button>
              <Button onClick={handleRoleChange} disabled={updateUserRole.isPending}>
                {updateUserRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user's profile and role assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

// Access Control Panel Component
function AccessControlPanel({ 
  users, stores, shelves, selectedUser, onSelectUser 
}: { 
  users: any[]; 
  stores: any[]; 
  shelves: any[];
  selectedUser: { userId: string; fullName: string } | null;
  onSelectUser: (u: { userId: string; fullName: string } | null) => void;
}) {
  const { useUserStoreAccess, useUserShelfAccess, assignStore, revokeStore, assignShelf, revokeShelf } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState(selectedUser?.userId || '');
  const [storeToAssign, setStoreToAssign] = useState('');
  const [shelfToAssign, setShelfToAssign] = useState('');

  const userId = selectedUser?.userId || selectedUserId;
  const storeAccess = useUserStoreAccess(userId);
  const shelfAccess = useUserShelfAccess(userId);

  const currentUser = users.find(u => u.userId === userId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User Selection */}
      <div className="space-y-4">
        <div className="page-section">
          <h3 className="font-semibold text-foreground mb-3">Select User</h3>
          <Select value={userId} onValueChange={(v) => {
            setSelectedUserId(v);
            const u = users.find(u => u.userId === v);
            onSelectUser(u ? { userId: u.userId, fullName: u.fullName || 'User' } : null);
          }}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
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
            </div>
          )}
        </div>
      </div>

      {/* Store Access */}
      <div className="page-section">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <Store className="w-4 h-4 text-primary" />
          Store Access
        </h3>
        {!userId ? (
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
              <Button 
                size="icon" 
                disabled={!storeToAssign || assignStore.isPending}
                onClick={() => { 
                  assignStore.mutate({ userId, storeId: storeToAssign }); 
                  setStoreToAssign(''); 
                }}
              >
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => revokeStore.mutate({ id: sa.id, userId })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {storeAccess.data?.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No stores assigned.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Shelf/Planogram Access */}
      <div className="page-section">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <LayoutGrid className="w-4 h-4 text-primary" />
          Planogram Access
        </h3>
        {!userId ? (
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
              <Button 
                size="icon" 
                disabled={!shelfToAssign || assignShelf.isPending}
                onClick={() => { 
                  assignShelf.mutate({ userId, shelfId: shelfToAssign }); 
                  setShelfToAssign(''); 
                }}
              >
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => revokeShelf.mutate({ id: sa.id, userId })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {shelfAccess.data?.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No shelves assigned.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
