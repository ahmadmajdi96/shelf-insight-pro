import { ScanLine, Package, Store, TrendingUp, ImageIcon, CheckCircle2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentDetections } from '@/components/dashboard/RecentDetections';
import { ShareOfShelfChart } from '@/components/dashboard/ShareOfShelfChart';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back! Here's your shelf detection overview.">
      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <Button variant="glow" onClick={() => navigate('/detection')}>
          <ScanLine className="w-4 h-4 mr-2" />
          New Detection
        </Button>
        <Button variant="outline" onClick={() => navigate('/products')}>
          <Package className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Detections"
          value="1,247"
          change="+12% from last week"
          changeType="positive"
          icon={ScanLine}
        />
        <StatsCard
          title="Trained SKUs"
          value="48"
          change="6 pending training"
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Monitored Stores"
          value="23"
          change="+3 this month"
          changeType="positive"
          icon={Store}
        />
        <StatsCard
          title="Avg. Share of Shelf"
          value="34.5%"
          change="+2.3% vs last month"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentDetections />
        </div>
        <div>
          <ShareOfShelfChart />
        </div>
      </div>

      {/* Usage Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Monthly Image Quota</h3>
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-medium text-foreground">847 / 2,000</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                style={{ width: '42.35%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground">1,153 images remaining this month</p>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Training Status</h3>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="text-sm font-medium text-success">42 SKUs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In Progress</span>
              <span className="text-sm font-medium text-warning">4 SKUs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="text-sm font-medium text-muted-foreground">2 SKUs</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
