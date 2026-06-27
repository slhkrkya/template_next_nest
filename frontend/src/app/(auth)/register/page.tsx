'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { ProgressBar } from 'primereact/progressbar';
import { useAuth } from '@/hooks/useAuth';

const createPasswordSchema = (t: (key: any, params?: any) => string) => z
  .string()
  .min(8, t('validation.passwordMin'))
  .regex(/[A-Z]/, t('validation.passwordUppercase'))
  .regex(/[a-z]/, t('validation.passwordLowercase'))
  .regex(/[0-9]/, t('validation.passwordNumber'));

const createRegisterSchema = (t: (key: any, params?: any) => string) => z
  .object({
    firstName: z.string().min(1, t('validation.firstNameRequired')).max(50),
    lastName: z.string().min(1, t('validation.lastNameRequired')).max(50),
    email: z.string().email(t('validation.email')),
    companyName: z.string().max(100).optional(),
    password: createPasswordSchema(t),
    confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600 dark:text-rose-400">{message}</small>;
}

function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations('validation');
  const checks = [
    { label: t('passwordCheckLength'), ok: password.length >= 8 },
    { label: t('passwordCheckUppercase'), ok: /[A-Z]/.test(password) },
    { label: t('passwordCheckLowercase'), ok: /[a-z]/.test(password) },
    { label: t('passwordCheckNumber'), ok: /[0-9]/.test(password) },
  ];
  const strength = checks.filter((check) => check.ok).length;

  if (!password) return null;

  return (
    <div className="mt-3">
      <ProgressBar value={strength * 25} showValue={false} className="h-2" />
      <div className="mt-2 flex flex-wrap gap-2">
        {checks.map((check) => (
          <span
            key={check.label}
            className={check.ok ? 'text-xs font-semibold text-emerald-600' : 'text-xs text-slate-400'}
          >
            <i className={check.ok ? 'pi pi-check mr-1' : 'pi pi-circle mr-1'} />
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations();
  const { register: registerUser } = useAuth();
  const [success, setSuccess] = useState(false);
  const registerSchema = createRegisterSchema(t);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('auth.registrationFailed');
      setError('root', { message });
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <i className="pi pi-check text-2xl" />
        </span>
        <h2 className="m-0 text-2xl font-bold text-slate-950 dark:text-slate-50">
          {t('auth.emailSentTitle')}
        </h2>
        <p className="mx-auto my-5 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('auth.confirmationSent')}
        </p>
        <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400">
          {t('auth.backToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="m-0 text-3xl font-bold text-slate-950 dark:text-slate-50">
          {t('auth.registerHeading')}
        </h1>
        <p className="m-0 mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('auth.registerShortSubtitle')}
        </p>
      </div>

      {errors.root?.message && (
        <Message severity="error" text={errors.root.message} className="mb-5 w-full" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('auth.firstName')}
            </label>
            <InputText
              id="firstName"
              autoComplete="given-name"
              placeholder={t('auth.placeholders.firstName')}
              {...register('firstName')}
              invalid={!!errors.firstName}
              className="w-full"
            />
            <FieldError message={errors.firstName?.message} />
          </div>

          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('auth.lastName')}
            </label>
            <InputText
              id="lastName"
              autoComplete="family-name"
              placeholder={t('auth.placeholders.lastName')}
              {...register('lastName')}
              invalid={!!errors.lastName}
              className="w-full"
            />
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('auth.emailAddress')}
          </label>
          <InputText
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.placeholders.email')}
            {...register('email')}
            invalid={!!errors.email}
            className="w-full"
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <label htmlFor="companyName" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('auth.companyName')}{' '}
            <span className="font-normal text-slate-400 dark:text-slate-500">
              ({t('auth.optional')})
            </span>
          </label>
          <InputText
            id="companyName"
            autoComplete="organization"
            placeholder={t('auth.placeholders.companyName')}
            {...register('companyName')}
            invalid={!!errors.companyName}
            className="w-full"
          />
          <FieldError message={errors.companyName?.message} />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('auth.password')}
          </label>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Password
                inputId="password"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                toggleMask
                feedback={false}
                inputClassName="w-full"
                className="w-full"
                placeholder={t('auth.placeholders.newPassword')}
                autoComplete="new-password"
                invalid={!!errors.password}
              />
            )}
          />
          <PasswordStrength password={passwordValue} />
          <FieldError message={errors.password?.message} />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('auth.confirmPassword')}
          </label>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <Password
                inputId="confirmPassword"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                toggleMask
                feedback={false}
                inputClassName="w-full"
                className="w-full"
                placeholder={t('auth.placeholders.repeatPassword')}
                autoComplete="new-password"
                invalid={!!errors.confirmPassword}
              />
            )}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <p className="m-0 text-xs leading-5 text-slate-400 dark:text-slate-500">
          {t('auth.termsPrefix')}{' '}
          <Link href="/terms" className="text-indigo-600 dark:text-indigo-400">{t('auth.terms')}</Link>{' '}
          {t('auth.and')}{' '}
          <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400">{t('auth.privacy')}</Link>.
        </p>

        <Button
          type="submit"
          label={t('auth.createAccount')}
          icon="pi pi-user-plus"
          loading={isSubmitting}
          className="w-full"
        />
      </form>

      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-indigo-600">
          {t('auth.signIn')}
        </Link>
      </p>
    </>
  );
}
