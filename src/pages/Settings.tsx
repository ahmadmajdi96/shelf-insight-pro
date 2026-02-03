import { Bell, Lock, Palette, Database, Globe, Shield, SlidersHorizontal } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useConfidenceSettings } from '@/hooks/useConfidenceSettings';

const settingsSections = [
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Configure how you receive alerts and updates',
    settings: [
      { id: 'email-alerts', label: 'Email notifications', description: 'Receive email for important events', enabled: true },
      { id: 'detection-alerts', label: 'Detection alerts', description: 'Notify when new detections complete', enabled: true },
      { id: 'training-alerts', label: 'Training updates', description: 'Notify when model training finishes', enabled: false },
    ]
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Manage your account security settings',
    settings: [
      { id: '2fa', label: 'Two-factor authentication', description: 'Add an extra layer of security', enabled: false },
      { id: 'session-timeout', label: 'Auto session timeout', description: 'Automatically log out after inactivity', enabled: true },
    ]
  },
  {
    icon: Database,
    title: 'Data & Privacy',
    description: 'Control how your data is handled',
    settings: [
      { id: 'analytics', label: 'Usage analytics', description: 'Help us improve with anonymous usage data', enabled: true },
      { id: 'data-retention', label: 'Extended data retention', description: 'Keep detection history for 1 year', enabled: false },
    ]
  },
];

export default function Settings() {
  const { confidence, setConfidence, confidencePercent } = useConfidenceSettings();

  return (
    <MainLayout title="Settings" subtitle="Manage your account and application preferences.">
      <div className="max-w-3xl space-y-6">
        {/* Profile Section */}
        <div className="rounded-xl bg-card border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue="John Smith" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="john@company.com" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input defaultValue="Coca-Cola Company" className="bg-secondary border-border" disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input defaultValue="Tenant Admin" className="bg-secondary border-border" disabled />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="default">Save Changes</Button>
          </div>
        </div>

        {/* Detection Settings */}
        <div className="rounded-xl bg-card border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Detection Settings</h3>
              <p className="text-sm text-muted-foreground">Configure AI detection parameters</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Confidence Threshold</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only show detections above this confidence level
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">{confidencePercent}%</span>
              </div>
              <Slider
                value={[confidence]}
                onValueChange={([value]) => setConfidence(value)}
                min={0.5}
                max={1}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div 
            key={section.title}
            className={cn(
              "rounded-xl bg-card border border-border p-6",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${sectionIndex * 100}ms` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              {section.settings.map((setting) => (
                <div 
                  key={setting.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{setting.label}</p>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch defaultChecked={setting.enabled} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* API Section */}
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">API Access</h3>
              <p className="text-sm text-muted-foreground">Manage your API keys and integrations</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input 
                  value="sk_live_•••••••••••••••••••••••••" 
                  className="bg-secondary border-border font-mono"
                  readOnly
                />
                <Button variant="outline">Reveal</Button>
                <Button variant="outline">Regenerate</Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this key to authenticate API requests. Never share your API key publicly.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-6">
          <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These actions are irreversible. Please be certain.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Delete All Data
            </Button>
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Close Account
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
