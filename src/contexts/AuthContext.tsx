import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth as apiAuth, rest, onAuthChange, getToken, getStoredUser } from '@/lib/api-client';
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
          adminId: profileData.admin_id || null,
          fullName: profileData.full_name,
          avatarUrl: profileData.avatar_url,
        });
        setTenantId(profileData.tenant_id);
        setAdminId(profileData.admin_id || null);
      }

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

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      const simpleUser: SimpleUser = { id: storedUser.id, email: storedUser.email || '' };
      setUser(simpleUser);
      setSession({ access_token: token, user: simpleUser });
      fetchProfile(simpleUser.id).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    // Listen for auth changes from api-client (login/logout)
    const unsubscribe = onAuthChange((event, sess) => {
      if (event === 'SIGNED_IN' && sess) {
        const simpleUser: SimpleUser = { id: sess.user.id, email: sess.user.email || '' };
        setUser(simpleUser);
        setSession({ access_token: sess.access_token, user: simpleUser });
        fetchProfile(simpleUser.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
        setTenantId(null);
        setAdminId(null);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, fullName: string, username?: string) => {
    try {
      await apiAuth.signup(email, password, { full_name: fullName, username });
      toast({
        title: 'Account created',
        description: 'Your account has been created. You can now sign in.',
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