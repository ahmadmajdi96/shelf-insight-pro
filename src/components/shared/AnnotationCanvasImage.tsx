import { useState, useEffect, useMemo, MutableRefObject } from 'react';
import { resolveImageUrl, shouldFetchWithAuth } from '@/lib/image-url';

interface Props {
  imgRef: MutableRefObject<HTMLImageElement | null>;
  src: string;
}

export function AnnotationCanvasImage({ imgRef, src }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const resolvedSrc = useMemo(() => resolveImageUrl(src), [src]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    // Public/external URLs can be used directly.
    if (!shouldFetchWithAuth(resolvedSrc)) {
      setBlobUrl(resolvedSrc);
      return;
    }

    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('shelfvision_access_token');
        const res = await fetch(resolvedSrc, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) {
          // Final fallback to direct URL rendering.
          setBlobUrl(resolvedSrc);
        }
      }
    };

    fetchImage();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resolvedSrc]);

  if (!blobUrl) return <div className="w-full h-48 bg-muted animate-pulse rounded" />;

  return (
    <img
      ref={imgRef}
      src={blobUrl}
      alt=""
      className="w-full h-auto block"
      draggable={false}
    />
  );
}

