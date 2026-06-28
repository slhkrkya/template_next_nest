'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';

interface OperationClaim {
  id: string;
  name: string;
  description: string;
  priority: number;
  userCount: number;
}

interface ClaimUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const createRoleSchema = (t: (key: any, params?: any) => string) => z.object({
  name: z.string().min(1, t('validation.fieldRequired', { field: t('roles.name') })),
  description: z.string(),
  priority: z.coerce.number().int().min(0),
});

type RoleFormData = z.infer<ReturnType<typeof createRoleSchema>>;

async function getRoles(): Promise<OperationClaim[]> {
  const res = await fetch('/api/admin/operation-claims');
  if (!res.ok) throw new Error('Failed to fetch roles');
  return res.json();
}

async function getRoleUsers(roleId: string): Promise<ClaimUser[]> {
  const res = await fetch(`/api/admin/operation-claims/${roleId}/users`);
  if (!res.ok) throw new Error('Failed to fetch role users');
  return res.json();
}

async function createRole(data: RoleFormData) {
  const res = await fetch('/api/admin/operation-claims', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create role');
  return res.json();
}

async function updateRole(id: string, data: RoleFormData) {
  const res = await fetch(`/api/admin/operation-claims/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update role');
  return res.json();
}

async function deleteRole(id: string) {
  const res = await fetch(`/api/admin/operation-claims/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete role');
}

function RoleForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  defaultValues?: RoleFormData;
  onSubmit: (data: RoleFormData) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}) {
  const t = useTranslations();
  const roleSchema = createRoleSchema(t);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: defaultValues ?? { name: '', description: '', priority: 0 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="role-name" className="mb-2 block text-sm font-semibold text-foreground">{t('roles.roleName')}</label>
        <InputText id="role-name" {...register('name')} invalid={!!errors.name} className="w-full" placeholder="BILLING_MANAGER" />
        {errors.name && <small className="mt-1 block text-rose-600">{errors.name.message}</small>}
      </div>
      <div>
        <label htmlFor="role-description" className="mb-2 block text-sm font-semibold text-foreground">{t('roles.description')}</label>
        <InputText id="role-description" {...register('description')} className="w-full" placeholder={t('roles.descriptionPlaceholder')} />
      </div>
      <div>
        <label htmlFor="role-priority" className="mb-2 block text-sm font-semibold text-foreground">{t('roles.priority')}</label>
        <InputNumber
          inputId="role-priority"
          value={watch('priority')}
          onValueChange={(event) => setValue('priority', event.value ?? 0)}
          min={0}
          className="w-full"
          inputClassName="w-full"
        />
      </div>
      {error && <Message severity="error" text={error} />}
      <div className="flex justify-end gap-2">
        <Button type="button" label={t('common.cancel')} severity="secondary" outlined onClick={onCancel} />
        <Button type="submit" label={t('roles.saveRole')} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}

export default function RolesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<OperationClaim | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OperationClaim | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OperationClaim | null>(null);

  const rolesQuery = useQuery({ queryKey: ['admin', 'roles'], queryFn: getRoles });
  const usersQuery = useQuery({
    queryKey: ['admin', 'role-users', selectedRole?.id],
    queryFn: () => getRoleUsers(selectedRole!.id),
    enabled: !!selectedRole,
  });

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RoleFormData) => updateRole(editTarget!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRole(deleteTarget!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      if (selectedRole?.id === deleteTarget?.id) setSelectedRole(null);
      setDeleteTarget(null);
    },
  });

  const roles = rolesQuery.data ?? [];
  const roleUsers = usersQuery.data ?? [];

  const columns: Column<OperationClaim>[] = [
    { header: t('roles.name'), key: 'name', render: (_, role) => <span className="font-mono text-sm font-semibold">{role.name}</span> },
    { header: t('roles.description'), key: 'description', render: (_, role) => <span className="text-sm text-muted-foreground">{role.description}</span> },
    { header: t('roles.priority'), key: 'priority', render: (_, role) => <Tag value={role.priority} severity="info" /> },
    { header: t('users.title'), key: 'userCount', render: (_, role) => <span className="tabular-nums text-muted-foreground">{role.userCount.toLocaleString()}</span> },
    {
      header: t('common.actions'),
      key: 'id',
      className: 'w-36',
      render: (_, role) => (
        <div className="flex gap-2">
          <Button type="button" icon="pi pi-users" severity="info" text rounded aria-label={t('roles.showUsers')} onClick={() => setSelectedRole(role)} />
          <Button type="button" icon="pi pi-pencil" severity="secondary" text rounded aria-label={t('roles.editRoleAria')} onClick={() => setEditTarget(role)} />
          <Button type="button" icon="pi pi-trash" severity="danger" text rounded aria-label={t('roles.deleteRoleAria')} onClick={() => setDeleteTarget(role)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('roles.title')}
        subtitle={t('roles.subtitle')}
        actions={<Button type="button" label={t('roles.newRole')} icon="pi pi-plus" onClick={() => setCreateOpen(true)} />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <DataTable columns={columns} data={roles} isLoading={rolesQuery.isLoading} emptyMessage={t('roles.noRolesFound')} />

        <Card title={selectedRole ? t('roles.usersWithRole', { role: selectedRole.name }) : t('users.title')}>
          {!selectedRole ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{t('roles.selectRoleMembers')}</div>
          ) : usersQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('roles.loadingUsers')}</div>
          ) : roleUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{t('roles.noUsersWithRole')}</div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {roleUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-3">
                  <Avatar label={`${user.firstName[0]}${user.lastName[0]}`} shape="circle" className="bg-primary/10 text-primary" />
                  <div>
                    <p className="m-0 text-sm font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="m-0 mt-1 text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog visible={createOpen} onHide={() => setCreateOpen(false)} header={t('roles.newRole')} modal className="w-[92vw] max-w-lg">
        <RoleForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setCreateOpen(false)}
          loading={createMutation.isPending}
          error={createMutation.error ? (createMutation.error as Error).message : undefined}
        />
      </Dialog>

      <Dialog visible={!!editTarget} onHide={() => setEditTarget(null)} header={t('roles.editRole')} modal className="w-[92vw] max-w-lg">
        {editTarget && (
          <RoleForm
            defaultValues={{ name: editTarget.name, description: editTarget.description, priority: editTarget.priority }}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => setEditTarget(null)}
            loading={updateMutation.isPending}
            error={updateMutation.error ? (updateMutation.error as Error).message : undefined}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('roles.deleteRole')}
        description={t('roles.deleteConfirm', { role: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
