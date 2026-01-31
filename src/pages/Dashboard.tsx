import { ScanLine, Package, Store, TrendingUp, ImageIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentDetections } from '@/components/dashboard/RecentDetections';
import { ShareOfShelfChart } from '@/components/dashboard/ShareOfShelfChart';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useQuota } from '@/hooks/useQuota';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { stores, isLoading: storesLoading } = useStores();
  const { quota, monthlyPercentage, isLoading: quotaLoading } = useQuota();

  const isLoading = productsLoading || storesLoading || quotaLoading;

  const trainedCount = products.filter(p => p.training_status === 'completed').length;
  const trainingCount = products.filter(p => p.training_status === 'training').length;
  const pendingCount = products.filter(p => p.training_status === 'pending').length;

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle={`Welcome back${profile?.fullName ? `, ${profile.fullName}` : ''}! Here's your shelf detection overview.`}
      userRole={isAdmin ? 'admin' : 'tenant'}
    >
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="glow" onClick={() => navigate('/detection')}>
          <ScanLine className="w-4 h-4 mr-2" />
          New Detection
        </Button>
        <Button variant="outline" onClick={() => navigate('/products')}>
          <Package className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Images Processed"
              value={quota?.monthlyUsage?.toLocaleString() || '0'}
              change={`${quota?.monthlyLimit?.toLocaleString() || '0'} monthly limit`}
              changeType="neutral"
              icon={ScanLine}
            />
            <StatsCard
              title="Trained SKUs"
              value={trainedCount.toString()}
              change={`${pendingCount + trainingCount} pending`}
              changeType="neutral"
              icon={Package}
            />
            <StatsCard
              title="Monitored Stores"
              value={stores.length.toString()}
              change="Active locations"
              changeType="neutral"
              icon={Store}
            />
            <StatsCard
              title="Products"
              value={products.length.toString()}
              change={`${quota?.skuLimit || 0} max allowed`}
              changeType="neutral"
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
                  <span className="font-medium text-foreground">
                    {quota?.monthlyUsage?.toLocaleString() || 0} / {quota?.monthlyLimit?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.max(0, (quota?.monthlyLimit || 0) - (quota?.monthlyUsage || 0)).toLocaleString()} images remaining this month
                </p>
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
                  <span className="text-sm font-medium text-success">{trainedCount} SKUs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="text-sm font-medium text-warning">{trainingCount} SKUs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-medium text-muted-foreground">{pendingCount} SKUs</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
