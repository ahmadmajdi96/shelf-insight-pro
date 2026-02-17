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
import Settings from "./pages/Settings";
import Data from "./pages/Data";
import Planogram from "./pages/Planogram";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
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
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/" element={<ProtectedRoute requiredRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/tenants" element={<ProtectedRoute requiredRoles={['admin']}><Planogram /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute requiredRoles={['admin']}><Planogram /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute requiredRoles={['admin']}><Planogram /></ProtectedRoute>} />
            <Route path="/management" element={<ProtectedRoute requiredRoles={['admin']}><Planogram /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requiredRoles={['admin']}><Planogram /></ProtectedRoute>} />
            <Route path="/shelves/:id" element={<ProtectedRoute requiredRoles={['admin']}><ShelfDetail /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute requiredRoles={['admin']}><Activity /></ProtectedRoute>} />
            <Route path="/data" element={<ProtectedRoute requiredRoles={['admin']}><Data /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requiredRoles={['admin']}><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute requiredRoles={['admin']}><Notifications /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
