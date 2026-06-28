'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterField, getPrimeOverlayAppendTo } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';

type ScopeType = 'SELF' | 'DEPARTMENT' | 'ALL';

interface DataScope {
  id: string;
  entityName: string;
  scopeType: ScopeType;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Entity {
  id: string;
  name: string;
}

async function getUsers(): Promise<UserOption[]> {
  const res = await axiosInstance.get<{ data: UserOption[] }>('/users', { params: { limit: 200 } });
  return res.data.data ?? [];
}

async function getUserDataScopes(userId: string): Promise<DataScope[]> {
  const res = await axiosInstance.get<DataScope[]>(`/data-scopes/${userId}`);
  return res.data;
}

async function getEntities(): Promise<Entity[]> {
  const res = await axiosInstance.get<{ name: string }[]>('/permissions/entities');
  return res.data.map((e) => ({ id: e.name, name: e.name }));
}

async function upsertDataScope(userId: string, tenantId: string, entityName: string, scopeType: ScopeType): Promise<DataScope> {
  const res = await axiosInstance.post<DataScope>('/data-scopes', { userId, tenantId, entityName, scopeType });
  return res.data;
}

function ScopeTag({ value }: { value: ScopeType }) {
  const t = useTranslations('dataScopes');
  const severity = value === 'ALL' ? 'danger' : value === 'DEPARTMENT' ? 'warning' : 'info';
  const label = {
    SELF: t('scope.SELF'),
    DEPARTMENT: t('scope.DEPARTMENT'),
    ALL: t('scope.ALL'),
  }[value];

  return <Tag value={label} severity={severity} />;
}

export default function DataScopesPage() {
  const t = useTranslations('dataScopes');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();
  const currentTenantId = useAuthStore((s) => s.user?.tenantId ?? '');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addEntityName, setAddEntityName] = useState('');
  const [addScopeType, setAddScopeType] = useState<ScopeType>('SELF');
  const [pendingChanges, setPendingChanges] = useState<Record<string, ScopeType>>({});

  const usersQuery = useQuery({ queryKey: ['ds-users'], queryFn: getUsers });
  const entitiesQuery = useQuery({ queryKey: ['ds-entities'], queryFn: getEntities });
  const scopesQuery = useQuery({
    queryKey: ['data-scopes', selectedUserId],
    queryFn: () => getUserDataScopes(selectedUserId),
    enabled: !!selectedUserId,
  });

  useEffect(() => {
    setPendingChanges({});
  }, [selectedUserId]);

  const updateMutation = useMutation({
    mutationFn: ({ entityName, scopeType }: { entityName: string; scopeType: ScopeType }) =>
      upsertDataScope(selectedUserId, currentTenantId, entityName, scopeType),
    onSuccess: (_, vars) => {
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[vars.entityName];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['data-scopes', selectedUserId] });
    },
  });

  const addMutation = useMutation({
    mutationFn: () => upsertDataScope(selectedUserId, currentTenantId, addEntityName, addScopeType),
    onSuccess: () => {
      setAddEntityName('');
      setAddScopeType('SELF');
      queryClient.invalidateQueries({ queryKey: ['data-scopes', selectedUserId] });
    },
  });

  const scopes = scopesQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const entities = entitiesQuery.data ?? [];
  const scopeOptions: Array<{ label: string; value: ScopeType }> = [
    { label: t('scope.SELF'), value: 'SELF' },
    { label: t('scope.DEPARTMENT'), value: 'DEPARTMENT' },
    { label: t('scope.ALL'), value: 'ALL' },
  ];
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const entitiesWithoutScope = entities
    .filter((entity) => !scopes.some((scope) => scope.entityName === entity.name))
    .map((entity) => ({ label: entity.name, value: entity.name }));

  const userOptions = users.map((user) => ({
    label: `${user.firstName} ${user.lastName} (${user.email})`,
    value: user.id,
  }));

  const columns: Column<DataScope>[] = [
    { header: t('entity'), key: 'entityName', render: (_, scope) => <span className="font-mono text-sm">{scope.entityName}</span> },
    { header: t('currentScope'), key: 'scopeType', render: (_, scope) => <ScopeTag value={scope.scopeType} /> },
    {
      header: t('changeTo'),
      key: 'changeTo',
      render: (_, scope) => (
        <SelectButton
          value={pendingChanges[scope.entityName] ?? scope.scopeType}
          options={scopeOptions}
          onChange={(event) => event.value && setPendingChanges((prev) => ({ ...prev, [scope.entityName]: event.value }))}
          allowEmpty={false}
        />
      ),
    },
    {
      header: commonT('save'),
      key: 'save',
      className: 'w-28',
      render: (_, scope) => (
        <Button
          type="button"
          label={commonT('save')}
          size="small"
          disabled={!pendingChanges[scope.entityName]}
          loading={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ entityName: scope.entityName, scopeType: pendingChanges[scope.entityName] })}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <Card className="mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <FilterBar className="flex-1 !mb-0 !shadow-none">
            <FilterField label={t('selectUser')} htmlFor="user-select">
              <Dropdown
                inputId="user-select"
                value={selectedUserId}
                options={userOptions}
                onChange={(event) => setSelectedUserId(event.value ?? '')}
                placeholder={t('chooseUser')}
                filter
                className="w-full"
                loading={usersQuery.isLoading}
                showClear
                appendTo={getPrimeOverlayAppendTo()}
              />
            </FilterField>
          </FilterBar>
          {selectedUser && (
            <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
              <Avatar label={`${selectedUser.firstName[0]}${selectedUser.lastName[0]}`} shape="circle" className="bg-primary text-primary-foreground" />
              <div>
                <p className="m-0 text-sm font-semibold text-foreground">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="m-0 mt-1 text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {selectedUserId ? (
        <Card>
          <FilterBar
            actions={
              <Button
                type="button"
                label={t('addScope')}
                icon="pi pi-plus"
                disabled={!addEntityName}
                loading={addMutation.isPending}
                onClick={() => addMutation.mutate()}
              />
            }
          >
            <FilterField label={t('addEntity')} htmlFor="entity-select">
              <Dropdown
                inputId="entity-select"
                value={addEntityName}
                options={entitiesWithoutScope}
                onChange={(event) => setAddEntityName(event.value ?? '')}
                placeholder={t('selectEntity')}
                filter
                className="w-full"
                showClear
                appendTo={getPrimeOverlayAppendTo()}
              />
            </FilterField>
            <FilterField label={t('scopeLabel')}>
              <SelectButton
                value={addScopeType}
                options={scopeOptions}
                onChange={(event) => event.value && setAddScopeType(event.value)}
                allowEmpty={false}
                className="w-full"
              />
            </FilterField>
          </FilterBar>

          <DataTable
            columns={columns}
            data={scopes}
            isLoading={scopesQuery.isLoading}
            minWidth="44rem"
            emptyMessage={t('emptyForUser')}
          />
        </Card>
      ) : (
        <Card>
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t('selectUserHelp')}
          </div>
        </Card>
      )}
    </div>
  );
}
