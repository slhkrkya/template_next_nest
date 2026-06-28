'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { PageHeader } from '@/components/shared/PageHeader';

interface CompanyProfile {
  id: string;
  name: string;
  logoUrl: string | null;
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'cancelled';
  subscriptionExpiresAt: string | null;
  maxUsers: number;
  currentUsers: number;
  createdAt: string;
}

const createProfileSchema = (t: (key: any, params?: any) => string) => z.object({
  name: z.string().min(1, t('companyNameRequired')),
});

type ProfileFormData = z.infer<ReturnType<typeof createProfileSchema>>;

async function getCompanyProfile(): Promise<CompanyProfile> {
  const res = await axiosInstance.get<CompanyProfile>('/tenants/me');
  return res.data;
}

async function updateCompanyProfile(data: { name: string; logoUrl?: string | null }): Promise<CompanyProfile> {
  const res = await axiosInstance.patch<CompanyProfile>('/tenants/me', data);
  return res.data;
}

async function uploadLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('logo', file);
  const res = await axiosInstance.post<{ url: string }>('/tenants/me/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

function statusSeverity(status: CompanyProfile['subscriptionStatus']) {
  if (status === 'active') return 'success' as const;
  if (status === 'trial') return 'warning' as const;
  if (status === 'expired') return 'danger' as const;
  return 'secondary' as const;
}

export default function CompanyProfilePage() {
  const t = useTranslations('companyProfile');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const profileQuery = useQuery({ queryKey: ['company-profile'], queryFn: getCompanyProfile });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(createProfileSchema(t)),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({ name: profileQuery.data.name });
      setPreviewUrl(profileQuery.data.logoUrl);
    }
  }, [profileQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      let logoUrl: string | null | undefined;
      if (logoFile) {
        const uploadResult = await uploadLogo(logoFile);
        logoUrl = uploadResult.url;
      }
      return updateCompanyProfile({ name: data.name, ...(logoUrl !== undefined ? { logoUrl } : {}) });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['company-profile'], updated);
      setLogoFile(null);
      reset({ name: updated.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const profile = profileQuery.data;
  const isFormDirty = isDirty || !!logoFile;
  const usagePct = profile ? Math.round((profile.currentUsers / profile.maxUsers) * 100) : 0;

  function handleFile(file: File) {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setPreviewUrl(event.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={t('identity')}>
          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-5">
            <button
              type="button"
              className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50"
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
            >
              <Avatar
                image={previewUrl ?? undefined}
                icon={previewUrl ? undefined : 'pi pi-building'}
                size="xlarge"
                shape="square"
                className="bg-primary/10 text-primary"
              />
              <span className="text-sm font-semibold text-foreground">
                {logoFile ? logoFile.name : t('uploadLogo')}
              </span>
              <span className="text-xs text-muted-foreground">{t('logoHelp')}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />

            {profileQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">{t('loadingProfile')}</div>
            ) : (
              <div>
                <label htmlFor="company-name" className="mb-2 block text-sm font-semibold text-foreground">
                  {t('companyName')} <span className="text-rose-600">*</span>
                </label>
                <InputText
                  id="company-name"
                  {...register('name')}
                  invalid={!!errors.name}
                  className="w-full"
                  placeholder={t('companyNamePlaceholder')}
                />
                {errors.name && <small className="mt-1 block text-rose-600">{errors.name.message}</small>}
              </div>
            )}

            {saveMutation.isError && <Message severity="error" text={(saveMutation.error as Error).message} />}
            {saved && <Message severity="success" text={commonT('saved')} />}

            <Button
              type="submit"
              label={commonT('saveChanges')}
              icon="pi pi-save"
              loading={saveMutation.isPending}
              disabled={!isFormDirty}
            />
          </form>
        </Card>

        <Card title={t('subscription')}>
          {profileQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('loadingSubscription')}</div>
          ) : profile ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-4">
                  <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">{t('plan')}</p>
                  <p className="m-0 mt-2 text-lg font-bold text-foreground">{profile.subscriptionPlan}</p>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">{commonT('status')}</p>
                  <div className="mt-2">
                    <Tag value={profile.subscriptionStatus} severity={statusSeverity(profile.subscriptionStatus)} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">{t('expires')}</p>
                <p className="m-0 mt-2 text-sm font-semibold text-foreground">
                  {profile.subscriptionExpiresAt
                    ? format(new Date(profile.subscriptionExpiresAt), 'MMMM d, yyyy')
                    : t('noExpiryDate')}
                </p>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                  <span>{t('userSeats')}</span>
                  <span>{profile.currentUsers} / {profile.maxUsers}</span>
                </div>
                <ProgressBar value={usagePct} />
              </div>
              <p className="m-0 text-sm text-muted-foreground">
                {t('memberSince', { date: format(new Date(profile.createdAt), 'MMMM yyyy') })}
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
