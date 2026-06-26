'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas las categorías' },
  { value: 'food', label: 'Alimentos' },
  { value: 'water', label: 'Agua' },
  { value: 'hygiene', label: 'Higiene' },
  { value: 'medical', label: 'Sanitario' },
  { value: 'shelter', label: 'Refugio' },
  { value: 'tools', label: 'Herramientas' },
  { value: 'other', label: 'Otro' },
] as const;

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
] as const;

export function NeedsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') ?? '';
  const currentPriority = searchParams.get('priority') ?? '';

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="Filtros de peticiones">
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        <span>Categoría</span>
        <select
          value={currentCategory}
          onChange={(e) => updateParam('category', e.target.value)}
          className="rounded-lg border-2 border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          aria-label="Filtrar por categoría"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        <span>Prioridad</span>
        <select
          value={currentPriority}
          onChange={(e) => updateParam('priority', e.target.value)}
          className="rounded-lg border-2 border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          aria-label="Filtrar por prioridad"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
