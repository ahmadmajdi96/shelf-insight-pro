import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, auth as apiAuth } from '@/lib/api-client';
import { rest, rpc } from '@/lib/api-client';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'owner' | 'admin' | 'tenant_admin' | 'tenant_user';

interface UserProfile {
  id: string;
  userId: string;
  tenantId: string | null;
  adminId: string | null;
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
  adminId: string | null;
  isLoading: boolean;
  isOwner: boolean;
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
  const [adminId, setAdminId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      // Always use Supabase client for auth-related data (profiles, roles)
      // since these tables live in Lovable Cloud, not the custom backend
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId);

      if (profileError) throw profileError;

      const profileData = profiles?.[0];
      if (profileData) {
        setProfile({
          id: profileData.id,
          userId: profileData.user_id,
          tenantId: profileData.tenant_id,
          adminId: profileData.admin_id || null,
          fullName: profileData.full_name,
          avatarUrl: profileData.avatar_url,
        });
        setTenantId(profileData.tenant_id);
        setAdminId(profileData.admin_id || null);
      }

      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) throw roleError;

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
    let mounted = true;

    // IMPORTANT: Set up listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (sess?.user) {
          const simpleUser: SimpleUser = { id: sess.user.id, email: sess.user.email || '' };
          setSession({ access_token: sess.access_token, user: simpleUser });
          setUser(simpleUser);
          // Use setTimeout to avoid race conditions with Supabase internals
          setTimeout(() => { if (mounted) fetchProfile(sess.user.id); }, 0);
        }
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
        setTenantId(null);
        setAdminId(null);
        setIsLoading(false);
      }
    });

    // Fallback: if onAuthStateChange doesn't fire INITIAL_SESSION quickly
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        supabase.auth.getSession().then(({ data: { session: sess } }) => {
          if (!mounted) return;
          if (sess?.user) {
            const simpleUser: SimpleUser = { id: sess.user.id, email: sess.user.email || '' };
            setSession({ access_token: sess.access_token, user: simpleUser });
            setUser(simpleUser);
            fetchProfile(sess.user.id);
          }
          setIsLoading(false);
        });
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
    setAdminId(null);
    toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
  };

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || role === 'owner';
  const isTenantAdmin = role === 'tenant_admin' || role === 'admin' || role === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        tenantId,
        adminId,
        isLoading,
        isOwner,
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

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  role: null,
  tenantId: null,
  adminId: null,
  isLoading: true,
  isOwner: false,
  isAdmin: false,
  isTenantAdmin: false,
  signUp: async () => ({ error: new Error('AuthProvider not mounted') }),
  signIn: async () => ({ error: new Error('AuthProvider not mounted') }),
  signOut: async () => {},
  refreshProfile: async () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context ?? defaultAuthContext;
}
