import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/api-config';

/**
 * Fetches an image URL with authentication headers and returns a blob URL.
 * Needed because the storage backend requires auth for all requests.
 */
export function useAuthenticatedImage(imageUrl: string | null | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setBlobUrl(null);
      return;
    }

    let revoke: string | null = null;
    let cancelled = false;

    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(imageUrl, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        revoke = url;
        setBlobUrl(url);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [imageUrl]);

  return { blobUrl, loading, error };
}

/**
 * Utility to get an authenticated image URL as a blob URL (non-hook version).
 */
export async function fetchAuthenticatedImageUrl(imageUrl: string): Promise<string> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(imageUrl, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
