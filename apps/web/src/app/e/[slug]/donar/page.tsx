import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getEmergencyBySlug } from '@/lib/emergencies';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { OrgSelector } from '@/components/org-selector';
import { LocationPicker } from '@/components/location-picker';
import { submitOffer } from './actions';
import { DonarForm } from './donar-form';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const emergency = await getEmergencyBySlug(slug);

  if (!emergency) {
    return { title: 'Emergencia no encontrada · ReliefHub' };
  }

  return {
    title: `Donar material — ${emergency.name} · ReliefHub`,
    description: `Ofrece material de ayuda para ${emergency.name}.`,
  };
}

export default async function DonarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const token = await getToken();
  if (!token) {
    redirect(`/login?next=/e/${slug}/donar`);
  }

  const emergency = await getEmergencyBySlug(slug);
  if (!emergency) {
    notFound();
  }

  // Resolve optional ?needId= query param
  const rawNeedId =
    typeof resolvedSearchParams.needId === 'string'
      ? resolvedSearchParams.needId.trim()
      : undefined;

  // If a needId is provided, try to resolve the need title from the public list
  let targetNeedTitle: string | undefined;
  if (rawNeedId !== undefined && rawNeedId !== '') {
    const { data: needs } = await api.GET(
      '/emergencies/{emergencyId}/public/needs',
      { params: { path: { emergencyId: emergency.id } } },
    );
    const matched = (needs ?? []).find((n) => n.id === rawNeedId);
    if (matched !== undefined) {
      targetNeedTitle = matched.title;
    }
  }

  const targetNeedId =
    targetNeedTitle !== undefined ? rawNeedId : undefined;

  const boundAction = submitOffer.bind(null, emergency.id);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Donar material
          </h1>
          <p className="text-base text-gray-600">
            {emergency.name} · Describe el material que puedes aportar.
          </p>
        </header>

        <DonarForm
          action={boundAction}
          slug={slug}
          targetNeedTitle={targetNeedTitle}
          targetNeedId={targetNeedId}
          locationPicker={<LocationPicker />}
          orgSelector={<OrgSelector />}
        />
      </div>
    </main>
  );
}
