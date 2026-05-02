import { useEffect, useState } from "react";

/**
 * Gul banner der vises øverst i appen når brugeren mister internet.
 * Bruger navigator.onLine + online/offline events.
 */
export default function OfflineBanner() {
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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
