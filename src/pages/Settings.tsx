import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Server, Brain, Loader2, Globe } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl, setApiBaseUrl } from '@/lib/api-config';

const STORAGE_KEYS = {
  inferencing: 'shelfvision_inferencing_endpoint',
  training: 'shelfvision_training_endpoint',
};

export default function Settings() {
  const { toast } = useToast();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [inferencingEndpoint, setInferencingEndpoint] = useState('');
  const [trainingEndpoint, setTrainingEndpoint] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInferencingEndpoint(localStorage.getItem(STORAGE_KEYS.inferencing) || '');
    setTrainingEndpoint(localStorage.getItem(STORAGE_KEYS.training) || '');
  }, []);

  const handleSave = () => {
    setSaving(true);
    try {
      setApiBaseUrl(apiUrl);
      if (inferencingEndpoint) localStorage.setItem(STORAGE_KEYS.inferencing, inferencingEndpoint.replace(/\/+$/, ''));
      else localStorage.removeItem(STORAGE_KEYS.inferencing);
      if (trainingEndpoint) localStorage.setItem(STORAGE_KEYS.training, trainingEndpoint.replace(/\/+$/, ''));
      else localStorage.removeItem(STORAGE_KEYS.training);
      toast({ title: 'Settings saved', description: 'Endpoint configurations updated successfully.' });
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Settings" subtitle="Configure API endpoints for the platform.">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* API Base URL */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">API Base URL</h3>
              <p className="text-sm text-muted-foreground">Base URL for all backend REST operations</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://your-backend.com" className="bg-secondary border-border font-mono text-sm" />
          </div>
        </div>

        {/* Inferencing Endpoint */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Inferencing Endpoint</h3>
              <p className="text-sm text-muted-foreground">Used for auto-annotation and model inference</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Endpoint URL</Label>
            <Input value={inferencingEndpoint} onChange={e => setInferencingEndpoint(e.target.value)} placeholder="https://inference.example.com/predict" className="bg-secondary border-border font-mono text-sm" />
          </div>
        </div>

        {/* Training Endpoint */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Training Endpoint</h3>
              <p className="text-sm text-muted-foreground">Used for model training and versioning</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Endpoint URL</Label>
            <Input value={trainingEndpoint} onChange={e => setTrainingEndpoint(e.target.value)} placeholder="https://training.example.com/train" className="bg-secondary border-border font-mono text-sm" />
          </div>
        </div>

        <Button variant="glow" className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </MainLayout>
  );
}
