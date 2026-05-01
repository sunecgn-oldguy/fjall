import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("vísir forsíðuna við standard rute", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("Vælkomin til Fjall")).toBeInTheDocument();
  });

  it("vísir kortsíðuna við /kort rute", () => {
    render(
      <MemoryRouter initialEntries={["/kort"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Kort" }),
    ).toBeInTheDocument();
  });
});
