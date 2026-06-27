import { Card } from 'primereact/card';
import { classNames } from 'primereact/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';

interface TrendProps {
  direction: TrendDirection;
  value: number;
  label?: string;
}

interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend?: TrendProps;
  description?: string;
  iconClassName?: string;
  className?: string;
}

const TREND_CONFIG: Record<
  TrendDirection,
  { icon: React.ElementType; colour: string }
> = {
  up: { icon: TrendingUp, colour: 'text-emerald-500 dark:text-emerald-400' },
  down: { icon: TrendingDown, colour: 'text-rose-500 dark:text-rose-400' },
  neutral: { icon: Minus, colour: 'text-slate-500 dark:text-slate-400' },
};

export function StatsCard({
  icon: Icon,
  title,
  value,
  trend,
  description,
  iconClassName,
  className,
}: StatsCardProps) {
  const trendConfig = trend ? TREND_CONFIG[trend.direction] : null;
  const TrendIcon = trendConfig?.icon;

  return (
    <Card className={classNames('arca-stat-card h-full transition hover:-translate-y-0.5 hover:shadow-xl', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 truncate text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="m-0 mt-2 text-3xl font-black tabular-nums text-slate-950 dark:text-slate-50">
            {value}
          </p>
        </div>
        <div
          className={classNames(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm',
            iconClassName ?? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && trendConfig && TrendIcon && (
        <div className={classNames('mt-4 flex items-center gap-1 text-sm', trendConfig.colour)}>
          <TrendIcon className="h-4 w-4 shrink-0" />
          <span className="font-semibold tabular-nums">{trend.value.toFixed(1)}%</span>
          {trend.label && (
            <span className="text-slate-500 dark:text-slate-400">{trend.label}</span>
          )}
        </div>
      )}

      {description && (
        <p className="m-0 mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </Card>
  );
}
