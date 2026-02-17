import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ 
  children, 
  title, 
  subtitle,
}: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300",
        isMobile ? "ml-0" : "ml-60"
      )}>
        <Header title={title} subtitle={subtitle} />
        <main className={cn(
          "p-4 md:p-6",
          isMobile && "pt-16"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
