import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest, auth as apiAuth } from '@/lib/api-client';
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
  const { tenantId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['planogram-templates'],
    queryFn: async () => {
      const { data } = await rest.list('planogram_templates', {
        select: '*,store:stores(name),shelf:shelves(name)',
        order: 'updated_at.desc',
      });

      const enriched = await Promise.all(
        (data || []).map(async (t: any) => {
          const { data: versions } = await rest.list('planogram_versions', {
            select: '*',
            filters: { template_id: `eq.${t.id}` },
          });

          const { data: scans } = await rest.list('compliance_scans', {
            select: 'compliance_score',
            filters: { template_id: `eq.${t.id}` },
            order: 'created_at.desc',
            limit: 1,
          });

          return {
            ...t,
            layout: (t.layout || []) as PlanogramRow[],
            versions_count: versions?.length ?? 0,
            latest_compliance: scans?.[0]?.compliance_score ?? null,
          } as PlanogramTemplate;
        })
      );

      return enriched;
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      store_id?: string;
      shelf_id?: string;
      layout: PlanogramRow[];
      status?: string;
      tenantIdOverride?: string;
    }) => {
      const tid = template.tenantIdOverride || tenantId;
      if (!tid) throw new Error('No tenant ID');

      const user = apiAuth.getUser();
      const { tenantIdOverride: _override, ...templateData } = template;

      const data = await rest.create('planogram_templates', {
        ...templateData,
        tenant_id: tid,
        created_by: user?.id,
        layout: template.layout,
      });

      // Create initial version
      if (data?.id) {
        await rest.create('planogram_versions', {
          template_id: data.id,
          version_number: 1,
          layout: template.layout,
          change_notes: 'Initial version',
          created_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      toast({ title: 'Template created', description: 'Planogram template saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create template', description: error.message, variant: 'destructive' });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, changeNotes, ...updates }: any) => {
      const user = apiAuth.getUser();

      const data = await rest.update('planogram_templates', { id: `eq.${id}` }, updates);

      if (updates.layout) {
        const { data: versions } = await rest.list('planogram_versions', {
          select: 'version_number',
          filters: { template_id: `eq.${id}` },
          order: 'version_number.desc',
          limit: 1,
        });

        const nextVersion = (versions?.[0]?.version_number ?? 0) + 1;

        await rest.create('planogram_versions', {
          template_id: id,
          version_number: nextVersion,
          layout: updates.layout,
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
    onError: (error: Error) => {
      toast({ title: 'Failed to update template', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const original = await rest.get('planogram_templates', templateId);
      const user = apiAuth.getUser();

      const data = await rest.create('planogram_templates', {
        tenant_id: original.tenant_id,
        store_id: original.store_id,
        shelf_id: original.shelf_id,
        name: `${original.name} (Copy)`,
        description: original.description,
        layout: original.layout,
        status: 'draft',
        created_by: user?.id,
      });

      if (data?.id) {
        await rest.create('planogram_versions', {
          template_id: data.id,
          version_number: 1,
          layout: original.layout,
          change_notes: `Duplicated from "${original.name}"`,
          created_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      toast({ title: 'Template duplicated', description: 'A copy has been created.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to duplicate', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('planogram_templates', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      toast({ title: 'Template deleted', description: 'The planogram template has been removed.' });
    },
    onError: (error: Error) => {
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
      const { data } = await rest.list('planogram_versions', {
        select: '*',
        filters: { template_id: `eq.${templateId}` },
        order: 'version_number.desc',
      });
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
      const filters: Record<string, string> = {};
      if (templateId) filters.template_id = `eq.${templateId}`;

      const { data } = await rest.list('compliance_scans', {
        select: '*,template:planogram_templates(name)',
        order: 'created_at.desc',
        filters,
      });
      return (data || []) as ComplianceScan[];
    },
  });

  const createScan = useMutation({
    mutationFn: async (scan: any) => {
      const user = apiAuth.getUser();
      return await rest.create('compliance_scans', {
        ...scan,
        scanned_by: user?.id,
        details: scan.details || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-scans'] });
      queryClient.invalidateQueries({ queryKey: ['planogram-templates'] });
      toast({ title: 'Compliance scan saved', description: 'Results have been recorded.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save scan', description: error.message, variant: 'destructive' });
    },
  });

  return {
    scans: scansQuery.data ?? [],
    isLoading: scansQuery.isLoading,
    createScan,
  };
}
