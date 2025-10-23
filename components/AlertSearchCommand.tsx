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
import { TrendingUpIcon, BellIcon } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import AlertModal from "./AlertModal";
import { useAlert } from "./AlertProvider";

export default function AlertSearchCommand({
  renderAs = "button",
  label = "Create Alert",
  initialStocks = [],
}: AlertSearchCommandProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>();
  const { getAlertsForSymbol } = useAlert();

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

  const fetchCurrentPrice = async (
    symbol: string
  ): Promise<number | undefined> => {
    try {
      const response = await fetch(
        `/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch price: ${response.status}`);
      }
      const data = await response.json();
      return data.c; // current price
    } catch (error) {
      console.error("Error fetching current price:", error);
      return undefined;
    }
  };

  const handleSelectStock = async (stock: StockWithWatchlistStatus) => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);

    // Fetch current price for the selected stock
    const price = await fetchCurrentPrice(stock.symbol);
    setCurrentPrice(price);

    // Set selected stock and open modal
    setSelectedStock({
      symbol: stock.symbol,
      company: stock.name,
      currentPrice: price,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
    setCurrentPrice(undefined);
  };

  return (
    <>
      {renderAs === "text" ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <BellIcon className="w-4 h-4 group-hover:fill-current transition-all duration-300" />
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
            placeholder="Search stocks to create alert..."
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
                    <button
                      onClick={() => handleSelectStock(stock)}
                      className="search-item-link w-full text-left"
                    >
                      <TrendingUpIcon className="h-4 w-4 text-gray-500" />

                      <div className="flex-1">
                        <div className="search-item-name">{stock.name}</div>
                        <div className="text-sm text-gray-500">
                          {stock.symbol} | {stock.exchange} | {stock.type}
                        </div>
                      </div>
                    </button>
                  </div>
                  {i < displayStocks?.length - 1 && <CommandSeparator />}
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>

      {/* Alert Modal */}
      {selectedStock && (
        <AlertModal
          symbol={selectedStock.symbol}
          company={selectedStock.company}
          currentPrice={currentPrice}
          existingAlerts={getAlertsForSymbol(selectedStock.symbol)}
          open={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

