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
import { StarIcon, TrendingUpIcon } from "lucide-react";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

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
      const results = await searchStocks(searchTerm.trim());
      console.log("Search results:", results); // Debug log
      setStocks(results);
    } catch (error) {
      console.error("Search error:", error); // Debug log
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
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
              {isSearchMode ? "No results found" : "No stocks in available"}
            </CommandEmpty>
          ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? `Search results` : `Popular stocks`} {` `} (
                {displayStocks?.length || 0})
              </div>

              {displayStocks?.map((stock, i) => (
                <>
                  <li key={stock.symbol} className="search-item">
                    <Link
                      href={`/stock/${stock.symbol}`}
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
                      <StarIcon className="h-4 w-4 text-gray-500" />
                    </Link>
                  </li>
                  {i < displayStocks?.length - 1 && <CommandSeparator />}
                </>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
