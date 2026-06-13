import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "../components/Toast";

describe("AppShell", () => {
  it("renders the ShortiGo shell navigation and child content", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <AppShell>
              <h1>Feed preview</h1>
            </AppShell>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: /ShortiGo/i })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: /For You/i })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: /Explore/i })).not.toHaveLength(0);
    expect(screen.getByRole("heading", { name: /Feed preview/i })).toBeTruthy();
  });
});
