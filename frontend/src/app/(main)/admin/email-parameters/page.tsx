'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { PageHeader } from '@/components/shared/PageHeader';

const emailSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.coerce.number().int().min(1).max(65535, 'Port must be 1-65535'),
  user: z.string().min(1, 'SMTP username is required'),
  pass: z.string().min(1, 'SMTP password is required'),
  fromEmail: z.string().email('Enter a valid sender email'),
  fromName: z.string().min(1, 'Sender name is required'),
  secure: z.boolean(),
});

type EmailFormData = z.infer<typeof emailSchema>;

async function getEmailConfig(): Promise<EmailFormData> {
  const res = await fetch('/api/admin/email-parameters');
  if (!res.ok) throw new Error('Failed to fetch email configuration');
  return res.json();
}

async function saveEmailConfig(data: EmailFormData): Promise<void> {
  const res = await fetch('/api/admin/email-parameters', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save email configuration');
}

async function sendTestEmail(payload: { to: string }): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/email-parameters/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Test email failed');
  return data;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="mt-1 block text-rose-600">{message}</small>;
}

export default function EmailParametersPage() {
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
    resolver: zodResolver(emailSchema),
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
        title="Email Configuration"
        subtitle="Configure SMTP settings for outbound email delivery."
      />

      {configQuery.isLoading ? (
        <Card><div className="py-10 text-center text-sm text-slate-500">Loading email configuration...</div></Card>
      ) : (
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-5">
          <Card title="SMTP Server">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
              <div>
                <label htmlFor="host" className="mb-2 block text-sm font-semibold text-slate-700">Host</label>
                <InputText id="host" {...register('host')} invalid={!!errors.host} className="w-full" placeholder="smtp.example.com" />
                <FieldError message={errors.host?.message} />
              </div>
              <div>
                <label htmlFor="port" className="mb-2 block text-sm font-semibold text-slate-700">Port</label>
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
                    <label htmlFor="secure" className="mb-2 block text-sm font-semibold text-slate-700">Use TLS/SSL</label>
                    <div className="flex h-11 items-center gap-3">
                      <InputSwitch inputId="secure" checked={field.value} onChange={(event) => field.onChange(event.value)} />
                      <span className="text-sm text-slate-500">{field.value ? 'TLS enabled' : 'Plain / STARTTLS'}</span>
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="user" className="mb-2 block text-sm font-semibold text-slate-700">Username</label>
                <InputText id="user" {...register('user')} invalid={!!errors.user} className="w-full" autoComplete="username" />
                <FieldError message={errors.user?.message} />
              </div>
              <div>
                <label htmlFor="pass" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
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

          <Card title="Sender Details">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="fromEmail" className="mb-2 block text-sm font-semibold text-slate-700">From Email</label>
                <InputText id="fromEmail" {...register('fromEmail')} invalid={!!errors.fromEmail} className="w-full" placeholder="noreply@company.com" />
                <FieldError message={errors.fromEmail?.message} />
              </div>
              <div>
                <label htmlFor="fromName" className="mb-2 block text-sm font-semibold text-slate-700">From Name</label>
                <InputText id="fromName" {...register('fromName')} invalid={!!errors.fromName} className="w-full" placeholder="Acme Corp" />
                <FieldError message={errors.fromName?.message} />
              </div>
            </div>
          </Card>

          {saveMutation.isError && <Message severity="error" text={(saveMutation.error as Error).message} />}
          {saved && <Message severity="success" text="Configuration saved" />}

          <Button
            type="submit"
            label="Save Configuration"
            icon="pi pi-save"
            loading={saveMutation.isPending}
            disabled={!isDirty}
          />
        </form>
      )}

      <Card title="Send Test Email" className="mt-5">
        <p className="m-0 mb-4 text-sm text-slate-500">
          Verify your SMTP settings are working by sending a test message.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-72 flex-1">
            <label htmlFor="testEmail" className="mb-2 block text-sm font-semibold text-slate-700">Send to</label>
            <InputText id="testEmail" type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} className="w-full" placeholder="you@example.com" />
          </div>
          <Button
            type="button"
            label="Send Test"
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
