interface MessageBubbleProps {
  text: string;
  displayName: string;
  createdAt: string;
  isMine: boolean;
}

/**
 * Enkelt chat-boble.
 * Egne beskeder: blå baggrund, højrestillet.
 * Andres beskeder: grå baggrund, venstrestillet, med navn.
 */
export default function MessageBubble({
  text,
  displayName,
  createdAt,
  isMine,
}: MessageBubbleProps) {
  const time = new Date(createdAt).toLocaleTimeString("fo-FO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
          isMine
            ? "rounded-br-sm bg-blue-600 text-white"
            : "rounded-bl-sm bg-stone-200 text-stone-900"
        }`}
      >
        {!isMine && (
          <p className="mb-0.5 text-xs font-semibold text-stone-500">
            {displayName}
          </p>
        )}
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
