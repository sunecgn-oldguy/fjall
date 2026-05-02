/**
 * MessageBubble — en enkelt chatboble.
 *
 * Styling afhænger af om beskeden er brugerens egen (isMine):
 * - Egen besked: blå baggrund, højrestillet, ingen afsendernavn
 * - Andres besked: grå baggrund, venstrestillet, med afsendernavn over teksten
 *
 * Afrundede hjørner med én "flad" kant i bunden giver en
 * klassisk chat-boble-effekt (som iMessage/WhatsApp).
 */
interface MessageBubbleProps {
  text: string;
  displayName: string;
  createdAt: string;     // ISO-tidsstempel fra databasen
  isMine: boolean;       // true = brugerens egen besked
}

export default function MessageBubble({
  text,
  displayName,
  createdAt,
  isMine,
}: MessageBubbleProps) {
  // Formattér tidsstempel til "HH:MM" i færøsk tidszone
  const time = new Date(createdAt).toLocaleTimeString("fo-FO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
          isMine
            ? "rounded-br-sm bg-blue-600 text-white"    // Flad kant nederst-højre
            : "rounded-bl-sm bg-stone-200 text-stone-900" // Flad kant nederst-venstre
        }`}
      >
        {/* Vis afsendernavn kun for andres beskeder */}
        {!isMine && (
          <p className="mb-0.5 text-xs font-semibold text-stone-500">
            {displayName}
          </p>
        )}
        {/* whitespace-pre-wrap bevarer linjeskift i beskeden */}
        <p className="whitespace-pre-wrap break-words text-sm">{text}</p>
        <p
          className={`mt-0.5 text-right text-[10px] ${
            isMine ? "text-blue-200" : "text-stone-400"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
