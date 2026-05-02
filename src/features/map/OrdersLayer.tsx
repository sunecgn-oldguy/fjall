import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { OrderWithNames } from "./useOrders";

interface OrdersLayerProps {
  orders: OrderWithNames[];
  /** Aktuelt indlogget bruger-id — bruges til at fremhæve tildelte ordrer */
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

/**
 * Viser ordrer som orange prikker på kortet.
 * Ordrer tildelt den aktuelle bruger får en tykkere kant.
 * Tap på en prik viser detaljer + status-knapper.
 */
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
            radius={isAssignedToMe ? 12 : 10}
            pathOptions={{
              color: isAssignedToMe ? "#f97316" : "#fff",
              fillColor: "#f97316",
              fillOpacity: isAccepted ? 0.6 : 0.9,
              weight: isAssignedToMe ? 3 : 2,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]}>
              {o.message.length > 20
                ? o.message.slice(0, 20) + "..."
                : o.message}
            </Tooltip>
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
                  {o.status === "pending" && (
                    <button
                      onClick={() => onAccept(o.id)}
                      className="w-full rounded bg-orange-500 px-3 py-2 text-sm font-medium text-white active:bg-orange-600"
                    >
                      Góðtak
                    </button>
                  )}
                  {o.status === "accepted" && (
                    <button
                      onClick={() => onComplete(o.id)}
                      className="w-full rounded bg-green-600 px-3 py-2 text-sm font-medium text-white active:bg-green-700"
                    >
                      Liðugt
                    </button>
                  )}
                  <button
                    onClick={() => onCancel(o.id)}
                    className="w-full rounded border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 active:bg-stone-50"
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
