import { useCallback, useEffect, useState } from "react";
import { HelpCircle, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PreviewIframe } from "@/components/PreviewIframe";
import { apiClient, ApiError } from "@/api/client";
import { useHeroStore } from "@/state/heroStore";
import { useSettingsStore } from "@/state/settingsStore";
import { useUIStore } from "@/state/uiStore";

const MODEL_LABEL = "MiniMax M2.7";

/**
 * Screen 1 — App Shell (DESIGN_SPEC §Screen 1 & §Screen 5).
 * Top bar + left hero-list sidebar + main canvas.
 * Dark mode is the default per user preference.
 */
export default function App() {
  const activeHero = useHeroStore((s) => s.activeHero);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const pushToast = useUIStore((s) => s.pushToast);

  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode, hydrated]);

  const handleFetchSite = useCallback(
    async (url: string) => {
      setFetching(true);
      setFetchError(null);
      try {
        await apiClient.fetchSite({ url });
        pushToast({
          type: "info",
          title: "Site fetched",
          description: "Generation step comes online in W2.",
        });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? `${err.message}${err.hint ? ` — ${err.hint}` : ""}`
            : "Network error. Check that the backend is running on :8787.";
        setFetchError(message);
      } finally {
        setFetching(false);
      }
    },
    [pushToast],
  );

  return (
    <div className="flex h-screen w-screen flex-col bg-canvas text-text-primary dark:bg-canvas-dark dark:text-text-primaryDark">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <HeroListSidebar />
        <main id="main" className="flex min-w-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 items-stretch justify-center p-token-6">
            {activeHero ? (
              <PreviewIframe html={activeHero.html} css={activeHero.css} />
            ) : (
              <EmptyState
                onFetchSite={handleFetchSite}
                isLoading={fetching}
                errorMessage={fetchError}
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );

  function TopBar() {
    return (
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-token-6 dark:border-border-dark dark:bg-surface-dark">
        <div className="flex items-center gap-token-3">
          <div
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-sm bg-brand-primary text-caption font-semibold text-white dark:bg-brand-primaryDark"
          >
            H
          </div>
          <span className="text-card-subtitle text-text-primary dark:text-text-primaryDark">
            Hero Slot Studio
          </span>
        </div>
        <div className="flex items-center gap-token-2">
          <span className="inline-flex items-center gap-token-1 rounded-pill border border-border bg-surface-subtle px-token-3 py-token-1 text-caption text-text-secondary dark:border-border-dark dark:bg-surface-subtleDark dark:text-text-secondaryDark">
            <Sparkles size={12} aria-hidden="true" />
            Model: {MODEL_LABEL}
          </span>
          <IconButton label="Settings">
            <SettingsIcon size={20} aria-hidden="true" />
          </IconButton>
          <IconButton label="Keyboard shortcuts">
            <HelpCircle size={20} aria-hidden="true" />
          </IconButton>
        </div>
      </header>
    );
  }
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-circle text-text-secondary transition-colors duration-fast ease-out hover:bg-canvas hover:text-text-primary dark:text-text-secondaryDark dark:hover:bg-surface-subtleDark dark:hover:text-text-primaryDark"
    >
      {children}
    </button>
  );
}

function HeroListSidebar() {
  return (
    <aside
      aria-label="Hero list"
      className="flex w-[280px] shrink-0 flex-col border-r border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
    >
      <div className="flex h-12 items-center border-b border-border px-token-4 dark:border-border-dark">
        <h2 className="text-body font-semibold text-text-primary dark:text-text-primaryDark">
          Version history
        </h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-token-2 px-token-4 text-center">
        <p className="text-body font-medium text-text-primary dark:text-text-primaryDark">
          No saved versions yet
        </p>
        <p className="text-caption text-text-secondary dark:text-text-secondaryDark">
          Publish a hero to save it to history.
        </p>
      </div>
    </aside>
  );
}
