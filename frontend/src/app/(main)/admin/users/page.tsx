'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { format } from 'date-fns';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterField, getPrimeOverlayAppendTo } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import UserForm from './components/UserForm';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
}

async function getUsers(params: {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<UsersResponse> {
  const res = await axiosInstance.get<UsersResponse>('/users', {
    params: {
      page: params.page,
      limit: params.pageSize,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status === 'active' ? { isActive: 'true' } : params.status === 'inactive' ? { isActive: 'false' } : {}),
    },
  });
  return res.data;
}

async function deleteUser(id: string) {
  await axiosInstance.delete(`/users/${id}`);
}

async function toggleUserStatus(id: string) {
  const res = await axiosInstance.patch(`/users/${id}/toggle-active`);
  return res.data;
}

function StatusBadge({ active }: { active: boolean }) {
  const t = useTranslations('status');
  return <Tag value={active ? t('ACTIVE') : t('INACTIVE')} severity={active ? 'success' : 'secondary'} />;
}

function RoleBadge({ role }: { role: string }) {
  const severity = role === 'ADMIN' ? 'danger' : role === 'MODERATOR' ? 'warning' : 'info';
  return <Tag value={role} severity={severity} />;
}

export default function UsersPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const pageSize = 10;
  const roleOptions = [
    { label: t('users.allRoles'), value: '' },
    { label: t('nav.admin'), value: 'ADMIN' },
    { label: t('users.moderator'), value: 'MODERATOR' },
    { label: t('nav.user'), value: 'USER' },
  ];
  const statusOptions = [
    { label: t('users.allStatuses'), value: '' },
    { label: t('status.ACTIVE'), value: 'active' },
    { label: t('status.INACTIVE'), value: 'inactive' },
  ];

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', { page, search, role: roleFilter, status: statusFilter }],
    queryFn: () => getUsers({ page, pageSize, search, role: roleFilter, status: statusFilter }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(deleteTarget!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeleteTarget(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => toggleUserStatus(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const users = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.total ?? 0;

  const columns: Column<User>[] = [
    {
      header: t('nav.user'),
      key: 'firstName',
      render: (_, user) => (
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">
            {user.firstName} {user.lastName}
          </p>
          <p className="m-0 mt-1 text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    { header: t('roles.title'), key: 'role', render: (_, user) => <RoleBadge role={user.role} /> },
    { header: t('common.status'), key: 'isActive', render: (_, user) => <StatusBadge active={user.isActive} /> },
    {
      header: t('users.created'),
      key: 'createdAt',
      render: (_, user) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(user.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: t('common.active'),
      key: 'activeToggle',
      render: (_, user) => (
        <InputSwitch
          checked={user.isActive}
          onChange={() => toggleMutation.mutate({ id: user.id })}
        />
      ),
    },
    {
      header: t('common.actions'),
      key: 'id',
      className: 'w-32',
      render: (_, user) => (
        <div className="flex gap-2">
          <Button
            type="button"
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            aria-label={t('users.editUserAria')}
            onClick={() => setEditUser(user)}
          />
          <Button
            type="button"
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            aria-label={t('users.deleteUserAria')}
            onClick={() => setDeleteTarget(user)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={
          <Button type="button" label={t('users.newUser')} icon="pi pi-plus" onClick={() => setCreateOpen(true)} />
        }
      />

      <FilterBar>
        <FilterField label={t('common.search')}>
          <span className="p-input-icon-left block w-full">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder={t('users.searchByNameOrEmail')}
              className="w-full"
            />
          </span>
        </FilterField>
        <FilterField label={t('roles.title')} htmlFor="users-role-filter">
          <Dropdown
            inputId="users-role-filter"
            value={roleFilter}
            options={roleOptions}
            onChange={(event) => {
              setRoleFilter(event.value ?? '');
              setPage(1);
            }}
            placeholder={t('users.allRoles')}
            className="w-full"
            showClear
            appendTo={getPrimeOverlayAppendTo()}
          />
        </FilterField>
        <FilterField label={t('common.status')} htmlFor="users-status-filter">
          <Dropdown
            inputId="users-status-filter"
            value={statusFilter}
            options={statusOptions}
            onChange={(event) => {
              setStatusFilter(event.value ?? '');
              setPage(1);
            }}
            placeholder={t('users.allStatuses')}
            className="w-full"
            showClear
            appendTo={getPrimeOverlayAppendTo()}
          />
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        data={users}
        isLoading={usersQuery.isLoading}
        minWidth="52rem"
        pagination={{ page, pageSize, totalCount: total, onPageChange: setPage }}
        emptyMessage={t('users.noUsersFound')}
      />

      <Dialog
        visible={createOpen}
        onHide={() => setCreateOpen(false)}
        header={t('users.createUser')}
        modal
        className="w-[92vw] max-w-xl"
      >
        <UserForm
          mode="create"
          onSuccess={() => {
            setCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Dialog>

      <Dialog
        visible={!!editUser}
        onHide={() => setEditUser(null)}
        header={t('users.editUser')}
        modal
        className="w-[92vw] max-w-xl"
      >
        {editUser && (
          <UserForm
            mode="edit"
            user={editUser}
            onSuccess={() => {
              setEditUser(null);
              queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            }}
            onCancel={() => setEditUser(null)}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('users.deleteUser')}
        description={t('users.deleteConfirmNamed', {
          name: `${deleteTarget?.firstName ?? ''} ${deleteTarget?.lastName ?? ''}`.trim(),
        })}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
