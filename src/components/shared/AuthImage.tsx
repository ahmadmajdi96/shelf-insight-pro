import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface AuthImageProps {
  src: string;
  alt?: string;
  className?: string;
  draggable?: boolean;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function AuthImage({ src, alt, className, draggable, onLoad }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setLoading(true);
    setError(false);
    setBlobUrl(null);

    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('auth_token');
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
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center bg-muted animate-pulse', className)}>
        <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
      </div>
    );
  }

  return <img src={blobUrl} alt={alt || ''} className={className} draggable={draggable} onLoad={onLoad} />;
}
