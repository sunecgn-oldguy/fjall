/**
 * AddSightingPanel — bottom-panel til at oprette en ny fåre-observation.
 *
 * Vises efter brugeren har trykket på kortet for at vælge position.
 * Panelet glider op fra bunden og indeholder:
 * - Antal-vælger med +/- knapper (store touch-targets til handsker)
 * - 8 kompasretninger som runde knapper
 * - Frivilligt note-felt
 * - Gem/Annullér knapper
 */
import { useState } from "react";

/** De 8 kompasretninger brugeren kan vælge */
const DIRECTIONS = [
  { label: "N", value: 0 },
  { label: "NE", value: 45 },
  { label: "E", value: 90 },
  { label: "SE", value: 135 },
  { label: "S", value: 180 },
  { label: "SW", value: 225 },
  { label: "W", value: 270 },
  { label: "NW", value: 315 },
] as const;

interface AddSightingPanelProps {
  onSubmit: (data: {
    count: number;
    direction: number | null;
    note: string;
  }) => void;
  onCancel: () => void;
}

export default function AddSightingPanel({
  onSubmit,
  onCancel,
}: AddSightingPanelProps) {
  const [count, setCount] = useState(1);
  const [direction, setDirection] = useState<number | null>(null);
  const [note, setNote] = useState("");

  function handleSubmit() {
    onSubmit({ count, direction, note });
  }

  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-[1001] rounded-t-2xl bg-white p-4 shadow-lg">
      <h3 className="mb-3 text-center text-lg font-semibold text-stone-800">
        Merkja seyðir
      </h3>

      {/* Antal-vælger: store +/- knapper der er nemme at ramme med handsker */}
      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium text-stone-600">
          Antal
        </label>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl font-bold text-stone-700 hover:bg-stone-200 active:bg-stone-300"
          >
            -
          </button>
          <span className="min-w-[3rem] text-center text-3xl font-bold text-stone-800">
            {count}
          </span>
          <button
            onClick={() => setCount((c) => c + 1)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl font-bold text-stone-700 hover:bg-stone-200 active:bg-stone-300"
          >
            +
          </button>
        </div>
      </div>

      {/* Kompasretning — tryk for at vælge, tryk igen for at fravælge */}
      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium text-stone-600">
          Átt (valfrítt)
        </label>
        <div className="flex flex-wrap justify-center gap-2">
          {DIRECTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() =>
                setDirection((prev) => (prev === d.value ? null : d.value))
              }
              className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-medium ${
                direction === d.value
                  ? "bg-green-600 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frivillig note */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-stone-600">
          Viðmerking (valfrítt)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="T.d. 'við ána' ella 'á vegnum'"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      {/* Handlingsknapper */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 active:bg-stone-100"
        >
          Angra
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-500 active:bg-green-700"
        >
          Goym
        </button>
      </div>
    </div>
  );
}
