import { useState } from "react";

interface MapActionButtonProps {
  onAddSighting: () => void;
  onAddOrder: () => void;
}

/**
 * Flydende "+"-knap i nederste højre hjørne.
 * Åbner en undermenu med to valg: merkja seyðir eller gev ávísing.
 * 56px touch-target for brug med handsker i regn.
 */
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
    <div className="pointer-events-auto absolute bottom-6 right-4 z-[1001] flex flex-col items-end gap-2">
      {/* Undermenu — vises over knappen */}
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

      {/* Hoved-knap */}
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
