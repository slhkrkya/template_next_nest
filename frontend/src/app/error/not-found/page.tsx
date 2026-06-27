import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function NotFoundPage() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-8 max-w-md text-center">
        {/* Illustration */}
        <svg
          viewBox="0 0 240 160"
          className="w-64 h-auto"
          aria-hidden="true"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ground */}
          <ellipse cx="120" cy="148" rx="90" ry="8" fill="currentColor" className="text-muted/30" />

          {/* Number 4 left */}
          <text
            x="12"
            y="120"
            fontSize="100"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            fill="currentColor"
            className="text-muted-foreground/20"
          >
            4
          </text>

          {/* Number 4 right */}
          <text
            x="152"
            y="120"
            fontSize="100"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            fill="currentColor"
            className="text-muted-foreground/20"
          >
            4
          </text>

          {/* Zero / magnifying glass frame */}
          <circle cx="120" cy="72" r="44" stroke="currentColor" strokeWidth="10" className="text-muted-foreground/30" />
          <circle cx="120" cy="72" r="28" fill="currentColor" className="text-muted/20" />

          {/* Magnifying glass handle */}
          <line x1="152" y1="104" x2="172" y2="128" stroke="currentColor" strokeWidth="10" strokeLinecap="round" className="text-muted-foreground/30" />

          {/* Question mark */}
          <text
            x="108"
            y="88"
            fontSize="32"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            fill="currentColor"
            className="text-muted-foreground/50"
          >
            ?
          </text>
        </svg>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {t('errors.notFoundTitle')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t('errors.notFoundLongDescription')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
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
