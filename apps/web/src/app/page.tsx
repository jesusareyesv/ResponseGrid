import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DEMO_EMERGENCY_ID } from '@/lib/config';
import { PublicResourceCard } from './public-resource-card';

// Active-resource list must reflect live backend state on every request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Emergencia sísmica — Venezuela · ReliefHub',
  description:
    'Información oficial y puntos activos de ayuda. La forma más eficaz de ayudar es la donación económica a entidades verificadas.',
};

export default async function HomePage() {
  const { data: resources } = await api.GET(
    '/emergencies/{emergencyId}/public/resources',
    { params: { path: { emergencyId: DEMO_EMERGENCY_ID } } },
  );

  // `resources` is undefined only on network/schema error; treat same as empty.
  const activeResources = resources ?? [];

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-white px-4 py-10">
      <div className="w-full max-w-xl flex flex-col gap-10">

        {/* ── 1. CABECERA OFICIAL ───────────────────────────────────────── */}
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Emergencia sísmica — Venezuela
            </h1>
            <span
              aria-label="Estado: emergencia activa"
              className="inline-flex items-center rounded-full border-2 border-red-700 bg-red-50 px-3 py-1 text-sm font-bold text-red-800"
            >
              Emergencia activa
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">
            Fuente oficial · ReliefHub
          </p>
        </header>

        {/* ── 2. DONACIÓN ECONÓMICA (bloque destacado) ─────────────────── */}
        <section
          aria-labelledby="donate-heading"
          className="rounded-lg border-2 border-gray-900 bg-gray-900 p-6 flex flex-col gap-4"
        >
          <h2
            id="donate-heading"
            className="text-xl font-bold text-white leading-snug"
          >
            La forma más eficaz de ayudar ahora
          </h2>
          <p className="text-base text-gray-200">
            La forma más eficaz de ayudar ahora es la{' '}
            <strong>donación económica a entidades verificadas</strong>. Permite
            que los profesionales compren exactamente lo que se necesita, donde
            y cuando se necesita.
          </p>
          {/*
           * TODO: campañas verificadas — enlazar a una lista curada de
           * campañas oficiales (Cruz Roja, ACNUR, etc.) cuando esté disponible.
           * Por ahora href="#" con aria-disabled para señalar la intención.
           */}
          <a
            href="#"
            aria-disabled="true"
            tabIndex={-1}
            className="flex items-center justify-center w-full py-4 px-6 text-lg font-semibold text-gray-900 bg-white rounded-lg border-2 border-white opacity-60 cursor-not-allowed focus:outline-none"
          >
            Donar a entidades verificadas
          </a>
          <p className="text-xs text-gray-400 text-center">
            Próximamente: enlace a campañas verificadas
          </p>
        </section>

        {/* ── 3. QUÉ NO LLEVAR ─────────────────────────────────────────── */}
        <section aria-labelledby="dont-bring-heading" className="flex flex-col gap-4">
          <h2
            id="dont-bring-heading"
            className="text-xl font-bold text-gray-900"
          >
            Qué NO llevar ahora
          </h2>
          <p className="text-sm text-gray-600">
            Enviar material sin coordinar satura la cadena logística y puede
            bloquear la llegada de ayuda profesional.
          </p>
          <ul className="flex flex-col gap-2" role="list">
            {[
              'Ropa usada sin clasificar ni empaquetar.',
              'Medicamentos — deben canalizarse a través de la vía sanitaria autorizada.',
              'Agua embotellada para envío internacional.',
              'Alimentos caseros o con fecha de caducidad próxima.',
              'Material sin destino o punto receptor asignado.',
              'No acudas por tu cuenta a la zona afectada.',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-gray-800"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-900 flex items-center justify-center font-bold text-gray-900 text-xs"
                >
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ── 4. OFRECER UN RECURSO ────────────────────────────────────── */}
        <section aria-labelledby="offer-heading" className="flex flex-col gap-4">
          <h2
            id="offer-heading"
            className="text-xl font-bold text-gray-900"
          >
            ¿Puedes ofrecer un recurso?
          </h2>
          <p className="text-sm text-gray-600">
            Si dispones de un almacén, vehículo de transporte, local o espacio,
            regístralo aquí para que los coordinadores puedan activarlo.
          </p>
          <Link
            href="/registrar"
            className="flex items-center justify-center w-full py-4 px-6 text-lg font-semibold text-white bg-gray-900 rounded-lg border-2 border-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
          >
            Registrar un recurso
          </Link>
        </section>

        {/* ── 5. PUNTOS ACTIVOS ────────────────────────────────────────── */}
        <section aria-labelledby="points-heading" className="flex flex-col gap-4">
          <h2
            id="points-heading"
            className="text-xl font-bold text-gray-900"
          >
            Puntos activos
          </h2>

          {activeResources.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center">
              <p className="text-base font-semibold text-gray-700">
                Aún no hay puntos activos.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Por ahora, la forma más eficaz de ayudar es la donación económica.
              </p>
            </div>
          ) : (
            <ul
              className="flex flex-col gap-3"
              aria-label="Puntos activos verificados"
              role="list"
            >
              {activeResources.map((resource) => (
                <li key={resource.id}>
                  <PublicResourceCard resource={resource} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── 6. PIE ───────────────────────────────────────────────────── */}
        <footer className="border-t border-gray-200 pt-6 flex justify-end">
          <Link
            href="/coordinacion"
            className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
          >
            Acceso de coordinación
          </Link>
        </footer>

      </div>
    </main>
  );
}
