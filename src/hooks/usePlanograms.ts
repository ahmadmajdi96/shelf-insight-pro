import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PlanogramRow {
  id: string;
  label: string;
  products: Array<{
    instanceId: string;
    skuId: string | null;
    name: string;
    facings: number;
  }>;
}

export interface PlanogramTemplate {
  id: string;
  tenant_id: string;
  store_id: string | null;
  shelf_id: string | null;
  name: string;
  description: string | null;
  layout: PlanogramRow[];
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  store?: { name: string } | null;
  shelf?: { name: string } | null;
  versions_count?: number;
  latest_compliance?: number | null;
}

export interface PlanogramVersion {
  id: string;
  template_id: string;
  version_number: number;
  layout: PlanogramRow[];
  change_notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ComplianceScan {
  id: string;
  template_id: string;
  shelf_image_id: string | null;
  image_url: string;
  compliance_score: number;
  total_expected: number;
  total_found: number;
  total_missing: number;
  total_extra: number;
  details: any[];
  scanned_by: string | null;
  created_at: string;
  template?: { name: string } | null;
}

export function usePlanogramTemplates() {
  const { tenantId, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['planogram-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planogram_templates')
        .select('*, store:stores(name), shelf:shelves(name)')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get version counts and latest compliance for each template
      const enriched = await Promise.all(
        (data || []).map(async (t: any) => {
          const { count } = await supabase
            .from('planogram_versions')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', t.id);

          const { data: latestScan } = await supabase
            .from('compliance_scans')
            .select('compliance_score')
            .eq('template_id', t.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...t,
            layout: (t.layout || []) as PlanogramRow[],
            versions_count: count ?? 0,
            latest_compliance: latestScan?.[0]?.compliance_score ?? null,
          } as PlanogramTemplate;
        })
      );

      return enriched;
    },
    enabled: isAdmin,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      store_id?: string;
      shelf_id?: string;
      layout: PlanogramRow[];
      status?: string;
    }) => {
      const tid = tenantId;
      if (!tid) throw new Error('No tenant ID');

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('planogram_templates')
        .insert({
          ...template,
          tenant_id: tid,
          created_by: user?.id,
          layout: template.layout as any,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial version
      await supabase.from('planogram_versions').insert({
        template_id: data.id,
        version_number: 1,
        layout: template.layout as any,
        change_notes: 'Initial version',
        created_by: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      toast({ title: 'Template created', description: 'Planogram template saved successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create template', description: error.message, variant: 'destructive' });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, changeNotes, ...updates }: {
      id: string;
      name?: string;
      description?: string;
      store_id?: string;
      shelf_id?: string;
      layout?: PlanogramRow[];
      status?: string;
      changeNotes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const updatePayload: any = { ...updates };
      if (updates.layout) updatePayload.layout = updates.layout as any;

      const { data, error } = await supabase
        .from('planogram_templates')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create new version if layout changed
      if (updates.layout) {
        const { data: lastVersion } = await supabase
          .from('planogram_versions')
          .select('version_number')
          .eq('template_id', id)
          .order('version_number', { ascending: false })
          .limit(1);

        const nextVersion = (lastVersion?.[0]?.version_number ?? 0) + 1;

        await supabase.from('planogram_versions').insert({
          template_id: id,
          version_number: nextVersion,
          layout: updates.layout as any,
          change_notes: changeNotes || `Version ${nextVersion}`,
          created_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      queryClient.invalidateQueries({ queryKey: ['planogram-versions'] });
      toast({ title: 'Template updated', description: 'Changes saved with new version.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update template', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { data: original, error: fetchError } = await supabase
        .from('planogram_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('planogram_templates')
        .insert({
          tenant_id: original.tenant_id,
          store_id: original.store_id,
          shelf_id: original.shelf_id,
          name: `${original.name} (Copy)`,
          description: original.description,
          layout: original.layout,
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('planogram_versions').insert({
        template_id: data.id,
        version_number: 1,
        layout: original.layout,
        change_notes: `Duplicated from "${original.name}"`,
        created_by: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      toast({ title: 'Template duplicated', description: 'A copy has been created.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to duplicate', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('planogram_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      toast({ title: 'Template deleted', description: 'The planogram template has been removed.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete template', description: error.message, variant: 'destructive' });
    },
  });

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    duplicateTemplate,
    deleteTemplate,
  };
}

export function usePlanogramVersions(templateId: string | null) {
  const versionsQuery = useQuery({
    queryKey: ['planogram-versions', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('planogram_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v,
        layout: (v.layout || []) as PlanogramRow[],
      })) as PlanogramVersion[];
    },
    enabled: !!templateId,
  });

  return {
    versions: versionsQuery.data ?? [],
    isLoading: versionsQuery.isLoading,
  };
}

export function useComplianceScans(templateId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scansQuery = useQuery({
    queryKey: ['compliance-scans', templateId],
    queryFn: async () => {
      let query = supabase
        .from('compliance_scans')
        .select('*, template:planogram_templates(name)')
        .order('created_at', { ascending: false });

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ComplianceScan[];
    },
  });

  const createScan = useMutation({
    mutationFn: async (scan: {
      template_id: string;
      shelf_image_id?: string;
      image_url: string;
      compliance_score: number;
      total_expected: number;
      total_found: number;
      total_missing: number;
      total_extra: number;
      details?: any[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('compliance_scans')
        .insert({ ...scan, scanned_by: user?.id, details: (scan.details || []) as any })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-scans'] });
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      toast({ title: 'Compliance scan saved', description: 'Results have been recorded.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to save scan', description: error.message, variant: 'destructive' });
    },
  });

  return {
    scans: scansQuery.data ?? [],
    isLoading: scansQuery.isLoading,
    createScan,
  };
}
