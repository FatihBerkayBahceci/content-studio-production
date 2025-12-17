'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/lib/stores/ui-store';
import { useClientStore } from '@/lib/stores/client-store';

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
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { getSelectedClient } = useClientStore();
  const selectedClient = getSelectedClient();

  const isItemActive = (url?: string) => {
    if (!url) return false;
    return pathname === url || (url !== '/' && pathname?.startsWith(url));
  };

  return (
    <aside className={cn('app-sidebar', sidebarCollapsed && 'condensed')}>
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

        {/* Collapse Toggle Button */}
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
            {menuItems.map((item, index) => {
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
  );
}

// Mobile sidebar toggle button (for header)
export function SidebarToggle() {
  const { toggleSidebarCollapse } = useUIStore();

  return (
    <button
      onClick={toggleSidebarCollapse}
      className="sidebar-toggle lg:hidden"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
