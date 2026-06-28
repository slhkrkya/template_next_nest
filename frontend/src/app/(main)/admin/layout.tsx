import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';

interface AdminRouteLayoutProps {
  children: React.ReactNode;
}

function isAdminRole(role?: string): boolean {
  return (role ?? '').trim().toLowerCase() === 'admin';
}

export default async function AdminRouteLayout({
  children,
}: AdminRouteLayoutProps) {
  const user = await getUserFromCookie();

  if (!user) {
    redirect('/login');
  }

  if (!user.isSuperAdmin && !isAdminRole(user.role)) {
    redirect('/user/profile');
  }

  return <>{children}</>;
}
