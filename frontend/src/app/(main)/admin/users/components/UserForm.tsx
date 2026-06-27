'use client';

import { Controller, useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { InputSwitch } from 'primereact/inputswitch';
import type { User } from '../page';

const createCreateSchema = (t: (key: any, params?: any) => string) => z.object({
  firstName: z.string().min(1, t('validation.firstNameRequired')),
  lastName: z.string().min(1, t('validation.lastNameRequired')),
  email: z.string().email(t('validation.email')),
  password: z.string().min(8, t('validation.passwordMin')),
  role: z.enum(['ADMIN', 'MODERATOR', 'USER'], { required_error: t('validation.fieldRequired', { field: t('roles.title') }) }),
  isActive: z.boolean(),
});

const createEditSchema = (t: (key: any, params?: any) => string) => z.object({
  firstName: z.string().min(1, t('validation.firstNameRequired')),
  lastName: z.string().min(1, t('validation.lastNameRequired')),
  email: z.string().email(t('validation.email')),
  role: z.enum(['ADMIN', 'MODERATOR', 'USER'], { required_error: t('validation.fieldRequired', { field: t('roles.title') }) }),
  isActive: z.boolean(),
});

type CreateFormData = z.infer<ReturnType<typeof createCreateSchema>>;
type EditFormData = z.infer<ReturnType<typeof createEditSchema>>;

async function createUser(data: CreateFormData) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to create user');
  }
  return res.json();
}

async function updateUser(id: string, data: EditFormData) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to update user');
  }
  return res.json();
}

interface UserFormProps {
  mode: 'create' | 'edit';
  user?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600">{message}</small>;
}

export default function UserForm({ mode, user, onSuccess, onCancel }: UserFormProps) {
  const t = useTranslations();
  const isCreate = mode === 'create';
  const createSchema = createCreateSchema(t);
  const editSchema = createEditSchema(t);
  const roleOptions = [
    { label: t('nav.user'), value: 'USER' },
    { label: t('users.moderator'), value: 'MODERATOR' },
    { label: t('nav.admin'), value: 'ADMIN' },
  ];

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isCreate ? createSchema : editSchema) as any,
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      role: (user?.role as 'ADMIN' | 'MODERATOR' | 'USER') ?? 'USER',
      isActive: user?.isActive ?? true,
      ...(isCreate ? { password: '' } : {}),
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateFormData | EditFormData) =>
      isCreate ? createUser(data as CreateFormData) : updateUser(user!.id, data as EditFormData),
    onSuccess,
  });

  const isActive = watch('isActive');

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-2 block text-sm font-semibold text-slate-700">{t('auth.firstName')}</label>
          <InputText id="firstName" {...register('firstName')} invalid={!!errors.firstName} className="w-full" placeholder={t('auth.placeholders.firstName')} />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-2 block text-sm font-semibold text-slate-700">{t('auth.lastName')}</label>
          <InputText id="lastName" {...register('lastName')} invalid={!!errors.lastName} className="w-full" placeholder={t('auth.placeholders.lastName')} />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">{t('auth.email')}</label>
        <InputText id="email" type="email" {...register('email')} invalid={!!errors.email} className="w-full" placeholder={t('auth.placeholders.email')} />
        <FieldError message={errors.email?.message} />
      </div>

      {isCreate && (
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">{t('auth.password')}</label>
          <Controller
            control={control}
            name={'password' as any}
            render={({ field }) => (
              <Password
                inputId="password"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                toggleMask
                feedback={false}
                inputClassName="w-full"
                className="w-full"
                invalid={'password' in errors && !!errors.password}
              />
            )}
          />
          {'password' in errors && <FieldError message={errors.password?.message} />}
        </div>
      )}

      <div>
        <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">{t('roles.title')}</label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Dropdown
              inputId="role"
              value={field.value}
              options={roleOptions}
              onChange={(event) => field.onChange(event.value)}
              className="w-full"
              invalid={!!errors.role}
            />
          )}
        />
        <FieldError message={errors.role?.message} />
      </div>

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div>
              <p className="m-0 text-sm font-semibold text-slate-900 dark:text-slate-100">{t('users.accountActive')}</p>
              <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isActive ? t('users.accountActiveHelp') : t('users.accountInactiveHelp')}
              </p>
            </div>
            <InputSwitch checked={!!field.value} onChange={(event) => field.onChange(event.value)} />
          </div>
        )}
      />

      {mutation.isError && (
        <Message severity="error" text={(mutation.error as Error).message} />
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" label={t('common.cancel')} severity="secondary" outlined onClick={onCancel} />
        <Button
          type="submit"
          label={isCreate ? t('users.createUser') : t('common.saveChanges')}
          icon="pi pi-save"
          loading={mutation.isPending}
        />
      </div>
    </form>
  );
}
