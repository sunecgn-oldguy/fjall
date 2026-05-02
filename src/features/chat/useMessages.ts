/**
 * useMessages — hook der håndterer chatbeskeder for en gruppe.
 *
 * Henter de seneste 50 beskeder ved indlæsning, og lytter derefter
 * på nye beskeder via Supabase Realtime (kun INSERT — beskeder kan ikke redigeres).
 *
 * Beskeder vises i kronologisk rækkefølge (ældste først, nyeste nederst).
 * Vi henter dem i omvendt rækkefølge fra databasen (for at få de seneste 50)
 * og vender dem om i klienten.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Message } from "../../types/database";

/** Besked beriget med afsenderens visningsnavn */
export interface MessageWithName extends Message {
  display_name: string;
}

interface UseMessagesReturn {
  messages: MessageWithName[];
  sendMessage: (text: string) => Promise<boolean>;
}

export function useMessages(
  groupId: string | null,
  userId: string | null,
): UseMessagesReturn {
  const [messages, setMessages] = useState<MessageWithName[]>([]);
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

  /** Berig en besked med afsenderens visningsnavn */
  const enrichMessage = useCallback(
    async (msg: Message): Promise<MessageWithName> => {
      const displayName = await fetchDisplayName(msg.user_id);
      return { ...msg, display_name: displayName };
    },
    [fetchDisplayName],
  );

  // Hent eksisterende beskeder + abonnér på nye
  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function fetchExisting() {
      // Hent seneste 50 beskeder, sorteret nyeste-først (for LIMIT),
      // derefter vendt om så ældste vises øverst i chatten
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled || !data) return;

      // Vend rækkefølgen: database giver [nyeste, ..., ældste] → vi vil have [ældste, ..., nyeste]
      const reversed = [...data].reverse();

      const enriched = await Promise.all(
        reversed.map((m: Message) => enrichMessage(m)),
      );

      if (!cancelled) {
        setMessages(enriched);
      }
    }

    fetchExisting();

    // Realtime: lyt KUN på INSERT (nye beskeder) — ikke UPDATE eller DELETE
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
            // Undgå duplikater — kan ske hvis Realtime-beskeden ankommer
            // før fetchExisting er færdig, eller ved netværksfejl
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

  /** Send en ny besked i gruppen. Returnerer true ved succes. */
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
