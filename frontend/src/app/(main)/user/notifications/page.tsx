'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bulkDeleteNotifications,
  getMyNotifications,
  markAllRead,
  markAsRead,
} from '@/lib/api/notifications.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAppToast } from '@/providers/prime-provider';
import type { Notification, NotifType } from '@/types';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Paginator } from 'primereact/paginator';
import { SelectButton } from 'primereact/selectbutton';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import type { CSSProperties } from 'react';

type FilterType = 'all' | 'unread';

const PAGE_SIZE = 10;

const typeConfig: Record<
  NotifType,
  {
    icon: string;
    severity: 'info' | 'success' | 'warning' | 'danger';
    style: CSSProperties;
  }
> = {
  INFO: {
    icon: 'pi pi-info-circle',
    severity: 'info',
    style: {
      backgroundColor: 'color-mix(in srgb, var(--blue-500) 16%, transparent)',
      color: 'var(--blue-500)',
    },
  },
  SUCCESS: {
    icon: 'pi pi-check-circle',
    severity: 'success',
    style: {
      backgroundColor: 'color-mix(in srgb, var(--green-500) 16%, transparent)',
      color: 'var(--green-500)',
    },
  },
  WARNING: {
    icon: 'pi pi-exclamation-triangle',
    severity: 'warning',
    style: {
      backgroundColor: 'color-mix(in srgb, var(--yellow-500) 16%, transparent)',
      color: 'var(--yellow-500)',
    },
  },
  ERROR: {
    icon: 'pi pi-times-circle',
    severity: 'danger',
    style: {
      backgroundColor: 'color-mix(in srgb, var(--red-500) 16%, transparent)',
      color: 'var(--red-500)',
    },
  },
};

function NotificationIcon({ type }: { type: NotifType }) {
  const config = typeConfig[type] ?? typeConfig.INFO;

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
      style={config.style}
    >
      <i className={config.icon} />
    </span>
  );
}

function EmptyState({ filter }: { filter: FilterType }) {
  const t = useTranslations('notifications');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-900">
        <i className="pi pi-bell text-xl" />
      </span>
      <p className="m-0 font-semibold text-slate-800 dark:text-slate-100">
        {filter === 'unread' ? t('allCaughtUp') : t('noNotifications')}
      </p>
      <p className="m-0 mt-1 text-sm text-slate-500">
        {filter === 'unread'
          ? t('emptyUnread')
          : t('emptyAll')}
      </p>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isMarkingRead,
  isDeleting,
  locale,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingRead: boolean;
  isDeleting: boolean;
  locale: string;
}) {
  const t = useTranslations('notifications');
  const isUnread = !notification.readAt;
  const dateLocale = locale === 'tr' ? tr : enUS;
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: dateLocale,
      });
    } catch {
      return notification.createdAt;
    }
  })();

  return (
    <div
      className={`flex gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 dark:border-slate-800 ${
        isUnread ? 'bg-primary/10' : ''
      }`}
    >
      <NotificationIcon type={notification.type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="m-0 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                {notification.title}
              </p>
              {isUnread && <Tag value={t('unread')} severity="info" />}
            </div>
            <p className="m-0 mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {notification.message}
            </p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-slate-400">{timeAgo}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {isUnread && (
          <Button
            type="button"
            icon="pi pi-check"
            text
            rounded
            severity="success"
            aria-label={t('markAsRead')}
            loading={isMarkingRead}
            onClick={() => onMarkRead(notification.id)}
          />
        )}
        <Button
          type="button"
          icon="pi pi-trash"
          text
          rounded
          severity="danger"
          aria-label={t('deleteNotification')}
          loading={isDeleting}
          onClick={() => onDelete(notification.id)}
        />
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const commonT = useTranslations('common');
  const locale = useLocale();
  const { toast } = useAppToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const queryKey = ['notifications', filter, page];
  const filterOptions = [
    { label: commonT('all'), value: 'all' },
    { label: t('unread'), value: 'unread' },
  ];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getMyNotifications({
        page,
        pageSize: PAGE_SIZE,
        unreadOnly: filter === 'unread',
      }),
  });

  const notifications = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: t('markedRead'), variant: 'success' });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: t('allMarkedRead'), variant: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bulkDeleteNotifications([id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: t('deleted'), variant: 'success' });
    },
  });

  return (
    <div className="p-6">
      <PageHeader
        title={t('title')}
        subtitle={
          totalCount > 0
            ? filter === 'unread'
              ? t('unreadCount', { count: totalCount })
              : t('count', { count: totalCount })
            : t('allCaughtUp')
        }
        actions={
          <Button
            type="button"
            label={t('markAllAsRead')}
            icon="pi pi-check-circle"
            severity="secondary"
            outlined
            disabled={markAllAsReadMutation.isPending || notifications.length === 0}
            loading={markAllAsReadMutation.isPending}
            onClick={() => markAllAsReadMutation.mutate()}
          />
        }
      />

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SelectButton
            value={filter}
            options={filterOptions}
            onChange={(event) => {
              if (event.value) {
                setFilter(event.value);
                setPage(1);
              }
            }}
            allowEmpty={false}
          />
          <Tag value={commonT('pageOf', { page, totalPages })} severity="info" />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} height="4.75rem" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => markAsReadMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                isMarkingRead={markAsReadMutation.isPending}
                isDeleting={deleteMutation.isPending}
                locale={locale}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Paginator
            first={(page - 1) * PAGE_SIZE}
            rows={PAGE_SIZE}
            totalRecords={totalCount}
            onPageChange={(event) => setPage(event.page + 1)}
            className="mt-4 justify-end border-0 p-0"
          />
        )}
      </Card>
    </div>
  );
}
