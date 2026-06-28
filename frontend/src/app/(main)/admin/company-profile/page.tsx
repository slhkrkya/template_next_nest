'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

const profileSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

async function getCompanyProfile(): Promise<CompanyProfile> {
  const res = await fetch('/api/admin/company-profile');
  if (!res.ok) throw new Error('Failed to fetch company profile');
  return res.json();
}

async function updateCompanyProfile(data: { name: string; logoUrl?: string | null }): Promise<CompanyProfile> {
  const res = await fetch('/api/admin/company-profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update company profile');
  return res.json();
}

async function uploadLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('logo', file);
  const res = await fetch('/api/admin/company-profile/logo', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to upload logo');
  return res.json();
}

function statusSeverity(status: CompanyProfile['subscriptionStatus']) {
  if (status === 'active') return 'success' as const;
  if (status === 'trial') return 'warning' as const;
  if (status === 'expired') return 'danger' as const;
  return 'secondary' as const;
}

export default function CompanyProfilePage() {
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
    resolver: zodResolver(profileSchema),
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
        title="Company Profile"
        subtitle="Manage your tenant identity and review subscription details."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Identity">
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
              <span className="text-sm font-semibold text-slate-700">
                {logoFile ? logoFile.name : 'Click or drag to upload logo'}
              </span>
              <span className="text-xs text-slate-400">PNG, JPG, SVG or WebP. Max 2 MB.</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />

            {profileQuery.isLoading ? (
              <div className="text-sm text-slate-500">Loading profile...</div>
            ) : (
              <div>
                <label htmlFor="company-name" className="mb-2 block text-sm font-semibold text-slate-700">
                  Company Name
                </label>
                <InputText
                  id="company-name"
                  {...register('name')}
                  invalid={!!errors.name}
                  className="w-full"
                  placeholder="Acme Corporation"
                />
                {errors.name && <small className="mt-1 block text-rose-600">{errors.name.message}</small>}
              </div>
            )}

            {saveMutation.isError && <Message severity="error" text={(saveMutation.error as Error).message} />}
            {saved && <Message severity="success" text="Saved" />}

            <Button
              type="submit"
              label="Save Changes"
              icon="pi pi-save"
              loading={saveMutation.isPending}
              disabled={!isFormDirty}
            />
          </form>
        </Card>

        <Card title="Subscription">
          {profileQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading subscription...</div>
          ) : profile ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="m-0 text-xs font-semibold uppercase text-slate-500">Plan</p>
                  <p className="m-0 mt-2 text-lg font-bold text-slate-950 dark:text-slate-50">{profile.subscriptionPlan}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="m-0 text-xs font-semibold uppercase text-slate-500">Status</p>
                  <div className="mt-2">
                    <Tag value={profile.subscriptionStatus} severity={statusSeverity(profile.subscriptionStatus)} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="m-0 text-xs font-semibold uppercase text-slate-500">Expires</p>
                <p className="m-0 mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {profile.subscriptionExpiresAt
                    ? format(new Date(profile.subscriptionExpiresAt), 'MMMM d, yyyy')
                    : 'No expiry date'}
                </p>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm text-slate-500">
                  <span>User seats</span>
                  <span>{profile.currentUsers} / {profile.maxUsers}</span>
                </div>
                <ProgressBar value={usagePct} />
              </div>
              <p className="m-0 text-sm text-slate-500">
                Member since {format(new Date(profile.createdAt), 'MMMM yyyy')}.
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
