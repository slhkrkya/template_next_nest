'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { getPrimeOverlayAppendTo } from '@/components/shared/FilterBar';
import type { TenantStatus } from '@/types';

export interface TenantFormValues {
  name: string;
  slug: string;
  maxUsers: number;
  trialEndsAt: string;
  status: TenantStatus;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

interface TenantFormProps {
  defaultValues?: Partial<TenantFormValues>;
  onSubmit: (values: TenantFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

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
  const t = useTranslations('tenants');
  const commonT = useTranslations('common');
  const statusT = useTranslations('status');
  const validationT = useTranslations('validation');
  const authT = useTranslations('auth');
  const statusOptions: Array<{ label: string; value: TenantStatus }> = [
    { label: statusT('TRIAL'), value: 'TRIAL' },
    { label: statusT('ACTIVE'), value: 'ACTIVE' },
    { label: statusT('SUSPENDED'), value: 'SUSPENDED' },
  ];
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
      adminFirstName: defaultValues?.adminFirstName ?? '',
      adminLastName: defaultValues?.adminLastName ?? '',
      adminEmail: defaultValues?.adminEmail ?? '',
      adminPassword: defaultValues?.adminPassword ?? '',
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
        <label htmlFor="tenant-name" className="mb-2 block text-sm font-semibold text-foreground">
          {commonT('name')} <span className="text-rose-600">*</span>
        </label>
        <InputText
          id="tenant-name"
          placeholder={t('namePlaceholder')}
          {...register('name', { required: validationT('fieldRequired', { field: commonT('name') }) })}
          invalid={!!errors.name}
          className="w-full"
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label htmlFor="tenant-slug" className="mb-2 block text-sm font-semibold text-foreground">
          {t('slug')} <span className="text-rose-600">*</span>
        </label>
        <InputText
          id="tenant-slug"
          placeholder={t('slugPlaceholder')}
          {...register('slug', {
            required: validationT('fieldRequired', { field: t('slug') }),
            pattern: {
              value: /^[a-z0-9-]+$/,
              message: t('slugPattern'),
            },
          })}
          invalid={!!errors.slug}
          readOnly={mode === 'edit'}
          className="w-full"
        />
        <FieldError message={errors.slug?.message} />
        {!errors.slug && (
          <small className="mt-1 block text-muted-foreground">
            {mode === 'create'
              ? t('slugCreateHelp')
              : t('slugEditHelp')}
          </small>
        )}
      </div>

      <div>
        <label htmlFor="tenant-max-users" className="mb-2 block text-sm font-semibold text-foreground">
          {t('maxUsersLabel')} <span className="text-rose-600">*</span>
        </label>
        <Controller
          control={control}
          name="maxUsers"
          rules={{
            min: { value: 1, message: t('minUsersValidation') },
            max: { value: 10000, message: t('maxUsersValidation') },
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
        <label htmlFor="tenant-trial-ends" className="mb-2 block text-sm font-semibold text-foreground">
          {t('trialEndsAt')}
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
              showButtonBar
              appendTo={getPrimeOverlayAppendTo()}
              className="w-full"
            />
          )}
        />
        <small className="mt-1 block text-muted-foreground">{t('trialEndsHelp')}</small>
      </div>

      {mode === 'create' && (
        <div className="grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="tenant-admin-first-name" className="mb-2 block text-sm font-semibold text-foreground">
              {t('adminFirstName')} <span className="text-rose-600">*</span>
            </label>
            <InputText
              id="tenant-admin-first-name"
              autoComplete="given-name"
              placeholder={authT('placeholders.firstName')}
              {...register('adminFirstName', {
                required: validationT('fieldRequired', { field: t('adminFirstName') }),
                maxLength: { value: 50, message: t('maxCharsValidation', { count: 50 }) },
              })}
              invalid={!!errors.adminFirstName}
              className="w-full"
            />
            <FieldError message={errors.adminFirstName?.message} />
          </div>

          <div>
            <label htmlFor="tenant-admin-last-name" className="mb-2 block text-sm font-semibold text-foreground">
              {t('adminLastName')} <span className="text-rose-600">*</span>
            </label>
            <InputText
              id="tenant-admin-last-name"
              autoComplete="family-name"
              placeholder={authT('placeholders.lastName')}
              {...register('adminLastName', {
                required: validationT('fieldRequired', { field: t('adminLastName') }),
                maxLength: { value: 50, message: t('maxCharsValidation', { count: 50 }) },
              })}
              invalid={!!errors.adminLastName}
              className="w-full"
            />
            <FieldError message={errors.adminLastName?.message} />
          </div>

          <div>
            <label htmlFor="tenant-admin-email" className="mb-2 block text-sm font-semibold text-foreground">
              {t('adminEmail')} <span className="text-rose-600">*</span>
            </label>
            <InputText
              id="tenant-admin-email"
              type="email"
              autoComplete="email"
              placeholder={t('adminEmailPlaceholder')}
              {...register('adminEmail', {
                required: validationT('fieldRequired', { field: t('adminEmail') }),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: validationT('email'),
                },
              })}
              invalid={!!errors.adminEmail}
              className="w-full"
            />
            <FieldError message={errors.adminEmail?.message} />
          </div>

          <div>
            <label htmlFor="tenant-admin-password" className="mb-2 block text-sm font-semibold text-foreground">
              {t('adminPassword')} <span className="text-rose-600">*</span>
            </label>
            <InputText
              id="tenant-admin-password"
              type="password"
              autoComplete="new-password"
              placeholder={t('adminPasswordPlaceholder')}
              {...register('adminPassword', {
                required: validationT('fieldRequired', { field: t('adminPassword') }),
                minLength: { value: 8, message: validationT('passwordMin') },
                maxLength: { value: 100, message: t('maxCharsValidation', { count: 100 }) },
              })}
              invalid={!!errors.adminPassword}
              className="w-full"
            />
            <FieldError message={errors.adminPassword?.message} />
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div>
          <label htmlFor="tenant-status" className="mb-2 block text-sm font-semibold text-foreground">
            {commonT('status')}
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
                appendTo={getPrimeOverlayAppendTo()}
              />
            )}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          label={commonT('cancel')}
          severity="secondary"
          outlined
          onClick={onCancel}
          disabled={isLoading}
        />
        <Button
          type="submit"
          label={mode === 'create' ? t('createTenant') : commonT('saveChanges')}
          icon="pi pi-save"
          loading={isLoading}
        />
      </div>
    </form>
  );
}
