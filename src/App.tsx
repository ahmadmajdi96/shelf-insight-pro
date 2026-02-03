import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Detection from "./pages/Detection";
import Categories from "./pages/Categories";
import Stores from "./pages/Stores";
import Shelves from "./pages/Shelves";
import ShelfDetail from "./pages/ShelfDetail";
import Tenants from "./pages/Tenants";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Data from "./pages/Data";
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
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes - any authenticated user */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute requireTenant>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/detection" element={
              <ProtectedRoute requireTenant>
                <Detection />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute requireTenant>
                <Categories />
              </ProtectedRoute>
            } />
            <Route path="/stores" element={
              <ProtectedRoute requireTenant>
                <Stores />
              </ProtectedRoute>
            } />
            <Route path="/shelves" element={
              <ProtectedRoute requireTenant>
                <Shelves />
              </ProtectedRoute>
            } />
            <Route path="/shelves/:id" element={
              <ProtectedRoute requireTenant>
                <ShelfDetail />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            {/* Admin/Tenant Admin routes */}
            <Route path="/users" element={
              <ProtectedRoute requiredRoles={['admin', 'tenant_admin']}>
                <Users />
              </ProtectedRoute>
            } />
            
            {/* Admin only routes */}
            <Route path="/tenants" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Tenants />
              </ProtectedRoute>
            } />
            <Route path="/activity" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Activity />
              </ProtectedRoute>
            } />
            <Route path="/data" element={
              <ProtectedRoute requiredRoles={['admin', 'tenant_admin']}>
                <Data />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;