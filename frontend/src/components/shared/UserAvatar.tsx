import { cn } from '@/lib/utils';

type StatusIndicator = 'online' | 'offline' | 'away' | 'busy';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: StatusIndicator;
  className?: string;
  /** Alt text for the image; defaults to the user's name */
  alt?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const STATUS_CLASSES: Record<StatusIndicator, string> = {
  online: 'bg-green-500',
  offline: 'bg-muted-foreground',
  away: 'bg-yellow-400',
  busy: 'bg-red-500',
};

const STATUS_DOT_SIZE: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
};

/**
 * Derive up to two initials from a display name.
 */
function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function UserAvatar({
  src,
  name,
  initials,
  size = 'md',
  status,
  className,
  alt,
}: UserAvatarProps) {
  const displayInitials = initials ?? getInitials(name);
  const sizeClass = SIZE_CLASSES[size];
  const dotSizeClass = STATUS_DOT_SIZE[size];

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? name ?? 'User avatar'}
          className={cn(
            'rounded-full object-cover ring-2 ring-background',
            sizeClass,
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full ring-2 ring-background flex items-center justify-center bg-primary font-semibold text-primary-foreground select-none',
            sizeClass,
          )}
          aria-label={alt ?? name ?? 'User avatar'}
          role="img"
        >
          {displayInitials}
        </div>
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            dotSizeClass,
            STATUS_CLASSES[status],
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
