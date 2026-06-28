'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { usePermissionStore } from '@/store/permission.store';
import { logout as logoutApi } from '@/lib/api/auth.api';
import {
  LayoutDashboard,
  User,
  Bell,
  Users,
  Shield,
  Key,
  ClipboardList,
  Mail,
  Ban,
  Gauge,
  Database,
  Building2,
  Workflow,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Globe,
  Building,
  CreditCard,
  ScrollText,
  ArrowLeftRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
  permission?: {
    entity: string;
    action: 'read';
  };
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

const userNavItems: NavItem[] = [
  { labelKey: 'profile', href: '/user/profile', icon: User },
  { labelKey: 'notifications', href: '/user/notifications', icon: Bell },
];

const adminNavItems: NavItem[] = [
  { labelKey: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { labelKey: 'users', href: '/admin/users', icon: Users, permission: { entity: 'Users', action: 'read' } },
  { labelKey: 'roles', href: '/admin/roles', icon: Shield, permission: { entity: 'Roles', action: 'read' } },
  { labelKey: 'permissions', href: '/admin/permissions', icon: Key, permission: { entity: 'Permissions', action: 'read' } },
  { labelKey: 'auditLogs', href: '/admin/audit-logs', icon: ClipboardList, permission: { entity: 'AuditLogs', action: 'read' } },
  { labelKey: 'emailParameters', href: '/admin/email-parameters', icon: Mail, permission: { entity: 'EmailParameters', action: 'read' } },
  { labelKey: 'ipBans', href: '/admin/ip-bans', icon: Ban, permission: { entity: 'IpBans', action: 'read' } },
  { labelKey: 'rateLimits', href: '/admin/rate-limit-violations', icon: Gauge, permission: { entity: 'RateLimits', action: 'read' } },
  { labelKey: 'dataScopes', href: '/admin/data-scopes', icon: Database, permission: { entity: 'DataScopes', action: 'read' } },
  { labelKey: 'companyProfile', href: '/admin/company-profile', icon: Building2, permission: { entity: 'Tenants', action: 'read' } },
  { labelKey: 'notifications', href: '/admin/notifications', icon: Bell, permission: { entity: 'Notifications', action: 'read' } },
  { labelKey: 'workflowDemo', href: '/admin/workflow-demo', icon: Workflow, permission: { entity: 'EntityWorkflows', action: 'read' } },
];

const superAdminNavItems: NavItem[] = [
  { labelKey: 'tenants', href: '/super-admin/tenants', icon: Globe, permission: { entity: 'Tenants', action: 'read' } },
  { labelKey: 'subscriptionPlans', href: '/super-admin/subscription-plans', icon: CreditCard, permission: { entity: 'SubscriptionPlans', action: 'read' } },
  { labelKey: 'systemLogs', href: '/super-admin/system-logs', icon: ScrollText, permission: { entity: 'AuditLogs', action: 'read' } },
  { labelKey: 'notifications', href: '/super-admin/notifications', icon: Bell, permission: { entity: 'Notifications', action: 'read' } },
  { labelKey: 'switchTenant', href: '/super-admin/tenant-select', icon: ArrowLeftRight, permission: { entity: 'Tenants', action: 'read' } },
];

function isAdminRole(role?: string): boolean {
  return (role ?? '').trim().toLowerCase() === 'admin';
}

function NavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const t = useTranslations('nav');
  const Icon = item.icon;
  const label = t(item.labelKey);

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? label : undefined}
    >
      {active && !collapsed && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-sidebar-primary" />}
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function NavGroup({
  group,
  collapsed,
  pathname,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
}) {
  const t = useTranslations('nav');
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-sidebar-foreground/40">
          {t(group.titleKey)}
        </p>
      )}
      {collapsed && (
        <div className="my-1 mx-2 h-px bg-sidebar-border" />
      )}
      <nav className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { hasPermission } = usePermissionStore();
  const isSuperAdmin = user?.isSuperAdmin ?? false;
  const isAdmin = isAdminRole(user?.role);

  async function logout() {
    try { await logoutApi(); } catch { /* ignore */ }
    clearAuth();
    router.push('/login');
  }

  const inTenantMode = isSuperAdmin && !!(user?.tenantId);
  const inGlobalMode = isSuperAdmin && !user?.tenantId;

  const canAccessItem = (item: NavItem) => {
    if (!item.permission) return true;
    if (isSuperAdmin) return true;
    return hasPermission(item.permission.entity, item.permission.action);
  };

  // Global mode shows SuperAdmin; tenant mode shows Admin for the selected tenant.
  const showAdminSection = inTenantMode || isAdmin;
  const showSuperAdminSection = inGlobalMode;

  const filteredAdminItems = showAdminSection ? adminNavItems.filter(canAccessItem) : [];
  const filteredSuperAdminItems = showSuperAdminSection ? superAdminNavItems : [];

  const groups: NavGroup[] = [
    // User section is visible for regular users and SuperAdmin tenant mode.
    ...(!isAdmin && !inGlobalMode ? [{ titleKey: 'user', items: userNavItems }] : []),
    ...(filteredAdminItems.length > 0 ? [{ titleKey: 'admin', items: filteredAdminItems }] : []),
    ...(filteredSuperAdminItems.length > 0 ? [{ titleKey: 'superAdmin', items: filteredSuperAdminItems }] : []),
  ];

  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      {/* Logo / App name */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border px-4',
          collapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-ring/20">
          <Building className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight">{t('auth.brand')}</span>
            <span className="block truncate text-xs text-sidebar-foreground/45">{t('nav.operationsSuite')}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide">
        {groups.map((group) => (
          <NavGroup
            key={group.titleKey}
            group={group}
            collapsed={collapsed}
            pathname={pathname}
          />
        ))}
      </div>

      {/* Footer: collapse toggle + logout */}
      <div className="shrink-0 space-y-1 border-t border-sidebar-border p-2">
        <button
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>{t('nav.collapse')}</span>
            </>
          )}
        </button>

        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-rose-500/15 hover:text-rose-100',
            collapsed && 'justify-center px-2'
          )}
          aria-label={t('auth.logout')}
          title={collapsed ? t('auth.logout') : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>
    </div>
  );
}
