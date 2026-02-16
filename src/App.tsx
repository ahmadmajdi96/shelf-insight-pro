import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Detection from "./pages/Detection";
import Categories from "./pages/Categories";
import Shelves from "./pages/Shelves";
import ShelfDetail from "./pages/ShelfDetail";
import Tenants from "./pages/Tenants";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Data from "./pages/Data";
import Planogram from "./pages/Planogram";
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
            
            {/* All protected routes - admin only */}
            <Route path="/" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tenants" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Tenants />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Categories />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/shelves" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Shelves />
              </ProtectedRoute>
            } />
            <Route path="/shelves/:id" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <ShelfDetail />
              </ProtectedRoute>
            } />
            <Route path="/planogram" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Planogram />
              </ProtectedRoute>
            } />
            <Route path="/detection" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Detection />
              </ProtectedRoute>
            } />
            <Route path="/activity" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Activity />
              </ProtectedRoute>
            } />
            <Route path="/data" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Data />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Settings />
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
