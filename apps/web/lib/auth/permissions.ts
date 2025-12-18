import { query } from '@/lib/db';

export type UserRole = 'admin' | 'client' | 'team' | 'test';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accessibleClients: number[];
}

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

// Check if user is admin (or has admin-like access)
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'test';
}

// Check if user can manage users (admin only)
export function canManageUsers(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'test';
}

// Check if user can access a specific client
export function canAccessClient(user: AuthUser, clientId: number): boolean {
  if (user.role === 'admin' || user.role === 'test') return true;
  return user.accessibleClients.includes(clientId);
}

// Check if user can edit a client's data
export async function canEditClient(user: AuthUser, clientId: number): Promise<boolean> {
  if (user.role === 'admin' || user.role === 'test') return true;
  if (user.role === 'client') return false;

  // Team members need can_edit permission
  const result = await query<{ can_edit: boolean }[]>(
    `SELECT can_edit FROM user_clients WHERE user_id = ? AND client_id = ?`,
    [parseInt(user.id), clientId]
  );
  return result[0]?.can_edit || false;
}

// Check if user can access a project
export async function canAccessProject(user: AuthUser, projectId: number): Promise<boolean> {
  if (user.role === 'admin' || user.role === 'test') return true;

  // Get the client_id of the project
  const project = await query<{ client_id: number }[]>(
    `SELECT client_id FROM keyword_projects WHERE id = ?`,
    [projectId]
  );

  if (!project[0]) return false;

  return canAccessClient(user, project[0].client_id);
}

// Check if user can edit a project
export async function canEditProject(user: AuthUser, projectId: number): Promise<boolean> {
  if (user.role === 'admin' || user.role === 'test') return true;
  if (user.role === 'client') return false;

  // Get the client_id of the project
  const project = await query<{ client_id: number }[]>(
    `SELECT client_id FROM keyword_projects WHERE id = ?`,
    [projectId]
  );

  if (!project[0]) return false;

  return canEditClient(user, project[0].client_id);
}

// Filter clients list based on user permissions
export function filterClientsByAccess<T extends { id: number }>(user: AuthUser, clients: T[]): T[] {
  if (user.role === 'admin' || user.role === 'test') return clients;
  return clients.filter(client => user.accessibleClients.includes(client.id));
}

// Get permission summary for UI
export function getPermissionSummary(user: AuthUser) {
  return {
    isAdmin: user.role === 'admin' || user.role === 'test',
    canManageUsers: user.role === 'admin' || user.role === 'test',
    canCreateProjects: user.role !== 'client',
    canExportData: true, // All roles can export
    canAccessSettings: user.role === 'admin' || user.role === 'test',
    accessibleClientCount: (user.role === 'admin' || user.role === 'test') ? 'all' : user.accessibleClients.length,
  };
}
