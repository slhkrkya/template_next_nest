import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';

function hasAdminAccess(role?: string): boolean {
  const normalizedRole = (role ?? '').trim().toLowerCase();
  return normalizedRole.length > 0 && normalizedRole !== 'user';
}

export default async function UserDashboardPage() {
  const user = await getUserFromCookie();

  if (user?.isSuperAdmin) {
    redirect('/super-admin/tenants');
  }

  if (hasAdminAccess(user?.role)) {
    redirect('/admin/dashboard');
  }

  redirect('/user/profile');
}
