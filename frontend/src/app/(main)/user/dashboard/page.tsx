'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bell, CheckCircle2, FolderKanban, Users } from 'lucide-react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/shared/StatsCard';
import { useAuth } from '@/hooks/useAuth';

const notificationSeverity = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'danger',
} as const;

export default function UserDashboardPage() {
  const t = useTranslations('dashboard');
  const commonT = useTranslations('common');
  const { user } = useAuth();
  const firstName = user?.firstName ?? '';

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  })();
  const stats = [
    {
      title: t('activeProjects'),
      value: '12',
      description: t('plusThisMonth', { count: 2 }),
      icon: FolderKanban,
      iconClassName: 'bg-indigo-100 text-indigo-700',
      trend: { direction: 'up' as const, value: 18.2, label: t('thisMonth') },
    },
    {
      title: t('tasksCompleted'),
      value: '84',
      description: t('plusThisWeek', { count: 11 }),
      icon: CheckCircle2,
      iconClassName: 'bg-emerald-100 text-emerald-700',
      trend: { direction: 'up' as const, value: 14.7, label: t('thisWeek') },
    },
    {
      title: t('teamMembers'),
      value: '7',
      description: t('noChange'),
      icon: Users,
      iconClassName: 'bg-sky-100 text-sky-700',
      trend: { direction: 'neutral' as const, value: 0, label: t('stable') },
    },
    {
      title: t('unreadNotifications'),
      value: '3',
      description: t('requiresAttention'),
      icon: Bell,
      iconClassName: 'bg-amber-100 text-amber-700',
      trend: { direction: 'down' as const, value: 6.1, label: t('needsReview') },
    },
  ];
  const notifications = [
    {
      id: 1,
      type: 'info',
      title: t('sampleNewMemberTitle'),
      message: t('sampleNewMemberMessage'),
      time: t('timeFiveMinutes'),
      read: false,
    },
    {
      id: 2,
      type: 'success',
      title: t('sampleProjectTitle'),
      message: t('sampleProjectMessage'),
      time: t('timeTwoHours'),
      read: false,
    },
    {
      id: 3,
      type: 'warning',
      title: t('sampleSubscriptionTitle'),
      message: t('sampleSubscriptionMessage'),
      time: t('timeYesterday'),
      read: true,
    },
    {
      id: 4,
      type: 'info',
      title: t('sampleExportTitle'),
      message: t('sampleExportMessage'),
      time: t('timeTwoDays'),
      read: true,
    },
  ];
  const quickActions = [
    { label: t('newProject'), href: '/user/projects/new', icon: 'pi pi-plus' },
    { label: t('inviteMember'), href: '/user/team/invite', icon: 'pi pi-user-plus' },
    { label: t('viewReports'), href: '/user/reports', icon: 'pi pi-chart-line' },
    { label: t('accountSettings'), href: '/user/profile', icon: 'pi pi-cog' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle={t('subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-semibold text-slate-950 dark:text-slate-50">
                {t('recentNotifications')}
              </h2>
              <p className="m-0 mt-1 text-sm text-slate-500">
                {t('recentNotificationsSubtitle')}
              </p>
            </div>
            <Link href="/user/notifications">
              <Button type="button" label={commonT('viewAll')} icon="pi pi-arrow-right" iconPos="right" text />
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 dark:border-slate-800 ${
                  !notification.read ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                }`}
              >
                <Tag
                  value={notification.type}
                  severity={notificationSeverity[notification.type as keyof typeof notificationSeverity]}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="m-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">{notification.time}</span>
                  </div>
                  <p className="m-0 mt-1 truncate text-sm text-slate-500">
                    {notification.message}
                  </p>
                </div>
                {!notification.read && <i className="pi pi-circle-fill mt-2 text-xs text-indigo-500" />}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="m-0 text-lg font-semibold text-slate-950 dark:text-slate-50">
              {t('quickActions')}
            </h2>
            <p className="m-0 mt-1 text-sm text-slate-500">
              {t('quickActionsSubtitle')}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button
                  type="button"
                  label={action.label}
                  icon={action.icon}
                  severity="secondary"
                  outlined
                  className="w-full justify-start"
                />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
