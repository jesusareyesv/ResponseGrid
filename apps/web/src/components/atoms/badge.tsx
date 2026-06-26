import type { HTMLAttributes } from 'react';

type BadgeVariant =
  | 'active'
  | 'unverified'
  | 'role-owner'
  | 'role-member'
  | 'verification-official'
  | 'verification-verified';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  active:
    'inline-flex items-center rounded-full border-2 border-red-700 bg-red-50 px-3 py-0.5 text-xs font-bold text-red-800',
  unverified:
    'inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 flex-shrink-0',
  'role-owner':
    'inline-flex items-center rounded-full border border-gray-900 bg-gray-900 px-2.5 py-0.5 text-xs font-semibold text-white',
  'role-member':
    'inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600',
  'verification-official':
    'inline-flex items-center gap-1 rounded-full border-2 border-amber-600 bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800 flex-shrink-0',
  'verification-verified':
    'inline-flex items-center gap-1 rounded-full border border-green-400 bg-green-50 px-3 py-1 text-sm font-semibold text-green-800 flex-shrink-0',
};

export function Badge({ variant, className = '', children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
