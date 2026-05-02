import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Message } from "../../types/database";

/** Besked beriget med afsenderens display_name */
export interface MessageWithName extends Message {
  display_name: string;
}

interface UseMessagesReturn {
  messages: MessageWithName[];
  sendMessage: (text: string) => Promise<boolean>;
}

/**
 * Hook der håndterer chatbeskeder for en gruppe:
 * - Henter de seneste 50 beskeder (sorteret ældste først)
 * - Abonnerer på nye beskeder via Supabase Realtime
 * - Eksponerer sendMessage() til at sende ny besked
 */
export function useMessages(
  groupId: string | null,
  userId: string | null,
): UseMessagesReturn {
  const [messages, setMessages] = useState<MessageWithName[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Hent display_name fra profiles-tabel
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

  // Berig en besked med display_name
  const enrichMessage = useCallback(
    async (msg: Message): Promise<MessageWithName> => {
      const displayName = await fetchDisplayName(msg.user_id);
      return { ...msg, display_name: displayName };
    },
    [fetchDisplayName],
  );

  // Initial fetch + Realtime subscription
  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function fetchExisting() {
      // Hent seneste 50 beskeder — sorteret med ældste først
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled || !data) return;

      // Vend rækkefølgen så ældste er først (chat-rækkefølge)
      const reversed = [...data].reverse();

      const enriched = await Promise.all(
        reversed.map((m: Message) => enrichMessage(m)),
      );

      if (!cancelled) {
        setMessages(enriched);
      }
    }

    fetchExisting();

    // Realtime subscription — lyt kun efter nye beskeder (INSERT)
    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (cancelled) return;

          const msg = payload.new as Message;
          const enriched = await enrichMessage(msg);

          setMessages((prev) => {
            // Undgå duplikater (kan ske ved optimistisk insert)
            if (prev.some((m) => m.id === msg.id)) return prev;
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
  }, [groupId, enrichMessage]);

  // Send en ny besked
  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!groupId || !userId) return false;

      const { error } = await supabase.from("messages").insert({
        group_id: groupId,
        user_id: userId,
        text: text.trim(),
      });

      return !error;
    },
    [groupId, userId],
  );

  return { messages, sendMessage };
}
