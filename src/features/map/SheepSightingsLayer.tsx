import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { SightingWithName } from "./useSheepSightings";

interface SheepSightingsLayerProps {
  sightings: SightingWithName[];
  onResolve: (id: string) => void;
}

/** Kompasretninger for visning */
const COMPASS_LABELS: Record<number, string> = {
  0: "N",
  45: "NE",
  90: "E",
  135: "SE",
  180: "S",
  225: "SW",
  270: "W",
  315: "NW",
};

/**
 * Beregner opacity baseret på tid til udløb.
 * Nyoprettede observationer: fuld opacity (0.9).
 * Tæt på udløb: lav opacity (0.25).
 */
function calcOpacity(expiresAt: string): number {
  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  const total = 2 * 60 * 60 * 1000; // 2 timer i ms
  const remaining = expires - now;

  if (remaining <= 0) return 0;
  // Lineær fade fra 0.9 → 0.25
  const ratio = Math.min(remaining / total, 1);
  return 0.25 + ratio * 0.65;
}

/**
 * Finder nærmeste kompasretning-label for en given grad.
 */
function compassLabel(degrees: number): string {
  const keys = [0, 45, 90, 135, 180, 225, 270, 315];
  let closest = 0;
  let minDiff = 360;
  for (const k of keys) {
    const diff = Math.min(Math.abs(degrees - k), 360 - Math.abs(degrees - k));
    if (diff < minDiff) {
      minDiff = diff;
      closest = k;
    }
  }
  return COMPASS_LABELS[closest];
}

/**
 * Viser fåre-observationer som grønne prikker med antal-tooltip.
 * Opacity fader gradvis mod udløbstidspunktet (2 timer).
 * Tap på en prik viser detaljer + "Liðugt"-knap.
 */
export default function SheepSightingsLayer({
  sightings,
  onResolve,
}: SheepSightingsLayerProps) {
  return (
    <>
      {sightings.map((s) => {
        const opacity = calcOpacity(s.expires_at);
        if (opacity <= 0) return null;

        return (
          <CircleMarker
            key={s.id}
            center={[s.latitude, s.longitude]}
            radius={10}
            pathOptions={{
              color: "#fff",
              fillColor: "#22c55e",
              fillOpacity: opacity,
              weight: 2,
              opacity: opacity,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]}>
              {s.count} seyður
            </Tooltip>
            <Popup>
              <div className="min-w-[160px] text-sm">
                <p className="font-semibold text-green-700">
                  {s.count} seyður
                </p>
                {s.direction !== null && (
                  <p className="text-stone-600">
                    Átt: {compassLabel(s.direction)} ({s.direction}°)
                  </p>
                )}
                {s.note && (
                  <p className="text-stone-600">{s.note}</p>
                )}
                <p className="mt-1 text-xs text-stone-400">
                  {s.display_name}
                </p>
                <button
                  onClick={() => {
                    if (window.confirm("Markera hesa athugan sum liðuga?")) {
                      onResolve(s.id);
                    }
                  }}
                  className="mt-2 w-full rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500 active:bg-green-700"
                >
                  Liðugt
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
