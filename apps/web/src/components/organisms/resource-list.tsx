'use client';

/**
 * ResourceList — paginated "load more" list of public resources.
 *
 * Starts with the `initialItems` fetched server-side (page 1).
 * Each "Cargar más" click fetches the next page from the client using the
 * typed API client and appends results (no full page reload).
 */

import { useState, useTransition } from 'react';
import { createResponseGridClient } from '@reliefhub/api-client';
import type { components } from '@reliefhub/api-client';
import { PublicResourceCard } from '@/components/organisms/public-resource-card';
import { EmptyState } from '@/components/molecules/empty-state';
import type { Messages } from '@/i18n/messages/es';
import type { Locale } from '@/i18n';

type ResourceViewDto = components['schemas']['ResourceViewDto'];

const LIMIT = 50;

interface ResourceListProps {
  emergencyId: string;
  initialItems: ResourceViewDto[];
  total: number;
  t: Messages['resource_card'];
  tVerification: Messages['verification_badge'];
  tStatusLight: Messages['status_light'];
  tList: Messages['resource_list'];
  tEmpty: { title: string; description?: string };
  locale: Locale;
}

export function ResourceList({
  emergencyId,
  initialItems,
  total,
  t,
  tVerification,
  tStatusLight,
  tList,
  tEmpty,
  locale,
}: ResourceListProps) {
  const [items, setItems] = useState<ResourceViewDto[]>(initialItems);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const hasMore = items.length < total;

  function handleLoadMore() {
    startTransition(async () => {
      const nextPage = page + 1;
      const client = createResponseGridClient(
        process.env.NEXT_PUBLIC_API_URL ?? '',
      );
      const { data } = await client.GET(
        '/emergencies/{emergencyId}/public/resources',
        {
          params: {
            path: { emergencyId },
            query: { page: nextPage, limit: LIMIT },
          },
        },
      );
      if (data != null) {
        setItems((prev) => [...prev, ...data.items]);
        setPage(nextPage);
      }
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState title={tEmpty.title} description={tEmpty.description} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary line */}
      <p className="text-xs text-gray-500">
        {tList.showing
          .replace('{shown}', String(items.length))
          .replace('{total}', String(total))}
      </p>

      <ul
        className="flex flex-col gap-3"
        aria-label={tList.aria_label}
        role="list"
      >
        {items.map((resource) => (
          <li key={resource.id}>
            <PublicResourceCard
              resource={resource}
              t={t}
              tVerification={tVerification}
              tStatusLight={tStatusLight}
              locale={locale}
            />
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isPending}
          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isPending ? tList.loading : tList.load_more}
        </button>
      )}
    </div>
  );
}
