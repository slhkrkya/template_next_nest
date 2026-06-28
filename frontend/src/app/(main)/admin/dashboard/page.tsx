'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import { Card } from 'primereact/card';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Building2, CalendarPlus, Users, UserCheck } from 'lucide-react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/shared/StatsCard';
import { useThemeStore } from '@/store/theme.store';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
);

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  entityName: string;
  action: string;
  entityId: string;
  ipAddress: string;
  createdAt: string;
}

async function getDashboardStats() {
  const res = await fetch('/api/admin/dashboard/stats');
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json() as Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTenants: number;
    newUsersToday: number;
    dailyLogins: { date: string; count: number }[];
  }>;
}

async function getAuditLogs() {
  const res = await fetch('/api/admin/audit-logs?limit=10');
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json() as Promise<{ data: AuditLog[] }>;
}

function ActionBadge({ action }: { action: string }) {
  const severity =
    action === 'DELETE'
      ? 'danger'
      : action === 'CREATE'
        ? 'success'
        : action === 'UPDATE'
          ? 'info'
          : 'secondary';

  return <Tag value={action} severity={severity} />;
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const { resolvedTheme } = useTheme();
  const themePreference = useThemeStore((state) => state.preference);
  const [primaryChartColor, setPrimaryChartColor] = useState('238 78% 58%');
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const primary = rootStyles.getPropertyValue('--primary').trim();
    setPrimaryChartColor(primary || '238 78% 58%');
  }, [themePreference, isDark]);

  const statsQuery = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
  });

  const logsQuery = useQuery({
    queryKey: ['admin', 'audit-logs', { limit: 10 }],
    queryFn: getAuditLogs,
  });

  const stats = statsQuery.data;
  const logs = logsQuery.data?.data ?? [];

  const last30Days = Array.from({ length: 30 }, (_, index) =>
    format(subDays(new Date(), 29 - index), 'MMM d'),
  );

  const loginCounts = stats?.dailyLogins
    ? last30Days.map((label) => {
        const found = stats.dailyLogins.find(
          (day) => format(new Date(day.date), 'MMM d') === label,
        );
        return found?.count ?? 0;
      })
    : Array(30).fill(0);

  const gridColor = isDark ? 'rgba(22,55,34,0.7)' : 'rgba(100,160,120,0.15)';
  const tickColor = isDark ? '#4a7a5a' : '#6b9e7a';
  const lineColor = `hsl(${primaryChartColor})`;
  const fillColor = `hsl(${primaryChartColor} / ${isDark ? '0.20' : '0.12'})`;
  const tooltipBg = isDark ? '#0e1f12' : '#ffffff';
  const tooltipText = isDark ? '#d4f0dc' : '#0a1a0d';

  const chartData = {
    labels: last30Days,
    datasets: [
      {
        label: t('dashboard.dailyLogins'),
        data: loginCounts,
        borderColor: lineColor,
        backgroundColor: fillColor,
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: lineColor,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: isDark ? '#1a3d22' : '#d0edd8',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor, maxTicksLimit: 8, font: { size: 11 } },
        border: { color: gridColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { color: gridColor },
        beginAtZero: true,
      },
    },
  };

  const logColumns: Column<AuditLog>[] = [
    {
      header: t('nav.user'),
      key: 'userName',
      render: (_, row) => (
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">{row.userName}</p>
          <p className="m-0 mt-1 text-xs text-muted-foreground">{row.ipAddress}</p>
        </div>
      ),
    },
    { header: t('common.actions'), key: 'action', render: (_, row) => <ActionBadge action={row.action} /> },
    {
      header: t('permissions.entity'),
      key: 'entityName',
      render: (_, row) => (
        <span className="text-sm text-muted-foreground">{row.entityName}</span>
      ),
    },
    {
      header: t('dashboard.time'),
      key: 'createdAt',
      render: (_, row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(row.createdAt), 'MMM d, HH:mm')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('nav.dashboard')}
        subtitle={t('dashboard.adminSubtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <Skeleton height="5rem" />
            </Card>
          ))
        ) : (
          <>
            <StatsCard icon={Users} title={t('dashboard.totalUsers')} value={(stats?.totalUsers ?? 0).toLocaleString()} />
            <StatsCard
              icon={UserCheck}
              title={t('dashboard.activeUsers')}
              value={(stats?.activeUsers ?? 0).toLocaleString()}
              iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            />
            <StatsCard
              icon={Building2}
              title={t('dashboard.totalTenants')}
              value={(stats?.totalTenants ?? 0).toLocaleString()}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatsCard
              icon={CalendarPlus}
              title={t('dashboard.newUsersToday')}
              value={(stats?.newUsersToday ?? 0).toLocaleString()}
              description={t('dashboard.sinceMidnight', { count: stats?.newUsersToday ?? 0 })}
              iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title={t('dashboard.dailyLoginsLast30Days')}>
          <div className="h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>

        <Card title={t('dashboard.recentAuditLogs')}>
          <DataTable
            columns={logColumns}
            data={logs}
            isLoading={logsQuery.isLoading}
            emptyMessage={t('dashboard.noAuditLogs')}
          />
        </Card>
      </div>
    </div>
  );
}
