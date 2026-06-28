'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Skeleton } from 'primereact/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppToast } from '@/providers/prime-provider';
import { useAuthStore } from '@/store/auth.store';
import { getTenants } from '@/lib/api/tenants.api';
import { switchTenant } from '@/lib/api/auth.api';
import type { Tenant } from '@/types';

export default function TenantSelectPage() {
  const router = useRouter();
  const { toast } = useAppToast();
  const { user, updateUser } = useAuthStore();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filtered, setFiltered] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const activeTenantId = user?.tenantId ?? null;

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTenants({ pageSize: 200 });
      setTenants(result.data);
      setFiltered(result.data);
    } catch {
      toast({ title: 'Failed to load tenants', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      tenants.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(q) ||
          tenant.slug.toLowerCase().includes(q),
      ),
    );
  }, [search, tenants]);

  async function handleSwitch(tenant: Tenant | null) {
    const id = tenant?.id ?? null;
    setSwitching(id ?? '__global__');
    try {
      await switchTenant(id);
      updateUser({
        tenantId: id ?? undefined,
        tenantName: tenant?.name ?? undefined,
      });
      toast({
        title: tenant
          ? `Switched to ${tenant.name}`
          : 'Switched to global context',
        variant: 'success',
      });
      router.push(id ? '/admin/dashboard' : '/super-admin/tenants');
    } catch {
      toast({ title: 'Failed to switch tenant', variant: 'destructive' });
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Switch Tenant Context"
        subtitle="Select a tenant to manage, or return to the global super-admin view."
      />

      <button
        type="button"
        onClick={() => handleSwitch(null)}
        disabled={switching !== null}
        className={
          activeTenantId === null
            ? 'mb-6 flex w-full items-center gap-4 rounded-xl border-2 border-primary bg-primary/10 px-5 py-4 text-left'
            : 'mb-6 flex w-full items-center gap-4 rounded-xl border-2 border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary/40'
        }
      >
        <Avatar icon="pi pi-globe" shape="circle" size="large" className="bg-primary text-primary-foreground" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold text-slate-950 dark:text-slate-50">All Tenants (Global View)</p>
          <p className="m-0 mt-1 text-xs text-slate-500">
            Manage all tenants without a specific context.
          </p>
        </div>
        {activeTenantId === null && <i className="pi pi-check-circle text-xl text-primary" />}
        {switching === '__global__' && <i className="pi pi-spin pi-spinner text-primary" />}
      </button>

      <span className="p-input-icon-left mb-4 block max-w-md">
        <i className="pi pi-search" />
        <InputText
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tenants..."
          className="w-full"
        />
      </span>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height="7rem" borderRadius="12px" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-10 text-center text-sm text-slate-500">No tenants match your search.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tenant) => {
            const isActive = tenant.id === activeTenantId;
            const isSwitching = switching === tenant.id;

            return (
              <button
                key={tenant.id}
                type="button"
                onClick={() => handleSwitch(tenant)}
                disabled={switching !== null || tenant.status === 'DELETED'}
                className={
                  isActive
                    ? 'rounded-xl border-2 border-primary bg-primary/10 p-4 text-left'
                    : 'rounded-xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary/40'
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      label={tenant.name.charAt(0).toUpperCase()}
                      shape="circle"
                      className="bg-primary/10 text-primary"
                    />
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{tenant.name}</p>
                      <p className="m-0 mt-1 truncate font-mono text-xs text-slate-500">{tenant.slug}</p>
                    </div>
                  </div>
                  {isActive && <i className="pi pi-check-circle text-primary" />}
                  {isSwitching && <i className="pi pi-spin pi-spinner text-primary" />}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <StatusBadge status={tenant.status} />
                  <span className="text-xs text-slate-500">
                    Max {tenant.maxUsers.toLocaleString()} users
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Button
          type="button"
          label="Go Back"
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          onClick={() => router.back()}
        />
      </div>
    </div>
  );
}
