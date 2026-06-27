'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAppToast } from '@/providers/prime-provider';
import {
  createNotification,
  getMyNotifications,
} from '@/lib/api/notifications.api';
import type { CreateNotificationRequest, Notification, NotifType } from '@/types';

const PAGE_SIZE = 15;

function TypeBadge({ type }: { type: NotifType }) {
  const t = useTranslations('notifications');
  const labels: Record<NotifType, string> = {
    INFO: t('info'),
    SUCCESS: t('success'),
    WARNING: t('warning'),
    ERROR: t('error'),
  };
  const severity =
    type === 'SUCCESS'
      ? 'success'
      : type === 'WARNING'
        ? 'warning'
        : type === 'ERROR'
          ? 'danger'
          : 'info';

  return <Tag value={labels[type] ?? type} severity={severity} />;
}

function CreateNotifForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: CreateNotificationRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const t = useTranslations('notifications');
  const commonT = useTranslations('common');
  const typeOptions: Array<{ label: string; value: NotifType }> = [
    { label: t('info'), value: 'INFO' },
    { label: t('success'), value: 'SUCCESS' },
    { label: t('warning'), value: 'WARNING' },
    { label: t('error'), value: 'ERROR' },
  ];
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotifType>('INFO');
  const [userId, setUserId] = useState('');
  const [link, setLink] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      title,
      message,
      type,
      userId: userId || undefined,
      link: link || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Message
        severity="info"
        text={t('systemWideHint')}
      />
      <div>
        <label htmlFor="notif-title" className="mb-2 block text-sm font-semibold text-slate-700">
          {t('titleField')} <span className="text-rose-600">*</span>
        </label>
        <InputText
          id="notif-title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('scheduledMaintenancePlaceholder')}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="notif-message" className="mb-2 block text-sm font-semibold text-slate-700">
          {t('messageField')} <span className="text-rose-600">*</span>
        </label>
        <InputTextarea
          id="notif-message"
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t('maintenanceBodyPlaceholder')}
          rows={4}
          autoResize
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="notif-type" className="mb-2 block text-sm font-semibold text-slate-700">
            {t('type')}
          </label>
          <Dropdown
            inputId="notif-type"
            value={type}
            options={typeOptions}
            onChange={(event) => setType(event.value)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="notif-user" className="mb-2 block text-sm font-semibold text-slate-700">
            {t('userId')}
          </label>
          <InputText
            id="notif-user"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder={t('optionalUserUuid')}
            className="w-full"
          />
        </div>
      </div>
      <div>
        <label htmlFor="notif-link" className="mb-2 block text-sm font-semibold text-slate-700">
          {t('link')}
        </label>
        <InputText
          id="notif-link"
          type="url"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="https://example.com"
          className="w-full"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          label={commonT('cancel')}
          severity="secondary"
          outlined
          onClick={onCancel}
          disabled={isLoading}
        />
        <Button
          type="submit"
          label={t('sendNotification')}
          icon="pi pi-bell"
          loading={isLoading}
        />
      </div>
    </form>
  );
}

export default function NotificationsAdminPage() {
  const t = useTranslations('notifications');
  const commonT = useTranslations('common');
  const { toast } = useAppToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMyNotifications({ page, pageSize: PAGE_SIZE });
      setNotifications(result.data);
      setTotalCount(result.totalCount);
    } catch {
      toast({ title: t('loadFailed'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, t, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleCreate(data: CreateNotificationRequest) {
    setIsMutating(true);
    try {
      await createNotification(data);
      toast({ title: t('sentSuccessfully'), variant: 'success' });
      setDialogOpen(false);
      fetchNotifications();
    } catch {
      toast({ title: t('sendFailed'), variant: 'destructive' });
    } finally {
      setIsMutating(false);
    }
  }

  const columns: Column<Notification>[] = [
    {
      header: t('type'),
      key: 'type',
      className: 'w-28',
      render: (_, row) => <TypeBadge type={row.type as NotifType} />,
    },
    {
      header: t('titleField'),
      key: 'title',
      render: (_, row) => (
        <div>
          <span className={row.isRead ? 'text-sm font-medium' : 'text-sm font-semibold'}>
            {row.title}
          </span>
          <p className="m-0 mt-1 line-clamp-1 text-xs text-slate-500">{row.message}</p>
        </div>
      ),
    },
    {
      header: commonT('status'),
      key: 'isRead',
      className: 'w-24',
      render: (_, row) => (
        <Tag value={row.isRead ? t('read') : t('unreadStatus')} severity={row.isRead ? 'secondary' : 'info'} />
      ),
    },
    {
      header: t('sent'),
      key: 'createdAt',
      className: 'w-40',
      render: (_, row) => (
        <span className="text-xs tabular-nums text-slate-500">
          {format(new Date(row.createdAt), 'dd MMM yyyy HH:mm')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={t('superAdminSubtitle')}
        actions={
          <Button
            type="button"
            label={t('newNotification')}
            icon="pi pi-plus"
            onClick={() => setDialogOpen(true)}
          />
        }
      />

      <DataTable
        columns={columns}
        data={notifications}
        isLoading={isLoading}
        searchPlaceholder={t('searchNotifications')}
        pagination={{ page, pageSize: PAGE_SIZE, totalCount, onPageChange: setPage }}
        emptyMessage={t('noNotificationsFound')}
      />

      <Dialog
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        header={t('sendNotification')}
        modal
        className="w-[92vw] max-w-lg"
      >
        <CreateNotifForm
          onSubmit={handleCreate}
          onCancel={() => setDialogOpen(false)}
          isLoading={isMutating}
        />
      </Dialog>
    </div>
  );
}
