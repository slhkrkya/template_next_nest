'use client';

import { useCallback, useEffect, useState } from 'react';
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
          <label htmlFor="plan-name" className="mb-2 block text-sm font-semibold text-slate-700">Internal Name</label>
          <InputText id="plan-name" required value={values.name} onChange={(event) => set('name', event.target.value)} placeholder="pro" className="w-full" />
        </div>
        <div>
          <label htmlFor="plan-display-name" className="mb-2 block text-sm font-semibold text-slate-700">Display Name</label>
          <InputText id="plan-display-name" required value={values.displayName} onChange={(event) => set('displayName', event.target.value)} placeholder="Pro Plan" className="w-full" />
        </div>
      </div>

      <div>
        <label htmlFor="plan-description" className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
        <InputTextarea id="plan-description" value={values.description} onChange={(event) => set('description', event.target.value)} placeholder="Best for growing teams" rows={3} autoResize className="w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="max-users" className="mb-2 block text-sm font-semibold text-slate-700">Max Users</label>
          <InputNumber inputId="max-users" value={values.maxUsers} onValueChange={(event) => set('maxUsers', event.value ?? 1)} min={1} className="w-full" inputClassName="w-full" />
        </div>
        <div>
          <label htmlFor="monthly-price" className="mb-2 block text-sm font-semibold text-slate-700">Monthly Price</label>
          <InputNumber inputId="monthly-price" value={values.monthlyPrice} onValueChange={(event) => set('monthlyPrice', event.value ?? 0)} min={0} mode="currency" currency="USD" locale="en-US" className="w-full" inputClassName="w-full" />
        </div>
        <div>
          <label htmlFor="yearly-price" className="mb-2 block text-sm font-semibold text-slate-700">Yearly Price</label>
          <InputNumber inputId="yearly-price" value={values.yearlyPrice} onValueChange={(event) => set('yearlyPrice', event.value ?? 0)} min={0} mode="currency" currency="USD" locale="en-US" className="w-full" inputClassName="w-full" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
        <div>
          <p className="m-0 text-sm font-semibold text-slate-900 dark:text-slate-100">Active plan</p>
          <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400">Inactive plans cannot be selected by new tenants.</p>
        </div>
        <InputSwitch checked={values.isActive} onChange={(event) => set('isActive', event.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" label="Cancel" severity="secondary" outlined onClick={onCancel} disabled={isLoading} />
        <Button type="submit" label="Save Plan" icon="pi pi-save" loading={isLoading} />
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
  const yearlyDiscount =
    plan.monthlyPrice > 0
      ? Math.max(0, Math.round((1 - plan.yearlyPrice / 12 / plan.monthlyPrice) * 100))
      : 0;

  return (
    <Card className={plan.isActive ? 'h-full' : 'h-full opacity-60'}>
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold text-slate-950 dark:text-slate-50">{plan.displayName}</h2>
            <p className="m-0 mt-1 font-mono text-xs text-slate-500">{plan.name}</p>
          </div>
          <Tag value={plan.isActive ? 'Active' : 'Inactive'} severity={plan.isActive ? 'success' : 'secondary'} />
        </div>

        {plan.description && <p className="m-0 text-sm leading-6 text-slate-500">{plan.description}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary/10 p-4 text-center">
            <p className="m-0 text-xs font-semibold uppercase text-primary">Monthly</p>
            <p className="m-0 mt-2 text-2xl font-bold tabular-nums text-foreground">${plan.monthlyPrice.toFixed(2)}</p>
          </div>
          <div className="relative rounded-xl bg-accent p-4 text-center">
            <p className="m-0 text-xs font-semibold uppercase text-accent-foreground">Yearly</p>
            <p className="m-0 mt-2 text-2xl font-bold tabular-nums text-foreground">${plan.yearlyPrice.toFixed(2)}</p>
            {yearlyDiscount > 0 && (
              <Tag value={`-${yearlyDiscount}%`} severity="success" className="absolute -right-2 -top-2" />
            )}
          </div>
        </div>

        <div className="text-sm text-slate-500">
          Max users: <span className="font-semibold text-slate-950 dark:text-slate-50">{plan.maxUsers.toLocaleString()}</span>
        </div>

        <div className="mt-auto flex gap-2">
          <Button type="button" label="Edit" icon="pi pi-pencil" severity="secondary" outlined className="flex-1" onClick={() => onEdit(plan)} />
          <Button type="button" icon={plan.isActive ? 'pi pi-toggle-on' : 'pi pi-toggle-off'} severity={plan.isActive ? 'success' : 'secondary'} outlined aria-label={plan.isActive ? 'Deactivate plan' : 'Activate plan'} onClick={() => onToggle(plan)} />
          <Button type="button" icon="pi pi-trash" severity="danger" outlined aria-label="Delete plan" onClick={() => onDelete(plan)} />
        </div>
      </div>
    </Card>
  );
}

export default function SubscriptionPlansPage() {
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
      toast({ title: 'Failed to load subscription plans', variant: 'destructive' });
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
        toast({ title: 'Plan updated', variant: 'success' });
      } else {
        await createSubscriptionPlan(values as Omit<SubscriptionPlan, 'id'>);
        toast({ title: 'Plan created', variant: 'success' });
      }
      setDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch {
      toast({ title: 'Failed to save plan', variant: 'destructive' });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleToggle(plan: SubscriptionPlan) {
    setIsMutating(true);
    try {
      await updateSubscriptionPlan(plan.id, { isActive: !plan.isActive });
      toast({ title: `Plan ${plan.isActive ? 'deactivated' : 'activated'}`, variant: 'success' });
      fetchPlans();
    } catch {
      toast({ title: 'Failed to toggle plan status', variant: 'destructive' });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDelete() {
    if (!deletingPlan) return;
    setIsMutating(true);
    try {
      await deleteSubscriptionPlan(deletingPlan.id);
      toast({ title: 'Plan deleted', variant: 'success' });
      fetchPlans();
    } catch {
      toast({ title: 'Failed to delete plan', variant: 'destructive' });
    } finally {
      setIsMutating(false);
      setDeletingPlan(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        subtitle="Define and manage the plans available to tenants."
        actions={
          <Button
            type="button"
            label="New Plan"
            icon="pi pi-plus"
            onClick={() => {
              setEditingPlan(null);
              setDialogOpen(true);
            }}
          />
        }
      />

      {isLoading ? (
        <Card><div className="py-12 text-center text-sm text-slate-500">Loading subscription plans...</div></Card>
      ) : plans.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="m-0 mb-4 text-sm text-slate-500">No subscription plans yet.</p>
            <Button type="button" label="Create the first plan" icon="pi pi-plus" outlined onClick={() => setDialogOpen(true)} />
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
        header={editingPlan ? 'Edit Plan' : 'Create Subscription Plan'}
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
        title="Delete Subscription Plan"
        description={`Permanently delete "${deletingPlan?.displayName}"? Tenants on this plan will not be affected immediately, but they will lose access at renewal.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isMutating}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPlan(null)}
      />
    </div>
  );
}
