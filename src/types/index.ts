export type UserRole = 'admin' | 'tenant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  createdAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  logo?: string;
  maxSkus: number;
  maxImagesPerMonth: number;
  maxImagesPerWeek: number;
  maxImagesPerYear: number;
  processedImagesThisMonth: number;
  processedImagesThisWeek: number;
  processedImagesThisYear: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface SKU {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description?: string;
  barcode?: string;
  images: string[];
  isTrained: boolean;
  trainingStatus: 'pending' | 'training' | 'completed' | 'failed';
  createdAt: Date;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  createdAt: Date;
}

export interface DetectionResult {
  id: string;
  tenantId: string;
  storeId?: string;
  originalImageUrl: string;
  annotatedImageUrl?: string;
  processedAt: Date;
  detections: DetectedSKU[];
  shareOfShelf: ShareOfShelf;
}

export interface DetectedSKU {
  skuId: string;
  skuName: string;
  isAvailable: boolean;
  facings: number;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShareOfShelf {
  totalShelfArea: number;
  trainedProductsArea: number;
  percentage: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    percentage: number;
  }[];
}

export interface TenantActivity {
  tenantId: string;
  tenantName: string;
  processedImages: number;
  trainedSkus: number;
  lastActivity: Date;
}
