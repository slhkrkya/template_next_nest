interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-card/90 p-4 text-card-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 h-1 w-12 rounded-full bg-primary" />
        <h1 className="m-0 truncate text-2xl font-bold tracking-tight text-card-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="m-0 mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
