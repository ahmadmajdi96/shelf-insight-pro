import { describe, it, expect } from 'vitest';
import type { User, Tenant, SKU, Store, DetectionResult, DetectedSKU, BoundingBox, ShareOfShelf } from '@/types';

describe('Type Definitions', () => {
  it('should create valid User object', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      createdAt: new Date(),
    };
    expect(user.role).toBe('admin');
    expect(user.tenantId).toBeUndefined();
  });

  it('should create valid Tenant object', () => {
    const tenant: Tenant = {
      id: 't1',
      name: 'Test Tenant',
      maxSkus: 50,
      maxImagesPerMonth: 1000,
      maxImagesPerWeek: 300,
      maxImagesPerYear: 10000,
      processedImagesThisMonth: 100,
      processedImagesThisWeek: 25,
      processedImagesThisYear: 500,
      isActive: true,
      createdAt: new Date(),
    };
    expect(tenant.isActive).toBe(true);
    expect(tenant.maxSkus).toBe(50);
  });

  it('should create valid BoundingBox', () => {
    const bbox: BoundingBox = { x: 10, y: 20, width: 100, height: 50 };
    expect(bbox.x).toBe(10);
    expect(bbox.width).toBe(100);
  });

  it('should create valid DetectedSKU', () => {
    const detected: DetectedSKU = {
      skuId: 'sku-1',
      skuName: 'Cola',
      isAvailable: true,
      facings: 3,
      confidence: 0.95,
      boundingBox: { x: 10, y: 20, width: 100, height: 50 },
    };
    expect(detected.confidence).toBe(0.95);
    expect(detected.isAvailable).toBe(true);
  });

  it('should create valid ShareOfShelf', () => {
    const sos: ShareOfShelf = {
      totalShelfArea: 1000,
      trainedProductsArea: 750,
      percentage: 75,
      byCategory: [
        { categoryId: 'c1', categoryName: 'Beverages', percentage: 45 },
        { categoryId: 'c2', categoryName: 'Snacks', percentage: 30 },
      ],
    };
    expect(sos.percentage).toBe(75);
    expect(sos.byCategory).toHaveLength(2);
  });

  it('should enforce UserRole type', () => {
    const adminRole: 'admin' | 'tenant' = 'admin';
    const tenantRole: 'admin' | 'tenant' = 'tenant';
    expect(adminRole).toBe('admin');
    expect(tenantRole).toBe('tenant');
  });

  it('should create valid Store object', () => {
    const store: Store = {
      id: 's1',
      tenantId: 't1',
      name: 'Downtown Store',
      address: '123 Main St',
      city: 'NYC',
      country: 'US',
      createdAt: new Date(),
    };
    expect(store.name).toBe('Downtown Store');
  });

  it('should create valid SKU object', () => {
    const sku: SKU = {
      id: 'sku-1',
      tenantId: 't1',
      categoryId: 'c1',
      name: 'Cola 330ml',
      images: ['img1.jpg', 'img2.jpg'],
      isTrained: true,
      trainingStatus: 'completed',
      createdAt: new Date(),
    };
    expect(sku.trainingStatus).toBe('completed');
    expect(sku.images).toHaveLength(2);
  });
});
