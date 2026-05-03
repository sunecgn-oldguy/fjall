/**
 * Layout — den fælles ramme rundt om alle sider.
 *
 * Indeholder:
 * - Header med app-navn og navigation
 * - OfflineBanner der vises når internet mangler
 * - <Outlet /> hvor den aktuelle side indsættes (fra React Router)
 * - Footer (skjult på kort- og chat-siden for at spare plads)
 *
 * Navigation (forenklet — kortet er appen):
 * - Ikke logget ind: Kort, Rita inn
 * - Logget ind: Kort, Skilaboð, Túrar, Útrita
 */
import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../features/auth/AuthContext";
import OfflineBanner from "./OfflineBanner";

export default function Layout() {
  const { user, loading, signOut } = useAuth();
  const { pathname } = useLocation();

  // Kort og chat bruger fuld skærmhøjde (ingen scrollbar, ingen footer).
  // Vi bruger "dvh" (dynamic viewport height) i stedet for "vh" fordi
  // iOS Safari's 100vh inkluderer arealet bag adresselinjen — dvh tilpasser sig.
  const isFullHeight = pathname === "/" || pathname === "/skilabod";

  // NavLink-styling: aktiv side får mørk baggrund, inaktive er lysegrå
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1 rounded transition-colors ${
      isActive
        ? "bg-stone-600 text-white"
        : "text-stone-300 hover:text-white"
    }`;

  return (
    <div className={`flex flex-col bg-stone-50 text-stone-900 ${isFullHeight ? "h-dvh" : "min-h-dvh"}`}>
      <header className="bg-stone-800 text-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="text-xl font-bold tracking-tight">
            Fjall
          </NavLink>

          <div className="flex items-center gap-4">
            <NavLink to="/" className={navLinkClass} end>
              Kort
            </NavLink>

            {/* Vis Skilaboð og Túrar kun når brugeren er logget ind */}
            {user && (
              <>
                <NavLink to="/skilabod" className={navLinkClass}>
                  Skilaboð
                </NavLink>
                <NavLink to="/turar" className={navLinkClass}>
                  Túrar
                </NavLink>
              </>
            )}

            {/* Login/logout knap — vent til auth er loaded så vi undgår flicker */}
            {!loading && (
              <>
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="rounded px-3 py-1 text-stone-300 transition-colors hover:text-white"
                  >
                    Útrita
                  </button>
                ) : (
                  <NavLink to="/login" className={navLinkClass}>
                    Rita inn
                  </NavLink>
                )}
              </>
            )}
          </div>
        </nav>
      </header>

      <OfflineBanner />

      {/* Hovedindhold — den aktuelle side indsættes her via <Outlet /> */}
      <main
        className={
          isFullHeight
            ? "flex-1 min-h-0"
            : "mx-auto w-full max-w-5xl flex-1 px-4 py-6"
        }
      >
        <Outlet />
      </main>

      {/* Footer skjules på kort- og chat-siden for at give max plads */}
      {!isFullHeight && (
        <footer className="border-t border-stone-200 bg-stone-100 py-4 text-center text-sm text-stone-500">
          Fjall — Seyðadriv Coordinator
        </footer>
      )}
    </div>
  );
}
