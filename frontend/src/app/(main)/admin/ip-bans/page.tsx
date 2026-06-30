'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isPast } from 'date-fns';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { getPrimeOverlayAppendTo } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { PermissionGuard } from '@/components/shared/PermissionGuard';

interface IpBan {
  id: string;
  ipAddress: string;
  reason: string;
  bannedAt: string;
  expiresAt: string | null;
  bannedBy: string;
}

const createBanSchema = (t: (key: any, params?: any) => string) => z.object({
  ipAddress: z
    .string()
    .min(1, t('ipRequired'))
    .regex(
      /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^([0-9a-fA-F:]+)(\/\d{1,3})?$/,
      t('ipValidation'),
    ),
  reason: z.string().min(1, t('reasonRequired')),
  expiresAt: z.string().optional(),
});

type BanFormData = z.infer<ReturnType<typeof createBanSchema>>;

async function getIpBans(): Promise<IpBan[]> {
  const res = await axiosInstance.get<{ data: IpBan[] } | IpBan[]>('/ip-bans');
  return Array.isArray(res.data) ? res.data : (res.data as { data: IpBan[] }).data;
}

async function createIpBan(data: BanFormData): Promise<IpBan> {
  const res = await axiosInstance.post<IpBan>('/ip-bans/ban', {
    ip: data.ipAddress,
    reason: data.reason,
    expiresAt: data.expiresAt || undefined,
  });
  return res.data;
}

async function unbanIp(ipAddress: string): Promise<void> {
  await axiosInstance.delete(`/ip-bans/unban/${encodeURIComponent(ipAddress)}`);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600">{message}</small>;
}

export default function IpBansPage() {
  const t = useTranslations('ipBans');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [unbanTarget, setUnbanTarget] = useState<IpBan | null>(null);
  const bansQuery = useQuery({ queryKey: ['ip-bans'], queryFn: getIpBans });

  const addMutation = useMutation({
    mutationFn: createIpBan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-bans'] });
      setAddOpen(false);
      reset();
    },
  });

  const unbanMutation = useMutation({
    mutationFn: () => unbanIp(unbanTarget!.ipAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-bans'] });
      setUnbanTarget(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BanFormData>({
    resolver: zodResolver(createBanSchema(t)),
    defaultValues: { ipAddress: '', reason: '', expiresAt: '' },
  });

  const expiresAt = watch('expiresAt');
  const bans = bansQuery.data ?? [];

  function isExpired(ban: IpBan): boolean {
    return !!ban.expiresAt && isPast(new Date(ban.expiresAt));
  }

  const columns: Column<IpBan>[] = [
    { header: t('ipAddress'), key: 'ipAddress', render: (_, ban) => <span className="font-mono font-semibold">{ban.ipAddress}</span> },
    { header: t('reason'), key: 'reason', render: (_, ban) => <span className="line-clamp-2 text-sm text-muted-foreground">{ban.reason}</span> },
    {
      header: t('bannedAt'),
      key: 'bannedAt',
      render: (_, ban) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(ban.bannedAt), 'MMM d, yyyy HH:mm')}
        </span>
      ),
    },
    {
      header: t('expires'),
      key: 'expiresAt',
      render: (_, ban) =>
        ban.expiresAt === null ? (
          <Tag value={t('permanent')} severity="danger" />
        ) : isExpired(ban) ? (
          <Tag value={t('expired')} severity="secondary" />
        ) : (
          <Tag value={format(new Date(ban.expiresAt), 'MMM d, yyyy')} severity="warning" />
        ),
    },
    { header: t('bannedBy'), key: 'bannedBy', render: (_, ban) => <span className="text-sm text-muted-foreground">{ban.bannedBy}</span> },
    {
      header: commonT('actions'),
      key: 'id',
      render: (_, ban) => (
        <PermissionGuard entity="IpBans" action="delete">
          <Button
            type="button"
            label={t('unban')}
            icon="pi pi-unlock"
            severity="danger"
            outlined
            size="small"
            onClick={() => setUnbanTarget(ban)}
          />
        </PermissionGuard>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <PermissionGuard entity="IpBans" action="create">
            <Button type="button" label={t('addBan')} icon="pi pi-plus" onClick={() => setAddOpen(true)} />
          </PermissionGuard>
        }
      />

      <DataTable
        columns={columns}
        data={bans}
        isLoading={bansQuery.isLoading}
        minWidth="56rem"
        emptyMessage={t('empty')}
      />

      <Dialog
        visible={addOpen}
        onHide={() => setAddOpen(false)}
        header={t('addIpBan')}
        modal
        className="w-[92vw] max-w-lg"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => addMutation.mutate(data))}>
          <div>
            <label htmlFor="ipAddress" className="mb-2 block text-sm font-semibold text-foreground">{t('ipAddress')} <span className="text-rose-600">*</span></label>
            <InputText id="ipAddress" {...register('ipAddress')} invalid={!!errors.ipAddress} className="w-full" placeholder={t('ipPlaceholder')} />
            <small className="mt-1 block text-muted-foreground">{t('ipHelp')}</small>
            <FieldError message={errors.ipAddress?.message} />
          </div>
          <div>
            <label htmlFor="reason" className="mb-2 block text-sm font-semibold text-foreground">{t('reason')} <span className="text-rose-600">*</span></label>
            <InputText id="reason" {...register('reason')} invalid={!!errors.reason} className="w-full" placeholder={t('reasonPlaceholder')} />
            <FieldError message={errors.reason?.message} />
          </div>
          <div>
            <label htmlFor="expiresAt" className="mb-2 block text-sm font-semibold text-foreground">{t('expiresAt')}</label>
            <Calendar
              inputId="expiresAt"
              value={expiresAt ? new Date(expiresAt) : null}
              onChange={(event) => {
                const value = event.value instanceof Date ? event.value.toISOString() : '';
                setValue('expiresAt', value);
              }}
              showTime
              hourFormat="24"
              showIcon
              showButtonBar
              appendTo={getPrimeOverlayAppendTo()}
              className="w-full"
            />
            <small className="mt-1 block text-muted-foreground">{t('expiresHelp')}</small>
          </div>
          {addMutation.isError && <Message severity="error" text={(addMutation.error as Error).message} />}
          <div className="flex justify-end gap-2">
            <Button type="button" label={commonT('cancel')} severity="secondary" outlined onClick={() => setAddOpen(false)} />
            <Button type="submit" label={t('addBan')} icon="pi pi-lock" loading={addMutation.isPending} />
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!unbanTarget}
        title={t('removeIpBan')}
        description={t('removeConfirm', { ip: unbanTarget?.ipAddress ?? '' })}
        confirmLabel={t('removeBan')}
        variant="destructive"
        onConfirm={() => unbanMutation.mutate()}
        onCancel={() => setUnbanTarget(null)}
        isLoading={unbanMutation.isPending}
      />
    </div>
  );
}
