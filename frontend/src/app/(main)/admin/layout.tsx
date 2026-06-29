import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';

interface AdminRouteLayoutProps {
  children: React.ReactNode;
}

function hasAdminAccess(role?: string): boolean {
  const normalizedRole = (role ?? '').trim().toLowerCase();
  return normalizedRole.length > 0 && normalizedRole !== 'user';
}

export default async function AdminRouteLayout({
  children,
}: AdminRouteLayoutProps) {
  const user = await getUserFromCookie();

  if (!user) {
    redirect('/login');
  }

  if (!user.isSuperAdmin && !hasAdminAccess(user.role)) {
    redirect('/user/profile');
  }

  return <>{children}</>;
}
