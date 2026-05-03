/**
 * TripControlPanel — viser tur-status som overlay på kortet.
 *
 * Forenklet design:
 * - Aktiv tur → grøn prik + "Optekur..." + varighed + stansa-knap (kun for starter)
 * - Ingen tur → ingenting (turen startes automatisk af MapPage)
 *
 * Alle ser turens status, men kun den der startede kan stoppe.
 */
import { useState, useEffect } from "react";
import type { Trip } from "../../types/database";

interface TripControlPanelProps {
  activeTrip: Trip | null;
  currentUserId: string | null;
  onEndTrip: () => Promise<boolean>;
}

/**
 * Formatterer en varighed fra millisekunder til "Xt Ym"-format.
 * F.eks. 3_660_000 ms → "1t 1m"
 */
function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}t ${minutes}m`;
  return `${minutes}m`;
}

export default function TripControlPanel({
  activeTrip,
  currentUserId,
  onEndTrip,
}: TripControlPanelProps) {
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState("");

  // Opdatér varighedsindikator hvert minut
  useEffect(() => {
    if (!activeTrip) {
      setElapsed("");
      return;
    }

    function updateElapsed() {
      const start = new Date(activeTrip!.started_at).getTime();
      setElapsed(formatDuration(Date.now() - start));
    }

    updateElapsed();
    const intervalId = setInterval(updateElapsed, 60_000);
    return () => clearInterval(intervalId);
  }, [activeTrip]);

  const handleEnd = async () => {
    if (!window.confirm("Ert tú vís/ur? Tú stansa túrin fyri alla.")) return;
    setLoading(true);
    await onEndTrip();
    setLoading(false);
  };

  // Vis ingenting når der ingen aktiv tur er (den startes automatisk)
  if (!activeTrip) return null;

  // Kan den aktuelle bruger stoppe turen?
  const canEnd = currentUserId === activeTrip.started_by;

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      {/* Grøn pulserende prik */}
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
      </span>

      <span className="text-sm font-medium text-stone-700">
        Optekur... {elapsed && <span className="text-stone-500">({elapsed})</span>}
      </span>

      {canEnd && (
        <button
          onClick={handleEnd}
          disabled={loading}
          className="ml-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow active:bg-red-700 hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? "..." : "Stansa"}
        </button>
      )}
    </div>
  );
}
