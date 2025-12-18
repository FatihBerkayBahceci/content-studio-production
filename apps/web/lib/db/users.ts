import { query } from './index';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  uuid: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'client' | 'team' | 'test';
  is_active: boolean;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword {
  id: number;
  uuid: string;
  email: string;
  name: string;
  role: 'admin' | 'client' | 'team' | 'test';
  is_active: boolean;
  email_verified_at: Date | null;
  last_login_at: Date | null;
}

export interface UserClient {
  id: number;
  user_id: number;
  client_id: number;
  can_edit: boolean;
  created_at: Date;
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await query<User[]>(
    `SELECT * FROM users WHERE email = ? AND is_active = TRUE LIMIT 1`,
    [email]
  );
  return users[0] || null;
}

// Find user by ID
export async function findUserById(id: number): Promise<UserWithoutPassword | null> {
  const users = await query<UserWithoutPassword[]>(
    `SELECT id, uuid, email, name, role, is_active, email_verified_at, last_login_at
     FROM users WHERE id = ? AND is_active = TRUE LIMIT 1`,
    [id]
  );
  return users[0] || null;
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Update last login
export async function updateLastLogin(userId: number): Promise<void> {
  await query(
    `UPDATE users SET last_login_at = NOW() WHERE id = ?`,
    [userId]
  );
}

// Get user's accessible clients
export async function getUserClients(userId: number): Promise<UserClient[]> {
  return query<UserClient[]>(
    `SELECT * FROM user_clients WHERE user_id = ?`,
    [userId]
  );
}

// Check if user can access a specific client
export async function canUserAccessClient(userId: number, clientId: number, role: string): Promise<boolean> {
  // Admins and test users can access all clients
  if (role === 'admin' || role === 'test') return true;

  const result = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM user_clients WHERE user_id = ? AND client_id = ?`,
    [userId, clientId]
  );
  return result[0]?.count > 0;
}

// Check if user can edit a specific client
export async function canUserEditClient(userId: number, clientId: number, role: string): Promise<boolean> {
  // Admins and test users can edit all clients
  if (role === 'admin' || role === 'test') return true;

  // Clients (customers) cannot edit
  if (role === 'client') return false;

  const result = await query<{ can_edit: boolean }[]>(
    `SELECT can_edit FROM user_clients WHERE user_id = ? AND client_id = ?`,
    [userId, clientId]
  );
  return result[0]?.can_edit || false;
}

// Get all clients accessible by user
export async function getAccessibleClients(userId: number, role: string): Promise<number[]> {
  // Admins and test users can access all clients
  if (role === 'admin' || role === 'test') {
    const clients = await query<{ id: number }[]>(
      `SELECT id FROM clients WHERE is_active = 1 AND deleted_at IS NULL`
    );
    return clients.map(c => c.id);
  }

  const userClients = await query<{ client_id: number }[]>(
    `SELECT client_id FROM user_clients WHERE user_id = ?`,
    [userId]
  );
  return userClients.map(uc => uc.client_id);
}

// Create a new user
export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'client' | 'team' | 'test';
}): Promise<number> {
  const passwordHash = await hashPassword(data.password);
  const result = await query<{ insertId: number }>(
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`,
    [data.email, passwordHash, data.name, data.role || 'team']
  );
  return (result as any).insertId;
}

// Assign client to user
export async function assignClientToUser(userId: number, clientId: number, canEdit: boolean = false): Promise<void> {
  await query(
    `INSERT INTO user_clients (user_id, client_id, can_edit) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE can_edit = ?`,
    [userId, clientId, canEdit, canEdit]
  );
}
