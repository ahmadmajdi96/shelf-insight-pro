import { useState } from 'react';
import { Bell, CheckCheck, Filter, Trash2, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

const typeLabels: Record<string, { label: string; color: string }> = {
  processing_complete: { label: 'Processing', color: 'bg-primary/10 text-primary' },
  training_complete: { label: 'Training', color: 'bg-success/10 text-success' },
  quota_warning: { label: 'Quota', color: 'bg-warning/10 text-warning' },
  system_alert: { label: 'System', color: 'bg-destructive/10 text-destructive' },
};

export default function Notifications() {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  const filtered = notifications.filter(n => {
    const matchesType = typeFilter === 'all' || n.type === typeFilter;
    const matchesRead = readFilter === 'all' || 
      (readFilter === 'unread' && !n.isRead) || 
      (readFilter === 'read' && n.isRead);
    return matchesType && matchesRead;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, n) => {
    const day = format(new Date(n.createdAt), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(n);
    return acc;
  }, {});

  const formatDayLabel = (day: string) => {
    const d = new Date(day);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return format(d, 'EEEE, MMMM d');
  };

  return (
    <MainLayout title="Notifications" subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border h-9 text-sm">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="processing_complete">Processing</SelectItem>
              <SelectItem value="training_complete">Training</SelectItem>
              <SelectItem value="quota_warning">Quota</SelectItem>
              <SelectItem value="system_alert">System</SelectItem>
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="h-9"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-primary">{unreadCount}</p>
          <p className="text-sm text-muted-foreground">Unread</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-success">
            {notifications.filter(n => n.type === 'processing_complete' || n.type === 'training_complete').length}
          </p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-warning">
            {notifications.filter(n => n.type === 'quota_warning').length}
          </p>
          <p className="text-sm text-muted-foreground">Warnings</p>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 page-section">
          <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            {notifications.length === 0 ? "You're all caught up!" : 'No notifications match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {formatDayLabel(day)}
              </h3>
              <div className="space-y-1.5">
                {items.map((n, i) => {
                  const typeInfo = typeLabels[n.type] || { label: n.type, color: 'bg-muted text-muted-foreground' };
                  return (
                    <button
                      key={n.id}
                      className={cn(
                        "w-full text-left rounded-xl p-4 border transition-all duration-200 animate-fade-in",
                        n.isRead 
                          ? "bg-card border-border hover:border-border" 
                          : "bg-primary/[0.03] border-primary/10 hover:border-primary/20",
                      )}
                      style={{ animationDelay: `${i * 30}ms` }}
                      onClick={() => { if (!n.isRead) markAsRead.mutate(n.id); }}
                    >
                      <div className="flex items-start gap-3">
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                        <div className={cn("flex-1 min-w-0", n.isRead && "ml-5")}>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground">{n.title}</p>
                            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", typeInfo.color)}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{n.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1.5">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
