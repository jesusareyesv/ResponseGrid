import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            ReliefHub
          </h1>
          <p className="text-lg text-gray-600">
            Coordinación de recursos en emergencias
          </p>
        </div>

        <nav className="flex flex-col gap-4">
          <Link
            href="/registrar"
            className="flex items-center justify-center w-full py-4 px-6 text-lg font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
          >
            Ofrecer un recurso
          </Link>

          <Link
            href="/coordinacion"
            className="flex items-center justify-center w-full py-4 px-6 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
          >
            Panel de coordinación
          </Link>
        </nav>
      </div>
    </main>
  );
}
