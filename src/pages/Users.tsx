import { useState, useMemo } from 'react';
import { Search, UserPlus, MoreVertical, Shield, Trash2, Loader2, Pencil, Eye } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUsers, UserWithProfile } from '@/hooks/useUsers';
import { useTenants } from '@/hooks/useTenants';
import { useAdmins } from '@/hooks/useAdmins';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  tenant_admin: { label: 'Tenant Admin', variant: 'secondary' },
  tenant_user: { label: 'User', variant: 'outline' },
};

type UnifiedUser = {
  id: string;
  source: 'user' | 'admin' | 'tenant';
  name: string;
  email: string;
  role: string;
  tenantName?: string;
  createdAt: string;
  details: any;
};

export default function Users() {
  const { users, isLoading, createUser, updateUserProfile, updateUserRole, deleteUser } = useUsers();
  const { tenants } = useTenants();
  const { admins } = useAdmins();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Add user
  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', fullName: '', username: '', role: 'tenant_user', tenantId: '' });

  // Edit user
  const [editUser, setEditUser] = useState<UserWithProfile | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', username: '', tenantId: '' });

  // View user
  const [viewUser, setViewUser] = useState<UserWithProfile | null>(null);

  // Role change
  const [roleChangeUser, setRoleChangeUser] = useState<{ userId: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState('');

  // Delete confirm
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Build unified list: users + admins + tenants
  const unifiedUsers = useMemo<UnifiedUser[]>(() => {
    const list: UnifiedUser[] = [];
    // Users from profiles
    users.forEach(u => {
      list.push({
        id: u.userId,
        source: 'user',
        name: u.fullName || u.username || 'Unnamed',
        email: u.email || u.userId.slice(0, 8) + '...',
        role: u.role,
        tenantName: u.tenantId ? tenants.find(t => t.id === u.tenantId)?.name : undefined,
        createdAt: u.createdAt,
        details: u,
      });
    });
    // Admins (avoid duplicates by email)
    const userEmails = new Set(users.map(u => u.email).filter(Boolean));
    admins.forEach(a => {
      if (!userEmails.has(a.email)) {
        list.push({
          id: a.id,
          source: 'admin',
          name: a.full_name,
          email: a.email,
          role: 'admin',
          createdAt: a.created_at,
          details: a,
        });
      }
    });
    // Tenants (show as entries)
    tenants.forEach(t => {
      if (t.username) {
        list.push({
          id: t.id,
          source: 'tenant',
          name: t.name,
          email: t.username || '',
          role: 'tenant',
          createdAt: t.created_at,
          details: t,
        });
      }
    });
    return list;
  }, [users, admins, tenants]);

  const filteredUsers = unifiedUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSource = sourceFilter === 'all' || u.source === sourceFilter;
    return matchesSearch && matchesRole && matchesSource;
  });

  const handleAddUser = () => {
    if (!addForm.email || !addForm.password || !addForm.fullName) return;
    createUser.mutate({ email: addForm.email, password: addForm.password, fullName: addForm.fullName, username: addForm.username || undefined, role: addForm.role, tenantId: addForm.tenantId || undefined }, {
      onSuccess: () => { setShowAddUser(false); setAddForm({ email: '', password: '', fullName: '', username: '', role: 'tenant_user', tenantId: '' }); }
    });
  };

  const handleEditUser = () => {
    if (!editUser) return;
    updateUserProfile.mutate({ userId: editUser.userId, fullName: editForm.fullName, username: editForm.username || undefined, tenantId: editForm.tenantId || undefined }, { onSuccess: () => setEditUser(null) });
  };

  const handleRoleChange = () => {
    if (roleChangeUser && newRole) { updateUserRole.mutate({ userId: roleChangeUser.userId, role: newRole }); setRoleChangeUser(null); setNewRole(''); }
  };

  const handleDelete = () => {
    if (deleteUserId) { deleteUser.mutate(deleteUserId); setDeleteUserId(null); }
  };

  const openEdit = (user: UserWithProfile) => {
    setEditUser(user);
    setEditForm({ fullName: user.fullName || '', username: user.username || '', tenantId: user.tenantId || '' });
  };

  const getSourceBadge = (source: string) => {
    if (source === 'admin') return <Badge variant="default" className="text-[10px]">Admin</Badge>;
    if (source === 'tenant') return <Badge className="text-[10px] bg-accent text-accent-foreground">Tenant</Badge>;
    return <Badge variant="outline" className="text-[10px]">User</Badge>;
  };

  return (
    <MainLayout title="User Management" subtitle="View all users, admins, and tenants in one place.">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9 bg-card border-border" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border"><SelectValue placeholder="All Sources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="tenant">Tenants</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border"><Shield className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="All roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
              <SelectItem value="tenant_user">User</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddUser(true)}><UserPlus className="w-4 h-4 mr-2" />Add User</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{unifiedUsers.length}</p><p className="text-sm text-muted-foreground">Total</p></div>
          <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-foreground">{users.length}</p><p className="text-sm text-muted-foreground">Users</p></div>
          <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-primary">{admins.length}</p><p className="text-sm text-muted-foreground">Admins</p></div>
          <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-accent">{tenants.filter(t => t.username).length}</p><p className="text-sm text-muted-foreground">Tenants</p></div>
          <div className="p-4 rounded-lg bg-card border border-border"><p className="text-2xl font-bold text-success">{users.filter(u => u.role === 'tenant_admin').length}</p><p className="text-sm text-muted-foreground">Tenant Admins</p></div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email / Username</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={`${u.source}-${u.id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{getSourceBadge(u.source)}</TableCell>
                      <TableCell>
                        <Badge variant={roleLabels[u.role]?.variant || 'outline'}>
                          {roleLabels[u.role]?.label || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.tenantName || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(u.createdAt), 'PP')}</TableCell>
                      <TableCell className="text-right">
                        {u.source === 'user' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewUser(u.details)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(u.details)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setRoleChangeUser({ userId: u.id, currentRole: u.role }); setNewRole(u.role); }}><Shield className="w-4 h-4 mr-2" />Change Role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUserId(u.id)}><Trash2 className="w-4 h-4 mr-2" />Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No users found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* ===== ADD USER DIALOG ===== */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />Add New User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Full Name *</Label><Input value={addForm.fullName} onChange={e => setAddForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Username</Label><Input value={addForm.username} onChange={e => setAddForm(f => ({ ...f, username: e.target.value }))} className="bg-secondary border-border" /></div>
              <div className="space-y-2 col-span-2"><Label>Password *</Label><Input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Role</Label>
                <Select value={addForm.role} onValueChange={v => setAddForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="tenant_admin">Tenant Admin</SelectItem><SelectItem value="tenant_user">User</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Tenant</Label>
                <Select value={addForm.tenantId} onValueChange={v => setAddForm(f => ({ ...f, tenantId: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">None</SelectItem>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
              <Button onClick={handleAddUser} disabled={createUser.isPending || !addForm.email || !addForm.password || !addForm.fullName}>
                {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT USER DIALOG ===== */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-primary" />Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Username</Label><Input value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Tenant</Label>
              <Select value={editForm.tenantId || 'none'} onValueChange={v => setEditForm(f => ({ ...f, tenantId: v === 'none' ? '' : v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={handleEditUser} disabled={updateUserProfile.isPending}>{updateUserProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== VIEW USER DIALOG ===== */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-primary" />User Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{(viewUser.fullName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{viewUser.fullName || 'Unnamed'}</p>
                  <p className="text-sm text-muted-foreground">@{viewUser.username || 'no-username'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Role</p><Badge variant={roleLabels[viewUser.role]?.variant || 'outline'} className="mt-1">{roleLabels[viewUser.role]?.label || viewUser.role}</Badge></div>
                <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Tenant</p><p className="text-sm font-medium text-foreground mt-1">{viewUser.tenantId ? tenants.find(t => t.id === viewUser.tenantId)?.name || 'Unknown' : 'None'}</p></div>
                <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm font-medium text-foreground mt-1">{format(new Date(viewUser.createdAt), 'PP')}</p></div>
                <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Last Login</p><p className="text-sm font-medium text-foreground mt-1">{viewUser.lastLogin ? format(new Date(viewUser.lastLogin), 'PP') : 'Never'}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleChangeUser} onOpenChange={() => setRoleChangeUser(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Change Role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="tenant_admin">Tenant Admin</SelectItem><SelectItem value="tenant_user">User</SelectItem></SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRoleChangeUser(null)}>Cancel</Button>
              <Button onClick={handleRoleChange} disabled={updateUserRole.isPending}>{updateUserRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove User</AlertDialogTitle><AlertDialogDescription>This will remove the user's profile and role assignments.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
