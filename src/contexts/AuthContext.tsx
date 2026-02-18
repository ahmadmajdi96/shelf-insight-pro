import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, auth as apiAuth, onAuthChange, getToken, getStoredUser } from '@/lib/api-client';
import { rest, rpc } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'tenant_admin' | 'tenant_user';

interface UserProfile {
  id: string;
  userId: string;
  tenantId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

interface SimpleUser {
  id: string;
  email: string;
  last_sign_in_at?: string;
}

interface AuthContextType {
  user: SimpleUser | null;
  session: { access_token: string; user: SimpleUser } | null;
  profile: UserProfile | null;
  role: AppRole | null;
  tenantId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isTenantAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, username?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [session, setSession] = useState<{ access_token: string; user: SimpleUser } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profiles } = await rest.list('profiles', {
        select: '*',
        filters: { user_id: `eq.${userId}` },
      });

      const profileData = profiles?.[0];
      if (profileData) {
        setProfile({
          id: profileData.id,
          userId: profileData.user_id,
          tenantId: profileData.tenant_id,
          fullName: profileData.full_name,
          avatarUrl: profileData.avatar_url,
        });
        setTenantId(profileData.tenant_id);
      }

      // Fetch user role
      const { data: roles } = await rest.list('user_roles', {
        select: 'role',
        filters: { user_id: `eq.${userId}` },
      });

      const roleData = roles?.[0];
      if (roleData) {
        setRole(roleData.role as AppRole);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = onAuthChange((event, sess) => {
      if (event === 'SIGNED_IN' && sess?.user) {
        setSession(sess);
        setUser(sess.user);
        setTimeout(() => fetchProfile(sess.user.id), 0);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
        setTenantId(null);
      }
      setIsLoading(false);
    });

    // Check existing session
    const existing = apiAuth.getSession();
    if (existing?.user) {
      setSession(existing as any);
      setUser(existing.user);
      fetchProfile(existing.user.id);
    }
    setIsLoading(false);

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, fullName: string, username?: string) => {
    try {
      await apiAuth.signup(email, password, { full_name: fullName, username });
      toast({
        title: 'Check your email',
        description: 'We sent you a verification link to complete your registration.',
      });
      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({ title: 'Sign up failed', description: err.message, variant: 'destructive' });
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await apiAuth.login(email, password);
      toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({ title: 'Sign in failed', description: err.message, variant: 'destructive' });
      return { error: err };
    }
  };

  const signOut = async () => {
    await apiAuth.logout();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setTenantId(null);
    toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
  };

  const isAdmin = role === 'admin';
  const isTenantAdmin = role === 'tenant_admin' || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        tenantId,
        isLoading,
        isAdmin,
        isTenantAdmin,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
