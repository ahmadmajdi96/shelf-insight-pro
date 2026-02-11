import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ScanLine, 
  Store, 
  Users, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Boxes,
  Activity,
  Menu,
  X,
  UserCog,
  LayoutGrid,
  Database,
  Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  userRole?: 'admin' | 'tenant';
}

// Admin-only navigation items
const adminOnlyNavItems = [
  { icon: Users, label: 'Tenants', path: '/tenants' },
  { icon: Activity, label: 'Activity', path: '/activity' },
];

// Common tenant navigation items
const baseTenantNavItems = [
  { icon: Boxes, label: 'Categories', path: '/categories' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: LayoutGrid, label: 'Shelves', path: '/shelves' },
  { icon: Grid3X3, label: 'Planogram', path: '/planogram' },
  { icon: ScanLine, label: 'Detection', path: '/detection' },
  { icon: Store, label: 'Stores', path: '/stores' },
];

// Tenant admin specific items
const tenantAdminItems = [
  { icon: UserCog, label: 'Users', path: '/users' },
  { icon: Database, label: 'Data', path: '/data' },
];

// Build navigation based on role
function getNavItems(isAdmin: boolean, isTenantAdmin: boolean, hasTenant: boolean) {
  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  ];
  
  // Admin gets admin-only items
  if (isAdmin) {
    items.push(...adminOnlyNavItems);
    // If admin has a tenant, show tenant items too
    if (hasTenant) {
      items.push(...baseTenantNavItems);
    }
    items.push(...tenantAdminItems);
  } else if (isTenantAdmin) {
    items.push(...baseTenantNavItems, ...tenantAdminItems);
  } else {
    // Regular tenant user
    items.push(...baseTenantNavItems);
  }
  
  items.push({ icon: Settings, label: 'Settings', path: '/settings' });
  return items;
}

export function Sidebar({ userRole: propUserRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut, isAdmin, isTenantAdmin, tenantId } = useAuth();
  
  // Build navigation items dynamically based on role and tenant
  const navItems = getNavItems(isAdmin, isTenantAdmin, !!tenantId);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  // Mobile hamburger button
  const MobileMenuButton = () => (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-3 left-3 z-50 md:hidden bg-card border border-border shadow-lg"
      onClick={() => setMobileOpen(!mobileOpen)}
    >
      {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </Button>
  );

  // Mobile overlay
  const MobileOverlay = () => (
    <div 
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity",
        mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={() => setMobileOpen(false)}
    />
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ShelfVision</span>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <ScanLine className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-primary/10 text-primary border-l-2 border-primary",
                    collapsed && !isMobile && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                  {(!collapsed || isMobile) && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User / Collapse */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full justify-center text-muted-foreground hover:text-foreground",
              !collapsed && "justify-between"
            )}
          >
            {!collapsed && <span className="text-xs">Collapse</span>}
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full text-muted-foreground hover:text-destructive",
            (collapsed && !isMobile) ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="w-4 h-4" />
          {(!collapsed || isMobile) && <span className="ml-2 text-sm">Logout</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <MobileMenuButton />
      <MobileOverlay />
      
      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-300 flex flex-col md:hidden w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col hidden md:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
