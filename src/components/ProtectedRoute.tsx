import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
  requireTenant?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles,
  requireTenant = false 
}: ProtectedRouteProps) {
  const { user, role, tenantId, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles && role && !requiredRoles.includes(role)) {
    // User doesn't have required role
    return <Navigate to="/" replace />;
  }

  // Check if tenant is required but user doesn't have one (and isn't admin)
  if (requireTenant && !tenantId && role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">No Tenant Assigned</h1>
          <p className="text-muted-foreground mb-6">
            Your account hasn't been assigned to a tenant yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
