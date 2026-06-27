'use client';

/**
 * Discrete notice shown when a form draft has been restored from localStorage.
 * Atom — no interactivity; purely informational.
 */
export function DraftRestoredBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500"
    >
      Borrador restaurado
    </div>
  );
}
