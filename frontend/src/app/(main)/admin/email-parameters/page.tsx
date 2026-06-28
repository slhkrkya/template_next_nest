'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { PageHeader } from '@/components/shared/PageHeader';

const createEmailSchema = (t: (key: any, params?: any) => string) => z.object({
  host: z.string().min(1, t('hostRequired')),
  port: z.coerce.number().int().min(1).max(65535, t('portValidation')),
  user: z.string().min(1, t('userRequired')),
  pass: z.string().min(1, t('passwordRequired')),
  fromEmail: z.string().email(t('fromEmailValidation')),
  fromName: z.string().min(1, t('fromNameRequired')),
  secure: z.boolean(),
});

type EmailFormData = z.infer<ReturnType<typeof createEmailSchema>>;

async function getEmailConfig(): Promise<EmailFormData> {
  const res = await axiosInstance.get<EmailFormData>('/email-parameters');
  return res.data;
}

async function saveEmailConfig(data: EmailFormData): Promise<void> {
  await axiosInstance.post('/email-parameters', data);
}

async function sendTestEmail(payload: { to: string }): Promise<{ success: boolean; message: string }> {
  const res = await axiosInstance.post<{ success: boolean; message: string }>('/email-parameters/test', payload);
  return res.data;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600">{message}</small>;
}

export default function EmailParametersPage() {
  const t = useTranslations('emailParameters');
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const configQuery = useQuery({ queryKey: ['email-config'], queryFn: getEmailConfig });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EmailFormData>({
    resolver: zodResolver(createEmailSchema(t)),
    defaultValues: { host: '', port: 587, user: '', pass: '', fromEmail: '', fromName: '', secure: false },
  });

  useEffect(() => {
    if (configQuery.data) reset(configQuery.data);
  }, [configQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: saveEmailConfig,
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const testMutation = useMutation({
    mutationFn: () => sendTestEmail({ to: testEmail }),
    onSuccess: (result) => setTestResult(result),
    onError: (err) => setTestResult({ success: false, message: (err as Error).message }),
  });

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {configQuery.isLoading ? (
        <Card><div className="py-10 text-center text-sm text-muted-foreground">{t('loading')}</div></Card>
      ) : (
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-5">
          <Card title={t('smtpServer')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
              <div>
                <label htmlFor="host" className="mb-2 block text-sm font-semibold text-foreground">{t('host')} <span className="text-rose-600">*</span></label>
                <InputText id="host" {...register('host')} invalid={!!errors.host} className="w-full" placeholder={t('hostPlaceholder')} />
                <FieldError message={errors.host?.message} />
              </div>
              <div>
                <label htmlFor="port" className="mb-2 block text-sm font-semibold text-foreground">{t('port')} <span className="text-rose-600">*</span></label>
                <Controller
                  control={control}
                  name="port"
                  render={({ field }) => (
                    <InputNumber inputId="port" value={field.value} onValueChange={(event) => field.onChange(event.value)} className="w-full" inputClassName="w-full" />
                  )}
                />
                <FieldError message={errors.port?.message} />
              </div>
              <Controller
                control={control}
                name="secure"
                render={({ field }) => (
                  <div>
                    <label htmlFor="secure" className="mb-2 block text-sm font-semibold text-foreground">{t('useTls')}</label>
                    <div className="flex h-11 items-center gap-3">
                      <InputSwitch inputId="secure" checked={field.value} onChange={(event) => field.onChange(event.value)} />
                      <span className="text-sm text-muted-foreground">{field.value ? t('tlsEnabled') : t('plainStarttls')}</span>
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="user" className="mb-2 block text-sm font-semibold text-foreground">{t('username')} <span className="text-rose-600">*</span></label>
                <InputText id="user" {...register('user')} invalid={!!errors.user} className="w-full" autoComplete="username" />
                <FieldError message={errors.user?.message} />
              </div>
              <div>
                <label htmlFor="pass" className="mb-2 block text-sm font-semibold text-foreground">{t('password')} <span className="text-rose-600">*</span></label>
                <Controller
                  control={control}
                  name="pass"
                  render={({ field }) => (
                    <Password
                      inputId="pass"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      feedback={false}
                      toggleMask
                      inputClassName="w-full"
                      className="w-full"
                      invalid={!!errors.pass}
                    />
                  )}
                />
                <FieldError message={errors.pass?.message} />
              </div>
            </div>
          </Card>

          <Card title={t('senderDetails')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="fromEmail" className="mb-2 block text-sm font-semibold text-foreground">{t('fromEmail')} <span className="text-rose-600">*</span></label>
                <InputText id="fromEmail" {...register('fromEmail')} invalid={!!errors.fromEmail} className="w-full" placeholder={t('fromEmailPlaceholder')} />
                <FieldError message={errors.fromEmail?.message} />
              </div>
              <div>
                <label htmlFor="fromName" className="mb-2 block text-sm font-semibold text-foreground">{t('fromName')} <span className="text-rose-600">*</span></label>
                <InputText id="fromName" {...register('fromName')} invalid={!!errors.fromName} className="w-full" placeholder={t('fromNamePlaceholder')} />
                <FieldError message={errors.fromName?.message} />
              </div>
            </div>
          </Card>

          {saveMutation.isError && <Message severity="error" text={(saveMutation.error as Error).message} />}
          {saved && <Message severity="success" text={t('saved')} />}

          <Button
            type="submit"
            label={t('saveConfiguration')}
            icon="pi pi-save"
            loading={saveMutation.isPending}
            disabled={!isDirty}
          />
        </form>
      )}

      <Card title={t('sendTestEmail')} className="mt-5">
        <p className="m-0 mb-4 text-sm text-muted-foreground">
          {t('sendTestHelp')}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-72 flex-1">
            <label htmlFor="testEmail" className="mb-2 block text-sm font-semibold text-foreground">{t('sendTo')}</label>
            <InputText id="testEmail" type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} className="w-full" placeholder={t('testEmailPlaceholder')} />
          </div>
          <Button
            type="button"
            label={t('sendTest')}
            icon="pi pi-send"
            severity="secondary"
            outlined
            disabled={!testEmail}
            loading={testMutation.isPending}
            onClick={() => {
              setTestResult(null);
              testMutation.mutate();
            }}
          />
        </div>
        {testResult && (
          <Message
            severity={testResult.success ? 'success' : 'error'}
            text={testResult.message}
            className="mt-4 w-full"
          />
        )}
      </Card>
    </div>
  );
}
