import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';

function isAdminRole(role?: string): boolean {
  return (role ?? '').trim().toLowerCase() === 'admin';
}

export default async function UserDashboardPage() {
  const user = await getUserFromCookie();

  if (user?.isSuperAdmin) {
    redirect('/super-admin/tenants');
  }

  if (isAdminRole(user?.role)) {
    redirect('/admin/dashboard');
  }

  redirect('/user/profile');
}
