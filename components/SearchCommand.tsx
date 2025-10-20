"use client";

import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import Link from "next/link";
import { TrendingUpIcon } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import WatchlistButton from "./WatchlistButton";
import { useWatchlist } from "./WatchlistProvider";

export default function SearchCommand({
  renderAs = "button",
  label = "Add stock",
  initialStocks,
}: SearchCommandProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks);
  const [loading, setLoading] = useState<boolean>(false);
  const { isInWatchlist: checkWatchlist } = useWatchlist();

  // Update initial stocks with real watchlist status when component mounts
  useEffect(() => {
    if (initialStocks.length > 0) {
      const updatedStocks = initialStocks.map((stock) => ({
        ...stock,
        isInWatchlist: checkWatchlist(stock.symbol),
      }));
      setStocks(updatedStocks);
    }
  }, [initialStocks, checkWatchlist]);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);

    setLoading(true);

    try {
      // Call our API route instead of the server action
      const url = new URL("/api/stocks/search", window.location.origin);
      if (searchTerm.trim()) {
        url.searchParams.set("q", searchTerm.trim());
      }

      const response = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const results = await response.json();
      setStocks(results);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, debouncedSearch]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  };

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    // Reflect change locally for immediate UI; also source of truth is context
    setStocks((prev) =>
      prev.map((stock) =>
        stock.symbol === symbol ? { ...stock, isInWatchlist: isAdded } : stock
      )
    );
  };

  return (
    <>
      {renderAs === "text" ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {label}
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="search-dialog"
      >
        <div className="search-field">
          <CommandInput
            placeholder="Search stocks..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="search-input"
          />
        </div>
        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty className="search-list-empty flex items-center justify-center gap-4">
              {loading && <Spinner />} Loading stocks...
            </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <CommandEmpty className="search-list-indicator">
              {isSearchMode ? "No results found" : "No stocks available"}
            </CommandEmpty>
          ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? `Search results` : `Popular stocks`} {` `} (
                {displayStocks?.length || 0})
              </div>

              {displayStocks?.map((stock, i) => (
                <li key={stock.symbol} className="search-item">
                  <div className="search-item-container">
                    <Link
                      href={`/stocks/${stock.symbol}`}
                      onClick={handleSelectStock}
                      className="search-item-link"
                    >
                      <TrendingUpIcon className="h-4 w-4 text-gray-500" />

                      <div className="flex-1">
                        <div className="search-item-name">{stock.name}</div>
                        <div className="text-sm text-gray-500">
                          {stock.symbol} | {stock.exchange} | {stock.type}
                        </div>
                      </div>
                    </Link>
                    <WatchlistButton
                      mode="icon"
                      symbol={stock.symbol}
                      company={stock.name}
                      isInWatchlist={checkWatchlist(stock.symbol)}
                      onWatchlistChange={handleWatchlistChange}
                    />
                  </div>
                  {i < displayStocks?.length - 1 && <CommandSeparator />}
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
