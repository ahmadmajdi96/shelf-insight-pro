import { useState, useMemo } from 'react';
import {
  Activity as ActivityIcon, ScanLine, Package, Clock, TrendingUp, TrendingDown,
  Loader2, Building2, Store, Filter, Search, X, Download, ChevronDown,
  BarChart3, History, FileText, CheckCircle2, Eye
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { useActivity } from '@/hooks/useActivity';
import { useAdmins } from '@/hooks/useAdmins';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { usePlanogramTemplates, usePlanogramVersions, useComplianceScans } from '@/hooks/usePlanograms';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', '#8B5CF6', '#06B6D4'];

export default function Activity() {
  const { activityData, chartData, recentActivity, totalImages, totalSkus, activeTenants, isLoading } = useActivity();
  const { admins } = useAdmins();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAdminId, setSelectedAdminId] = useState('all');
  const [selectedTenantId, setSelectedTenantId] = useState('all');
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLimit, setViewLimit] = useState(25);

  // Fetch tenants, stores, detections
  const { data: tenants = [] } = useQuery({
    queryKey: ['activity-all-tenants'],
    queryFn: async () => { const { data } = await rest.list('tenants', { select: '*', order: 'name.asc' }); return data || []; },
  });
  const { data: stores = [] } = useQuery({
    queryKey: ['activity-all-stores'],
    queryFn: async () => { const { data } = await rest.list('stores', { select: '*,tenant:tenants(name)', order: 'name.asc' }); return data || []; },
  });
  const { data: detections = [] } = useQuery({
    queryKey: ['activity-all-detections'],
    queryFn: async () => { const { data } = await rest.list('detections', { select: '*,tenant:tenants(name),store:stores(name)', order: 'processed_at.desc', limit: 500 }); return data || []; },
  });

  // Compliance & versions
  const { templates } = usePlanogramTemplates();
  const allScans = useComplianceScans();

  // Cascading filters
  const filteredTenants = useMemo(() => {
    let result = tenants;
    if (selectedAdminId !== 'all') result = tenants.filter((t: any) => t.admin_id === selectedAdminId);
    if (searchQuery) result = result.filter((t: any) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [tenants, selectedAdminId, searchQuery]);

  const handleAdminChange = (v: string) => { setSelectedAdminId(v); setSelectedTenantId('all'); setSelectedStoreId('all'); };
  const handleTenantChange = (v: string) => { setSelectedTenantId(v); setSelectedStoreId('all'); };

  const filteredStores = useMemo(() => {
    let result = stores;
    if (selectedTenantId !== 'all') result = result.filter((s: any) => s.tenant_id === selectedTenantId);
    else if (selectedAdminId !== 'all') {
      const tenantIds = new Set(filteredTenants.map((t: any) => t.id));
      result = result.filter((s: any) => tenantIds.has(s.tenant_id));
    }
    return result;
  }, [stores, selectedTenantId, selectedAdminId, filteredTenants]);

  const filteredDetections = useMemo(() => {
    let result = detections;
    if (selectedTenantId !== 'all') result = result.filter((d: any) => d.tenant_id === selectedTenantId);
    else if (selectedAdminId !== 'all') {
      const tenantIds = new Set(filteredTenants.map((t: any) => t.id));
      result = result.filter((d: any) => tenantIds.has(d.tenant_id));
    }
    if (selectedStoreId !== 'all') result = result.filter((d: any) => d.store_id === selectedStoreId);
    return result;
  }, [detections, selectedTenantId, selectedAdminId, filteredTenants, selectedStoreId]);

  const filteredComplianceScans = useMemo(() => {
    let result = (allScans.scans || []) as any[];

    if (selectedTenantId !== 'all') {
      result = result.filter((scan: any) => scan.template?.tenant_id === selectedTenantId);
    } else if (selectedAdminId !== 'all') {
      const tenantIds = new Set(filteredTenants.map((t: any) => t.id));
      result = result.filter((scan: any) => tenantIds.has(scan.template?.tenant_id));
    }

    if (selectedStoreId !== 'all') {
      result = result.filter((scan: any) => scan.template?.store_id === selectedStoreId);
    }

    return result;
  }, [allScans.scans, selectedTenantId, selectedAdminId, selectedStoreId, filteredTenants]);

  const tenantPieData = useMemo(() => {
    return filteredTenants.slice(0, 6).map((t: any) => ({
      name: t.name,
      value: t.processed_images_this_month || 1,
    }));
  }, [filteredTenants]);

  const clearFilters = () => { setSearchQuery(''); setSelectedAdminId('all'); setSelectedTenantId('all'); setSelectedStoreId('all'); };
  const hasActiveFilters = searchQuery || selectedAdminId !== 'all' || selectedTenantId !== 'all' || selectedStoreId !== 'all';
  const exportPDF = () => { document.title = `ShelfVision Activity Report - ${new Date().toLocaleDateString()}`; window.print(); };

  const tabItems = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'compliance', label: 'Compliance', icon: CheckCircle2 },
    { value: 'scan-history', label: 'Scan History', icon: History },
    { value: 'versions', label: 'Version History', icon: FileText },
  ];

  if (isLoading) {
    return (
      <MainLayout title="Activity" subtitle="Monitor usage and activity across all tenants.">
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Activity" subtitle="Monitor usage, compliance, and activity across all tenants.">
      {/* Filters bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-secondary border-border" />
          </div>
          {isAdmin && (
            <Select value={selectedAdminId} onValueChange={handleAdminChange}>
              <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder="All Admins" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedTenantId} onValueChange={handleTenantChange}>
            <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder="All Tenants" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {filteredTenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedStoreId} onValueChange={v => setSelectedStoreId(v)}>
            <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder="All Stores" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {filteredStores.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-4 h-4 mr-1" />Clear</Button>}
          <div className="flex items-center gap-2 ml-auto">
            <Select value={String(viewLimit)} onValueChange={v => setViewLimit(Number(v))}>
              <SelectTrigger className="w-[80px] h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportPDF}><Download className="w-4 h-4 mr-2" />Export PDF</Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="inline-flex h-12 items-center gap-1 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-1.5 shadow-lg shadow-primary/5">
            {tabItems.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className={cn(
                "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary/50",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25",
              )}>
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-3xl font-bold text-primary">{totalImages.toLocaleString()}</p><p className="text-sm text-muted-foreground">Images Processed</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-3xl font-bold text-foreground">{totalSkus}</p><p className="text-sm text-muted-foreground">SKUs Trained</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-3xl font-bold text-foreground">{activeTenants}</p><p className="text-sm text-muted-foreground">Active Tenants</p></div>
            <div className="p-4 rounded-lg bg-card border border-border"><p className="text-3xl font-bold text-foreground">{filteredStores.length}</p><p className="text-sm text-muted-foreground">Active Stores</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl bg-card border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Weekly Image Processing</h3>
              <div className="h-[250px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                      <Bar dataKey="images" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No weekly data available yet</div>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Tenant Distribution</h3>
              <div className="h-[250px]">
                {tenantPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tenantPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name }) => name}>
                        {tenantPieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No tenant data</div>
                )}
              </div>
            </div>
          </div>

          {/* Detection History Table */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Detection History ({filteredDetections.length})</h3>
            </div>
            <ScrollArea className="h-[calc(100vh-600px)] min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Tenant</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>SKUs Detected</TableHead>
                    <TableHead>Total Facings</TableHead>
                    <TableHead>Share of Shelf</TableHead>
                    <TableHead>Missing SKUs</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetections.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No detections yet</TableCell></TableRow>
                  ) : filteredDetections.slice(0, viewLimit).map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.tenant?.name || '-'}</TableCell>
                      <TableCell>{d.store?.name || '-'}</TableCell>
                      <TableCell>{d.detected_skus || 0}</TableCell>
                      <TableCell>{d.total_facings || 0}</TableCell>
                      <TableCell>{d.share_of_shelf_percentage ? `${d.share_of_shelf_percentage}%` : '-'}</TableCell>
                      <TableCell>{d.missing_skus || 0}</TableCell>
                      <TableCell>{format(new Date(d.processed_at), 'PP p')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* ─── Compliance Tab ─── */}
        <TabsContent value="compliance" className="space-y-4 animate-fade-in">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Compliance Scans ({(allScans.scans || []).length})</h3>
            </div>
            <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Score</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Found</TableHead>
                    <TableHead>Missing</TableHead>
                    <TableHead>Extra</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Image</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(allScans.scans || []).length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No compliance scans recorded</TableCell></TableRow>
                  ) : (allScans.scans || []).slice(0, viewLimit).map((scan: any) => (
                    <TableRow key={scan.id}>
                      <TableCell><Badge variant={scan.compliance_score >= 80 ? 'default' : 'destructive'}>{scan.compliance_score}%</Badge></TableCell>
                      <TableCell className="font-medium">{scan.template?.name || scan.template_id?.slice(0, 8) || '-'}</TableCell>
                      <TableCell>{scan.total_expected}</TableCell>
                      <TableCell>{scan.total_found}</TableCell>
                      <TableCell>{scan.total_missing}</TableCell>
                      <TableCell>{scan.total_extra}</TableCell>
                      <TableCell>{format(new Date(scan.created_at), 'PP p')}</TableCell>
                      <TableCell>
                        {scan.image_url && <a href={scan.image_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View</a>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* ─── Scan History Tab ─── */}
        <TabsContent value="scan-history" className="space-y-4 animate-fade-in">
          <ScanHistoryTable viewLimit={viewLimit} selectedTenantId={selectedTenantId} selectedStoreId={selectedStoreId} selectedAdminId={selectedAdminId} tenants={tenants} />
        </TabsContent>

        {/* ─── Version History Tab ─── */}
        <TabsContent value="versions" className="space-y-4 animate-fade-in">
          <VersionHistoryTable templates={templates} viewLimit={viewLimit} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}

function ScanHistoryTable({ viewLimit, selectedTenantId, selectedStoreId, selectedAdminId, tenants }: { viewLimit: number; selectedTenantId: string; selectedStoreId: string; selectedAdminId: string; tenants: any[] }) {
  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['activity-scan-history'],
    queryFn: async () => {
      const { data } = await rest.list('shelf_images', {
        select: '*,shelf:shelves(name,tenant_id,store_id,tenant:tenants(name),store:stores(name))',
        order: 'created_at.desc',
        limit: 500,
      });
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    let result = scans;
    if (selectedTenantId !== 'all') {
      result = result.filter((s: any) => s.shelf?.tenant_id === selectedTenantId);
    } else if (selectedAdminId !== 'all') {
      const adminTenantIds = new Set(tenants.filter((t: any) => t.admin_id === selectedAdminId).map((t: any) => t.id));
      result = result.filter((s: any) => adminTenantIds.has(s.shelf?.tenant_id));
    }
    if (selectedStoreId !== 'all') {
      result = result.filter((s: any) => s.shelf?.store_id === selectedStoreId);
    }
    return result;
  }, [scans, selectedTenantId, selectedStoreId, selectedAdminId, tenants]);

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Scan History ({filtered.length})</h3>
      </div>
      <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Shelf</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Detection Result</TableHead>
              <TableHead>Processed</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Image</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No scan history</TableCell></TableRow>
            ) : filtered.slice(0, viewLimit).map((scan: any) => (
              <TableRow key={scan.id}>
                <TableCell className="font-medium">{scan.shelf?.name || '-'}</TableCell>
                <TableCell>{scan.shelf?.tenant?.name || '-'}</TableCell>
                <TableCell>{scan.shelf?.store?.name || '-'}</TableCell>
                <TableCell>
                  {scan.detection_result ? (
                    <Badge variant="default">Has Results</Badge>
                  ) : (
                    <Badge variant="secondary">No Results</Badge>
                  )}
                </TableCell>
                <TableCell><Badge variant={scan.processed_at ? 'default' : 'secondary'}>{scan.processed_at ? format(new Date(scan.processed_at), 'PP p') : 'Pending'}</Badge></TableCell>
                <TableCell>{format(new Date(scan.created_at), 'PP p')}</TableCell>
                <TableCell>
                  <a href={scan.image_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View</a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

function VersionHistoryTable({ templates, viewLimit }: { templates: any[]; viewLimit: number }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('all');
  const { versions } = usePlanogramVersions(selectedTemplateId === 'all' ? null : selectedTemplateId);

  const { data: allVersions = [] } = useQuery({
    queryKey: ['activity-all-versions'],
    queryFn: async () => {
      const { data } = await rest.list('planogram_versions', { select: '*,template:planogram_templates(name)', order: 'created_at.desc', limit: 200 });
      return data || [];
    },
    enabled: selectedTemplateId === 'all',
  });

  const displayVersions = selectedTemplateId === 'all' ? allVersions : versions;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold text-foreground">Version History ({displayVersions.length})</h3>
        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-secondary border-border"><SelectValue placeholder="All Planograms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Planograms</SelectItem>
            {templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Planogram</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayVersions.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No versions recorded</TableCell></TableRow>
            ) : displayVersions.slice(0, viewLimit).map((v: any) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.template?.name || v.template_id?.slice(0, 8) || '-'}</TableCell>
                <TableCell><Badge variant="secondary">v{v.version_number}</Badge></TableCell>
                <TableCell className="max-w-[300px] truncate text-muted-foreground">{v.change_notes || '-'}</TableCell>
                <TableCell>{format(new Date(v.created_at), 'PP p')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
