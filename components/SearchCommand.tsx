"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
import { TrendingUpIcon, BellIcon } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import WatchlistButton from "./WatchlistButton";
import { useWatchlist } from "./WatchlistProvider";
import AlertModal from "./AlertModal";
import { useAlert } from "./AlertProvider";
import { toast } from "sonner";

export default function SearchCommand({
  type = "navigation",
  renderAs = "button",
  label,
  initialStocks = [],
  onNavigate,
}: AlertSearchCommandProps) {
  const pathname = usePathname();
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

  const { isInWatchlist: checkWatchlist } = useWatchlist();
  const { getAlertsForSymbol } = useAlert();

  // Set default label based on type
  const defaultLabel = type === "alert" ? "Create Alert" : "Add stock";
  const displayLabel = label || defaultLabel;

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

  // Close dialog when navigating to a new page
  useEffect(() => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  }, [pathname, initialStocks]);

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
      if (type === "alert") {
        toast.error("Search failed", {
          description: "Unable to search stocks. Please try again.",
        });
      }
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
      toast.error("Failed to fetch current price", {
        description: "Alert creation will proceed without current price data.",
      });
      return undefined;
    }
  };

  const handleSelectStock = async (stock: StockWithWatchlistStatus) => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);

    // Close dropdown if navigating (type === "navigation")
    if (type === "navigation" && onNavigate) {
      onNavigate();
    }

    if (type === "alert") {
      toast.loading("Fetching stock price...", { id: "fetch-price" });
      const price = await fetchCurrentPrice(stock.symbol);
      toast.dismiss("fetch-price");
      setCurrentPrice(price);

      setSelectedStock({
        symbol: stock.symbol,
        company: stock.name,
        currentPrice: price,
      });
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
    setCurrentPrice(undefined);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setSearchTerm("");
      setStocks(initialStocks);
    }
  };

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    setStocks((prev) =>
      prev.map((stock) =>
        stock.symbol === symbol ? { ...stock, isInWatchlist: isAdded } : stock
      )
    );
  };

  const renderButton = () => {
    // Convert displayLabel to string for aria-label
    const ariaLabel =
      typeof displayLabel === "string"
        ? displayLabel
        : type === "alert"
        ? "Create Alert"
        : "Add stock";

    const handleButtonClick = (e?: React.MouseEvent) => {
      // Prevent event from bubbling up (which might close dialogs)
      if (e) {
        e.stopPropagation();
      }

      // Just open the search dialog - don't close dropdown
      // Both dialogs can coexist, and navigation will close both
      setOpen(true);
    };

    if (renderAs === "text") {
      return (
        <button
          onClick={handleButtonClick}
          className="search-text"
          aria-label={ariaLabel}
        >
          {displayLabel}
        </button>
      );
    }

    return (
      <Button onClick={handleButtonClick}>
        {type === "alert" && (
          <BellIcon className="w-4 h-4 group-hover:fill-current transition-all duration-300" />
        )}
        {displayLabel}
      </Button>
    );
  };

  const renderStockItem = (stock: StockWithWatchlistStatus, index: number) => {
    const stockContent = (
      <>
        <TrendingUpIcon className="h-4 w-4 text-gray-500" />
        <div className="flex-1">
          <div className="search-item-name">{stock.name}</div>
          <div className="text-sm text-gray-500">
            {stock.symbol} | {stock.exchange} | {stock.type}
          </div>
        </div>
      </>
    );

    return (
      <li
        key={`${stock.symbol}-${stock.exchange || "default"}`}
        className="search-item"
      >
        <div className="search-item-container">
          {type === "navigation" ? (
            <Link
              href={`/stocks/${stock.symbol}`}
              onClick={() => handleSelectStock(stock)}
              className="search-item-link"
            >
              {stockContent}
            </Link>
          ) : (
            <button
              onClick={() => handleSelectStock(stock)}
              className="search-item-link w-full text-left"
            >
              {stockContent}
            </button>
          )}

          <WatchlistButton
            mode="icon"
            symbol={stock.symbol}
            company={stock.name}
            isInWatchlist={checkWatchlist(stock.symbol)}
            onWatchlistChange={handleWatchlistChange}
          />
        </div>
        {index < displayStocks?.length - 1 && <CommandSeparator />}
      </li>
    );
  };

  return (
    <>
      {renderButton()}

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        className="search-dialog"
      >
        <div className="search-field">
          <CommandInput
            placeholder={
              type === "alert"
                ? "Search stocks to create alert..."
                : "Search stocks..."
            }
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="search-input"
            aria-label={
              type === "alert"
                ? "Search stocks to create alert"
                : "Search stocks"
            }
          />
        </div>
        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty className="search-list-empty flex items-center justify-center gap-4">
              {loading && <Spinner />} Loading stocks...
            </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <CommandEmpty className="search-list-indicator">
              {isSearchMode
                ? "No results found"
                : type === "alert"
                ? "Search for stocks to create alerts"
                : "No stocks available"}
            </CommandEmpty>
          ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? `Search results` : `Popular stocks`} {` `} (
                {displayStocks?.length || 0})
              </div>

              {displayStocks?.map((stock, i) => renderStockItem(stock, i))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>

      {/* Alert Modal - only render for alert type */}
      {type === "alert" && selectedStock && (
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
