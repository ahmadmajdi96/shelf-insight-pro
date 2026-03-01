import { useState, useEffect, MutableRefObject } from 'react';
import { getApiBaseUrl } from '@/lib/api-config';

interface Props {
  imgRef: MutableRefObject<HTMLImageElement | null>;
  src: string;
}

function needsAuth(url: string): boolean {
  try {
    const base = new URL(getApiBaseUrl()).origin;
    return new URL(url).origin === base;
  } catch {
    return false;
  }
}

export function AnnotationCanvasImage({ imgRef, src }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    // If URL doesn't need auth, use it directly
    if (!needsAuth(src)) {
      setBlobUrl(src);
      return;
    }

    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('shelfvision_access_token');
        const res = await fetch(src, {
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
        // silently fail
      }
    };

    fetchImage();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

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
