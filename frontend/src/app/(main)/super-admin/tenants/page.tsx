'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  CheckCircle,
  PauseCircle,
  Trash2,
  Pencil,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAppToast } from '@/providers/prime-provider';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import {
  getTenants,
  createTenant,
  updateTenant,
  updateTenantStatus,
  deleteTenant,
} from '@/lib/api/tenants.api';
import type { Tenant, TenantStatus } from '@/types';
import { TenantForm, type TenantFormValues } from './components/TenantForm';

type DialogMode = 'create' | 'edit' | null;

interface ConfirmState {
  open: boolean;
  action: 'activate' | 'suspend' | 'delete' | null;
  tenant: Tenant | null;
}

const STATUS_ACTION_MAP: Record<string, TenantStatus> = {
  activate: 'ACTIVE',
  suspend: 'SUSPENDED',
  delete: 'DELETED',
};

export default function TenantsPage() {
  const { toast } = useAppToast();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    action: null,
    tenant: null,
  });

  const PAGE_SIZE = 10;

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTenants({ page, pageSize: PAGE_SIZE, search });
      setTenants(result.data);
      setTotalCount(result.totalCount);
    } catch {
      toast({ title: 'Failed to load tenants', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // ── Create ────────────────────────────────────────────────────────────────

  async function handleCreate(values: TenantFormValues) {
    setIsMutating(true);
    try {
      await createTenant({
        name: values.name,
        slug: values.slug,
        maxUsers: values.maxUsers,
        trialEndsAt: values.trialEndsAt || undefined,
      });
      toast({ title: 'Tenant created successfully' });
      setDialogMode(null);
      fetchTenants();
    } catch {
      toast({ title: 'Failed to create tenant', variant: 'destructive' });
    } finally {
      setIsMutating(false);
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  async function handleEdit(values: TenantFormValues) {
    if (!editingTenant) return;
    setIsMutating(true);
    try {
      await updateTenant(editingTenant.id, {
        name: values.name,
        maxUsers: values.maxUsers,
        trialEndsAt: values.trialEndsAt || undefined,
      });
      // Also update status if changed
      if (values.status !== editingTenant.status) {
        await updateTenantStatus(editingTenant.id, values.status);
      }
      toast({ title: 'Tenant updated successfully' });
      setDialogMode(null);
      setEditingTenant(null);
      fetchTenants();
    } catch {
      toast({ title: 'Failed to update tenant', variant: 'destructive' });
    } finally {
      setIsMutating(false);
    }
  }

  // ── Status / Delete confirm ───────────────────────────────────────────────

  function openConfirm(action: ConfirmState['action'], tenant: Tenant) {
    setConfirm({ open: true, action, tenant });
  }

  async function handleConfirm() {
    const { action, tenant } = confirm;
    if (!action || !tenant) return;

    setIsMutating(true);
    try {
      if (action === 'delete') {
        await deleteTenant(tenant.id);
        toast({ title: 'Tenant deleted' });
      } else {
        await updateTenantStatus(tenant.id, STATUS_ACTION_MAP[action]);
        toast({
          title: `Tenant ${action === 'activate' ? 'activated' : 'suspended'}`,
        });
      }
      fetchTenants();
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setIsMutating(false);
      setConfirm({ open: false, action: null, tenant: null });
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<Tenant>[] = [
    {
      header: 'Name',
      key: 'name',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.slug}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Trial Ends',
      key: 'trialEndsAt',
      render: (_, row) =>
        row.trialEndsAt ? (
          <span className="tabular-nums text-sm">
            {format(new Date(row.trialEndsAt), 'dd MMM yyyy')}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      header: 'Users',
      key: 'maxUsers',
      render: (_, row) => (
        <span className="tabular-nums text-sm">
          — / {row.maxUsers.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Created',
      key: 'createdAt',
      render: (_, row) => (
        <span className="tabular-nums text-sm text-muted-foreground">
          {format(new Date(row.createdAt), 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'id',
      className: 'w-56',
      render: (_, row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            icon={<Pencil className="h-4 w-4" />}
            severity="secondary"
            text
            rounded
            aria-label="Edit"
            onClick={() => {
              setEditingTenant(row);
              setDialogMode('edit');
            }}
          />
          {row.status !== 'ACTIVE' && (
            <Button
              type="button"
              icon={<CheckCircle className="h-4 w-4" />}
              severity="success"
              text
              rounded
              aria-label="Activate"
              onClick={() => openConfirm('activate', row)}
            />
          )}
          {row.status !== 'SUSPENDED' && row.status !== 'DELETED' && (
            <Button
              type="button"
              icon={<PauseCircle className="h-4 w-4" />}
              severity="warning"
              text
              rounded
              aria-label="Suspend"
              onClick={() => openConfirm('suspend', row)}
            />
          )}
          <Button
            type="button"
            icon={<Trash2 className="h-4 w-4" />}
            severity="danger"
            text
            rounded
            aria-label="Delete"
            onClick={() => openConfirm('delete', row)}
          />
        </div>
      ),
    },
  ];

  // ── Confirm dialog labels ─────────────────────────────────────────────────

  const confirmConfig = {
    activate: {
      title: 'Activate Tenant',
      description: `Activate "${confirm.tenant?.name}"? They will regain full access to the platform.`,
      label: 'Activate',
      variant: 'default' as const,
    },
    suspend: {
      title: 'Suspend Tenant',
      description: `Suspend "${confirm.tenant?.name}"? Their users will be unable to log in until reactivated.`,
      label: 'Suspend',
      variant: 'default' as const,
    },
    delete: {
      title: 'Delete Tenant',
      description: `Permanently delete "${confirm.tenant?.name}"? This action cannot be undone.`,
      label: 'Delete',
      variant: 'destructive' as const,
    },
  };

  const currentConfirm = confirm.action ? confirmConfig[confirm.action] : null;

  return (
    <div>
      <PageHeader
        title="Tenants"
        subtitle="Manage all tenant organisations on this platform."
        actions={
          <Button type="button" onClick={() => setDialogMode('create')}>
            <Plus className="mr-2 h-4 w-4" />
            New Tenant
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={tenants}
        isLoading={isLoading}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search tenants…"
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          totalCount,
          onPageChange: setPage,
        }}
        emptyMessage="No tenants found."
      />

      {/* Create / Edit Dialog */}
      <Dialog
        visible={dialogMode !== null}
        onHide={() => {
            setDialogMode(null);
            setEditingTenant(null);
        }}
        header={dialogMode === 'create' ? 'Create Tenant' : 'Edit Tenant'}
        modal
        className="w-[92vw] max-w-lg"
      >
          {dialogMode === 'create' && (
            <TenantForm
              mode="create"
              onSubmit={handleCreate}
              onCancel={() => setDialogMode(null)}
              isLoading={isMutating}
            />
          )}
          {dialogMode === 'edit' && editingTenant && (
            <TenantForm
              mode="edit"
              defaultValues={{
                name: editingTenant.name,
                slug: editingTenant.slug,
                maxUsers: editingTenant.maxUsers,
                trialEndsAt: editingTenant.trialEndsAt ?? '',
                status: editingTenant.status,
              }}
              onSubmit={handleEdit}
              onCancel={() => {
                setDialogMode(null);
                setEditingTenant(null);
              }}
              isLoading={isMutating}
            />
          )}
      </Dialog>

      {/* Confirm Dialog */}
      {currentConfirm && (
        <ConfirmDialog
          open={confirm.open}
          title={currentConfirm.title}
          description={currentConfirm.description}
          confirmLabel={currentConfirm.label}
          variant={currentConfirm.variant}
          isLoading={isMutating}
          onConfirm={handleConfirm}
          onCancel={() =>
            setConfirm({ open: false, action: null, tenant: null })
          }
        />
      )}
    </div>
  );
}
