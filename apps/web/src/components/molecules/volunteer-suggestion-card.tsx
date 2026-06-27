import type { components } from '@reliefhub/api-client';
import { SkillTag } from '@/components/atoms/skill-tag';

type VolunteerSuggestionDto = components['schemas']['VolunteerSuggestionDto'];

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: 'Inmediata',
  this_week: 'Esta semana',
  flexible: 'Flexible',
};

interface VolunteerSuggestionCardProps {
  volunteer: VolunteerSuggestionDto;
  selected: boolean;
  onToggle: (volunteerId: string) => void;
}

export function VolunteerSuggestionCard({
  volunteer,
  selected,
  onToggle,
}: VolunteerSuggestionCardProps) {
  const availabilityLabel =
    AVAILABILITY_LABELS[volunteer.availability] ?? volunteer.availability;

  return (
    <article
      aria-label={`Voluntario sugerido: ${volunteer.name}`}
      className={`flex flex-col gap-3 rounded-lg border-2 p-4 transition-colors ${
        selected
          ? 'border-gray-900 bg-gray-50'
          : 'border-gray-200 bg-white hover:border-gray-400'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-base font-bold text-gray-900 leading-tight">
            {volunteer.name}
          </h4>
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span>
              <span className="font-medium">Disponibilidad:</span>{' '}
              {availabilityLabel}
            </span>
            {volunteer.hasVehicle && (
              <>
                <span aria-hidden="true" className="text-gray-300">·</span>
                <span className="font-medium">Con vehículo</span>
              </>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => onToggle(volunteer.volunteerId)}
          aria-pressed={selected}
          aria-label={
            selected
              ? `Deseleccionar a ${volunteer.name}`
              : `Seleccionar a ${volunteer.name}`
          }
          className={`flex-shrink-0 rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
            selected
              ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-700'
              : 'border-gray-900 bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          {selected ? 'Seleccionado' : 'Seleccionar'}
        </button>
      </div>

      {/* Skills */}
      {volunteer.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Habilidades">
          {volunteer.skills.map((skill) => (
            <SkillTag key={skill} skill={skill} />
          ))}
        </div>
      )}
    </article>
  );
}
