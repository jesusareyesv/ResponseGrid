import { Badge } from '@/components/atoms/badge';

export type VerificationLevel = 'unverified' | 'verified' | 'official';

interface VerificationBadgeProps {
  level: VerificationLevel;
  className?: string;
}

const CONFIG: Record<
  VerificationLevel,
  { variant: 'verification-official' | 'verification-verified' | 'unverified'; label: string; icon: string }
> = {
  official: {
    variant: 'verification-official',
    label: 'Oficial',
    icon: '🏛️',
  },
  verified: {
    variant: 'verification-verified',
    label: 'Verificado',
    icon: '🟢',
  },
  unverified: {
    variant: 'unverified',
    label: 'Sin verificar',
    icon: '🔵',
  },
};

/**
 * VerificationBadge — visual indicator for resource trust level.
 *
 * Renders as a <span> so it can be used inline inside flex rows.
 * Accessible: aria-label describes both the type and value.
 */
export function VerificationBadge({ level, className }: VerificationBadgeProps) {
  const { variant, label, icon } = CONFIG[level];
  return (
    <Badge
      variant={variant}
      aria-label={`Nivel de confianza: ${label}`}
      className={className}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </Badge>
  );
}
