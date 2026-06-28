'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { forgotPassword } from '@/lib/api/auth.api';

const createSchema = (t: (key: any, params?: any) => string) => z.object({
  email: z.string().email(t('validation.email')),
});

type FormData = z.infer<ReturnType<typeof createSchema>>;

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const schema = createSchema(t);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSent(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('auth.genericError');
      setError('root', { message });
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <i className="pi pi-envelope text-2xl" />
        </span>
        <h2 className="m-0 text-2xl font-bold text-slate-950 dark:text-slate-50">
          {t('auth.checkInbox')}
        </h2>
        <p className="mx-auto mb-1 mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('auth.resetLinkSentTo')}
        </p>
        <p className="mb-6 text-sm font-semibold text-slate-700 dark:text-slate-300">{submittedEmail}</p>
        <Button type="button" label={t('auth.tryAnotherEmail')} text onClick={() => setSent(false)} />
        <div className="mt-5">
          <Link href="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="m-0 text-3xl font-bold text-slate-950 dark:text-slate-50">
          {t('auth.resetPasswordHeading')}
        </h1>
        <p className="m-0 mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('auth.resetPasswordHelp')}
        </p>
      </div>

      {errors.root?.message && (
        <Message severity="error" text={errors.root.message} className="mb-5 w-full" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
          {errors.email?.message && (
            <small className="mt-1 block text-rose-600 dark:text-rose-400">{errors.email.message}</small>
          )}
        </div>

        <Button
          type="submit"
          label={t('auth.sendResetLink')}
          icon="pi pi-send"
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
