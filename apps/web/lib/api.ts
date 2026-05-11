/**
 * Typed API client — wraps fetch with auth token injection,
 * base URL from env, and consistent error handling.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
        {} as Record<string, string>
      )
    );
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(response.status, error.detail || "Unknown error");
  }

  // Handle 204 No Content
  if (response.status === 204) return {} as T;

  return response.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── API Namespace ────────────────────────────────────────────────────────────

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(data) }),

    login: (data: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(data) }),

    me: (token: string) =>
      request("/auth/me", { token }),
  },

  // ── Stocks ────────────────────────────────────────────────────────────────
  stocks: {
    search: (q: string, limit = 10) =>
      request("/stocks/search", { params: { q, limit } }),

    getProfile: (symbol: string) =>
      request(`/stocks/${symbol}`),

    getQuote: (symbol: string) =>
      request(`/stocks/${symbol}/quote`),

    getHistory: (symbol: string, period = "1y", interval = "1d") =>
      request(`/stocks/${symbol}/history`, { params: { period, interval } }),

    getTechnicals: (symbol: string) =>
      request(`/stocks/${symbol}/technicals`),
  },

  // ── Market ────────────────────────────────────────────────────────────────
  market: {
    indices: () => request("/market/indices"),
    overview: () => request("/market/overview"),
  },

  // ── Portfolio ─────────────────────────────────────────────────────────────
  portfolio: {
    generate: (data: object, token: string) =>
      request("/portfolio/generate", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    list: (token: string) =>
      request("/portfolio", { token }),

    get: (id: string, token: string) =>
      request(`/portfolio/${id}`, { token }),

    delete: (id: string, token: string) =>
      request(`/portfolio/${id}`, { method: "DELETE", token }),
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  ai: {
    analyzeStock: (symbol: string, token: string) =>
      request(`/ai/analyze/${symbol}`, { method: "POST", token }),

    chat: (data: { message: string; history?: object[] }, token: string) =>
      request("/ai/chat", { method: "POST", body: JSON.stringify(data), token }),

    marketInsight: () =>
      request("/ai/market-insight"),
  },

  // ── Watchlist ─────────────────────────────────────────────────────────────
  watchlist: {
    get: (token: string) =>
      request("/watchlist", { token }),

    add: (symbol: string, token: string) =>
      request("/watchlist/add", {
        method: "POST",
        body: JSON.stringify({ symbol }),
        token,
      }),

    remove: (symbol: string, token: string) =>
      request(`/watchlist/remove/${symbol}`, { method: "DELETE", token }),
  },
};
