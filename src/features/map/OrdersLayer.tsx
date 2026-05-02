/**
 * OrdersLayer — viser ordrer/ávísingar som orange prikker på kortet.
 *
 * Ordrer er "gå hertil"-kommandoer med en position og en besked.
 * Prikken er større og har tykkere kant hvis ordren er tildelt den aktuelle bruger.
 *
 * Popup viser:
 * - Ordrebesked
 * - Hvem der oprettede den og hvem den er tildelt
 * - Status-knapper afhængig af ordre-status:
 *   - "pending" → "Góðtak" knap (acceptér ordren)
 *   - "accepted" → "Liðugt" knap (markér som fuldført)
 *   - Altid → "Strika" knap (annullér ordren)
 */
import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { OrderWithNames } from "./useOrders";

interface OrdersLayerProps {
  orders: OrderWithNames[];
  currentUserId: string | null;
  onAccept: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

/** Status-labels på færøsk */
const STATUS_LABELS: Record<string, string> = {
  pending: "Bíðar",
  accepted: "Góðtikið",
};

export default function OrdersLayer({
  orders,
  currentUserId,
  onAccept,
  onComplete,
  onCancel,
}: OrdersLayerProps) {
  return (
    <>
      {orders.map((o) => {
        const isAssignedToMe = o.assigned_to === currentUserId;
        const isAccepted = o.status === "accepted";

        return (
          <CircleMarker
            key={o.id}
            center={[o.latitude, o.longitude]}
            radius={isAssignedToMe ? 12 : 10}  // Større prik for egne ordrer
            pathOptions={{
              color: isAssignedToMe ? "#f97316" : "#fff",
              fillColor: "#f97316",  // Orange = ordre
              fillOpacity: isAccepted ? 0.6 : 0.9, // Svagere når accepteret
              weight: isAssignedToMe ? 3 : 2,       // Tykkere kant for egne
            }}
          >
            {/* Besked-label (afkortet til 20 tegn) */}
            <Tooltip permanent direction="top" offset={[0, -12]}>
              {o.message.length > 20
                ? o.message.slice(0, 20) + "..."
                : o.message}
            </Tooltip>
            {/* Popup med alle detaljer og status-knapper */}
            <Popup>
              <div className="min-w-[180px] text-sm">
                <p className="font-semibold text-orange-700">{o.message}</p>
                <p className="text-xs text-stone-400">
                  Frá: {o.created_by_name}
                </p>
                {o.assigned_to_name && (
                  <p className="text-xs text-stone-400">
                    Til: {o.assigned_to_name}
                  </p>
                )}
                <p className="text-xs text-stone-400">
                  Støða: {STATUS_LABELS[o.status] ?? o.status}
                </p>

                <div className="mt-2 flex flex-col gap-1">
                  {/* Acceptér-knap — kun synlig for "pending" ordrer */}
                  {o.status === "pending" && (
                    <button
                      onClick={() => onAccept(o.id)}
                      className="w-full rounded bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-400 active:bg-orange-600"
                    >
                      Góðtak
                    </button>
                  )}
                  {/* Fuldført-knap — kun synlig for "accepted" ordrer */}
                  {o.status === "accepted" && (
                    <button
                      onClick={() => {
                        if (window.confirm("Markera hesa ávísing sum liðuga?")) {
                          onComplete(o.id);
                        }
                      }}
                      className="w-full rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500 active:bg-green-700"
                    >
                      Liðugt
                    </button>
                  )}
                  {/* Annullér-knap — altid tilgængelig */}
                  <button
                    onClick={() => {
                      if (window.confirm("Ert tú vís/ur? Hetta strikar ávísingina.")) {
                        onCancel(o.id);
                      }
                    }}
                    className="w-full rounded border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 active:bg-stone-100"
                  >
                    Strika
                  </button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
