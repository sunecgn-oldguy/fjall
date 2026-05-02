/**
 * Spinner — en CSS-only loading-indikator.
 *
 * Bruger Tailwinds "animate-spin" til at rotere en cirkel.
 * Ingen JavaScript-animation, ingen ekstra biblioteker — ren CSS.
 *
 * To størrelser:
 * - "sm" (16px): til brug inde i knapper ved siden af tekst
 * - "default" (32px): til standalone loading-tilstande
 */
interface SpinnerProps {
  size?: "sm" | "default";
}

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
