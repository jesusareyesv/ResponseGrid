import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getEmergencyBySlug } from '@/lib/emergencies';
import { getToken, authHeaders } from '@/lib/auth';
import { submitReport } from './actions';
import { ReportForm } from './report-form';

const API_BASE = process.env.API_URL ?? 'http://localhost:3000';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const emergency = await getEmergencyBySlug(slug);
  if (!emergency) return { title: 'Emergencia no encontrada · ReliefHub' };
  return {
    title: `Enviar parte — ${emergency.name} · ReliefHub`,
    description: `Envía un parte de campo para ${emergency.name}.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function ReportarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/reportar`);
  }

  const emergency = await getEmergencyBySlug(slug);
  if (!emergency) {
    notFound();
  }

  // Fetch my resources for the optional "punto relacionado" selector
  let myResources: Array<{ id: string; name: string }> = [];
  try {
    const res = await fetch(
      `${API_BASE}/emergencies/${emergency.id}/resources/mine`,
      { headers: { ...authHeaders(token), 'Content-Type': 'application/json' } },
    );
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) {
        myResources = data
          .filter(
            (r): r is { id: string; name: string } =>
              typeof r === 'object' &&
              r != null &&
              typeof (r as Record<string, unknown>).id === 'string' &&
              typeof (r as Record<string, unknown>).name === 'string',
          )
          .map((r) => ({ id: r.id, name: r.name }));
      }
    }
  } catch {
    // non-fatal — form still works without point selector
  }

  const prefilledResourceId =
    typeof resolvedSearchParams.resourceId === 'string'
      ? resolvedSearchParams.resourceId
      : undefined;

  const boundAction = submitReport.bind(null, emergency.id);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10 bg-white">
      <div className="w-full max-w-md flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Enviar parte de campo
          </h1>
          <p className="text-base text-gray-600">
            {emergency.name}
          </p>
        </header>

        <ReportForm
          action={boundAction}
          slug={slug}
          myResources={myResources}
          prefilledResourceId={prefilledResourceId}
        />
      </div>
    </main>
  );
}
