import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getToken, clearToken, authHeaders } from '@/lib/auth';
import { api } from '@/lib/api';
import { getEmergencyBySlug } from '@/lib/emergencies';
import { ResourceCard } from './resource-card';
import { NeedCard } from './need-card';
import { logout } from './actions';

// Always fetch live data — never serve a stale cached page.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const emergency = await getEmergencyBySlug(slug);
  if (!emergency) return { title: 'Emergencia no encontrada · ReliefHub' };
  return {
    title: `Coordinación — ${emergency.name} · ReliefHub`,
    description: `Panel de coordinación de ${emergency.name}.`,
  };
}

export default async function CoordinacionPage({ params }: Props) {
  const { slug } = await params;

  // --- Auth guard -------------------------------------------------------
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  // --- Emergency resolution ---------------------------------------------
  const emergency = await getEmergencyBySlug(slug);
  if (!emergency) {
    notFound();
  }

  const emergencyId = emergency.id;
  const headers = authHeaders(token);

  // --- Fetch coordination queues ----------------------------------------
  const [queueResult, needsResult] = await Promise.all([
    api.GET('/emergencies/{emergencyId}/coordination/queue', {
      params: { path: { emergencyId } },
      headers,
    }),
    api.GET('/emergencies/{emergencyId}/needs/queue', {
      params: { path: { emergencyId } },
      headers,
    }),
  ]);

  // Handle 401 (expired / invalid token) from either call
  if (
    queueResult.response.status === 401 ||
    needsResult.response.status === 401
  ) {
    await clearToken();
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  const resourceQueue = queueResult.data ?? [];
  const needsQueue = needsResult.data ?? [];

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10 bg-white">
      <div className="w-full max-w-xl flex flex-col gap-8">

        {/* ── CABECERA ────────────────────────────────────────────────── */}
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Panel de coordinación
              </h1>
              <p className="text-base text-gray-600 font-medium">
                {emergency.name}
              </p>
            </div>

            {/* Logout button */}
            <form action={logout} className="flex-shrink-0">
              <button
                type="submit"
                className="rounded-lg border-2 border-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        {/* ── RECURSOS PENDIENTES ─────────────────────────────────────── */}
        <section aria-labelledby="resources-heading" className="flex flex-col gap-4">
          <h2
            id="resources-heading"
            className="text-xl font-bold text-gray-900"
          >
            Recursos pendientes
          </h2>

          {resourceQueue.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center">
              <p className="text-base font-semibold text-gray-700">
                No hay recursos pendientes de revisión.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Cuando alguien registre un recurso aparecerá aquí.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4" aria-label="Cola de recursos">
              {resourceQueue.map((resource) => (
                <li key={resource.id}>
                  <ResourceCard resource={resource} slug={slug} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── PETICIONES PENDIENTES ───────────────────────────────────── */}
        <section aria-labelledby="needs-heading" className="flex flex-col gap-4">
          <h2
            id="needs-heading"
            className="text-xl font-bold text-gray-900"
          >
            Peticiones pendientes
          </h2>

          {needsQueue.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center">
              <p className="text-base font-semibold text-gray-700">
                No hay peticiones pendientes de validación.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Las peticiones ciudadanas aparecerán aquí cuando lleguen.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4" aria-label="Cola de peticiones">
              {needsQueue.map((need) => (
                <li key={need.id}>
                  <NeedCard need={need} slug={slug} />
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </main>
  );
}
