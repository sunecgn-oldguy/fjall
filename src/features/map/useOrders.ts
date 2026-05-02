/**
 * useOrders — hook der håndterer ordrer/ávísingar for en gruppe.
 *
 * En ordre er en "gå hertil"-kommando som et gruppemedlem sender til et andet.
 * F.eks. "Gå til nordsiden af fjeldet" med en prik på kortet.
 *
 * Ordrer har en livscyklus (state machine):
 *   pending → accepted → completed
 *                      → cancelled (kan ske fra pending eller accepted)
 *
 * Kun "pending" og "accepted" ordrer vises på kortet.
 * "completed" og "cancelled" filtreres automatisk væk.
 *
 * Mønsteret er det samme som useSheepSightings:
 * fetch → Realtime subscription → cleanup ved unmount.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Order } from "../../types/database";

/** Ordre beriget med navne på opretteren og den tildelte person */
export interface OrderWithNames extends Order {
  created_by_name: string;
  assigned_to_name: string | null;
}

interface UseOrdersReturn {
  orders: OrderWithNames[];
  addOrder: (order: {
    group_id: string;
    created_by: string;
    assigned_to: string | null;
    latitude: number;
    longitude: number;
    message: string;
  }) => Promise<boolean>;
  acceptOrder: (id: string) => Promise<boolean>;
  completeOrder: (id: string) => Promise<boolean>;
  cancelOrder: (id: string) => Promise<boolean>;
}

export function useOrders(groupId: string | null): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderWithNames[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /** Hent visningsnavn fra profiles-tabellen */
  const fetchDisplayName = useCallback(
    async (uid: string): Promise<string> => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", uid)
        .single();
      return data?.display_name ?? "Ókendur";
    },
    [],
  );

  /** Berig en ordre med navne (opretter + evt. tildelt person) */
  const enrichOrder = useCallback(
    async (order: Order): Promise<OrderWithNames> => {
      const createdByName = await fetchDisplayName(order.created_by);
      const assignedToName = order.assigned_to
        ? await fetchDisplayName(order.assigned_to)
        : null;
      return { ...order, created_by_name: createdByName, assigned_to_name: assignedToName };
    },
    [fetchDisplayName],
  );

  // Hent eksisterende + abonnér på ændringer
  useEffect(() => {
    if (!groupId) {
      setOrders([]);
      return;
    }

    let cancelled = false;

    async function fetchExisting() {
      // Hent kun ordrer der stadig er aktive (pending/accepted)
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("group_id", groupId)
        .in("status", ["pending", "accepted"]);

      if (cancelled || !data) return;

      const enriched = await Promise.all(
        data.map((o: Order) => enrichOrder(o)),
      );

      if (!cancelled) {
        setOrders(enriched);
      }
    }

    fetchExisting();

    // Realtime: lyt på ændringer i orders for denne gruppe
    const channel = supabase
      .channel(`orders:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (cancelled) return;

          if (payload.eventType === "DELETE") {
            const old = payload.old as Partial<Order>;
            setOrders((prev) => prev.filter((o) => o.id !== old.id));
            return;
          }

          const order = payload.new as Order;

          // Fjern afsluttede ordrer fra kortet
          if (
            order.status === "completed" ||
            order.status === "cancelled"
          ) {
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
            return;
          }

          const enriched = await enrichOrder(order);

          // Opdatér eksisterende eller tilføj ny
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === order.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = enriched;
              return next;
            }
            return [...prev, enriched];
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, enrichOrder]);

  /** Opret en ny ordre */
  const addOrder = useCallback(
    async (order: {
      group_id: string;
      created_by: string;
      assigned_to: string | null;
      latitude: number;
      longitude: number;
      message: string;
    }): Promise<boolean> => {
      const { error } = await supabase.from("orders").insert(order);
      return !error;
    },
    [],
  );

  /** Generisk status-opdatering — bruges af accept/complete/cancel */
  const updateStatus = useCallback(
    async (id: string, status: Order["status"]): Promise<boolean> => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      return !error;
    },
    [],
  );

  // Convenience-funktioner der kalder updateStatus med den rigtige status
  const acceptOrder = useCallback(
    (id: string) => updateStatus(id, "accepted"),
    [updateStatus],
  );

  const completeOrder = useCallback(
    (id: string) => updateStatus(id, "completed"),
    [updateStatus],
  );

  const cancelOrder = useCallback(
    (id: string) => updateStatus(id, "cancelled"),
    [updateStatus],
  );

  return { orders, addOrder, acceptOrder, completeOrder, cancelOrder };
}
