import { useEffect, useRef, useState, type FormEvent } from "react";
import Spinner from "../../components/Spinner";
import { useAuth } from "../auth/AuthContext";
import GroupSelector from "../map/GroupSelector";
import MessageBubble from "./MessageBubble";
import { useMessages } from "./useMessages";

/**
 * Skilaboð — gruppechat-side.
 * Full-height layout med gruppevælger, beskedliste og input-bar.
 */
export default function ChatPage() {
  const { user } = useAuth();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const { messages, sendMessage } = useMessages(groupId, user?.id ?? null);

  // Ref til beskedlistens bund — bruges til auto-scroll
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll til bunden når nye beskeder ankommer
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const ok = await sendMessage(trimmed);
    if (ok) setInput("");
    setSending(false);
  }

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Gruppevælger */}
      <div className="border-b border-stone-200 bg-white px-4 py-3">
        <GroupSelector
          userId={user.id}
          selectedGroupId={groupId}
          onSelect={setGroupId}
        />
      </div>

      {/* Beskedliste */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!groupId ? (
          <p className="py-12 text-center text-sm text-stone-400">
            Vel ein bólk fyri at síggja skilaboð
          </p>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-400">
            Eingi skilaboð enn — skriv tað fyrsta!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                text={msg.text}
                displayName={msg.display_name}
                createdAt={msg.created_at}
                isMine={msg.user_id === user.id}
              />
            ))}
          </div>
        )}
        {/* Usynligt element i bunden — scroll-target */}
        <div ref={bottomRef} />
      </div>

      {/* Input-bar */}
      {groupId && (
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-stone-200 bg-white px-4 py-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv eitt skilaboð..."
            className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? <Spinner size="sm" /> : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
