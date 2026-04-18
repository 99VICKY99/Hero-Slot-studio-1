import { useState, type FormEvent } from "react";
import { Globe, Loader2 } from "lucide-react";

interface EmptyStateProps {
  onFetchSite?: (url: string) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

/**
 * Welcome / "Fetch a site" empty state. Matches DESIGN_SPEC §Screen 2 & §Screen 3.
 * Renders inside the Studio canvas when no hero is active.
 */
export function EmptyState({ onFetchSite, isLoading = false, errorMessage }: EmptyStateProps) {
  const [url, setUrl] = useState("");
  const trimmed = url.trim();
  const canSubmit = trimmed.length > 0 && !isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await onFetchSite?.(trimmed);
  }

  return (
    <div className="flex h-full w-full items-center justify-center px-token-6 py-token-12">
      <div className="w-full max-w-[560px] rounded-lg border border-border bg-surface p-token-8 shadow-subtle dark:border-border-dark dark:bg-surface-dark">
        <div className="flex flex-col items-center text-center">
          <div className="mb-token-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-primaryDark/10 dark:text-brand-primaryDark">
            <Globe size={24} aria-hidden="true" />
          </div>
          <h1 className="text-section-header text-text-primary dark:text-text-primaryDark">
            Fetch a site to begin
          </h1>
          <p className="mt-token-2 text-body text-text-secondary dark:text-text-secondaryDark">
            Paste a website URL. We&rsquo;ll pull its colors, fonts, logo, and hero imagery so the
            editor can open with everything ready.
          </p>
        </div>

        <form className="mt-token-6 flex flex-col gap-token-3" onSubmit={handleSubmit} noValidate>
          <label htmlFor="fetch-url" className="text-label text-text-primary dark:text-text-primaryDark">
            Website URL
          </label>
          <input
            id="fetch-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://stripe.com"
            disabled={isLoading}
            className="h-10 w-full rounded-md border border-border-strong bg-surface px-token-3 text-body text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-text-disabled dark:border-border-strongDark dark:bg-surface-dark dark:text-text-primaryDark dark:placeholder:text-text-secondaryDark dark:focus:border-brand-primaryDark dark:focus:ring-brand-primaryDark/30"
          />

          {errorMessage ? (
            <p className="text-caption text-feedback-error" role="alert">
              {errorMessage}
            </p>
          ) : (
            <p className="text-caption text-text-secondary dark:text-text-secondaryDark">
              e.g. https://linear.app — we respect SSRF limits and never fetch private addresses.
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-token-2 inline-flex h-10 items-center justify-center gap-token-2 rounded-pill bg-brand-primary px-token-6 text-button text-white transition-colors duration-fast ease-out hover:bg-brand-primaryHover disabled:cursor-not-allowed disabled:bg-text-disabled disabled:text-white/80 dark:bg-brand-primaryDark dark:hover:bg-brand-primaryHoverDark"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Fetching&hellip;
              </>
            ) : (
              "Fetch site"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
