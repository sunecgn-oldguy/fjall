/**
 * SheepSightingsLayer — viser fåre-observationer som grønne prikker på kortet.
 *
 * Hver observation viser antal får som permanent label.
 * Tryk på en prik åbner en popup med detaljer + "Liðugt"-knap.
 *
 * Opacity (gennemsigtighed) fader gradvis over 2 timer:
 * - Ny observation: næsten fuld opacity (0.9)
 * - Tæt på udløb: svag opacity (0.25)
 * - Udløbet: usynlig (0)
 * Dette giver et visuelt hint om hvor "frisk" informationen er.
 */
import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { SightingWithName } from "./useSheepSightings";

interface SheepSightingsLayerProps {
  sightings: SightingWithName[];
  onResolve: (id: string) => void;
}

/** Kompasretnings-labels brugt i popup-detaljer */
const COMPASS_LABELS: Record<number, string> = {
  0: "N", 45: "NE", 90: "E", 135: "SE",
  180: "S", 225: "SW", 270: "W", 315: "NW",
};

/**
 * Beregner opacity baseret på tid til udløb.
 * Lineær interpolation fra 0.9 (ny) til 0.25 (tæt på udløb).
 */
function calcOpacity(expiresAt: string): number {
  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  const total = 2 * 60 * 60 * 1000; // 2 timer i millisekunder
  const remaining = expires - now;

  if (remaining <= 0) return 0;
  const ratio = Math.min(remaining / total, 1); // 0 = udløbet, 1 = helt ny
  return 0.25 + ratio * 0.65; // Mapper til 0.25–0.90
}

/** Finder nærmeste kompasretning for en given grad (f.eks. 47° → "NE") */
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

export default function SheepSightingsLayer({
  sightings,
  onResolve,
}: SheepSightingsLayerProps) {
  return (
    <>
      {sightings.map((s) => {
        const opacity = calcOpacity(s.expires_at);
        if (opacity <= 0) return null; // Udløbet — vis ikke

        return (
          <CircleMarker
            key={s.id}
            center={[s.latitude, s.longitude]}
            radius={10}
            pathOptions={{
              color: "#fff",
              fillColor: "#22c55e",  // Grøn = fåre-observation
              fillOpacity: opacity,
              weight: 2,
              opacity: opacity,
            }}
          >
            {/* Antal-label — altid synlig */}
            <Tooltip permanent direction="top" offset={[0, -12]}>
              {s.count} seyður
            </Tooltip>
            {/* Popup med detaljer — åbnes ved tryk */}
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
