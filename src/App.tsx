import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ShelfDetail from "./pages/ShelfDetail";
import Tenants from "./pages/Tenants";
import Activity from "./pages/Activity";
import ApiDocs from "./pages/ApiDocs";
import Data from "./pages/Data";
import Planogram from "./pages/Planogram";
import Training from "./pages/Training";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import AccessControl from "./pages/AccessControl";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Shared routes - accessible by owner, admin, and tenant_admin */}
            <Route path="/" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><Dashboard /></ProtectedRoute>} />
            <Route path="/tenants" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><Planogram /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><Planogram /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><Planogram /></ProtectedRoute>} />
            <Route path="/management" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><Planogram /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requiredRoles={['owner', 'admin']}><Users /></ProtectedRoute>} />
            <Route path="/access-control" element={<ProtectedRoute requiredRoles={['owner', 'admin']}><AccessControl /></ProtectedRoute>} />
            <Route path="/shelves/:id" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><ShelfDetail /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><Activity /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute requiredRoles={['owner', 'admin', 'tenant_admin', 'tenant_user']}><Notifications /></ProtectedRoute>} />
            
            {/* Owner-only routes */}
            <Route path="/training" element={<ProtectedRoute requiredRoles={['owner']}><Training /></ProtectedRoute>} />
            <Route path="/data" element={<ProtectedRoute requiredRoles={['owner']}><Data /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRoles={['owner']}><Settings /></ProtectedRoute>} />
            <Route path="/api-docs" element={<ProtectedRoute requiredRoles={['owner']}><ApiDocs /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
