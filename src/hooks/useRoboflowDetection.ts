import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DetectionResult {
  success: boolean;
  result?: any;
  error?: string;
}

export function useRoboflowDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const detectWithRoboflow = async (
    imageUrl: string,
    shelfId?: string,
    tenantId?: string
  ): Promise<DetectionResult> => {
    setIsDetecting(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('roboflow-detect', {
        body: {
          imageUrl,
          shelfId,
          tenantId,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Detection failed');
      }

      setResult(data.result);
      return { success: true, result: data.result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Detection failed';
      setError(errorMessage);
      toast({
        title: 'Detection failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
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
    detectWithRoboflow,
    reset,
  };
}
