/**
 * StatusBanner — prominent banner shown when an emergency is paused or closed.
 * Renders nothing when status is 'active'.
 */

interface StatusBannerProps {
  status: 'active' | 'paused' | 'closed';
}

export function StatusBanner({ status }: StatusBannerProps) {
  if (status === 'active') return null;

  const isPaused = status === 'paused';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex flex-col gap-1 rounded-lg border-2 px-5 py-4',
        isPaused
          ? 'border-amber-500 bg-amber-50 text-amber-900'
          : 'border-gray-400 bg-gray-100 text-gray-700',
      ].join(' ')}
    >
      <p className="text-base font-bold leading-snug">
        {isPaused
          ? '⏸ Recogidas en pausa — solo información'
          : '🔒 Emergencia cerrada'}
      </p>
      <p className="text-sm">
        {isPaused
          ? 'En este momento no se admiten nuevas altas de recursos ni peticiones. Consulta la información disponible y vuelve más tarde.'
          : 'Esta emergencia ha concluido. Ya no se aceptan recursos ni peticiones.'}
      </p>
    </div>
  );
}
