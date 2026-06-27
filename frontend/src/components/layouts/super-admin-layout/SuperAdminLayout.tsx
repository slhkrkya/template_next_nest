'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { logout as logoutApi } from '@/lib/api/auth.api';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import {
  Globe,
  CreditCard,
  ScrollText,
  Bell,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const SUPER_ADMIN_SIDEBAR_KEY = 'super-admin-sidebar-collapsed';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
}

const superAdminNavItems: NavItem[] = [
  { labelKey: 'tenants', href: '/super-admin/tenants', icon: Globe },
  { labelKey: 'subscriptionPlans', href: '/super-admin/subscription-plans', icon: CreditCard },
  { labelKey: 'systemLogs', href: '/super-admin/system-logs', icon: ScrollText },
  { labelKey: 'notifications', href: '/super-admin/notifications', icon: Bell },
  { labelKey: 'switchTenant', href: '/super-admin/tenant-select', icon: ArrowLeftRight },
];

interface SuperAdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  pathname: string;
}

function SuperAdminSidebar({ collapsed, onToggle, pathname }: SuperAdminSidebarProps) {
  const t = useTranslations();
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  async function logout() {
    try {
      await logoutApi();
    } catch {
      // Client logout should still complete when the server call fails.
    }
    clearAuth();
    router.push('/login');
  }

  return (
    <div className="flex h-full flex-col bg-slate-950 text-indigo-50">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-white/10 px-4',
          collapsed ? 'justify-center' : 'gap-3',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-950/35">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              {t('nav.superAdmin')}
            </span>
            <span className="text-sm font-bold tracking-tight">{t('nav.controlPanel')}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide">
        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">
            {t('nav.management')}
          </p>
        )}
        <div className="flex flex-col gap-1">
          {superAdminNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const label = t(`nav.${item.labelKey}`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-indigo-200/75 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center px-2',
                )}
                title={collapsed ? label : undefined}
              >
                {active && !collapsed && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-fuchsia-400" />}
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 space-y-1 border-t border-white/10 p-2">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-indigo-300 transition-colors hover:bg-white/10 hover:text-white',
            collapsed && 'justify-center px-2',
          )}
          aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>{t('nav.collapse')}</span>}
        </button>
        <button
          type="button"
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-indigo-300 transition-colors hover:bg-rose-500/15 hover:text-rose-100',
            collapsed && 'justify-center px-2',
          )}
          aria-label={t('auth.logout')}
          title={collapsed ? t('auth.logout') : undefined}
        >
          <i className="pi pi-sign-out text-sm" />
          {!collapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>
    </div>
  );
}

interface SuperAdminTopbarProps {
  onSidebarToggle: () => void;
  onMobileToggle: () => void;
  pathname: string;
}

function SuperAdminTopbar({ onSidebarToggle, onMobileToggle, pathname }: SuperAdminTopbarProps) {
  const t = useTranslations();
  const menuRef = useRef<Menu>(null);
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const segments = pathname.split('/').filter(Boolean);
  const segmentLabels: Record<string, string> = {
    'super-admin': t('nav.superAdmin'),
    tenants: t('nav.tenants'),
    'subscription-plans': t('nav.subscriptionPlans'),
    'system-logs': t('nav.systemLogs'),
    notifications: t('nav.notifications'),
    'tenant-select': t('nav.switchTenant'),
  };
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'SA';

  async function logout() {
    try {
      await logoutApi();
    } catch {
      // Client logout should still complete when the server call fails.
    }
    clearAuth();
    router.push('/login');
  }

  const menuItems: MenuItem[] = [
    { label: t('nav.profile'), icon: 'pi pi-user', command: () => router.push('/user/profile') },
    { label: t('nav.settings'), icon: 'pi pi-cog', command: () => router.push('/user/settings') },
    { separator: true },
    { label: t('auth.logout'), icon: 'pi pi-sign-out', command: logout },
  ];

  return (
    <header className="arca-topbar sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 shadow-sm dark:border-slate-800">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          icon="pi pi-bars"
          severity="secondary"
          text
          rounded
          onClick={onMobileToggle}
          className="lg:hidden"
          aria-label={t('nav.openSidebar')}
        />
        <Button
          type="button"
          icon="pi pi-bars"
          severity="secondary"
          text
          rounded
          onClick={onSidebarToggle}
          className="hidden lg:inline-flex"
          aria-label={t('nav.toggleSidebar')}
        />
        <nav aria-label="Breadcrumb" className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 md:flex">
          {segments.map((segment, index) => {
            const label =
              segmentLabels[segment] ??
              segment
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            const isLast = index === segments.length - 1;

            return (
              <span key={segment} className="flex items-center gap-2">
                {index > 0 && <span className="text-slate-300">/</span>}
                <span className={isLast ? 'font-semibold text-slate-950 dark:text-slate-50' : ''}>
                  {label}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
        <Menu model={menuItems} popup ref={menuRef} className="w-48" />
        <Button
          type="button"
          severity="secondary"
          text
          onClick={(event) => menuRef.current?.toggle(event)}
          aria-label={t('nav.userMenu')}
        >
          <span className="flex items-center gap-2">
            <Avatar label={initials} shape="circle" className="bg-fuchsia-600 text-white" />
            <span className="hidden text-sm font-semibold md:block">{user?.firstName ?? t('nav.admin')}</span>
            <i className="pi pi-chevron-down text-xs" />
          </span>
        </Button>
      </div>
    </header>
  );
}

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem(SUPER_ADMIN_SIDEBAR_KEY);
    if (stored !== null) setSidebarCollapsed(stored === 'true');
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SUPER_ADMIN_SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col sidebar-transition shadow-2xl shadow-slate-950/20 lg:static lg:z-auto lg:shadow-none',
          sidebarCollapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <SuperAdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          pathname={pathname}
        />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <SuperAdminTopbar
          onSidebarToggle={toggleSidebar}
          onMobileToggle={toggleMobile}
          pathname={pathname}
        />
        <main className="arca-page-surface flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
