'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'text-red-400 bg-red-500/10' },
  client: { label: 'Müşteri', color: 'text-blue-400 bg-blue-500/10' },
  team: { label: 'Ekip', color: 'text-emerald-400 bg-emerald-500/10' },
};

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const roleInfo = roleLabels[user.role] || roleLabels.team;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors',
          isOpen && 'bg-[hsl(var(--glass-bg-interactive))]'
        )}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <span className="text-sm font-medium text-foreground hidden md:block">
          {user.name}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-xl glass-2 border border-[hsl(var(--glass-border-subtle))] shadow-xl overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="p-4 border-b border-[hsl(var(--glass-border-subtle))]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                  roleInfo.color
                )}>
                  <Shield className="h-3 w-3" />
                  {roleInfo.label}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to settings
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              >
                <Settings className="h-4 w-4" />
                Ayarlar
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
