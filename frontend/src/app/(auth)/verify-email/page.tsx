'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { verifyEmail } from '@/lib/api/auth.api';

type VerifyStatus = 'pending' | 'success' | 'error';

export default function VerifyEmailPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const startedRef = useRef(false);
  const [status, setStatus] = useState<VerifyStatus>('pending');
  const [message, setMessage] = useState(t('verifyEmailAddress'));

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!token) {
      setStatus('error');
      setMessage(t('verifyMissing'));
      return;
    }

    verifyEmail(token)
      .then((response) => {
        setStatus('success');
        setMessage(response.message);
      })
      .catch((err: unknown) => {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t('verifyInvalidOrExpired');
        setStatus('error');
        setMessage(errorMessage);
      });
  }, [t, token]);

  const isPending = status === 'pending';
  const isSuccess = status === 'success';

  return (
    <div className="text-center">
      <span
        className={
          isPending
            ? 'mx-auto mb-5 flex h-16 w-16 items-center justify-center'
            : isSuccess
              ? 'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'
              : 'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600'
        }
      >
        {isPending ? (
          <ProgressSpinner style={{ width: 56, height: 56 }} strokeWidth="4" />
        ) : (
          <i className={isSuccess ? 'pi pi-check text-2xl' : 'pi pi-times text-2xl'} />
        )}
      </span>

      <h2 className="m-0 text-2xl font-bold text-slate-950 dark:text-slate-50">
        {isPending ? t('verifyEmailTitle') : isSuccess ? t('verifySuccessTitle') : t('verifyFailedTitle')}
      </h2>
      <p className="mx-auto my-5 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>

      {!isPending && (
        <Link href="/login">
          <Button type="button" label={t('backToSignIn')} icon="pi pi-arrow-left" />
        </Link>
      )}
    </div>
  );
}
