'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Skeleton } from 'primereact/skeleton';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppToast } from '@/providers/prime-provider';
import { useAuthStore } from '@/store/auth.store';
import { getTenants } from '@/lib/api/tenants.api';
import { switchTenant } from '@/lib/api/auth.api';
import type { Tenant } from '@/types';

export default function TenantSelectPage() {
  const t = useTranslations('tenants');
  const commonT = useTranslations('common');
  const router = useRouter();
  const { toast } = useAppToast();
  const { user, setAuth } = useAuthStore();

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
      toast({ title: t('loadFailed'), variant: 'destructive' });
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
      const { accessToken } = await switchTenant(id);
      setAuth(
        { ...user!, tenantId: id ?? undefined, tenantName: tenant?.name ?? undefined },
        accessToken,
      );
      toast({
        title: tenant ? t('switchedTenant', { name: tenant.name }) : t('switchedGlobal'),
        variant: 'success',
      });
      router.push(id ? '/admin/dashboard' : '/super-admin/tenants');
    } catch {
      toast({ title: t('switchFailed'), variant: 'destructive' });
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('switchTitle')}
        subtitle={t('switchSubtitle')}
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
          <p className="m-0 text-sm font-semibold text-foreground">{t('globalView')}</p>
          <p className="m-0 mt-1 text-xs text-muted-foreground">
            {t('globalViewDescription')}
          </p>
        </div>
        {activeTenantId === null && <i className="pi pi-check-circle text-xl text-primary" />}
        {switching === '__global__' && <i className="pi pi-spin pi-spinner text-primary" />}
      </button>

      <div className="relative mb-4 max-w-md">
        <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
        <InputText
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('search')}
          className="w-full pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height="7rem" borderRadius="12px" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-10 text-center text-sm text-muted-foreground">{t('noMatch')}</div>
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
                      <p className="m-0 truncate text-sm font-semibold text-foreground">{tenant.name}</p>
                      <p className="m-0 mt-1 truncate font-mono text-xs text-muted-foreground">{tenant.slug}</p>
                    </div>
                  </div>
                  {isActive && <i className="pi pi-check-circle text-primary" />}
                  {isSwitching && <i className="pi pi-spin pi-spinner text-primary" />}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <StatusBadge status={tenant.status} />
                  <span className="text-xs text-muted-foreground">
                    {t('maxUsers', { count: tenant.maxUsers.toLocaleString() })}
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
          label={commonT('goBack')}
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          onClick={() => router.back()}
        />
      </div>
    </div>
  );
}
