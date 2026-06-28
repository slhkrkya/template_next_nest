'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { classNames } from 'primereact/utils';
import { useAppToast } from '@/providers/prime-provider';
import { useNotificationStore } from '@/store/notification.store';
import { getMyNotifications, markAllRead } from '@/lib/api/notifications.api';
import type { Notification, NotifType } from '@/types';

const TYPE_DOT: Record<NotifType, string> = {
  INFO: 'var(--blue-500)',
  SUCCESS: 'var(--green-500)',
  WARNING: 'var(--yellow-500)',
  ERROR: 'var(--red-500)',
};

function NotifRow({ notif, locale }: { notif: Notification; locale: string }) {
  const dotColor = TYPE_DOT[notif.type as NotifType] ?? 'var(--surface-400)';
  const dateLocale = locale === 'tr' ? tr : enUS;

  return (
    <div
      className={classNames(
        'flex gap-3 rounded-md px-3 py-3 transition-colors hover:bg-accent',
        !notif.isRead && 'bg-primary/10',
      )}
    >
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-sm font-semibold text-foreground">{notif.title}</p>
        <p className="m-0 mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {notif.message}
        </p>
        <p className="m-0 mt-1 text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(notif.createdAt), {
            addSuffix: true,
            locale: dateLocale,
          })}
        </p>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const panelRef = useRef<OverlayPanel>(null);
  const { toast } = useAppToast();
  const { unreadCount, notifications, setUnreadCount, setNotifications } =
    useNotificationStore();
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const fetchRecent = useCallback(async () => {
    try {
      const result = await getMyNotifications({ pageSize: 5 });
      setNotifications(result.data);
      setUnreadCount(result.data.filter((notification) => !notification.isRead).length);
    } catch {
      // Notification preview is non-critical.
    }
  }, [setNotifications, setUnreadCount]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  async function handleMarkAllRead() {
    setIsMarkingRead(true);
    try {
      await markAllRead();
      setNotifications(notifications.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
      toast({ title: t('allMarkedRead'), variant: 'success' });
    } catch {
      toast({ title: t('failedMarkRead'), variant: 'destructive' });
    } finally {
      setIsMarkingRead(false);
    }
  }

  const badgeCount = Math.min(unreadCount, 99);

  return (
    <>
      <Button
        type="button"
        icon="pi pi-bell"
        severity="secondary"
        text
        rounded
        className="relative"
        aria-label={
          unreadCount > 0
            ? `${t('title')}, ${t('unreadCount', { count: unreadCount })}`
            : t('title')
        }
        onClick={(event) => {
          fetchRecent();
          panelRef.current?.toggle(event);
        }}
      >
        {badgeCount > 0 && (
          <Badge
            value={badgeCount > 99 ? '99+' : badgeCount}
            severity="danger"
            className="absolute -right-1 -top-1"
          />
        )}
      </Button>
      <OverlayPanel ref={panelRef} className="w-80">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-semibold text-foreground">{t('title')}</span>
          {unreadCount > 0 && (
            <Button
              type="button"
              label={t('markAllRead')}
              icon="pi pi-check"
              size="small"
              text
              loading={isMarkingRead}
              onClick={handleMarkAllRead}
            />
          )}
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t('noNotifications')}
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <NotifRow key={notification.id} notif={notification} locale={locale} />
            ))
          )}
        </div>
        <Link
          href="/user/notifications"
          className="block border-t border-border pt-3 text-center text-sm font-semibold text-primary"
          onClick={() => panelRef.current?.hide()}
        >
          {t('viewAll')}
        </Link>
      </OverlayPanel>
    </>
  );
}
