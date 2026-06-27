import Link from 'next/link';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function UnauthorizedPage() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-8 max-w-md text-center">
        {/* Icon illustration */}
        <div className="relative flex items-center justify-center">
          <div className="h-32 w-32 rounded-full bg-destructive/10 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-destructive/15 flex items-center justify-center">
              <ShieldOff
                className="h-10 w-10 text-destructive"
                strokeWidth={1.5}
              />
            </div>
          </div>
          {/* Error code bubble */}
          <span className="absolute -top-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow-md">
            403
          </span>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('errors.accessDenied')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t('errors.accessDeniedDescription')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1"
          >
            {t('errors.goToDashboard')}
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-muted px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.goBack')}
          </Link>
        </div>
      </div>
    </div>
  );
}
