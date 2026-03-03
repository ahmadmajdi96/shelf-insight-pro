import { ReactNode, useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';

const MIN_WIDTH = 1024;

export function DesktopOnly({ children }: { children: ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MIN_WIDTH);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= MIN_WIDTH);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Desktop Only</h1>
          <p className="text-muted-foreground leading-relaxed">
            This application is optimized for desktop use. Please access it from a laptop or desktop computer with a screen width of at least 1024px.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
