interface SpinnerProps {
  /** "sm" = 16px (til knapper), default = 32px (standalone) */
  size?: "sm" | "default";
}

/**
 * CSS-only loading-spinner med Tailwind animate-spin.
 * Bruges i stedet for ren tekst-loading-indikatorer.
 */
export default function Spinner({ size = "default" }: SpinnerProps) {
  const sizeClass = size === "sm" ? "h-4 w-4 border-2" : "h-8 w-8 border-3";

  return (
    <span
      role="status"
      aria-label="Innlesur"
      className={`inline-block ${sizeClass} animate-spin rounded-full border-stone-300 border-t-stone-700`}
    />
  );
}
