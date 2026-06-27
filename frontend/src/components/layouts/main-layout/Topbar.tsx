'use client';

import { useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { OverlayPanel } from 'primereact/overlaypanel';
import type { MenuItem } from 'primereact/menuitem';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { logout as logoutApi } from '@/lib/api/auth.api';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onMobileToggle: () => void;
}

function Breadcrumb() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const segmentLabels: Record<string, string> = {
    user: t('user'),
    admin: t('admin'),
    'super-admin': t('superAdmin'),
    dashboard: t('dashboard'),
    users: t('users'),
    roles: t('roles'),
    permissions: t('permissions'),
    'audit-logs': t('auditLogs'),
    tenants: t('tenants'),
    notifications: t('notifications'),
    profile: t('profile'),
    settings: t('settings'),
    'email-parameters': t('emailParameters'),
    'ip-bans': t('ipBans'),
    'rate-limit-violations': t('rateLimits'),
    'data-scopes': t('dataScopes'),
    'company-profile': t('companyProfile'),
    'workflow-demo': t('workflowDemo'),
    'subscription-plans': t('subscriptionPlans'),
    'system-logs': t('systemLogs'),
    'tenant-select': t('switchTenant'),
  };

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 md:flex"
    >
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
            {index > 0 && (
              <span className="text-slate-300 dark:text-slate-600">/</span>
            )}
            <span
              className={
                isLast
                  ? 'font-semibold text-slate-950 dark:text-slate-100'
                  : ''
              }
            >
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

function NotificationDropdown() {
  const t = useTranslations('notifications');
  const panelRef = useRef<OverlayPanel>(null);
  const { notifications, unreadCount, markAllRead } = useNotificationStore();
  const recent = notifications.slice(0, 5);

  return (
    <>
      <Button
        type="button"
        icon="pi pi-bell"
        severity="secondary"
        text
        rounded
        className="relative"
        aria-label={t('title')}
        onClick={(event) => panelRef.current?.toggle(event)}
      >
        {unreadCount > 0 && (
          <Badge
            value={unreadCount > 99 ? '99+' : unreadCount}
            severity="danger"
            className="absolute -right-1 -top-1"
          />
        )}
      </Button>

      <OverlayPanel ref={panelRef} className="w-80">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
          <span className="font-semibold text-slate-950 dark:text-slate-50">
            {t('title')}
          </span>
          {unreadCount > 0 && (
            <Button
              type="button"
              label={t('markAllRead')}
              icon="pi pi-check"
              size="small"
              text
              onClick={() => markAllRead()}
            />
          )}
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('noNotifications')}
            </div>
          ) : (
            recent.map((notification) => (
              <div
                key={notification.id}
                className="rounded-md px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <p className="m-0 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {notification.title}
                </p>
                <p className="m-0 mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {notification.message}
                </p>
              </div>
            ))
          )}
        </div>

        {notifications.length > 5 && (
          <Link
            href="/user/notifications"
            className="block border-t border-slate-200 pt-3 text-center text-sm font-semibold text-indigo-600 dark:border-slate-700 dark:text-indigo-400"
          >
            {t('viewAll')}
          </Link>
        )}
      </OverlayPanel>
    </>
  );
}

function UserDropdown() {
  const t = useTranslations();
  const menuRef = useRef<Menu>(null);
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  async function logout() {
    try {
      await logoutApi();
    } catch {
      // Logout should clear client state even if the API call fails.
    }
    clearAuth();
    router.push('/login');
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';

  const items: MenuItem[] = [
    {
      label: `${user?.firstName ?? t('nav.user')} ${user?.lastName ?? ''}`.trim(),
      template: () => (
        <div className="px-3 py-2">
          <p className="m-0 text-sm font-semibold text-slate-950 dark:text-slate-50">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="m-0 mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {user?.email}
          </p>
        </div>
      ),
    },
    { separator: true },
    {
      label: t('nav.profile'),
      icon: 'pi pi-user',
      command: () => router.push('/user/profile'),
    },
    {
      label: t('nav.settings'),
      icon: 'pi pi-cog',
      command: () => router.push('/user/settings'),
    },
    { separator: true },
    { label: t('auth.logout'), icon: 'pi pi-sign-out', command: logout },
  ];

  return (
    <>
      <Menu model={items} popup ref={menuRef} className="w-56" />
      <Button
        type="button"
        severity="secondary"
        text
        onClick={(event) => menuRef.current?.toggle(event)}
        aria-label={t('nav.userMenu')}
      >
        <span className="flex items-center gap-2">
          <Avatar
            label={initials}
            shape="circle"
            className="bg-indigo-600 text-white dark:bg-indigo-500"
          />
          <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 md:block">
            {user?.firstName ?? t('nav.user')}
          </span>
          <i className="pi pi-chevron-down text-xs text-slate-500 dark:text-slate-400" />
        </span>
      </Button>
    </>
  );
}

export function Topbar({ onSidebarToggle, onMobileToggle }: TopbarProps) {
  const t = useTranslations('nav');
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
          aria-label={t('openSidebar')}
        />
        <Button
          type="button"
          icon="pi pi-bars"
          severity="secondary"
          text
          rounded
          onClick={onSidebarToggle}
          className="hidden lg:inline-flex"
          aria-label={t('toggleSidebar')}
        />
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationDropdown />
        <UserDropdown />
      </div>
    </header>
  );
}
