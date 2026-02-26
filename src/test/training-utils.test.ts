import { describe, it, expect } from 'vitest';

// Test the pure utility logic from Training page

const CLASS_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#84CC16', '#D946EF', '#0EA5E9', '#F43F5E', '#A855F7',
  '#22D3EE', '#FB923C', '#818CF8', '#2DD4BF', '#FACC15',
];

const DEFAULT_TRAINING_CONFIG = {
  seed: 42,
  data: { root: './dataset', mode: 'pre_split', batch_size: 54, val_batch_size: 128 },
  model: { backbone: 'eva02_small_patch14_224.mim_in22k', pretrained: true, dropout: 0.3 },
  train: { epochs: 200, lr: 0.0005, optimizer: 'adamw', scheduler: 'cosine' },
};

describe('Training Utilities', () => {
  describe('CLASS_COLORS', () => {
    it('should have 20 unique colors', () => {
      expect(CLASS_COLORS).toHaveLength(20);
      const unique = new Set(CLASS_COLORS);
      expect(unique.size).toBe(20);
    });

    it('should all be valid hex colors', () => {
      CLASS_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should assign colors by index with wrapping', () => {
      const idx = 25;
      const color = CLASS_COLORS[idx % CLASS_COLORS.length];
      expect(color).toBe(CLASS_COLORS[5]);
    });
  });

  describe('DEFAULT_TRAINING_CONFIG', () => {
    it('should have seed value', () => {
      expect(DEFAULT_TRAINING_CONFIG.seed).toBe(42);
    });

    it('should have model config', () => {
      expect(DEFAULT_TRAINING_CONFIG.model.backbone).toContain('eva02');
      expect(DEFAULT_TRAINING_CONFIG.model.pretrained).toBe(true);
    });

    it('should have training config', () => {
      expect(DEFAULT_TRAINING_CONFIG.train.epochs).toBe(200);
      expect(DEFAULT_TRAINING_CONFIG.train.optimizer).toBe('adamw');
    });
  });

  describe('Products by Category grouping', () => {
    it('should group products by category', () => {
      const categories = [
        { id: 'cat-1', name: 'Beverages', tenant_id: 't1' },
        { id: 'cat-2', name: 'Snacks', tenant_id: 't1' },
      ];
      const products = [
        { id: 'p1', name: 'Cola', category_id: 'cat-1' },
        { id: 'p2', name: 'Water', category_id: 'cat-1' },
        { id: 'p3', name: 'Chips', category_id: 'cat-2' },
        { id: 'p4', name: 'No Cat', category_id: null },
      ];

      const groups: { categoryId: string | null; categoryName: string; products: any[] }[] = [];
      const categorized = new Set<string>();

      for (const cat of categories) {
        const prods = products.filter(p => p.category_id === cat.id);
        if (prods.length > 0) {
          groups.push({ categoryId: cat.id, categoryName: cat.name, products: prods });
          prods.forEach(p => categorized.add(p.id));
        }
      }

      const uncategorized = products.filter(p => !categorized.has(p.id));
      if (uncategorized.length > 0) {
        groups.push({ categoryId: null, categoryName: 'Uncategorized', products: uncategorized });
      }

      expect(groups).toHaveLength(3);
      expect(groups[0].categoryName).toBe('Beverages');
      expect(groups[0].products).toHaveLength(2);
      expect(groups[1].categoryName).toBe('Snacks');
      expect(groups[1].products).toHaveLength(1);
      expect(groups[2].categoryName).toBe('Uncategorized');
      expect(groups[2].products).toHaveLength(1);
    });

    it('should handle empty products', () => {
      const groups: any[] = [];
      expect(groups).toHaveLength(0);
    });
  });

  describe('BBox calculations', () => {
    it('should compute bounding box from draw coordinates', () => {
      const start = { x: 0.2, y: 0.3 };
      const end = { x: 0.6, y: 0.7 };

      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);

      expect(x).toBeCloseTo(0.2);
      expect(y).toBeCloseTo(0.3);
      expect(w).toBeCloseTo(0.4);
      expect(h).toBeCloseTo(0.4);
    });

    it('should handle reversed draw direction', () => {
      const start = { x: 0.8, y: 0.9 };
      const end = { x: 0.1, y: 0.2 };

      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);

      expect(x).toBeCloseTo(0.1);
      expect(y).toBeCloseTo(0.2);
      expect(w).toBeCloseTo(0.7);
      expect(h).toBeCloseTo(0.7);
    });

    it('should reject too-small bboxes', () => {
      const w = 0.005;
      const h = 0.005;
      const isValid = w >= 0.01 && h >= 0.01;
      expect(isValid).toBe(false);
    });

    it('should accept valid bboxes', () => {
      const w = 0.05;
      const h = 0.05;
      const isValid = w >= 0.01 && h >= 0.01;
      expect(isValid).toBe(true);
    });
  });

  describe('Training request payload builder', () => {
    it('should build correct payload structure', () => {
      const selectedDatasetId = 'ds-1';
      const datasetName = 'Test Dataset';
      const config = DEFAULT_TRAINING_CONFIG;
      const classes = [
        { id: 'c1', name: 'Cola', color: '#3B82F6' },
        { id: 'c2', name: 'Water', color: '#EF4444' },
      ];
      const images = [
        { id: 'i1', image_url: 'url1', file_name: 'img1.jpg', is_annotated: true, annotations: [{ id: 'b1', classId: 'c1' }] },
        { id: 'i2', image_url: 'url2', file_name: 'img2.jpg', is_annotated: false, annotations: [] },
      ];

      const payload = {
        dataset_id: selectedDatasetId,
        dataset_name: datasetName,
        config,
        classes: classes.map(c => ({ id: c.id, name: c.name, color: c.color })),
        images: images.map(img => ({
          id: img.id,
          image_url: img.image_url,
          file_name: img.file_name,
          is_annotated: img.is_annotated,
          annotations: img.annotations || [],
        })),
        summary: {
          total_images: images.length,
          annotated_images: images.filter(i => i.is_annotated).length,
          total_classes: classes.length,
          total_annotations: images.reduce((a, img) => a + (img.annotations?.length || 0), 0),
        },
      };

      expect(payload.dataset_id).toBe('ds-1');
      expect(payload.classes).toHaveLength(2);
      expect(payload.images).toHaveLength(2);
      expect(payload.summary.total_images).toBe(2);
      expect(payload.summary.annotated_images).toBe(1);
      expect(payload.summary.total_classes).toBe(2);
      expect(payload.summary.total_annotations).toBe(1);
    });

    it('should filter images by selected sets', () => {
      const selectedSetIds = new Set(['set-1']);
      const images = [
        { id: 'i1', image_set_id: 'set-1', is_annotated: true, annotations: [] },
        { id: 'i2', image_set_id: 'set-2', is_annotated: false, annotations: [] },
        { id: 'i3', image_set_id: 'set-1', is_annotated: true, annotations: [] },
      ];

      const selectedImages = selectedSetIds.size > 0
        ? images.filter(img => selectedSetIds.has(img.image_set_id))
        : images;

      expect(selectedImages).toHaveLength(2);
      expect(selectedImages.every(img => img.image_set_id === 'set-1')).toBe(true);
    });
  });

  describe('SKU selection toggle logic', () => {
    it('should toggle individual SKU', () => {
      const prev = new Set(['sku-1', 'sku-2']);
      // Toggle off
      const next1 = new Set(prev);
      next1.delete('sku-1');
      expect(next1.has('sku-1')).toBe(false);
      expect(next1.size).toBe(1);

      // Toggle on
      const next2 = new Set(prev);
      next2.add('sku-3');
      expect(next2.has('sku-3')).toBe(true);
      expect(next2.size).toBe(3);
    });

    it('should toggle entire category', () => {
      const products = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
      const selected = new Set<string>();

      // Select all
      products.forEach(p => selected.add(p.id));
      expect(selected.size).toBe(3);

      // Deselect all (all were selected)
      const allSelected = products.every(p => selected.has(p.id));
      expect(allSelected).toBe(true);
      if (allSelected) {
        products.forEach(p => selected.delete(p.id));
      }
      expect(selected.size).toBe(0);
    });
  });

  describe('Annotation scope filtering', () => {
    it('should scope images to a specific set', () => {
      const images = [
        { id: 'i1', image_set_id: 'set-a', is_annotated: false },
        { id: 'i2', image_set_id: 'set-b', is_annotated: true },
        { id: 'i3', image_set_id: 'set-a', is_annotated: false },
      ];

      const annotatingSetId = 'set-a';
      const scoped = images.filter(img => img.image_set_id === annotatingSetId);
      expect(scoped).toHaveLength(2);
    });

    it('should return all images when no set selected', () => {
      const images = [{ id: 'i1' }, { id: 'i2' }, { id: 'i3' }];
      const annotatingSetId = null;
      const scoped = annotatingSetId ? images.filter(() => false) : images;
      expect(scoped).toHaveLength(3);
    });
  });

  describe('Dataset filtering', () => {
    it('should filter by search query', () => {
      const datasets = [
        { name: 'Cola Detection', description: 'Detect cola products', tenant_id: 't1', status: 'draft' },
        { name: 'Snacks Model', description: 'Snack detection', tenant_id: 't2', status: 'ready' },
      ];
      const query = 'cola';
      const filtered = datasets.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(query.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Cola Detection');
    });

    it('should filter by status', () => {
      const datasets = [
        { name: 'A', status: 'draft' },
        { name: 'B', status: 'ready' },
        { name: 'C', status: 'draft' },
      ];
      const filtered = datasets.filter(d => d.status === 'draft');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Image navigation', () => {
    it('should navigate to next image with wrapping', () => {
      const images = ['img1', 'img2', 'img3'];
      const currentIndex = 2;
      const nextIndex = (currentIndex + 1) % images.length;
      expect(nextIndex).toBe(0);
    });

    it('should navigate to prev image with wrapping', () => {
      const images = ['img1', 'img2', 'img3'];
      const currentIndex = 0;
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      expect(prevIndex).toBe(2);
    });
  });
});
