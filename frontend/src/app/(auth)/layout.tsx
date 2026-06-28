import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');

  return {
    title: {
      default: t('authentication'),
      template: `%s | ${t('brand')}`,
    },
  };
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('auth');
  const highlights = [
    [t('realtime'), t('notifications')],
    [t('secure'), t('roleAccess')],
    [t('fast'), t('adminFlows')],
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-primary/10 lg:grid-cols-[1fr_440px]">
        <section className="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="flex items-center gap-3 focus:outline-none">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground text-lg font-black text-primary shadow-lg shadow-primary-foreground/20">
              AP
            </span>
            <span className="text-xl font-semibold tracking-tight">{t('brand')}</span>
          </Link>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              {t('multiTenantOperations')}
            </p>
            <h1 className="m-0 text-5xl font-bold leading-tight tracking-tight">
              {t('heroTitle')}
            </h1>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {highlights.map(([value, label]) => (
                <div key={value} className="rounded-xl border border-white/15 bg-white/10 p-4">
                  <p className="m-0 text-lg font-bold">{value}</p>
                  <p className="m-0 mt-1 text-sm text-primary-foreground/75">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="m-0 text-sm text-primary-foreground/70">
            &copy; {new Date().getFullYear()} {t('brand')}. {t('allRightsReserved')}
          </p>
        </section>

        {/* Right form panel. */}
        <main className="flex min-h-full flex-col justify-center bg-card p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
              AP
            </span>
            <span className="text-lg font-semibold">{t('brand')}</span>
          </div>
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
