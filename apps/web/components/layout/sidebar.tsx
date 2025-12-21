'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Search,
  FileText,
  Link2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Menu,
  Zap,
  Bell,
  User,
  LogOut,
  CreditCard,
  Filter,
  Globe,
  Sparkles,
  GitBranch,
  Target,
  Lightbulb,
  X,
  Presentation,
  Wand2,
  Minimize2,
  Terminal,
  Layers,
  Crown,
  Eye,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/lib/stores/ui-store';
import { useClientStore } from '@/lib/stores/client-store';
import { canAccessMenuItem, UserRole } from '@/lib/auth/role-menu';

// Navigation items with UI Kit structure
const menuItems = [
  {
    isTitle: true,
    label: 'Main',
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    key: 'clients',
    label: 'Müşteriler',
    url: '/clients',
    icon: Users,
  },
  {
    isTitle: true,
    label: 'AI Tools',
  },
  {
    key: 'quick-keywords',
    label: 'Hızlı Keyword',
    url: '/keywords',
    icon: Zap,
    badge: { text: 'Yeni', variant: 'primary' },
  },
  {
    key: 'keyword-research',
    label: 'Keyword Research',
    url: '/tool1',
    icon: Search,
    badge: { text: 'Active', variant: 'primary' },
  },
  {
    isTitle: true,
    label: 'Sunum - Arama Sayfaları',
  },
  {
    key: 'kw-wizard',
    label: 'Wizard Tasarım',
    url: '/keywords/wizard',
    icon: Wand2,
    badge: { text: 'Demo', variant: 'primary' },
  },
  {
    key: 'kw-minimal',
    label: 'Minimal Tasarım',
    url: '/keywords/minimal',
    icon: Minimize2,
    badge: { text: 'Demo', variant: 'primary' },
  },
  {
    key: 'kw-command',
    label: 'Command Tasarım',
    url: '/keywords/command',
    icon: Terminal,
    badge: { text: 'Demo', variant: 'primary' },
  },
  {
    key: 'kw-multiview',
    label: 'Multi-View',
    url: '/keywords/multi-view',
    icon: Layers,
    badge: { text: 'Demo', variant: 'primary' },
  },
  {
    isTitle: true,
    label: 'Sunum - Sonuç Sayfaları',
  },
  {
    key: 'kw-results-main',
    label: 'Ana Sonuç (Table)',
    url: '/keywords/60225cfe-7028-4e30-9999-111da6690a34',
    icon: Search,
    badge: { text: 'Demo', variant: 'primary' },
  },
  {
    key: 'kw-results-pro',
    label: 'Pro Tasarım',
    url: '/keywords/60225cfe-7028-4e30-9999-111da6690a34/pro',
    icon: Crown,
    badge: { text: 'Demo', variant: 'primary' },
  },
  {
    key: 'kw-results-quick',
    label: 'Quick View',
    url: '/keywords/60225cfe-7028-4e30-9999-111da6690a34/quick',
    icon: Eye,
    badge: { text: 'Demo', variant: 'primary' },
  },
  {
    key: 'kw-results-showcase',
    label: 'Showcase (Ultra)',
    url: '/keywords/60225cfe-7028-4e30-9999-111da6690a34/showcase',
    icon: Star,
    badge: { text: 'Demo', variant: 'primary' },
  },
  {
    key: 'content-studio',
    label: 'Content Studio',
    url: '/tool2',
    icon: FileText,
    badge: { text: 'Soon', variant: 'muted' },
  },
  {
    key: 'internal-linking',
    label: 'Internal Linking',
    url: '/tool3',
    icon: Link2,
    badge: { text: 'Soon', variant: 'muted' },
  },
  {
    isTitle: true,
    label: 'SEO Tools',
  },
  {
    key: 'ai-filter',
    label: 'AI Filtreleme',
    url: '/tools/filter',
    icon: Filter,
  },
  {
    key: 'competitor-analysis',
    label: 'Rakip Analizi',
    url: '/tools/competitors',
    icon: Globe,
  },
  {
    key: 'serp-analysis',
    label: 'SERP Analizi',
    url: '/tools/serp',
    icon: Sparkles,
  },
  {
    key: 'content-gap',
    label: 'İçerik Boşluğu',
    url: '/tools/content-gap',
    icon: GitBranch,
  },
  {
    key: 'opportunity-score',
    label: 'Fırsat Skorları',
    url: '/tools/opportunity',
    icon: Target,
  },
  {
    key: 'content-strategy',
    label: 'İçerik Stratejisi',
    url: '/tools/strategy',
    icon: Lightbulb,
  },
  {
    isTitle: true,
    label: 'System',
  },
  {
    key: 'system-prompts',
    label: 'System Prompts',
    url: '/settings/system-prompts',
    icon: MessageSquare,
  },
  {
    key: 'settings',
    label: 'Ayarlar',
    url: '/settings',
    icon: Settings,
  },
];

