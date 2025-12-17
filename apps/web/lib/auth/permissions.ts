import { query } from '@/lib/db';

export type UserRole = 'admin' | 'client' | 'team';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accessibleClients: number[];
}

// Check if user is admin
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'admin';
}

// Check if user can manage users (admin only)
export function canManageUsers(user: AuthUser): boolean {
  return user.role === 'admin';
}

// Check if user can access a specific client
export function canAccessClient(user: AuthUser, clientId: number): boolean {
  if (user.role === 'admin') return true;
  return user.accessibleClients.includes(clientId);
}

// Check if user can edit a client's data
export async function canEditClient(user: AuthUser, clientId: number): Promise<boolean> {
  if (user.role === 'admin') return true;
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
  if (user.role === 'admin') return true;

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
  if (user.role === 'admin') return true;
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
  if (user.role === 'admin') return clients;
  return clients.filter(client => user.accessibleClients.includes(client.id));
}

// Get permission summary for UI
export function getPermissionSummary(user: AuthUser) {
  return {
    isAdmin: user.role === 'admin',
    canManageUsers: user.role === 'admin',
    canCreateProjects: user.role !== 'client',
    canExportData: true, // All roles can export
    canAccessSettings: user.role === 'admin',
    accessibleClientCount: user.role === 'admin' ? 'all' : user.accessibleClients.length,
  };
}
