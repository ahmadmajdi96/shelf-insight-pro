import { forwardRef, memo } from 'react';
import { useAuthenticatedImage } from '@/hooks/useAuthenticatedImage';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const AuthImageInner = forwardRef<HTMLImageElement, AuthImageProps>(
  function AuthImage({ src, className, alt, ...props }, ref) {
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

AuthImageInner.displayName = 'AuthImage';

export const AuthImage = memo(AuthImageInner);
