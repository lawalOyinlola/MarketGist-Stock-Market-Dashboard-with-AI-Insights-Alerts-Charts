"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
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
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({
  initialSymbols = [],
  initialWatchlistData = [],
  email,
  children,
}: {
  initialSymbols?: string[];
  initialWatchlistData?: StockWithData[];
  email?: string;
  children: React.ReactNode;
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
  const didAutoRefetchRef = useRef<boolean>(false);
  const hasCompletedInitialLoadRef = useRef<boolean>(
    initialWatchlistData.length > 0 || initialSymbols.length === 0
  );

  const isInWatchlist = useCallback(
    (symbol: string) => symbolsState.has(symbol.toUpperCase().trim()),
    [symbolsState]
  );

  const refreshWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use email if available, otherwise fall back to internal auth
      const data = await getWatchlistWithData(email);
      setWatchlistData(data);
      hasCompletedInitialLoadRef.current = true;
    } catch (error) {
      console.error("Failed to refresh watchlist:", error);
      toast.error("Failed to refresh watchlist data");
      hasCompletedInitialLoadRef.current = true;
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const add = useCallback(
    async (symbol: string, company?: string) => {
      const normalized = symbol.toUpperCase().trim();
      if (!normalized) return false;
      const result = await addToWatchlist(normalized, company || normalized);
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
    [refreshWatchlist]
  );

  const remove = useCallback(
    async (symbol: string) => {
      const normalized = symbol.toUpperCase().trim();
      if (!normalized) return false;
      const result = await removeFromWatchlist(normalized);
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
    [refreshWatchlist]
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
    ]
  );

  // Auto-refresh on mount to fetch latest watchlist data client-side
  useEffect(() => {
    if (didAutoRefetchRef.current) return;
    if (!email) {
      // If no email, mark as completed to avoid showing loading forever
      hasCompletedInitialLoadRef.current = true;
      setIsLoading(false);
      return;
    }
    didAutoRefetchRef.current = true;
    // Fire and forget; internal loading state handles UX
    refreshWatchlist();
  }, [email, refreshWatchlist]);

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
