import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SKUToDetect {
  id: string;
  name: string;
  imageUrls: string[];
}

interface DetectionResult {
  detections: Array<{
    skuId: string;
    skuName: string;
    isAvailable: boolean;
    facings: number;
    confidence: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>;
  missingSkus: Array<{ skuId: string; skuName: string }>;
  shareOfShelf: {
    totalShelfArea: number;
    trainedProductsArea: number;
    percentage: number;
  };
  totalFacings: number;
  summary: string;
}

interface UseDetectionReturn {
  isDetecting: boolean;
  result: DetectionResult | null;
  error: string | null;
  detectSkus: (imageBase64: string, tenantId: string, skusToDetect: SKUToDetect[], storeId?: string) => Promise<DetectionResult | null>;
  reset: () => void;
}

export function useDetection(): UseDetectionReturn {
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const detectSkus = async (
    imageBase64: string,
    tenantId: string,
    skusToDetect: SKUToDetect[],
    storeId?: string
  ): Promise<DetectionResult | null> => {
    setIsDetecting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('detect-skus', {
        body: {
          imageBase64,
          tenantId,
          storeId,
          skusToDetect,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
      toast({
        title: "Detection Complete",
        description: `Found ${data.result.detections?.length || 0} products on shelf`,
      });
      return data.result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Detection failed';
      setError(message);
      toast({
        title: "Detection Failed",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsDetecting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    isDetecting,
    result,
    error,
    detectSkus,
    reset,
  };
}
