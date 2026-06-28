'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { PageHeader } from '@/components/shared/PageHeader';

interface IpBan {
  id: string;
  ipAddress: string;
  reason: string;
  bannedAt: string;
  expiresAt: string | null;
  bannedBy: string;
}

const banSchema = z.object({
  ipAddress: z
    .string()
    .min(1, 'IP address is required')
    .regex(
      /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^([0-9a-fA-F:]+)(\/\d{1,3})?$/,
      'Enter a valid IPv4 or IPv6 address (CIDR notation supported)',
    ),
  reason: z.string().min(1, 'Reason is required'),
  expiresAt: z.string().optional(),
});

type BanFormData = z.infer<typeof banSchema>;

async function getIpBans(): Promise<IpBan[]> {
  const res = await fetch('/api/admin/ip-bans');
  if (!res.ok) throw new Error('Failed to fetch IP bans');
  return res.json();
}

async function createIpBan(data: BanFormData): Promise<IpBan> {
  const res = await fetch('/api/admin/ip-bans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, expiresAt: data.expiresAt || null }),
  });
  if (!res.ok) throw new Error('Failed to create IP ban');
  return res.json();
}

async function unbanIp(id: string): Promise<void> {
  const res = await fetch(`/api/admin/ip-bans/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove IP ban');
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600">{message}</small>;
}

export default function IpBansPage() {
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
    mutationFn: () => unbanIp(unbanTarget!.id),
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
    resolver: zodResolver(banSchema),
    defaultValues: { ipAddress: '', reason: '', expiresAt: '' },
  });

  const expiresAt = watch('expiresAt');
  const bans = bansQuery.data ?? [];

  function isExpired(ban: IpBan): boolean {
    return !!ban.expiresAt && isPast(new Date(ban.expiresAt));
  }

  const columns: Column<IpBan>[] = [
    { header: 'IP Address', key: 'ipAddress', render: (_, ban) => <span className="font-mono font-semibold">{ban.ipAddress}</span> },
    { header: 'Reason', key: 'reason', render: (_, ban) => <span className="line-clamp-2 text-sm text-muted-foreground">{ban.reason}</span> },
    {
      header: 'Banned At',
      key: 'bannedAt',
      render: (_, ban) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(ban.bannedAt), 'MMM d, yyyy HH:mm')}
        </span>
      ),
    },
    {
      header: 'Expires',
      key: 'expiresAt',
      render: (_, ban) =>
        ban.expiresAt === null ? (
          <Tag value="Permanent" severity="danger" />
        ) : isExpired(ban) ? (
          <Tag value="Expired" severity="secondary" />
        ) : (
          <Tag value={format(new Date(ban.expiresAt), 'MMM d, yyyy')} severity="warning" />
        ),
    },
    { header: 'Banned By', key: 'bannedBy', render: (_, ban) => <span className="text-sm text-muted-foreground">{ban.bannedBy}</span> },
    {
      header: 'Action',
      key: 'id',
      render: (_, ban) => (
        <Button
          type="button"
          label="Unban"
          icon="pi pi-unlock"
          severity="danger"
          outlined
          size="small"
          onClick={() => setUnbanTarget(ban)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="IP Bans"
        subtitle="Block specific IP addresses or ranges from accessing the platform."
        actions={<Button type="button" label="Add Ban" icon="pi pi-plus" onClick={() => setAddOpen(true)} />}
      />

      <DataTable
        columns={columns}
        data={bans}
        isLoading={bansQuery.isLoading}
        emptyMessage="No IP bans configured. The platform is accessible to all IPs."
      />

      <Dialog
        visible={addOpen}
        onHide={() => setAddOpen(false)}
        header="Add IP Ban"
        modal
        className="w-[92vw] max-w-lg"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => addMutation.mutate(data))}>
          <div>
            <label htmlFor="ipAddress" className="mb-2 block text-sm font-semibold text-foreground">IP Address</label>
            <InputText id="ipAddress" {...register('ipAddress')} invalid={!!errors.ipAddress} className="w-full" placeholder="192.168.1.100 or 10.0.0.0/8" />
            <small className="mt-1 block text-muted-foreground">IPv4 or IPv6. CIDR notation supported for ranges.</small>
            <FieldError message={errors.ipAddress?.message} />
          </div>
          <div>
            <label htmlFor="reason" className="mb-2 block text-sm font-semibold text-foreground">Reason</label>
            <InputText id="reason" {...register('reason')} invalid={!!errors.reason} className="w-full" placeholder="Describe why this IP is being banned" />
            <FieldError message={errors.reason?.message} />
          </div>
          <div>
            <label htmlFor="expiresAt" className="mb-2 block text-sm font-semibold text-foreground">Expires At</label>
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
              className="w-full"
            />
            <small className="mt-1 block text-muted-foreground">Leave blank for a permanent ban.</small>
          </div>
          {addMutation.isError && <Message severity="error" text={(addMutation.error as Error).message} />}
          <div className="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" outlined onClick={() => setAddOpen(false)} />
            <Button type="submit" label="Add Ban" icon="pi pi-lock" loading={addMutation.isPending} />
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!unbanTarget}
        title="Remove IP Ban"
        description={`Allow ${unbanTarget?.ipAddress} access again? This cannot be undone automatically.`}
        confirmLabel="Remove Ban"
        variant="destructive"
        onConfirm={() => unbanMutation.mutate()}
        onCancel={() => setUnbanTarget(null)}
        isLoading={unbanMutation.isPending}
      />
    </div>
  );
}
