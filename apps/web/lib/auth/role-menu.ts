// Client-safe role-based menu permissions
// This file should not import any server-only modules

export type UserRole = 'admin' | 'client' | 'team' | 'test';

// Role-based menu permissions
export const ROLE_MENU_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // Full access
  team: ['*'], // Full access
  client: [
    'dashboard',
    'quick-keywords',
    'keyword-research',
    'content-studio',
  ],
  test: [
    'quick-keywords',
    'keyword-research',
    'system-prompts',
  ],
};

// Check if role can access a menu item
export function canAccessMenuItem(role: UserRole, menuKey: string): boolean {
  const permissions = ROLE_MENU_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(menuKey);
}
