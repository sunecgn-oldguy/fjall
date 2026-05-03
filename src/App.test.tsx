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
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

// Mock MapView — Leaflet virker ikke i jsdom (kræver rigtig DOM med layout)
vi.mock("./features/map/MapView", () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-view">{children}</div>
  ),
}));

// Mock react-leaflet hooks og komponenter der kræver MapContainer-kontekst
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TileLayer: () => null,
  CircleMarker: () => null,
  Circle: () => null,
  Tooltip: () => null,
  Popup: () => null,
  Polyline: () => null,
  useMap: () => ({
    flyTo: vi.fn(),
  }),
  useMapEvents: () => null,
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
  it("vísir kortsíðuna við standard rute (/)", () => {
    renderWithProviders("/");
    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });

  it("vísir kortsíðuna við /kort (redirect til /)", () => {
    renderWithProviders("/kort");
    // Navigate redirect kan give flere renders — vi tjekker bare at map-view findes
    const mapViews = screen.getAllByTestId("map-view");
    expect(mapViews.length).toBeGreaterThan(0);
  });

  it("vísir quickstart-síðuna við /login rute", () => {
    renderWithProviders("/login");
    expect(
      screen.getByRole("heading", { level: 1, name: "Kom í gongd" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Jógvan")).toBeInTheDocument();
  });

  it("omdirigerer til login frá /skilabod utan autentisering", () => {
    renderWithProviders("/skilabod");
    // Brugeren er ikke logget ind (session = null), så ProtectedRoute
    // omdirigerer til /login — vi forventer QuickStartPage
    expect(
      screen.getByRole("heading", { level: 1, name: "Kom í gongd" }),
    ).toBeInTheDocument();
  });
});