// Menu Item Component
function MenuItem({
  item,
  isActive,
  collapsed
}: {
  item: typeof menuItems[number];
  isActive: boolean;
  collapsed: boolean;
}) {
  if (!item.url || !item.icon) return null;

  const Icon = item.icon;

  return (
    <li className="nav-item">
      <Link
        href={item.url}
        className={cn('nav-link', isActive && 'active')}
        title={collapsed ? item.label : undefined}
      >
        <span className="nav-icon">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="nav-text">{item.label}</span>
        {item.badge && (
          <span className={cn(
            'nav-badge',
            item.badge.variant === 'primary' ? 'badge-primary' : 'badge-muted'
          )}>
            {item.badge.text}
          </span>
        )}
      </Link>
    </li>
  );
}

// Menu Title Component
function MenuTitle({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <li className="menu-title-collapsed"><div className="title-line" /></li>;

  return (
    <li className="menu-title">
      {label}
    </li>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarCollapsed, toggleSidebarCollapse, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { getSelectedClient } = useClientStore();
  const selectedClient = getSelectedClient();
  const userRole = (session?.user?.role || 'admin') as UserRole;

  // Filter menu items based on user role
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      // Always show title items if any of their following items are visible
      if (item.isTitle) return true;
      // Check permission for regular items
      if (item.key) {
        return canAccessMenuItem(userRole, item.key);
      }
      return true;
    }).filter((item, index, array) => {
      // Remove title items that have no visible items after them
      if (item.isTitle) {
        const nextItem = array[index + 1];
        // If next item is also a title or doesn't exist, hide this title
        if (!nextItem || nextItem.isTitle) return false;
      }
      return true;
    });
  }, [userRole]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    if (mobileSidebarOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen, setMobileSidebarOpen]);

  const isItemActive = (url?: string) => {
    if (!url) return false;
    return pathname === url || (url !== '/' && pathname?.startsWith(url));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'app-sidebar',
        sidebarCollapsed && 'condensed',
        mobileSidebarOpen && 'mobile-open'
      )}>
      {/* Logo Box */}
      <div className="logo-box">
        <Link href="/" className="logo-link">
          <img
            src="/seoart-icon.svg"
            alt="SEOART"
            width={32}
            height={32}
            className="logo-sm"
          />
          <div className="logo-lg">
            <span className="logo-title">SEOART</span>
            <span className="logo-dot">.</span>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--glass-bg-2))] text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Menüyü kapat"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={toggleSidebarCollapse}
          className="button-sm-hover"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="button-sm-hover-icon">
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </span>
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="scrollbar">
        <nav className="navbar-nav" id="navbar-nav">
          <ul className="nav-menu">
            {filteredMenuItems.map((item, index) => {
              if (item.isTitle) {
                return (
                  <MenuTitle
                    key={`title-${index}`}
                    label={item.label!}
                    collapsed={sidebarCollapsed}
                  />
                );
              }

              return (
                <MenuItem
                  key={item.key}
                  item={item}
                  isActive={isItemActive(item.url)}
                  collapsed={sidebarCollapsed}
                />
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Client Selector */}
        <button className={cn('sidebar-client-selector', sidebarCollapsed && 'collapsed')}>
          <div className="client-avatar">
            {selectedClient?.name?.charAt(0) || 'S'}
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="client-info">
                <span className="client-label">Müşteri</span>
                <span className="client-name">{selectedClient?.name || 'Seçiniz'}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>

        {/* Divider */}
        <div className={cn('sidebar-footer-divider', sidebarCollapsed && 'collapsed')} />

        {/* User Profile */}
        <div className={cn('sidebar-user', sidebarCollapsed && 'collapsed')}>
          <div className="user-avatar">
            <User className="h-4 w-4" />
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="user-info">
                <span className="user-name">Admin</span>
                <span className="user-plan">Pro Plan</span>
              </div>
              <div className="user-actions">
                <button className="user-action-btn" title="Bildirimler">
                  <Bell className="h-4 w-4" />
                  <span className="notification-dot" />
                </button>
                <button className="user-action-btn" title="Ayarlar">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

// Mobile sidebar toggle button (for header)
export function SidebarToggle() {
  const { toggleMobileSidebar } = useUIStore();

  return (
    <button
      onClick={toggleMobileSidebar}
      className="sidebar-toggle lg:hidden"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
