/**
 * HomePage — velkomstsiden der vises på rod-ruten (/).
 *
 * En simpel statisk side der forklarer hvad appen gør
 * og giver brugeren de næste skridt.
 */
export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-stone-800">
        Vælkomin til Fjall
      </h1>
      <p className="text-lg text-stone-600 max-w-xl">
        Fjall er eitt amboð til at samskipa seyðadriv í Føroyum. Her kanst tú
        fylgja drivsfelagum, síggja hvør seyðir eru á kortinum og gera
        ávísingar.
      </p>
      <div className="bg-white rounded-lg border border-stone-200 p-6 max-w-md">
        <h2 className="text-xl font-semibold text-stone-700 mb-2">
          Næstu stig
        </h2>
        <ul className="space-y-2 text-stone-600">
          <li>🔐 Skriva títt navn og byrja</li>
          <li>🗺️ Síggja kortið við GPS-staðseting</li>
          <li>🐑 Velja bólk og samskipa seyðadriv</li>
        </ul>
      </div>
    </div>
  );
}
