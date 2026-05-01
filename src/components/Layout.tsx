import { NavLink, Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <header className="bg-stone-800 text-white">
        <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="text-xl font-bold tracking-tight">
            Fjall
          </NavLink>
          <div className="flex gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1 rounded transition-colors ${
                  isActive
                    ? "bg-stone-600 text-white"
                    : "text-stone-300 hover:text-white"
                }`
              }
              end
            >
              Forsíða
            </NavLink>
            <NavLink
              to="/kort"
              className={({ isActive }) =>
                `px-3 py-1 rounded transition-colors ${
                  isActive
                    ? "bg-stone-600 text-white"
                    : "text-stone-300 hover:text-white"
                }`
              }
            >
              Kort
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-stone-100 border-t border-stone-200 text-stone-500 text-sm text-center py-4">
        Fjall — Seyðadriv Coordinator
      </footer>
    </div>
  );
}
