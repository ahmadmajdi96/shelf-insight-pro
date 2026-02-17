import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ScanLine, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  Menu,
  X,
  Database,
  Grid3X3,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Grid3X3, label: 'Management', path: '/management' },
  { icon: Activity, label: 'Activity', path: '/activity' },
  { icon: Database, label: 'Data', path: '/data' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

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
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <ScanLine className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground tracking-tight">ShelfVision</span>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-sm">
            <ScanLine className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const showBadge = item.path === '/notifications' && unreadCount > 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  isActive && "bg-primary/10 text-primary font-medium",
                  collapsed && !isMobile && "justify-center px-2"
                )}
              >
                <item.icon className={cn(
                  "w-[18px] h-[18px] shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {(!collapsed || isMobile) && (
                  <span className="text-sm flex-1">{item.label}</span>
                )}
                {showBadge && (!collapsed || isMobile) && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {showBadge && collapsed && !isMobile && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full" />
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full justify-center text-muted-foreground hover:text-foreground h-8",
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
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8",
            (collapsed && !isMobile) ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="w-4 h-4" />
          {(!collapsed || isMobile) && <span className="ml-2 text-sm">Sign out</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <MobileMenuButton />
      <MobileOverlay />
      
      {/* Mobile sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-300 flex flex-col md:hidden w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col hidden md:flex",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
