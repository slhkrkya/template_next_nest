'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { TabPanel, TabView } from 'primereact/tabview';
import { useAuth } from '@/hooks/useAuth';
import { useAppToast } from '@/providers/prime-provider';
import { changePassword, updateProfile } from '@/lib/api/users.api';

const createPersonalSchema = (t: (key: any, params?: any) => string) => z.object({
  firstName: z.string().min(1, t('validation.firstNameRequired')).max(50),
  lastName: z.string().min(1, t('validation.lastNameRequired')).max(50),
  mobile: z.string().optional(),
  birthDate: z.string().optional(),
});

const settingsSchema = z.object({
  language: z.string().min(1),
  theme: z.enum(['light', 'dark', 'system']),
  timezone: z.string().min(1),
});

const createPasswordSchema = (t: (key: any, params?: any) => string) => z
  .object({
    currentPassword: z.string().min(1, t('validation.fieldRequired', { field: t('auth.currentPassword') })),
    newPassword: z
      .string()
      .min(8, t('validation.passwordMin'))
      .regex(/[A-Z]/, t('validation.passwordUppercase'))
      .regex(/[a-z]/, t('validation.passwordLowercase'))
      .regex(/[0-9]/, t('validation.passwordNumber')),
    confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired')),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

type PersonalFormData = z.infer<ReturnType<typeof createPersonalSchema>>;
type SettingsFormData = z.infer<typeof settingsSchema>;
type PasswordFormData = z.infer<ReturnType<typeof createPasswordSchema>>;

const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'Eastern Time (US)', value: 'America/New_York' },
  { label: 'Central Time (US)', value: 'America/Chicago' },
  { label: 'Pacific Time (US)', value: 'America/Los_Angeles' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Paris', value: 'Europe/Paris' },
  { label: 'Istanbul', value: 'Europe/Istanbul' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Sydney', value: 'Australia/Sydney' },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600 dark:text-rose-400">{message}</small>;
}

function PersonalInfoTab({ user }: { user: any }) {
  const t = useTranslations();
  const { toast } = useAppToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const personalSchema = createPersonalSchema(t);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      mobile: user?.mobile ?? '',
      birthDate: user?.birthDate ?? '',
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      if (typeof readerEvent.target?.result === 'string') {
        setAvatarPreview(readerEvent.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: PersonalFormData) => {
    try {
      await updateProfile(data);
      toast({ title: t('profile.profileUpdated'), variant: 'success' });
    } catch {
      toast({ title: t('profile.profileUpdateFailed'), variant: 'destructive' });
    }
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="flex items-center gap-5">
        <Avatar
          image={avatarPreview ?? undefined}
          label={avatarPreview ? undefined : initials || '?'}
          shape="circle"
          size="xlarge"
          className="bg-primary/10 text-primary"
        />
        <div>
          <Button
            type="button"
            label={t('profile.uploadPhoto')}
            icon="pi pi-upload"
            text
            onClick={() => fileInputRef.current?.click()}
          />
          <p className="m-0 mt-1 text-xs text-muted-foreground">{t('profile.fileHelp')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={t('profile.uploadPhotoAria')}
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-2 block text-sm font-semibold text-foreground">{t('auth.firstName')}</label>
          <InputText id="firstName" autoComplete="given-name" {...register('firstName')} invalid={!!errors.firstName} className="w-full" />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-2 block text-sm font-semibold text-foreground">{t('auth.lastName')}</label>
          <InputText id="lastName" autoComplete="family-name" {...register('lastName')} invalid={!!errors.lastName} className="w-full" />
          <FieldError message={errors.lastName?.message} />
        </div>
        <div>
          <label htmlFor="mobile" className="mb-2 block text-sm font-semibold text-foreground">{t('profile.mobileNumber')}</label>
          <InputText id="mobile" autoComplete="tel" placeholder="+1 (555) 000-0000" {...register('mobile')} invalid={!!errors.mobile} className="w-full" />
          <FieldError message={errors.mobile?.message} />
        </div>
        <div>
          <label htmlFor="birthDate" className="mb-2 block text-sm font-semibold text-foreground">{t('profile.dateOfBirth')}</label>
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <Calendar
                inputId="birthDate"
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
          <FieldError message={errors.birthDate?.message} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" label={t('profile.saveChanges')} icon="pi pi-save" loading={isSubmitting} />
      </div>
    </form>
  );
}

function SettingsTab({ user }: { user: any }) {
  const t = useTranslations();
  const { toast } = useAppToast();
  const languageOptions = [
    { label: t('language.english'), value: 'en' },
    { label: t('language.turkish'), value: 'tr' },
  ];
  const themeOptions = [
    { label: t('theme.light'), value: 'light' },
    { label: t('theme.dark'), value: 'dark' },
    { label: t('profile.systemDefault'), value: 'system' },
  ];
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      language: user?.settings?.language ?? 'en',
      theme: user?.settings?.theme ?? 'system',
      timezone: user?.settings?.timezone ?? 'UTC',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateProfile({ settings: data });
      toast({ title: t('profile.settingsSaved'), variant: 'success' });
    } catch {
      toast({ title: t('profile.settingsSaveFailed'), variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-5">
      {[
        ['language', t('profile.language'), languageOptions],
        ['theme', t('profile.theme'), themeOptions],
        ['timezone', t('profile.timezone'), timezoneOptions],
      ].map(([name, label, options]) => (
        <div key={name as string}>
          <label htmlFor={name as string} className="mb-2 block text-sm font-semibold text-foreground">
            {label as string}
          </label>
          <Controller
            control={control}
            name={name as keyof SettingsFormData}
            render={({ field }) => (
              <Dropdown
                inputId={name as string}
                value={field.value}
                options={options as Array<{ label: string; value: string }>}
                onChange={(event) => field.onChange(event.value)}
                className="w-full"
              />
            )}
          />
        </div>
      ))}
      <div className="flex justify-end">
        <Button type="submit" label={t('profile.saveSettings')} icon="pi pi-save" loading={isSubmitting} />
      </div>
    </form>
  );
}

function ChangePasswordTab() {
  const t = useTranslations();
  const { toast } = useAppToast();
  const passwordSchema = createPasswordSchema(t);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast({ title: t('profile.passwordUpdated'), variant: 'success' });
      reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('profile.passwordUpdateFailed');
      toast({ title: message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-5">
      {[
        ['currentPassword', t('auth.currentPassword'), 'current-password'],
        ['newPassword', t('auth.newPassword'), 'new-password'],
        ['confirmPassword', t('auth.confirmNewPassword'), 'new-password'],
      ].map(([name, label, autoComplete]) => (
        <div key={name}>
          <label htmlFor={name} className="mb-2 block text-sm font-semibold text-foreground">
            {label}
          </label>
          <Controller
            control={control}
            name={name as keyof PasswordFormData}
            render={({ field }) => (
              <Password
                inputId={name}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                toggleMask
                feedback={name === 'newPassword'}
                inputClassName="w-full"
                className="w-full"
                autoComplete={autoComplete}
                invalid={!!errors[name as keyof PasswordFormData]}
              />
            )}
          />
          <FieldError message={errors[name as keyof PasswordFormData]?.message} />
        </div>
      ))}
      <div className="flex justify-end">
        <Button type="submit" label={t('profile.updatePassword')} icon="pi pi-lock" loading={isSubmitting} />
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="m-0 text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <Card>
        <TabView>
          <TabPanel header={t('personalInfo')}>
            <PersonalInfoTab user={user} />
          </TabPanel>
          <TabPanel header={t('settings')}>
            <SettingsTab user={user} />
          </TabPanel>
          <TabPanel header={t('changePassword')}>
            <ChangePasswordTab />
          </TabPanel>
        </TabView>
      </Card>
    </div>
  );
}
