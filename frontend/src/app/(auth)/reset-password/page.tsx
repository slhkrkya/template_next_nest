'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { useAppToast } from '@/providers/prime-provider';
import { resetPassword } from '@/lib/api/auth.api';

const createSchema = (t: (key: any, params?: any) => string) => z
  .object({
    password: z
      .string()
      .min(8, t('validation.passwordMin'))
      .regex(/[A-Z]/, t('validation.passwordUppercase'))
      .regex(/[a-z]/, t('validation.passwordLowercase'))
      .regex(/[0-9]/, t('validation.passwordNumber'))
      .regex(/[\W_]/, t('validation.passwordSpecial')),
    confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

type FormData = z.infer<ReturnType<typeof createSchema>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600 dark:text-rose-400">{message}</small>;
}

export default function ResetPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useAppToast();
  const schema = createSchema(t);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <i className="pi pi-exclamation-triangle text-2xl" />
        </span>
        <h2 className="m-0 text-2xl font-bold text-slate-950 dark:text-slate-50">
          {t('auth.invalidResetLinkTitle')}
        </h2>
        <p className="mx-auto my-5 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('auth.invalidResetLinkMessage')}
        </p>
        <Link href="/forgot-password">
          <Button type="button" label={t('auth.requestNewLink')} icon="pi pi-refresh" />
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword(token, data.password);
      toast({ title: t('auth.passwordUpdated'), variant: 'success' });
      router.push('/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('auth.resetFailed');
      setError('root', { message });
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="m-0 text-3xl font-bold text-slate-950 dark:text-slate-50">
          {t('auth.chooseNewPassword')}
        </h1>
        <p className="m-0 mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('auth.newPasswordHelp')}
        </p>
      </div>

      {errors.root?.message && (
        <Message severity="error" text={errors.root.message} className="mb-5 w-full" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('auth.newPassword')} <span className="text-rose-600">*</span>
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
          <FieldError message={errors.password?.message} />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('auth.confirmNewPassword')} <span className="text-rose-600">*</span>
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
                placeholder={t('auth.placeholders.repeatNewPassword')}
                autoComplete="new-password"
                invalid={!!errors.confirmPassword}
              />
            )}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <Button
          type="submit"
          label={t('profile.updatePassword')}
          icon="pi pi-lock"
          loading={isSubmitting}
          className="w-full"
        />
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t('auth.backToSignIn')}
        </Link>
      </div>
    </>
  );
}
