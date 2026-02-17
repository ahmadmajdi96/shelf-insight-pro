import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const isMobile = useIsMobile();
  const { profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className={cn(
      "h-16 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30",
      isMobile && "pl-14"
    )}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-xl font-bold text-foreground truncate tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="w-56 pl-9 h-9 bg-secondary/50 border-border/50 focus:border-primary text-sm"
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9"
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            >
              <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-card border border-border rounded-xl shadow-elevated overflow-hidden animate-fade-in z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => markAllAsRead.mutate()}
                      >
                        <CheckCheck className="w-3 h-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    recentNotifications.map((n) => (
                      <button
                        key={n.id}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0",
                          !n.isRead && "bg-primary/5"
                        )}
                        onClick={() => { if (!n.isRead) markAsRead.mutate(n.id); }}
                      >
                        <div className="flex items-start gap-3">
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                          <div className={cn("flex-1 min-w-0", n.isRead && "ml-5")}>
                            <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-border p-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-primary"
                    onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                  >
                    View all notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 h-9 px-2"
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-border flex items-center justify-center">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              <span className="hidden md:inline text-sm font-medium text-foreground max-w-[120px] truncate">
                {profile?.fullName || 'Admin'}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
            </Button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-elevated overflow-hidden animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">{profile?.fullName || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground truncate">Administrator</p>
                </div>
                <div className="py-1">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                    onClick={() => { navigate('/profile'); setShowProfile(false); }}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    My Profile
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                    onClick={() => { navigate('/settings'); setShowProfile(false); }}
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
                  </button>
                </div>
                <div className="border-t border-border py-1">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={async () => { await signOut(); navigate('/login'); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
