import type { components } from '@reliefhub/api-client';
import { VerificationBadge } from '@/components/atoms/verification-badge';
import { StatusLight } from '@/components/atoms/status-light';
import { FreshnessIndicator } from '@/components/atoms/freshness-indicator';
import type { Messages } from '@/i18n/messages/es';
import type { Locale } from '@/i18n';
import { categoryLabel, categoryColor } from '@/lib/categories';

type ResourceViewDto = components['schemas']['ResourceViewDto'];

interface PublicResourceCardProps {
  resource: ResourceViewDto;
  t: Messages['resource_card'];
  tVerification: Messages['verification_badge'];
  tStatusLight: Messages['status_light'];
  locale?: Locale;
}

export function PublicResourceCard({
  resource,
  t,
  tVerification,
  tStatusLight,
  locale = 'es',
}: PublicResourceCardProps) {
  const typeLabels: Record<ResourceViewDto['type'], string> = {
    collection_point: t.type_collection_point,
    delivery_point: t.type_delivery_point,
    collection_and_delivery: t.type_collection_and_delivery,
    warehouse: t.type_warehouse,
    transport: t.type_transport,
    supplier: t.type_supplier,
    venue: t.type_venue,
  };

  // Build the subtitle line: "tipo · ciudad, país" (omit nulls)
  const typeLabel = typeLabels[resource.type];
  const locationParts: string[] = [];
  if (resource.city != null) locationParts.push(resource.city);
  if (resource.country != null) locationParts.push(resource.country);
  const locationText = locationParts.join(', ');

  return (
    <article
      aria-label={t.aria_label.replace('{name}', resource.name)}
      className="flex flex-col gap-2 rounded-lg border-2 border-gray-900 bg-white p-3"
    >
      {/* ── Header: name + badges ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-gray-900 leading-tight">
          {resource.name}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <VerificationBadge level={resource.verificationLevel} t={tVerification} />
          <StatusLight status={resource.publicStatus} t={tStatusLight} />
        </div>
      </div>

      {/* ── Subtitle: type · city, country ──────────────────────────── */}
      <p className="text-xs text-gray-500">
        {typeLabel}
        {locationText !== '' && (
          <>
            <span aria-hidden="true" className="mx-1 text-gray-300">·</span>
            {locationText}
          </>
        )}
      </p>

      {/* ── Accepts chips ───────────────────────────────────────────── */}
      {(resource.accepts ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1" role="list" aria-label={t.accepts_label}>
          {(resource.accepts ?? []).map((slug) => (
            <span
              key={slug}
              role="listitem"
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor(slug)}`}
            >
              {categoryLabel(slug, locale)}
            </span>
          ))}
        </div>
      )}

      {/* ── Meta row: contact / schedule / manager / source / freshness ── */}
      <dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
        {resource.contact != null && (
          <div className="flex items-center gap-1">
            <dt className="font-medium text-gray-500">{t.meta_contact}</dt>
            <dd>{resource.contact}</dd>
          </div>
        )}
        {resource.schedule != null && (
          <div className="flex items-center gap-1">
            <dt className="font-medium text-gray-500">{t.meta_schedule}</dt>
            <dd>{resource.schedule}</dd>
          </div>
        )}
        {resource.manager != null && (
          <div className="flex items-center gap-1">
            <dt className="font-medium text-gray-500">{t.meta_manager}</dt>
            <dd>{resource.manager}</dd>
          </div>
        )}
        {resource.sourceName != null && (
          <div className="flex items-center gap-1">
            <dt className="font-medium text-gray-500">{t.meta_source}</dt>
            <dd>{resource.sourceName}</dd>
          </div>
        )}
      </dl>

      {/* ── Freshness indicator ─────────────────────────────────────── */}
      {resource.externalUpdatedAt != null && (
        <FreshnessIndicator lastVerifiedAt={resource.externalUpdatedAt} />
      )}
    </article>
  );
}
