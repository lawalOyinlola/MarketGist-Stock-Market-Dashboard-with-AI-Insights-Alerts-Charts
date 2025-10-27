"use server";

// STOCK NEWS API ACTIONS FOR MARKETGIST
import {
  getDateRange,
  validateArticle,
  formatArticle,
  formatMarketCapValue,
} from "@/lib/utils";
import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import { cache } from "react";
import { apiRateLimiter } from "@/lib/utils/rateLimiter";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

async function fetchJSON<T>(
  url: string,
  revalidateSeconds?: number,
  retries: number = 3
): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } =
    revalidateSeconds
      ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Check rate limit before making request
      if (!apiRateLimiter.isAllowed("finnhub-api")) {
        const waitTime = apiRateLimiter.getTimeUntilReset("finnhub-api");
        console.log(
          `Rate limit exceeded. Waiting ${Math.ceil(
            waitTime / 1000
          )} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000); // 10s

      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");

          // Handle specific error cases
          if (res.status === 403) {
            console.error(
              "Finnhub API 403 Error - Possible rate limit or quota exceeded"
            );
            if (attempt < retries) {
              console.log(
                `Retrying in ${
                  attempt * 2
                } seconds... (attempt ${attempt}/${retries})`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, attempt * 2000)
              );
              continue;
            }
            throw new Error(
              "API rate limit or quota exceeded. Please try again later."
            );
          }

          if (res.status === 429) {
            console.error("Finnhub API 429 Error - Rate limit exceeded");
            if (attempt < retries) {
              console.log(
                `Retrying in ${
                  attempt * 2
                } seconds... (attempt ${attempt}/${retries})`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, attempt * 2000)
              );
              continue;
            }
            throw new Error("API rate limit exceeded. Please try again later.");
          }

          if (res.status === 401) {
            console.error("Finnhub API 401 Error - Invalid API key");
            throw new Error(
              "API authentication failed. Please check your API key."
            );
          }

          throw new Error(`Fetch failed ${res.status}: ${text}`);
        }
        return (await res.json()) as T;
      } catch (error) {
        console.error("Error fetching JSON:", error);
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`Fetch attempt ${attempt} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw new Error("All retry attempts failed");
}

export { fetchJSON };

// Get current quote (price) for a symbol
export async function getQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const token = FINNHUB_API_KEY;
    if (!token) {
      console.error("FINNHUB API key is not configured");
      return null;
    }

    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(
      symbol
    )}&token=${token}`;
    const quote = await fetchJSON<QuoteData>(url, 60);
    return quote;
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return null;
  }
}

export async function getNews(
  symbols?: string[]
): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = FINNHUB_API_KEY;
    if (!token) {
      console.error("FINNHUB API key is not configured");
      throw new Error("FINNHUB API key is not configured");
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      const pool = 5;
      for (let i = 0; i < cleanSymbols.length; i += pool) {
        const batch = cleanSymbols.slice(i, i + pool);
        await Promise.all(
          batch.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(
                sym
              )}&from=${range.from}&to=${range.to}&token=${token}`;
              const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
              perSymbolArticles[sym] = (articles || []).filter(validateArticle);
            } catch (e) {
              console.error("Error fetching company news for", sym, e);
              perSymbolArticles[sym] = [];
            }
          })
        );
      }

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;

          const idx = perSymbolArticles[sym].length - list.length;
          const article = list[idx];

          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique
      .slice(0, maxArticles)
      .map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error("getNews error:", err);
    throw new Error("Failed to fetch news");
  }
}

