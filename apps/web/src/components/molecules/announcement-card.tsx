/**
 * AnnouncementCard — displays the official coordinator announcement alongside
 * the last-updated timestamp.  Renders nothing when announcement is null.
 */

import { RelativeTime } from '@/components/atoms/relative-time';

interface AnnouncementCardProps {
  announcement: string | null;
  updatedAt: string;
}

export function AnnouncementCard({ announcement, updatedAt }: AnnouncementCardProps) {
  if (announcement === null) {
    return (
      <p className="text-xs text-gray-400">
        Última actualización:{' '}
        <RelativeTime isoString={updatedAt} />
      </p>
    );
  }

  return (
    <aside
      aria-label="Comunicado oficial"
      className="flex flex-col gap-2 rounded-lg border-2 border-gray-900 bg-gray-50 px-5 py-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Comunicado oficial
      </p>
      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
        {announcement}
      </p>
      <p className="text-xs text-gray-400">
        Última actualización:{' '}
        <RelativeTime isoString={updatedAt} />
      </p>
    </aside>
  );
}
