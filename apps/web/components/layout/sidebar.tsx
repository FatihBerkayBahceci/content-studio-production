'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Search,
  Users,
  Settings,
  Menu,
  Zap,
  User,
  X,
  FolderKanban,
  MessageSquareCode,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/lib/stores/ui-store';
import { canAccessMenuItem, UserRole } from '@/lib/auth/role-menu';

// Navigation items - Simplified
const menuItems = [
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
    key: 'projects',
    label: 'Projeler',
    url: '/projects',
    icon: FolderKanban,
  },
  {
    key: 'quick-keywords',
    label: 'Hızlı Keyword',
    url: '/keywords/agent',
    icon: Zap,
  },
  {
    key: 'keyword-research',
    label: 'Keyword Research',
    url: '/tool1',
    icon: Search,
  },
  {
    key: 'system-prompts',
    label: 'System Prompts',
    url: '/settings/system-prompts',
    icon: MessageSquareCode,
  },
  {
    key: 'tests',
    label: 'Test Senaryolari',
    url: '/tests',
    icon: ClipboardCheck,
  },
];

// Menu Item Component with Tooltip
function MenuItem({
  item,
  isActive,
}: {
  item: typeof menuItems[number];
  isActive: boolean;
}) {
  if (!item.url || !item.icon) return null;

  const Icon = item.icon;

  return (
    <li className="nav-item-mini">
      <Link
        href={item.url}
        className={cn('nav-link-mini', isActive && 'active')}
        data-tooltip={item.label}
      >
        <span className="nav-icon-mini">
          <Icon className="h-5 w-5" />
        </span>
      </Link>
    </li>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const userRole = (session?.user?.role || 'admin') as UserRole;

  // Filter menu items based on user role
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (item.key) {
        return canAccessMenuItem(userRole, item.key);
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

      <aside className="app-sidebar-mini">
        {/* Logo */}
        <div className="logo-box-mini">
          <Link href="/" className="logo-link-mini" data-tooltip="Ana Sayfa">
            <img
              src="/seoart-icon.svg"
              alt="SEOART"
              width={28}
              height={28}
              className="logo-icon"
            />
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[hsl(var(--glass-bg-2))] text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Menüyü kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu-mini">
          <ul className="nav-list-mini">
            {filteredMenuItems.map((item) => (
              <MenuItem
                key={item.key}
                item={item}
                isActive={isItemActive(item.url)}
              />
            ))}
          </ul>
        </nav>

        {/* Footer - User */}
        <div className="nav-footer-mini">
          <Link href="/settings" className="nav-user-mini" data-tooltip="Ayarlar">
            <span className="nav-user-avatar">
              <User className="h-4 w-4" />
            </span>
          </Link>
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
