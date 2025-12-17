import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public routes (no authentication required)
const publicRoutes = [
  '/login',
  '/api/auth',
];

// Admin-only routes
const adminRoutes = [
  '/admin',
  '/settings/users',
];

// Check if path matches any route pattern
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route.endsWith('*')) {
      return path.startsWith(route.slice(0, -1));
    }
    return path === route || path.startsWith(route + '/');
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (matchesRoute(pathname, publicRoutes)) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not authenticated - redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes
  if (matchesRoute(pathname, adminRoutes)) {
    if (token.role !== 'admin') {
      // Redirect non-admins to dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Add user info to headers for API routes
  const response = NextResponse.next();
  response.headers.set('x-user-id', token.id as string);
  response.headers.set('x-user-role', token.role as string);
  response.headers.set('x-user-email', token.email as string);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
