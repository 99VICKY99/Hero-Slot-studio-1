import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";

// Mock idb so the settings store hydrate() can resolve without a real IndexedDB.
vi.mock("@/persistence/db", () => {
  const fakeDb = {
    get: vi.fn(async () => undefined),
    put: vi.fn(async () => undefined),
  };
  return {
    getDb: vi.fn(async () => fakeDb),
    STORE_HEROES: "heroes",
    STORE_ACTIVE: "active",
    STORE_SETTINGS: "settings",
    STORE_META: "meta",
    ACTIVE_KEY: "current",
    SETTINGS_KEY: "prefs",
    META_SCHEMA_VERSION_KEY: "schema_version",
    DB_NAME: "hero-studio",
    DB_VERSION: 1,
  };
});

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders the Hero Slot Studio shell with the fetch-site empty state", () => {
    render(<App />);
    expect(screen.getByText(/Hero Slot Studio/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /fetch a site to begin/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fetch site/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
  });
});
