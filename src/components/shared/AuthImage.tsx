import { forwardRef } from 'react';
import { useAuthenticatedImage } from '@/hooks/useAuthenticatedImage';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * Renders an image that requires authentication headers to load.
 * Fetches the image via authenticated request and displays it as a blob URL.
 */
export const AuthImage = forwardRef<HTMLImageElement, AuthImageProps>(
  ({ src, className, alt, ...props }, ref) => {
    const { blobUrl, loading, error } = useAuthenticatedImage(src);

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

    return <img ref={ref} src={blobUrl} alt={alt} className={className} {...props} />;
  }
);

AuthImage.displayName = 'AuthImage';
