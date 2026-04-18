/**
 * Typed fetch wrapper around the backend API.
 *
 * Error shape mirrors CLAUDE.md §14:
 *   { error: string; code: string; hint?: string; context?: object }
 *
 * Base URL comes from VITE_API_BASE so the same client works
 * in dev (Vite proxy) and prod (served by FastAPI StaticFiles).
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface ApiErrorShape {
  error: string;
  code: string;
  hint?: string;
  context?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly code: string;
  readonly hint?: string;
  readonly context?: Record<string, unknown>;
  readonly status: number;

  constructor(status: number, body: ApiErrorShape) {
    super(body.error);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.hint = body.hint;
    this.context = body.context;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let body: ApiErrorShape;
    try {
      body = (await response.json()) as ApiErrorShape;
    } catch {
      body = {
        error: response.statusText || "Request failed",
        code: "INTERNAL_ERROR",
      };
    }
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export interface HealthResponse {
  status: "ok";
  model: string;
  protocol: "openai" | "anthropic";
}

export interface FetchSiteRequest {
  url: string;
}

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface LogoAsset {
  url: string;
  data_base64: string;
}

export interface RankedImage {
  url: string;
  width: number;
  height: number;
  score: number;
}

export interface SiteMeta {
  title?: string | null;
  description?: string | null;
}

export interface FetchSiteResponse {
  palette: Palette;
  fonts: string[];
  logo: LogoAsset | null;
  images: RankedImage[];
  meta: SiteMeta;
}

/**
 * Stubbed endpoints for W2+; wired here so callers can import a single client.
 */
export const apiClient = {
  health(): Promise<HealthResponse> {
    return request<HealthResponse>("/health");
  },
  fetchSite(payload: FetchSiteRequest): Promise<FetchSiteResponse> {
    return request<FetchSiteResponse>("/fetch-site", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  generate(payload: Record<string, unknown>): Promise<unknown> {
    return request<unknown>("/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  patch(payload: Record<string, unknown>): Promise<unknown> {
    return request<unknown>("/patch", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  multiPatch(payload: Record<string, unknown>): Promise<unknown> {
    return request<unknown>("/multi-patch", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  regenerateSubtree(payload: Record<string, unknown>): Promise<unknown> {
    return request<unknown>("/regenerate-subtree", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  parseHtml(payload: Record<string, unknown>): Promise<unknown> {
    return request<unknown>("/parse-html", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export type ApiClient = typeof apiClient;