// User-agnostic stock search (cached for performance)
export const searchStocks = cache(async (query?: string): Promise<Stock[]> => {
  try {
    const token = FINNHUB_API_KEY;
    if (!token) {
      console.error(
        "Error in stock search:",
        new Error("FINNHUB API key is not configured")
      );
      return [];
    }

    const trimmed = typeof query === "string" ? query.trim() : "";

    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
              sym
            )}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<Record<string, unknown>>(url, 3600);
            return { sym, profile } as {
              sym: string;
              profile: Record<string, unknown> | null;
            };
          } catch (e) {
            console.error("Error fetching profile2 for", sym, e);
            return { sym, profile: null } as {
              sym: string;
              profile: Record<string, unknown> | null;
            };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined =
            (profile?.name as string) ||
            (profile?.ticker as string) ||
            undefined;
          const exchange: string | undefined =
            (profile?.exchange as string) || undefined;
          const logo: string | undefined =
            (profile?.logo as string) || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: "Common Stock",
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as Record<string, unknown>).__exchange = exchange; // internal only
          (r as Record<string, unknown>).__logo = logo; // internal only
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(
        trimmed
      )}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: Stock[] = results
      .map((r) => {
        const upper = (r.symbol || "").toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay =
          (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as Record<string, unknown>)
          .__exchange as string | undefined;
        const logoFromProfile = (r as Record<string, unknown>).__logo as
          | string
          | undefined;
        const exchange = exchangeFromDisplay || exchangeFromProfile || "US";
        const type = r.type || "Stock";
        const item: Stock = {
          symbol: upper,
          name,
          exchange,
          type,
          logo: logoFromProfile,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error("Error in stock search:", err);
    return [];
  }
});

// Per-email cached wrapper to prevent cross-user cache leaks
const getWatchlistWithDataCached = cache(
  async (email: string): Promise<StockWithData[]> => {
    try {
      const token = FINNHUB_API_KEY;
      if (!token) {
        console.error("FINNHUB API key is not configured");
        return [];
      }

      if (!email) return [];

      // Get user ID from email
      const { connectToDatabase } = await import("@/database/mongoose");
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;
      if (!db) throw new Error("MongoDB connection not found");

      const user = await db
        .collection("user")
        .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

      if (!user) return [];

      const userId =
        (user.id as string) ??
        (user._id as { toHexString?: () => string })?.toHexString?.() ??
        (user._id as { toString?: () => string })?.toString?.() ??
        "";

      if (!userId) return [];

      const { getWatchlistSymbolsByEmail } = await import(
        "@/lib/actions/watchlist.actions"
      );
      const symbols = await getWatchlistSymbolsByEmail(email);

      if (symbols.length === 0) return [];

      // Fetch financial data for each symbol
      const watchlistData = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            // Fetch quote (price, change, change%), company profile (market cap, company name) and basic financial metrics (P/E ratio)
            const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(
              symbol
            )}&token=${token}`;
            const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
              symbol
            )}&token=${token}`;
            const financialsUrl = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(
              symbol
            )}&metric=all&token=${token}`;

            const [quote, profile, financials] = await Promise.all([
              fetchJSON<QuoteData>(quoteUrl, 60),
              fetchJSON<ProfileData>(profileUrl, 3600),
              fetchJSON<FinancialsData>(financialsUrl, 3600),
            ]);

            return {
              userId,
              symbol,
              company: profile.name || symbol,
              addedAt: new Date(), // You might want to store this in your DB
              currentPrice: quote.c,
              changePercent: quote.dp,
              priceFormatted: quote.c ? `$${quote.c.toFixed(2)}` : undefined,
              changeFormatted: quote.dp
                ? `${quote.dp > 0 ? "+" : ""}${quote.dp.toFixed(2)}%`
                : undefined,
              marketCap: profile.marketCapitalization
                ? formatMarketCapValue(profile.marketCapitalization)
                : undefined,
              peRatio: financials.metric?.peBasicExclExtraTTM
                ? financials.metric.peBasicExclExtraTTM.toFixed(2)
                : undefined,
              logo: profile.logo || undefined,
            } as StockWithData;
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return null;
          }
        })
      );

      return watchlistData.filter(Boolean) as StockWithData[];
    } catch (err) {
      console.error("Error in getWatchlistWithData:", err);
      return [];
    }
  }
);

export async function getWatchlistWithData(
  email?: string
): Promise<StockWithData[]> {
  // If email is provided, use per-email cached version
  if (email) {
    return getWatchlistWithDataCached(email);
  }

  // Fallback for client-side calls without email (legacy support)
  try {
    const { getAuth } = await import("@/lib/better-auth/auth");
    const { headers } = await import("next/headers");
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) return [];

    return getWatchlistWithDataCached(session.user.email);
  } catch (err) {
    console.error("Error in getWatchlistWithData:", err);
    return [];
  }
}
