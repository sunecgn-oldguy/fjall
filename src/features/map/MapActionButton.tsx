/**
 * MapActionButton — flydende "+" knap i nederste højre hjørne af kortet.
 *
 * Dette er et "FAB" (Floating Action Button) — et velkendt mobil-designmønster
 * hvor en rund knap svæver over indholdet og giver hurtig adgang til hovedhandlinger.
 *
 * Klik på knappen åbner en undermenu med to valg:
 * - 🐑 Merkja seyðir (opret fåre-observation)
 * - 📍 Gev ávísing (opret ordre)
 *
 * Knappen roterer 45° når menuen er åben (+ → ×).
 * 56px touch-target sikrer at knappen er nem at ramme med handsker.
 */
import { useState } from "react";

interface MapActionButtonProps {
  onAddSighting: () => void;
  onAddOrder: () => void;
}

export default function MapActionButton({
  onAddSighting,
  onAddOrder,
}: MapActionButtonProps) {
  const [open, setOpen] = useState(false);

  function handleSighting() {
    setOpen(false);
    onAddSighting();
  }

  function handleOrder() {
    setOpen(false);
    onAddOrder();
  }

  return (
    <div className="pointer-events-auto absolute bottom-20 right-4 z-[1001] flex flex-col items-end gap-2">
      {/* Undermenu — vises over hovedknappen */}
      {open && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSighting}
            className="flex h-12 items-center gap-2 rounded-full bg-green-600 px-4 text-sm font-medium text-white shadow-lg hover:bg-green-500 active:bg-green-700"
          >
            <span className="text-lg">🐑</span>
            Merkja seyðir
          </button>
          <button
            onClick={handleOrder}
            className="flex h-12 items-center gap-2 rounded-full bg-orange-500 px-4 text-sm font-medium text-white shadow-lg hover:bg-orange-400 active:bg-orange-600"
          >
            <span className="text-lg">📍</span>
            Gev ávísing
          </button>
        </div>
      )}

      {/* Hovedknap — roterer 45° når åben (+ bliver ×) */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg transition-transform ${
          open
            ? "rotate-45 bg-stone-600 hover:bg-stone-500 active:bg-stone-700"
            : "bg-stone-800 hover:bg-stone-700 active:bg-stone-900"
        }`}
        aria-label={open ? "Lat aftur" : "Nýtt"}
      >
        +
      </button>
    </div>
  );
}
