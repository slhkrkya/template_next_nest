'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { FilterBar, FilterField, getPrimeOverlayAppendTo } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  targetUserId: string | null;
  targetUserName: string | null;
  isBroadcast: boolean;
  createdAt: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const createNotifSchema = (t: (key: any, params?: any) => string) => z
  .object({
    title: z.string().min(1, t('validation.fieldRequired', { field: t('notifications.titleField') })),
    message: z.string().min(1, t('validation.fieldRequired', { field: t('notifications.messageField') })),
    type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
    target: z.enum(['broadcast', 'user']),
    targetUserId: z.string().optional(),
  })
  .refine((data) => data.target === 'broadcast' || !!data.targetUserId, {
    message: t('notifications.selectTargetUser'),
    path: ['targetUserId'],
  });

type NotifFormData = z.infer<ReturnType<typeof createNotifSchema>>;

async function getAdminNotifications(): Promise<Notification[]> {
  const res = await axiosInstance.get<{ data: Notification[] } | Notification[]>('/notifications/my');
  return Array.isArray(res.data) ? res.data : (res.data as { data: Notification[] }).data;
}

async function markRead(id: string): Promise<void> {
  await axiosInstance.patch(`/notifications/${id}/read`);
}

async function markAllRead(): Promise<void> {
  await axiosInstance.patch('/notifications/read-all');
}

async function deleteNotif(id: string): Promise<void> {
  await axiosInstance.delete('/notifications/bulk', { data: { ids: [id] } });
}

async function createNotification(data: {
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  targetUserId?: string;
  isBroadcast: boolean;
}): Promise<void> {
  await axiosInstance.post('/notifications', data);
}

async function getUsers(): Promise<UserOption[]> {
  const res = await axiosInstance.get<{ data: UserOption[] }>('/users', { params: { limit: 200 } });
  return res.data.data ?? [];
}

function typeSeverity(type: Notification['type']) {
  if (type === 'SUCCESS') return 'success' as const;
  if (type === 'WARNING') return 'warning' as const;
  if (type === 'ERROR') return 'danger' as const;
  return 'info' as const;
}

