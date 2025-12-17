import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import { NextRequest, NextResponse } from 'next/server';

// Get session on server side
export async function getSession() {
  return getServerSession(authOptions);
}

// Get current user from session
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

// Check if user is authenticated
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

// Check if user is admin
export async function isAdmin() {
  const session = await getSession();
  return session?.user?.role === 'admin';
}

// API route authentication helper
export async function withAuth(
  request: NextRequest,
  handler: (user: { id: string; email: string; name: string; role: string; accessibleClients: number[] }) => Promise<NextResponse>,
  options?: { requireAdmin?: boolean; requireClientAccess?: number }
): Promise<NextResponse> {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Yetkilendirme gerekli' },
      { status: 401 }
    );
  }

  // Check admin requirement
  if (options?.requireAdmin && session.user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Admin yetkisi gerekli' },
      { status: 403 }
    );
  }

  // Check client access requirement
  if (options?.requireClientAccess) {
    const clientId = options.requireClientAccess;
    const hasAccess = session.user.role === 'admin' ||
                      session.user.accessibleClients.includes(clientId);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Bu müşteriye erişim yetkiniz yok' },
        { status: 403 }
      );
    }
  }

  return handler(session.user);
}

// Unauthorized response helper
export function unauthorized(message = 'Yetkilendirme gerekli') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

// Forbidden response helper
export function forbidden(message = 'Erişim reddedildi') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}
