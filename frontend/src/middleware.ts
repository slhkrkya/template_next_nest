import { NextRequest, NextResponse } from 'next/server';

const AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

const LEGACY_AUTH_PATHS = new Map([
  ['/auth/login', '/login'],
  ['/auth/register', '/register'],
  ['/auth/forgot-password', '/forgot-password'],
  ['/auth/reset-password', '/reset-password'],
  ['/auth/verify-email', '/verify-email'],
]);

const PUBLIC_PATH_PREFIXES = [
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
];

/**
 * Super-admin paths that don't require tenant context (global mode).
 * These paths are accessible in global mode without selecting a tenant.
 */
const SUPER_ADMIN_GLOBAL_PATHS = [
  '/super-admin/tenants',
  '/super-admin/tenant-select',
  '/super-admin/subscription-plans',
  '/super-admin/system-logs',
  '/super-admin/rate-limit-violations',
  '/super-admin/notifications',
];

function isPublicPath(pathname: string): boolean {
  return AUTH_PATHS.has(pathname) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.has(pathname);
}

function isSuperAdminGlobalPath(pathname: string): boolean {
  return SUPER_ADMIN_GLOBAL_PATHS.some((p) => pathname.startsWith(p));
}

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
  isSuperAdmin?: boolean;
  iat: number;
  exp: number;
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const json = decodeBase64Url(payload);
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JWTPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

function normalizeRole(role?: string): string {
  return (role ?? '').trim().toLowerCase();
}

function hasAdminAccess(role?: string): boolean {
  const normalizedRole = normalizeRole(role);
  return normalizedRole.length > 0 && normalizedRole !== 'user';
}

function getDefaultDashboard(payload: Pick<JWTPayload, 'role' | 'isSuperAdmin' | 'tenantId'>): string {
  if (payload.isSuperAdmin) {
    // If super-admin has a tenant context, go to admin dashboard for that tenant
    if (payload.tenantId) return '/admin/dashboard';
    // Otherwise, go to global super-admin view
    return '/super-admin/tenants';
  }
  if (hasAdminAccess(payload.role)) return '/admin/dashboard';
  return '/user/profile';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyAuthPath = LEGACY_AUTH_PATHS.get(pathname);
  if (legacyAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = legacyAuthPath;
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get('access_token')?.value;

  // Allow public paths without a token
  if (isPublicPath(pathname)) {
    // If authenticated user visits an auth page, redirect to their dashboard
    if (token && isAuthPath(pathname)) {
      const payload = decodeJWT(token);
      if (payload && !isTokenExpired(payload)) {
        const dashboard = getDefaultDashboard(payload);
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }
    return NextResponse.next();
  }

  // No token: redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode token
  const payload = decodeJWT(token);

  // Invalid or expired token: redirect to login
  if (!payload || isTokenExpired(payload)) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  if (pathname === '/dashboard' || pathname === '/user/dashboard') {
    return NextResponse.redirect(new URL(getDefaultDashboard(payload), request.url));
  }

  // Super-admin route protection
  if (pathname.startsWith('/super-admin')) {
    if (!payload.isSuperAdmin) {
      return NextResponse.redirect(new URL(getDefaultDashboard(payload), request.url));
    }
    // Super-admin can access super-admin routes (global mode paths)
    return NextResponse.next();
  }

  // Admin route protection with tenant context guard for super-admins
  if (pathname.startsWith('/admin')) {
    // Super-admin in global mode (no tenant selected) trying to access admin pages
    // Must select a tenant first to manage admin functionality
    if (payload.isSuperAdmin && !payload.tenantId) {
      return NextResponse.redirect(new URL('/super-admin/tenant-select', request.url));
    }

    // Non-SuperAdmin users need a non-User role for admin pages
    if (!payload.isSuperAdmin && !hasAdminAccess(payload.role)) {
      return NextResponse.redirect(new URL(getDefaultDashboard(payload), request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
