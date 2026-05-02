import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../features/auth/AuthContext";
import OfflineBanner from "./OfflineBanner";

export default function Layout() {
  const { user, loading, signOut } = useAuth();
  const { pathname } = useLocation();

  // dvh = dynamic viewport height — tilpasser sig iOS Safari adresselinje
  const isFullHeight = pathname === "/kort" || pathname === "/skilabod";

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
              Forsíða
            </NavLink>
            <NavLink to="/kort" className={navLinkClass}>
              Kort
            </NavLink>

            {user && (
              <>
                <NavLink to="/bolkar" className={navLinkClass}>
                  Bólkar
                </NavLink>
                <NavLink to="/skilabod" className={navLinkClass}>
                  Skilaboð
                </NavLink>
              </>
            )}

            {/* Login/logout */}
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

      <main
        className={
          isFullHeight
            ? "flex-1 min-h-0"
            : "mx-auto w-full max-w-5xl flex-1 px-4 py-6"
        }
      >
        <Outlet />
      </main>

      {!isFullHeight && (
        <footer className="border-t border-stone-200 bg-stone-100 py-4 text-center text-sm text-stone-500">
          Fjall — Seyðadriv Coordinator
        </footer>
      )}
    </div>
  );
}
