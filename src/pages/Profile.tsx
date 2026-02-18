import { useState } from 'react';
import { User, Camera, Lock, Loader2, Mail, Shield, Clock, AtSign } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { rest, storage } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  // Profile form
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [username, setUsername] = useState((profile as any)?.username || '');
  const [saving, setSaving] = useState(false);
  
  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await rest.update('profiles', { user_id: `eq.${user!.id}` }, { full_name: fullName, username });

      const error = null;
      await refreshProfile();
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      // Password change via new API not yet supported
      throw new Error('Password change is not available via the current API');
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user!.id}.${ext}`;
      
      await storage.upload('sku-training-images', path, file);
      const publicUrl = storage.getPublicUrl('sku-training-images', path);

      await rest.update('profiles', { user_id: `eq.${user!.id}` }, { avatar_url: publicUrl });
      
      await refreshProfile();
      toast({ title: 'Avatar updated' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <MainLayout title="My Profile" subtitle="Manage your account information and security.">
      <div className="max-w-2xl space-y-6">
        {/* Avatar & Name Section */}
        <div className="page-section">
          <div className="flex items-start gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-border flex items-center justify-center overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                ) : (
                  <Camera className="w-5 h-5 text-foreground" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{profile?.fullName || 'Admin User'}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AtSign className="w-3 h-3" />
                {(profile as any)?.username || 'no-username'}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <form onSubmit={handleSaveProfile} className="page-section space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Profile Information</h3>
              <p className="text-xs text-muted-foreground">Update your personal details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                className="bg-secondary border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                placeholder="johndoe"
                className="bg-secondary border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="bg-secondary border-border opacity-60" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="page-section space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Change Password</h3>
              <p className="text-xs text-muted-foreground">Update your account password</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="••••••••"
                className="bg-secondary border-border" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••••"
                className="bg-secondary border-border" 
                required
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="outline" disabled={changingPassword}>
              {changingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </div>
        </form>

        {/* Account Info */}
        <div className="page-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Account Details</h3>
              <p className="text-xs text-muted-foreground">Your account information</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm py-2 border-b border-border">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-mono text-xs text-foreground">{user?.id?.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-border">
              <span className="text-muted-foreground">Email verified</span>
              <span className="text-success text-xs font-medium">Verified</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-muted-foreground">Last sign in</span>
              <span className="text-foreground text-xs">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
