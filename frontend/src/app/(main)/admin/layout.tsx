import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';

interface AdminRouteLayoutProps {
  children: React.ReactNode;
}

export default async function AdminRouteLayout({
  children,
}: AdminRouteLayoutProps) {
  const user = await getUserFromCookie();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}
