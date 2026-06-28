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
  neutral: { icon: Minus, colour: 'text-muted-foreground' },
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
    <Card
      className={classNames(
        'arca-stat-card h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
          <p className="m-0 mt-2.5 text-3xl font-black tabular-nums text-foreground">
            {value}
          </p>
        </div>
        <div
          className={classNames(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md ring-1 ring-inset ring-white/10',
            iconClassName ?? 'bg-primary/15 text-primary',
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>

      {trend && trendConfig && TrendIcon && (
        <div className={classNames('mt-4 flex items-center gap-1.5 text-sm', trendConfig.colour)}>
          <TrendIcon className="h-4 w-4 shrink-0" />
          <span className="font-bold tabular-nums">{trend.value.toFixed(1)}%</span>
          {trend.label && (
            <span className="text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}

      {description && (
        <p className="m-0 mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </Card>
  );
}
