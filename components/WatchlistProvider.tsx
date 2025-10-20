"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";

type WatchlistContextValue = {
  symbols: Set<string>;
  isInWatchlist: (symbol: string) => boolean;
  add: (symbol: string, company?: string) => Promise<boolean>;
  remove: (symbol: string) => Promise<boolean>;
  toggle: (symbol: string, company?: string) => Promise<boolean>;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({
  initialSymbols = [],
  children,
}: {
  initialSymbols?: string[];
  children: React.ReactNode;
}) {
  const [symbolsState, setSymbolsState] = useState<Set<string>>(
    () => new Set(initialSymbols.map((s) => s.toUpperCase().trim()))
  );

  const isInWatchlist = useCallback(
    (symbol: string) => symbolsState.has(symbol.toUpperCase().trim()),
    [symbolsState]
  );

  const add = useCallback(async (symbol: string, company?: string) => {
    const normalized = symbol.toUpperCase().trim();
    if (!normalized) return false;
    const result = await addToWatchlist(normalized, company || normalized);
    if (result?.success) {
      setSymbolsState((prev) => new Set(prev).add(normalized));
      return true;
    }
    toast.error("Failed to add to watchlist", {
      description: result?.error || "Please try again",
    });
    return false;
  }, []);

  const remove = useCallback(async (symbol: string) => {
    const normalized = symbol.toUpperCase().trim();
    if (!normalized) return false;
    const result = await removeFromWatchlist(normalized);
    if (result?.success) {
      setSymbolsState((prev) => {
        const next = new Set(prev);
        next.delete(normalized);
        return next;
      });
      return true;
    }
    toast.error("Failed to remove from watchlist", {
      description: result?.error || "Please try again",
    });
    return false;
  }, []);

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
    () => ({ symbols: symbolsState, isInWatchlist, add, remove, toggle }),
    [symbolsState, isInWatchlist, add, remove, toggle]
  );

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
