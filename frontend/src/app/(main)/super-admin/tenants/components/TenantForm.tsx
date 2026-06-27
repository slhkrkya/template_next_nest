'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import type { TenantStatus } from '@/types';

export interface TenantFormValues {
  name: string;
  slug: string;
  maxUsers: number;
  trialEndsAt: string;
  status: TenantStatus;
}

interface TenantFormProps {
  defaultValues?: Partial<TenantFormValues>;
  onSubmit: (values: TenantFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const statusOptions: Array<{ label: string; value: TenantStatus }> = [
  { label: 'Trial', value: 'TRIAL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600">{message}</small>;
}

export function TenantForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}: TenantFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      slug: defaultValues?.slug ?? '',
      maxUsers: defaultValues?.maxUsers ?? 10,
      trialEndsAt: defaultValues?.trialEndsAt
        ? defaultValues.trialEndsAt.slice(0, 10)
        : '',
      status: defaultValues?.status ?? 'TRIAL',
    },
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (mode === 'create') {
      setValue('slug', slugify(nameValue));
    }
  }, [nameValue, mode, setValue]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="tenant-name" className="mb-2 block text-sm font-semibold text-slate-700">
          Name <span className="text-rose-600">*</span>
        </label>
        <InputText
          id="tenant-name"
          placeholder="Acme Corporation"
          {...register('name', { required: 'Name is required' })}
          invalid={!!errors.name}
          className="w-full"
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label htmlFor="tenant-slug" className="mb-2 block text-sm font-semibold text-slate-700">
          Slug <span className="text-rose-600">*</span>
        </label>
        <InputText
          id="tenant-slug"
          placeholder="acme-corporation"
          {...register('slug', {
            required: 'Slug is required',
            pattern: {
              value: /^[a-z0-9-]+$/,
              message: 'Slug may only contain lowercase letters, numbers, and hyphens',
            },
          })}
          invalid={!!errors.slug}
          readOnly={mode === 'edit'}
          className="w-full"
        />
        <FieldError message={errors.slug?.message} />
        {!errors.slug && (
          <small className="mt-1 block text-slate-500">
            {mode === 'create'
              ? 'Auto-generated from name. Used in URLs and cannot be changed later.'
              : 'Slug cannot be changed after creation.'}
          </small>
        )}
      </div>

      <div>
        <label htmlFor="tenant-max-users" className="mb-2 block text-sm font-semibold text-slate-700">
          Max Users
        </label>
        <Controller
          control={control}
          name="maxUsers"
          rules={{
            min: { value: 1, message: 'Must be at least 1' },
            max: { value: 10000, message: 'Must be 10,000 or fewer' },
          }}
          render={({ field }) => (
            <InputNumber
              inputId="tenant-max-users"
              value={field.value}
              onValueChange={(event) => field.onChange(event.value ?? 1)}
              min={1}
              max={10000}
              className="w-full"
              inputClassName="w-full"
            />
          )}
        />
        <FieldError message={errors.maxUsers?.message} />
      </div>

      <div>
        <label htmlFor="tenant-trial-ends" className="mb-2 block text-sm font-semibold text-slate-700">
          Trial Ends At
        </label>
        <Controller
          control={control}
          name="trialEndsAt"
          render={({ field }) => (
            <Calendar
              inputId="tenant-trial-ends"
              value={field.value ? new Date(field.value) : null}
              onChange={(event) => {
                const value = event.value instanceof Date
                  ? event.value.toISOString().slice(0, 10)
                  : '';
                field.onChange(value);
              }}
              dateFormat="yy-mm-dd"
              showIcon
              className="w-full"
            />
          )}
        />
        <small className="mt-1 block text-slate-500">Leave blank for no trial expiry.</small>
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="tenant-status" className="mb-2 block text-sm font-semibold text-slate-700">
            Status
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Dropdown
                inputId="tenant-status"
                value={field.value}
                options={statusOptions}
                onChange={(event) => field.onChange(event.value)}
                className="w-full"
              />
            )}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          outlined
          onClick={onCancel}
          disabled={isLoading}
        />
        <Button
          type="submit"
          label={mode === 'create' ? 'Create Tenant' : 'Save Changes'}
          icon="pi pi-save"
          loading={isLoading}
        />
      </div>
    </form>
  );
}
