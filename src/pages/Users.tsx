import { useState } from 'react';
import { Plus, Search, UserPlus, MoreVertical, Shield, Mail, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Mock users - will be replaced with real data
const mockUsers = [
  { id: '1', email: 'admin@company.com', fullName: 'John Admin', role: 'admin', status: 'active', lastLogin: '2 hours ago' },
  { id: '2', email: 'manager@coca-cola.com', fullName: 'Sarah Manager', role: 'tenant_admin', status: 'active', lastLogin: '1 day ago' },
  { id: '3', email: 'user@coca-cola.com', fullName: 'Mike User', role: 'tenant_user', status: 'active', lastLogin: '3 days ago' },
  { id: '4', email: 'pending@pepsi.com', fullName: 'Jane Pending', role: 'tenant_user', status: 'pending', lastLogin: null },
];

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Platform Admin', variant: 'default' },
  tenant_admin: { label: 'Tenant Admin', variant: 'secondary' },
  tenant_user: { label: 'User', variant: 'outline' },
};

export default function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin, role } = useAuth();

  const filteredUsers = mockUsers.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userRole = isAdmin ? 'admin' : 'tenant';

  return (
    <MainLayout 
      title="User Management" 
      subtitle="Manage user accounts and permissions."
      
    >
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-9 bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="glow" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Login</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={roleLabels[user.role]?.variant || 'outline'}>
                      {roleLabels[user.role]?.label || user.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        user.status === 'active' && 'border-success text-success',
                        user.status === 'pending' && 'border-warning text-warning',
                        user.status === 'inactive' && 'border-muted-foreground text-muted-foreground'
                      )}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {user.lastLogin || 'Never'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Shield className="w-4 h-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Invite User
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                type="email" 
                placeholder="user@company.com" 
                className="bg-secondary border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="John Doe" 
                className="bg-secondary border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue="tenant_user">
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && (
                    <SelectItem value="admin">Platform Admin</SelectItem>
                  )}
                  <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  <SelectItem value="tenant_user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow">
                <Mail className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
