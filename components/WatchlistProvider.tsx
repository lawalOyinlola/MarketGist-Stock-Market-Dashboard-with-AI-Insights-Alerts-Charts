"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { toast } from "sonner";
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import { getWatchlistWithData } from "@/lib/actions/finnhub.actions";

type WatchlistContextValue = {
  symbols: Set<string>;
  watchlistData: StockWithData[];
  isLoading: boolean;
  isInWatchlist: (symbol: string) => boolean;
  add: (symbol: string, company?: string) => Promise<boolean>;
  remove: (symbol: string) => Promise<boolean>;
  toggle: (symbol: string, company?: string) => Promise<boolean>;
  refreshWatchlist: () => Promise<void>;
  onEmailRequired?: () => void;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({
  initialSymbols = [],
  initialWatchlistData = [],
  email,
  children,
  onEmailRequired,
}: {
  initialSymbols?: string[];
  initialWatchlistData?: StockWithData[];
  email?: string;
  children: React.ReactNode;
  onEmailRequired?: () => void;
}) {
  const [symbolsState, setSymbolsState] = useState<Set<string>>(
    () => new Set(initialSymbols.map((s) => s.toUpperCase().trim()))
  );
  const [watchlistData, setWatchlistData] =
    useState<StockWithData[]>(initialWatchlistData);
  // If we have symbols but no initial data, we should show loading state
  const shouldShowInitialLoading =
    initialSymbols.length > 0 && initialWatchlistData.length === 0;
  const [isLoading, setIsLoading] = useState(shouldShowInitialLoading);

  // Use the provided email (already includes guest email from GuestWrapper)
  const effectiveEmail = email;

  const isInWatchlist = useCallback(
    (symbol: string) => symbolsState.has(symbol.toUpperCase().trim()),
    [symbolsState]
  );

  const refreshWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use email if available, otherwise fall back to internal auth
      const data = await getWatchlistWithData(effectiveEmail || undefined);
      setWatchlistData(data);
      // Update symbolsState to match the fetched data
      const fetchedSymbols = new Set(
        data.map((item) => item.symbol.toUpperCase().trim())
      );
      setSymbolsState(fetchedSymbols);
    } catch (error) {
      console.error("Failed to refresh watchlist:", error);
      toast.error("Failed to refresh watchlist data");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmail]);

  const add = useCallback(
    async (symbol: string, company?: string) => {
      // Check if we have an email (either authenticated or guest)
      if (!effectiveEmail) {
        // Show email capture modal for guest users
        if (onEmailRequired) {
          onEmailRequired();
        } else {
          toast.error("Email required", {
            description: "Please provide your email to add stocks to watchlist",
          });
        }
        return false;
      }

      const normalized = symbol.toUpperCase().trim();
      if (!normalized) return false;
      const result = await addToWatchlist(
        normalized,
        company || normalized,
        effectiveEmail || undefined
      );
      if (result?.success) {
        setSymbolsState((prev) => new Set(prev).add(normalized));
        // Refresh watchlist data to get the new stock with all its data
        await refreshWatchlist();
        return true;
      }
      toast.error("Failed to add to watchlist", {
        description: result?.error || "Please try again",
      });
      return false;
    },
    [effectiveEmail, refreshWatchlist, onEmailRequired]
  );

  const remove = useCallback(
    async (symbol: string) => {
      // Check if we have an email (either authenticated or guest)
      if (!effectiveEmail) {
        if (onEmailRequired) {
          onEmailRequired();
        } else {
          toast.error("Email required", {
            description: "Please provide your email to manage watchlist",
          });
        }
        return false;
      }

      const normalized = symbol.toUpperCase().trim();
      if (!normalized) return false;
      const result = await removeFromWatchlist(
        normalized,
        effectiveEmail || undefined
      );
      if (result?.success) {
        setSymbolsState((prev) => {
          const next = new Set(prev);
          next.delete(normalized);
          return next;
        });
        // Refresh watchlist data to remove the stock from the table
        await refreshWatchlist();
        return true;
      }
      toast.error("Failed to remove from watchlist", {
        description: result?.error || "Please try again",
      });
      return false;
    },
    [effectiveEmail, refreshWatchlist, onEmailRequired]
  );

  const toggle = useCallback(
    async (symbol: string, company?: string) => {
      if (isInWatchlist(symbol)) {
        return remove(symbol);
      }
      return add(symbol, company);
    },
    [add, remove, isInWatchlist]
  );

  const value = useMemo<WatchlistContextValue>(
    () => ({
      symbols: symbolsState,
      watchlistData,
      isLoading,
      isInWatchlist,
      add,
      remove,
      toggle,
      refreshWatchlist,
      onEmailRequired,
    }),
    [
      symbolsState,
      watchlistData,
      isLoading,
      isInWatchlist,
      add,
      remove,
      toggle,
      refreshWatchlist,
      onEmailRequired,
    ]
  );

  // Auto-refresh on mount to fetch latest watchlist data client-side
  useEffect(() => {
    if (!effectiveEmail) {
      // If no email, avoid showing loading forever
      setIsLoading(false);
      return;
    }
    // Fire and forget; internal loading state handles UX
    refreshWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveEmail]);

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return ctx;
}
