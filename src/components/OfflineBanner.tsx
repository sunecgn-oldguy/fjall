/**
 * OfflineBanner — viser en gul advarsel når brugeren mister internetforbindelsen.
 *
 * Bruger browserens navigator.onLine til at tjekke status,
 * og lytter på "online"/"offline" events for at opdatere i realtid.
 *
 * Vigtigt for en feltapp: brugere i færøske bjerge mister ofte signal.
 * Banneret giver dem besked om at data kan være forældet.
 */
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  // Initialiser med browserens aktuelle status (SSR-sikker med typeof-check)
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }

    // Browseren fyrer disse events automatisk når netværk kommer/går
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup: fjern event-listeners når komponenten unmountes
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Vis ingenting når der er internet
  if (online) return null;

  return (
    <div
      role="alert"
      className="bg-yellow-100 px-4 py-2 text-center text-sm font-medium text-yellow-800"
    >
      Eingin netsamband — data kann vera gamalt
    </div>
  );
}
