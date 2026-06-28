'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { DataTable, type Column } from '@/components/shared/DataTable';
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

const scopeOptions: Array<{ label: string; value: ScopeType }> = [
  { label: 'Self', value: 'SELF' },
  { label: 'Department', value: 'DEPARTMENT' },
  { label: 'All', value: 'ALL' },
];

async function getUsers(): Promise<UserOption[]> {
  const res = await fetch('/api/admin/users?pageSize=200');
  if (!res.ok) throw new Error('Failed');
  const data = await res.json();
  return data.data ?? [];
}

async function getUserDataScopes(userId: string): Promise<DataScope[]> {
  const res = await fetch(`/api/admin/data-scopes/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch data scopes');
  return res.json();
}

async function getEntities(): Promise<Entity[]> {
  const res = await fetch('/api/admin/entities');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

async function updateDataScope(userId: string, entityName: string, scopeType: ScopeType): Promise<DataScope> {
  const res = await fetch(`/api/admin/data-scopes/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityName, scopeType }),
  });
  if (!res.ok) throw new Error('Failed to update scope');
  return res.json();
}

async function addDataScope(userId: string, entityName: string, scopeType: ScopeType): Promise<DataScope> {
  const res = await fetch(`/api/admin/data-scopes/users/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityName, scopeType }),
  });
  if (!res.ok) throw new Error('Failed to add scope');
  return res.json();
}

function ScopeTag({ value }: { value: ScopeType }) {
  const severity = value === 'ALL' ? 'danger' : value === 'DEPARTMENT' ? 'warning' : 'info';
  return <Tag value={scopeOptions.find((option) => option.value === value)?.label ?? value} severity={severity} />;
}

export default function DataScopesPage() {
  const queryClient = useQueryClient();
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
      updateDataScope(selectedUserId, entityName, scopeType),
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
    mutationFn: () => addDataScope(selectedUserId, addEntityName, addScopeType),
    onSuccess: () => {
      setAddEntityName('');
      setAddScopeType('SELF');
      queryClient.invalidateQueries({ queryKey: ['data-scopes', selectedUserId] });
    },
  });

  const scopes = scopesQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const entities = entitiesQuery.data ?? [];
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const entitiesWithoutScope = entities
    .filter((entity) => !scopes.some((scope) => scope.entityName === entity.name))
    .map((entity) => ({ label: entity.name, value: entity.name }));

  const userOptions = users.map((user) => ({
    label: `${user.firstName} ${user.lastName} (${user.email})`,
    value: user.id,
  }));

  const columns: Column<DataScope>[] = [
    { header: 'Entity', key: 'entityName', render: (_, scope) => <span className="font-mono text-sm">{scope.entityName}</span> },
    { header: 'Current Scope', key: 'scopeType', render: (_, scope) => <ScopeTag value={scope.scopeType} /> },
    {
      header: 'Change To',
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
      header: 'Save',
      key: 'save',
      className: 'w-28',
      render: (_, scope) => (
        <Button
          type="button"
          label="Save"
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
        title="Data Scopes"
        subtitle="Control which data records each user can view and modify per entity type."
      />

      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-72 flex-1">
            <label htmlFor="user-select" className="mb-2 block text-sm font-semibold text-foreground">Select User</label>
            <Dropdown
              inputId="user-select"
              value={selectedUserId}
              options={userOptions}
              onChange={(event) => setSelectedUserId(event.value)}
              placeholder="Choose a user"
              filter
              className="w-full"
              loading={usersQuery.isLoading}
            />
          </div>
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
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-64">
              <label htmlFor="entity-select" className="mb-2 block text-sm font-semibold text-foreground">Add Entity</label>
              <Dropdown
                inputId="entity-select"
                value={addEntityName}
                options={entitiesWithoutScope}
                onChange={(event) => setAddEntityName(event.value)}
                placeholder="Select entity"
                filter
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Scope</label>
              <SelectButton value={addScopeType} options={scopeOptions} onChange={(event) => event.value && setAddScopeType(event.value)} allowEmpty={false} />
            </div>
            <Button
              type="button"
              label="Add Scope"
              icon="pi pi-plus"
              disabled={!addEntityName}
              loading={addMutation.isPending}
              onClick={() => addMutation.mutate()}
            />
          </div>

          <DataTable
            columns={columns}
            data={scopes}
            isLoading={scopesQuery.isLoading}
            emptyMessage="No data scopes configured for this user."
          />
        </Card>
      ) : (
        <Card>
          <div className="py-12 text-center text-sm text-muted-foreground">
            Select a user above to configure their data scopes.
          </div>
        </Card>
      )}
    </div>
  );
}
