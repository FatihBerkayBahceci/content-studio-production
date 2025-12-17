'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

// Routes that don't need the main layout (sidebar, header)
const publicRoutes = ['/login'];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // For public routes, render children directly without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // For authenticated routes, show full layout
  return (
    <div className="app-wrapper">
      <Header />
      <Sidebar />
      <main className="app-content">
        <div className="app-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
