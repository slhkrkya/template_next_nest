import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JWTPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

function hasAdminAccess(role?: string): boolean {
  const normalizedRole = (role ?? '').trim().toLowerCase();
  return normalizedRole.length > 0 && normalizedRole !== 'user';
}

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  // No token: redirect to login
  if (!token) {
    redirect('/login');
  }

  const payload = decodeJWT(token);

  // Invalid or expired token: redirect to login
  if (!payload || isTokenExpired(payload)) {
    redirect('/login');
  }

  // Role-based redirect logic
  if (payload.isSuperAdmin) {
    // Super-admin with tenant context goes to admin dashboard
    if (payload.tenantId) {
      redirect('/admin/dashboard');
    }
    // Super-admin without tenant context goes to global view
    redirect('/super-admin/tenants');
  }

  // Admin users go to admin dashboard
  if (hasAdminAccess(payload.role)) {
    redirect('/admin/dashboard');
  }

  // Regular users go to user dashboard/profile
  redirect('/user/profile');
}
