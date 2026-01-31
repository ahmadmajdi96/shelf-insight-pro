import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  userRole?: 'admin' | 'tenant';
}

export function MainLayout({ 
  children, 
  title, 
  subtitle,
  userRole = 'tenant' 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={userRole} />
      <div className="ml-64 transition-all duration-300">
        <Header title={title} subtitle={subtitle} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
