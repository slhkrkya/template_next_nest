import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('errors');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div className="mb-8 flex justify-center">
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="20" y="40" width="160" height="100" rx="8" fill="#E2E8F0" />
            <rect x="20" y="40" width="160" height="24" rx="8" fill="#CBD5E1" />
            <circle cx="36" cy="52" r="5" fill="#94A3B8" />
            <circle cx="52" cy="52" r="5" fill="#94A3B8" />
            <circle cx="68" cy="52" r="5" fill="#94A3B8" />
            <rect x="40" y="80" width="120" height="8" rx="4" fill="#94A3B8" />
            <rect x="60" y="96" width="80" height="8" rx="4" fill="#CBD5E1" />
            <rect x="72" y="112" width="56" height="8" rx="4" fill="#CBD5E1" />
            <text
              x="100"
              y="38"
              textAnchor="middle"
              fontSize="48"
              fontWeight="700"
              fill="#475569"
              fontFamily="sans-serif"
            >
              404
            </text>
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">{t('notFoundTitle')}</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          {t('notFoundHomeDescription')}
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary px-6 py-3 rounded-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
