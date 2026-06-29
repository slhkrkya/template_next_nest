'use client';

import { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { OverlayPanel } from 'primereact/overlaypanel';
import type { MenuItem } from 'primereact/menuitem';
import { Building, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { logout as logoutApi, switchTenant } from '@/lib/api/auth.api';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeConfigurator } from '@/components/shared/ThemeConfigurator';
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
      aria-label={t('breadcrumb')}
      className="hidden items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground md:flex"
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
              <span className="text-border">/</span>
            )}
            <span
              className={
                isLast
                  ? 'font-semibold text-foreground'
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

function TenantContextBadge() {
  const t = useTranslations('nav');
  const { user, setAuth } = useAuthStore();
  const router = useRouter();

  if (!user?.isSuperAdmin || !user?.tenantId) return null;

  async function returnToGlobal() {
    try {
      const { accessToken } = await switchTenant(null);
      setAuth({ ...user!, tenantId: undefined, tenantName: undefined }, accessToken);
      router.push('/super-admin/tenants');
    } catch {
      // Ignore; user can retry via tenant-select page.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm">
      <Building className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="max-w-[160px] truncate font-semibold text-primary">
        {user.tenantName ?? user.tenantId}
      </span>
      <button
        type="button"
        onClick={returnToGlobal}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
        title={t('returnGlobal')}
      >
        <ArrowLeft className="h-3 w-3" />
        {t('global')}
      </button>
    </div>
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
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-semibold text-foreground">
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
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('noNotifications')}
            </div>
          ) : (
            recent.map((notification) => (
              <div
                key={notification.id}
                className="rounded-md px-2 py-3 hover:bg-accent"
              >
                <p className="m-0 text-sm font-semibold text-foreground">
                  {notification.title}
                </p>
                <p className="m-0 mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {notification.message}
                </p>
              </div>
            ))
          )}
        </div>

        {notifications.length > 5 && (
          <Link
            href="/user/notifications"
            className="block border-t border-border pt-3 text-center text-sm font-semibold text-primary"
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
          <p className="m-0 text-sm font-semibold text-foreground">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="m-0 mt-1 truncate text-xs text-muted-foreground">
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
            className="bg-primary text-primary-foreground"
          />
          <span className="hidden text-sm font-semibold text-foreground md:block">
            {user?.firstName ?? t('nav.user')}
          </span>
          <i className="pi pi-chevron-down text-xs text-muted-foreground" />
        </span>
      </Button>
    </>
  );
}

export function Topbar({ onSidebarToggle, onMobileToggle }: TopbarProps) {
  const t = useTranslations('nav');
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-4 shadow-sm backdrop-blur-[14px] bg-card/[0.92]">
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
          <TenantContextBadge />
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            type="button"
            icon="pi pi-palette"
            severity="secondary"
            text
            rounded
            onClick={() => setThemeConfigOpen(true)}
            aria-label={t('openThemeConfigurator')}
          />
          <ThemeToggle />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </header>
      <ThemeConfigurator
        visible={themeConfigOpen}
        onHide={() => setThemeConfigOpen(false)}
      />
    </>
  );
}
