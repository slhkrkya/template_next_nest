'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('tenants');
  const commonT = useTranslations('common');
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
      toast({ title: t('loadFailed'), variant: 'destructive' });
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
        name: values.name.trim(),
        slug: values.slug.trim(),
        maxUsers: values.maxUsers,
        trialEndsAt: values.trialEndsAt || undefined,
        adminFirstName: values.adminFirstName.trim(),
        adminLastName: values.adminLastName.trim(),
        adminEmail: values.adminEmail.trim().toLowerCase(),
        adminPassword: values.adminPassword,
      });
      toast({ title: t('createdSuccessfully') });
      setDialogMode(null);
      fetchTenants();
    } catch {
      toast({ title: t('createFailed'), variant: 'destructive' });
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
      if (values.status !== editingTenant.status) {
        await updateTenantStatus(editingTenant.id, values.status);
      }
      toast({ title: t('updatedSuccessfully') });
      setDialogMode(null);
      setEditingTenant(null);
      fetchTenants();
    } catch {
      toast({ title: t('updateFailed'), variant: 'destructive' });
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
        toast({ title: t('deleted') });
      } else {
        await updateTenantStatus(tenant.id, STATUS_ACTION_MAP[action]);
        toast({
          title: action === 'activate' ? t('activated') : t('suspended'),
        });
      }
      fetchTenants();
    } catch {
      toast({ title: commonT('actionFailed'), variant: 'destructive' });
    } finally {
      setIsMutating(false);
      setConfirm({ open: false, action: null, tenant: null });
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<Tenant>[] = [
    {
      header: commonT('name'),
      key: 'name',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.slug}</span>
        </div>
      ),
    },
    {
      header: commonT('status'),
      key: 'status',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      header: t('trialEnds'),
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
      header: t('users'),
      key: 'maxUsers',
      render: (_, row) => (
        <span className="tabular-nums text-sm">
          — / {row.maxUsers.toLocaleString()}
        </span>
      ),
    },
    {
      header: commonT('created'),
      key: 'createdAt',
      render: (_, row) => (
        <span className="tabular-nums text-sm text-muted-foreground">
          {format(new Date(row.createdAt), 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      header: commonT('actions'),
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
            aria-label={commonT('edit')}
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
              aria-label={commonT('activate')}
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
              aria-label={commonT('suspend')}
              onClick={() => openConfirm('suspend', row)}
            />
          )}
          <Button
            type="button"
            icon={<Trash2 className="h-4 w-4" />}
            severity="danger"
            text
            rounded
            aria-label={commonT('delete')}
            onClick={() => openConfirm('delete', row)}
          />
        </div>
      ),
    },
  ];

  // ── Confirm dialog labels ─────────────────────────────────────────────────

  const confirmConfig = {
    activate: {
      title: t('activateTenant'),
      description: t('activateConfirm', { name: confirm.tenant?.name ?? '' }),
      label: commonT('activate'),
      variant: 'default' as const,
    },
    suspend: {
      title: t('suspendTenant'),
      description: t('suspendConfirm', { name: confirm.tenant?.name ?? '' }),
      label: commonT('suspend'),
      variant: 'default' as const,
    },
    delete: {
      title: t('deleteTenant'),
      description: t('deleteConfirm', { name: confirm.tenant?.name ?? '' }),
      label: commonT('delete'),
      variant: 'destructive' as const,
    },
  };

  const currentConfirm = confirm.action ? confirmConfig[confirm.action] : null;

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={t('superAdminSubtitle')}
        actions={
          <Button type="button" onClick={() => setDialogMode('create')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newTenant')}
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
        searchPlaceholder={t('search')}
        minWidth="60rem"
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          totalCount,
          onPageChange: setPage,
        }}
        emptyMessage={t('noTenantsFound')}
      />

      {/* Create / Edit Dialog */}
      <Dialog
        visible={dialogMode !== null}
        onHide={() => {
            setDialogMode(null);
            setEditingTenant(null);
        }}
        header={dialogMode === 'create' ? t('createTenant') : t('editTenant')}
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
