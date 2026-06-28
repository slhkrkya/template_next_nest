import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';

interface SuperAdminRouteLayoutProps {
  children: React.ReactNode;
}

function isAdminRole(role?: string): boolean {
  return (role ?? '').trim().toLowerCase() === 'admin';
}

function getDefaultDashboard(role?: string): string {
  if (isAdminRole(role)) return '/admin/dashboard';
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
