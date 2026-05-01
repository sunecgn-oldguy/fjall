import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import { AuthProvider } from "./features/auth/AuthContext";

// Mock Supabase-klienten så tests ikke kræver rigtig forbindelse
vi.mock("./lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

function renderWithProviders(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("vísir forsíðuna við standard rute", () => {
    renderWithProviders("/");
    expect(screen.getByText("Vælkomin til Fjall")).toBeInTheDocument();
  });

  it("vísir kortsíðuna við /kort rute", () => {
    renderWithProviders("/kort");
    expect(
      screen.getByRole("heading", { level: 1, name: "Kort" }),
    ).toBeInTheDocument();
  });

  it("vísir login-síðuna við /login rute", () => {
    renderWithProviders("/login");
    expect(
      screen.getByRole("heading", { level: 1, name: "Rita inn" }),
    ).toBeInTheDocument();
  });

  it("omdirigerer til login frá /bolkar utan autentisering", () => {
    renderWithProviders("/bolkar");
    // Brugeren er ikke logget ind (session = null), så ProtectedRoute
    // omdirigerer til /login — vi forventer login-formularen
    expect(
      screen.getByRole("heading", { level: 1, name: "Rita inn" }),
    ).toBeInTheDocument();
  });
});
