'use client';

import { usePathname } from 'next/navigation';
import { Search, Menu, Command, HelpCircle, Keyboard } from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui-store';
import { UserMenu } from '@/components/auth/user-menu';

// Breadcrumb mapping
const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Müşteriler',
  '/projects': 'Projeler',
  '/tool1': 'Keyword Research',
  '/tool1/new': 'Yeni Proje',
  '/tool2': 'Content Studio',
  '/tool3': 'Internal Linking',
  '/settings': 'Ayarlar',
  '/settings/system-prompts': 'System Prompts',
  '/keywords': 'Hızlı Keyword',
};

export function Header() {
  const pathname = usePathname();
  const { toggleMobileSidebar } = useUIStore();

  // Get current page title
  const getPageTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    // Check for dynamic routes
    if (pathname.startsWith('/tool1/')) return 'Proje Detay';
    if (pathname.startsWith('/clients/')) return 'Müşteri Detay';
    return 'Dashboard';
  };

  return (
    <header className="app-topbar">
      <div className="topbar-container">
        {/* Left Section */}
        <div className="topbar-left">
          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileSidebar}
            className="topbar-toggle lg:hidden"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page Title / Breadcrumb */}
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-title">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center - Search */}
        <div className="topbar-center">
          <div className="topbar-search">
            <Search className="search-icon" />
            <input
              type="search"
              placeholder="Ara..."
              className="search-input"
              autoComplete="off"
            />
            <div className="search-shortcut">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="topbar-right">
          {/* Keyboard Shortcuts */}
          <button className="topbar-icon-btn" title="Klavye Kısayolları">
            <Keyboard className="h-[18px] w-[18px]" />
          </button>

          {/* Help */}
          <button className="topbar-icon-btn" title="Yardım">
            <HelpCircle className="h-[18px] w-[18px]" />
          </button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