export default function AdminNotificationsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifQuery = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: getAdminNotifications,
    refetchInterval: 15_000,
  });
  const usersQuery = useQuery({ queryKey: ['notif-users'], queryFn: getUsers });
  const notifSchema = createNotifSchema(t);
  const typeOptions = [
    { label: t('notifications.info'), value: 'INFO' },
    { label: t('notifications.success'), value: 'SUCCESS' },
    { label: t('notifications.warning'), value: 'WARNING' },
    { label: t('notifications.error'), value: 'ERROR' },
  ];
  const targetOptions = [
    { label: t('notifications.broadcast'), value: 'broadcast' },
    { label: t('notifications.specificUser'), value: 'user' },
  ];

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });
  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteNotif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });
  const createMutation = useMutation({
    mutationFn: (data: NotifFormData) =>
      createNotification({
        title: data.title,
        message: data.message,
        type: data.type,
        isBroadcast: data.target === 'broadcast',
        targetUserId: data.target === 'user' ? data.targetUserId : undefined,
      }),
    onSuccess: () => {
      setCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NotifFormData>({
    resolver: zodResolver(notifSchema),
    defaultValues: { title: '', message: '', type: 'INFO', target: 'broadcast' },
  });

  const allNotifs = notifQuery.data ?? [];
  const target = watch('target');
  const type = watch('type');
  const targetUserId = watch('targetUserId');
  const unreadCount = allNotifs.filter((notification) => !notification.isRead).length;
  const displayed = filter === 'unread' ? allNotifs.filter((notification) => !notification.isRead) : allNotifs;
  const userOptions = (usersQuery.data ?? []).map((user) => ({
    label: `${user.firstName} ${user.lastName} - ${user.email}`,
    value: user.id,
  }));

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.adminSubtitle')}
        actions={
          <Button
            type="button"
            label={t('notifications.createNotification')}
            icon="pi pi-plus"
            onClick={() => {
              setCreateOpen(true);
              reset();
            }}
          />
        }
      />

      <FilterBar
        actions={
          <Button
            type="button"
            label={t('notifications.markAllRead')}
            icon="pi pi-check"
            severity="secondary"
            outlined
            disabled={unreadCount === 0}
            loading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          />
        }
      >
        <FilterField label={t('common.status')}>
          <SelectButton
            value={filter}
            options={[
              { label: t('common.all'), value: 'all' },
              { label: `${t('notifications.unread')} (${unreadCount})`, value: 'unread' },
            ]}
            onChange={(event) => event.value && setFilter(event.value)}
            allowEmpty={false}
            className="w-full"
          />
        </FilterField>
      </FilterBar>

      <div className="flex flex-col gap-3">
        {notifQuery.isLoading ? (
          <Card><div className="py-8 text-center text-sm text-muted-foreground">{t('notifications.loadingNotifications')}</div></Card>
        ) : displayed.length === 0 ? (
          <Card><div className="py-12 text-center text-sm text-muted-foreground">{filter === 'unread' ? t('notifications.noUnread') : t('notifications.noNotificationsYet')}</div></Card>
        ) : (
          displayed.map((notification) => (
            <Card key={notification.id} className={notification.isRead ? '' : 'border-l-4 border-l-primary'}>
              <div className="flex items-start gap-4">
                <Tag value={notification.type} severity={typeSeverity(notification.type)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="m-0 text-base font-semibold text-foreground">{notification.title}</h2>
                    {notification.isBroadcast && <Tag value={t('notifications.broadcast')} severity="info" />}
                    {notification.targetUserName && <Tag value={t('notifications.toUser', { user: notification.targetUserName })} severity="warning" />}
                    {!notification.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="m-0 mt-2 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                  <p className="m-0 mt-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    {' - '}
                    {format(new Date(notification.createdAt), 'MMM d, HH:mm')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notification.isRead && (
                    <Button
                      type="button"
                      icon="pi pi-check"
                      severity="success"
                      text
                      rounded
                      aria-label={t('notifications.markAsRead')}
                      onClick={() => markReadMutation.mutate(notification.id)}
                    />
                  )}
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    aria-label={t('common.delete')}
                    onClick={() => deleteMutation.mutate(notification.id)}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        visible={createOpen}
        onHide={() => setCreateOpen(false)}
        header={t('notifications.createNotification')}
        modal
        className="w-[92vw] max-w-xl"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">{t('notifications.target')} <span className="text-rose-600">*</span></label>
            <SelectButton
              value={target}
              options={targetOptions}
              onChange={(event) => event.value && setValue('target', event.value)}
              allowEmpty={false}
            />
          </div>
          {target === 'user' && (
            <div>
              <label htmlFor="targetUserId" className="mb-2 block text-sm font-semibold text-foreground">{t('notifications.targetUser')} <span className="text-rose-600">*</span></label>
              <Dropdown
                inputId="targetUserId"
                value={targetUserId}
                options={userOptions}
                onChange={(event) => setValue('targetUserId', event.value)}
                placeholder={t('notifications.selectUser')}
                filter
                className="w-full"
                loading={usersQuery.isLoading}
                showClear
                appendTo={getPrimeOverlayAppendTo()}
              />
              {errors.targetUserId && <small className="mt-1 block text-rose-600">{errors.targetUserId.message}</small>}
            </div>
          )}
          <div>
            <label htmlFor="type" className="mb-2 block text-sm font-semibold text-foreground">{t('notifications.type')} <span className="text-rose-600">*</span></label>
            <Dropdown
              inputId="type"
              value={type}
              options={typeOptions}
              onChange={(event) => setValue('type', event.value)}
              className="w-full"
              appendTo={getPrimeOverlayAppendTo()}
            />
          </div>
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-foreground">{t('notifications.titleField')} <span className="text-rose-600">*</span></label>
            <InputText id="title" {...register('title')} invalid={!!errors.title} className="w-full" placeholder={t('notifications.titlePlaceholder')} />
            {errors.title && <small className="mt-1 block text-rose-600">{errors.title.message}</small>}
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-semibold text-foreground">{t('notifications.messageField')} <span className="text-rose-600">*</span></label>
            <InputTextarea id="message" {...register('message')} invalid={!!errors.message} className="w-full" rows={4} autoResize placeholder={t('notifications.messagePlaceholder')} />
            {errors.message && <small className="mt-1 block text-rose-600">{errors.message.message}</small>}
          </div>
          {createMutation.isError && <Message severity="error" text={(createMutation.error as Error).message} />}
          <div className="flex justify-end gap-2">
            <Button type="button" label={t('common.cancel')} severity="secondary" outlined onClick={() => setCreateOpen(false)} />
            <Button type="submit" label={t('notifications.sendNotification')} icon="pi pi-send" loading={createMutation.isPending} />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
