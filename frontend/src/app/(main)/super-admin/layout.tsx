import { redirect } from 'next/navigation';
import { SuperAdminLayout } from '@/components/layouts/super-admin-layout/SuperAdminLayout';
import { getUserFromCookie } from '@/lib/auth';

interface SuperAdminRouteLayoutProps {
  children: React.ReactNode;
}

export default async function SuperAdminRouteLayout({
  children,
}: SuperAdminRouteLayoutProps) {
  const user = await getUserFromCookie();

  if (!user) {
    redirect('/login');
  }

  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
