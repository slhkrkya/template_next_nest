'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/types';

const createLoginSchema = (t: (key: any, params?: any) => string) => z.object({
  email: z.string().email(t('validation.email')),
  password: z.string().min(1, t('validation.passwordRequired')),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

function hasAdminAccess(role?: string): boolean {
  const normalizedRole = (role ?? '').trim().toLowerCase();
  return normalizedRole.length > 0 && normalizedRole !== 'user';
}

function getDefaultDashboard(user: AuthUser): string {
  if (user.isSuperAdmin) return '/super-admin/tenants';
  if (hasAdminAccess(user.role)) return '/admin/dashboard';
  return '/user/profile';
}

function canAccessPath(path: string, user: AuthUser): boolean {
  if (user.isSuperAdmin) return true;
  if (path.startsWith('/super-admin')) return false;
  if (path.startsWith('/admin')) return hasAdminAccess(user.role);
  return true;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600 dark:text-rose-400">{message}</small>;
}

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const { login } = useAuth();
  const loginSchema = createLoginSchema(t);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      const params = new URLSearchParams(window.location.search);
      const rawCallback = params.get('callbackUrl') ?? '';
      const defaultDashboard = getDefaultDashboard(response.user);
      const normalizedCallback =
        rawCallback === '/dashboard' || rawCallback === '/user/dashboard'
          ? defaultDashboard
          : rawCallback;
      const safePath =
        normalizedCallback.startsWith('/') && !normalizedCallback.startsWith('//')
          && canAccessPath(normalizedCallback, response.user)
          ? normalizedCallback
          : defaultDashboard;
      router.push(safePath);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('auth.invalidCredentials');
      setError('root', { message });
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="m-0 text-3xl font-bold text-slate-950 dark:text-slate-50">
          {t('auth.loginTitle')}
        </h1>
        <p className="m-0 mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('auth.loginWorkspaceSubtitle')}
        </p>
      </div>

      {errors.root?.message && (
        <Message severity="error" text={errors.root.message} className="mb-5 w-full" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            {t('auth.emailAddress')} <span className="text-rose-600">*</span>
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
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              {t('auth.password')} <span className="text-rose-600">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-primary hover:text-primary/80"
            >
              {t('auth.forgotPasswordLink')}
            </Link>
          </div>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Password
                inputId="password"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                feedback={false}
                toggleMask
                inputClassName="w-full"
                className="w-full"
                placeholder={t('auth.placeholders.password')}
                autoComplete="current-password"
                invalid={!!errors.password}
              />
            )}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                inputId="rememberMe"
                checked={!!field.value}
                onChange={(event) => field.onChange(!!event.checked)}
              />
              <label
                htmlFor="rememberMe"
                className="cursor-pointer text-sm text-slate-600 dark:text-slate-400"
              >
                {t('auth.rememberMe30Days')}
              </label>
            </div>
          )}
        />

        <Button
          type="submit"
          label={t('auth.signIn')}
          icon="pi pi-sign-in"
          loading={isSubmitting}
          className="w-full"
        />
      </form>

      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('auth.noAccount')}{' '}
        <Link
          href="/register"
          className="font-semibold text-primary hover:text-primary/80"
        >
          {t('auth.createOne')}
        </Link>
      </p>
    </>
  );
}
