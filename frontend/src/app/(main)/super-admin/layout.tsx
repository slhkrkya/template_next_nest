import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';

interface SuperAdminRouteLayoutProps {
  children: React.ReactNode;
}

function hasAdminAccess(role?: string): boolean {
  const normalizedRole = (role ?? '').trim().toLowerCase();
  return normalizedRole.length > 0 && normalizedRole !== 'user';
}

function getDefaultDashboard(role?: string): string {
  if (hasAdminAccess(role)) return '/admin/dashboard';
  return '/user/profile';
}

export default async function SuperAdminRouteLayout({
  children,
}: SuperAdminRouteLayoutProps) {
  const user = await getUserFromCookie();

  if (!user) {
    redirect('/login');
  }

  if (!user.isSuperAdmin) {
    redirect(getDefaultDashboard(user.role));
  }

  return <>{children}</>;
}
