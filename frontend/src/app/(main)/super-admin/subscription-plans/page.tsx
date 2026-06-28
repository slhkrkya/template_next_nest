'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAppToast } from '@/providers/prime-provider';
import axiosInstance from '@/lib/axios';
import type { SubscriptionPlan } from '@/types';

interface PlanFormValues {
  name: string;
  displayName: string;
  description: string;
  maxUsers: number;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
}

async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await axiosInstance.get<{ data: SubscriptionPlan[] }>('/subscription-plans');
  return res.data.data;
}

async function createSubscriptionPlan(
  data: Omit<SubscriptionPlan, 'id'>,
): Promise<SubscriptionPlan> {
  const res = await axiosInstance.post<SubscriptionPlan>('/subscription-plans', data);
  return res.data;
}

async function updateSubscriptionPlan(
  id: string,
  data: Partial<Omit<SubscriptionPlan, 'id'>>,
): Promise<SubscriptionPlan> {
  const res = await axiosInstance.patch<SubscriptionPlan>(`/subscription-plans/${id}`, data);
  return res.data;
}

async function deleteSubscriptionPlan(id: string): Promise<void> {
  await axiosInstance.delete(`/subscription-plans/${id}`);
}

function PlanForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: {
  defaultValues?: Partial<PlanFormValues>;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const t = useTranslations('subscriptionPlans');
  const commonT = useTranslations('common');
  const [values, setValues] = useState<PlanFormValues>({
    name: defaultValues?.name ?? '',
    displayName: defaultValues?.displayName ?? '',
    description: defaultValues?.description ?? '',
    maxUsers: defaultValues?.maxUsers ?? 10,
    monthlyPrice: defaultValues?.monthlyPrice ?? 0,
    yearlyPrice: defaultValues?.yearlyPrice ?? 0,
    isActive: defaultValues?.isActive ?? true,
  });

  function set<K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="plan-name" className="mb-2 block text-sm font-semibold text-foreground">{t('internalName')} <span className="text-rose-600">*</span></label>
          <InputText id="plan-name" required value={values.name} onChange={(event) => set('name', event.target.value)} placeholder={t('internalNamePlaceholder')} className="w-full" />
        </div>
        <div>
          <label htmlFor="plan-display-name" className="mb-2 block text-sm font-semibold text-foreground">{t('displayName')} <span className="text-rose-600">*</span></label>
          <InputText id="plan-display-name" required value={values.displayName} onChange={(event) => set('displayName', event.target.value)} placeholder={t('displayNamePlaceholder')} className="w-full" />
        </div>
      </div>

      <div>
        <label htmlFor="plan-description" className="mb-2 block text-sm font-semibold text-foreground">{t('description')}</label>
        <InputTextarea id="plan-description" value={values.description} onChange={(event) => set('description', event.target.value)} placeholder={t('descriptionPlaceholder')} rows={3} autoResize className="w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="max-users" className="mb-2 block text-sm font-semibold text-foreground">{t('maxUsers')} <span className="text-rose-600">*</span></label>
          <InputNumber inputId="max-users" value={values.maxUsers} onValueChange={(event) => set('maxUsers', event.value ?? 1)} min={1} className="w-full" inputClassName="w-full" />
        </div>
        <div>
          <label htmlFor="monthly-price" className="mb-2 block text-sm font-semibold text-foreground">{t('monthlyPrice')} <span className="text-rose-600">*</span></label>
          <InputNumber inputId="monthly-price" value={values.monthlyPrice} onValueChange={(event) => set('monthlyPrice', event.value ?? 0)} min={0} mode="currency" currency="USD" locale="en-US" className="w-full" inputClassName="w-full" />
        </div>
        <div>
          <label htmlFor="yearly-price" className="mb-2 block text-sm font-semibold text-foreground">{t('yearlyPrice')} <span className="text-rose-600">*</span></label>
          <InputNumber inputId="yearly-price" value={values.yearlyPrice} onValueChange={(event) => set('yearlyPrice', event.value ?? 0)} min={0} mode="currency" currency="USD" locale="en-US" className="w-full" inputClassName="w-full" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-4">
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">{t('activePlan')}</p>
          <p className="m-0 mt-1 text-xs text-muted-foreground">{t('inactivePlanHelp')}</p>
        </div>
        <InputSwitch checked={values.isActive} onChange={(event) => set('isActive', event.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" label={commonT('cancel')} severity="secondary" outlined onClick={onCancel} disabled={isLoading} />
        <Button type="submit" label={t('savePlan')} icon="pi pi-save" loading={isLoading} />
      </div>
    </form>
  );
}

function PlanCard({
  plan,
  onEdit,
  onToggle,
  onDelete,
}: {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggle: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
}) {
  const t = useTranslations('subscriptionPlans');
  const commonT = useTranslations('common');
  const yearlyDiscount =
    plan.monthlyPrice > 0
      ? Math.max(0, Math.round((1 - plan.yearlyPrice / 12 / plan.monthlyPrice) * 100))
      : 0;

  return (
    <Card className={plan.isActive ? 'h-full' : 'h-full opacity-60'}>
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold text-foreground">{plan.displayName}</h2>
            <p className="m-0 mt-1 font-mono text-xs text-muted-foreground">{plan.name}</p>
          </div>
          <Tag value={plan.isActive ? commonT('active') : commonT('inactive')} severity={plan.isActive ? 'success' : 'secondary'} />
        </div>

        {plan.description && <p className="m-0 text-sm leading-6 text-muted-foreground">{plan.description}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary/10 p-4 text-center">
            <p className="m-0 text-xs font-semibold uppercase text-primary">{t('monthly')}</p>
            <p className="m-0 mt-2 text-2xl font-bold tabular-nums text-foreground">${plan.monthlyPrice.toFixed(2)}</p>
          </div>
          <div className="relative rounded-xl bg-accent p-4 text-center">
            <p className="m-0 text-xs font-semibold uppercase text-accent-foreground">{t('yearly')}</p>
            <p className="m-0 mt-2 text-2xl font-bold tabular-nums text-foreground">${plan.yearlyPrice.toFixed(2)}</p>
            {yearlyDiscount > 0 && (
              <Tag value={`-${yearlyDiscount}%`} severity="success" className="absolute -right-2 -top-2" />
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {t('maxUsersValue', { count: plan.maxUsers.toLocaleString() })}
        </div>

        <div className="mt-auto flex gap-2">
          <Button type="button" label={commonT('edit')} icon="pi pi-pencil" severity="secondary" outlined className="flex-1" onClick={() => onEdit(plan)} />
          <Button type="button" icon={plan.isActive ? 'pi pi-toggle-on' : 'pi pi-toggle-off'} severity={plan.isActive ? 'success' : 'secondary'} outlined aria-label={plan.isActive ? t('deactivatePlan') : t('activatePlan')} onClick={() => onToggle(plan)} />
          <Button type="button" icon="pi pi-trash" severity="danger" outlined aria-label={t('deletePlan')} onClick={() => onDelete(plan)} />
        </div>
      </div>
    </Card>
  );
}

export default function SubscriptionPlansPage() {
  const t = useTranslations('subscriptionPlans');
  const commonT = useTranslations('common');
  const { toast } = useAppToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSubscriptionPlans();
      setPlans(data);
    } catch {
      toast({ title: t('loadFailed'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  async function handleSubmit(values: PlanFormValues) {
    setIsMutating(true);
    try {
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, values);
        toast({ title: t('updated'), variant: 'success' });
      } else {
        await createSubscriptionPlan(values as Omit<SubscriptionPlan, 'id'>);
        toast({ title: t('created'), variant: 'success' });
      }
      setDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch {
      toast({ title: t('saveFailed'), variant: 'destructive' });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleToggle(plan: SubscriptionPlan) {
    setIsMutating(true);
    try {
      await updateSubscriptionPlan(plan.id, { isActive: !plan.isActive });
      toast({ title: plan.isActive ? t('deactivated') : t('activated'), variant: 'success' });
      fetchPlans();
    } catch {
      toast({ title: t('toggleFailed'), variant: 'destructive' });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDelete() {
    if (!deletingPlan) return;
    setIsMutating(true);
    try {
      await deleteSubscriptionPlan(deletingPlan.id);
      toast({ title: t('deleted'), variant: 'success' });
      fetchPlans();
    } catch {
      toast({ title: t('deleteFailed'), variant: 'destructive' });
    } finally {
      setIsMutating(false);
      setDeletingPlan(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button
            type="button"
            label={t('newPlan')}
            icon="pi pi-plus"
            onClick={() => {
              setEditingPlan(null);
              setDialogOpen(true);
            }}
          />
        }
      />

      {isLoading ? (
        <Card><div className="py-12 text-center text-sm text-muted-foreground">{t('loading')}</div></Card>
      ) : plans.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="m-0 mb-4 text-sm text-muted-foreground">{t('empty')}</p>
            <Button type="button" label={t('createFirstPlan')} icon="pi pi-plus" outlined onClick={() => setDialogOpen(true)} />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={(value) => {
                setEditingPlan(value);
                setDialogOpen(true);
              }}
              onToggle={handleToggle}
              onDelete={(value) => setDeletingPlan(value)}
            />
          ))}
        </div>
      )}

      <Dialog
        visible={dialogOpen}
        onHide={() => {
          setDialogOpen(false);
          setEditingPlan(null);
        }}
        header={editingPlan ? t('editPlan') : t('createPlan')}
        modal
        className="w-[92vw] max-w-2xl"
      >
        <PlanForm
          defaultValues={editingPlan ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setDialogOpen(false);
            setEditingPlan(null);
          }}
          isLoading={isMutating}
        />
      </Dialog>

      <ConfirmDialog
        open={!!deletingPlan}
        title={t('deletePlan')}
        description={t('deleteConfirm', { name: deletingPlan?.displayName ?? '' })}
        confirmLabel={commonT('delete')}
        variant="destructive"
        isLoading={isMutating}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPlan(null)}
      />
    </div>
  );
}
