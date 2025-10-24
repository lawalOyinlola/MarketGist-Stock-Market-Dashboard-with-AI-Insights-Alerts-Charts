"use client";

import { useMemo } from "react";
import AlertsPanel from "@/components/AlertsPanel";
import SearchCommand from "@/components/SearchCommand";
import WatchListTable from "@/components/WatchListTable";
import { useWatchlist } from "@/components/WatchlistProvider";
import { PlusIcon } from "lucide-react";

interface WatchlistPageClientProps {
  initialStocks: Stock[];
}

export default function WatchlistPageClient({
  initialStocks,
}: WatchlistPageClientProps) {
  const { watchlistData } = useWatchlist();

  // Memoize the mapped stocks to prevent unnecessary re-renders
  const stocksWithWatchlistStatus = useMemo(
    () =>
      initialStocks.map((stock) => ({
        ...stock,
        isInWatchlist: watchlistData.some((w) => w.symbol === stock.symbol),
      })),
    [initialStocks, watchlistData]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-5">
      <div className="md:col-span-2 lg:col-span-5 space-y-5">
        <div className="flex items-center justify-between pl-4">
          <h2 className="text-2xl font-bold text-gray-100">Watchlist</h2>
          <SearchCommand
            renderAs="button"
            label={
              <>
                <PlusIcon className="w-4 h-4" /> Add Stock
              </>
            }
            initialStocks={stocksWithWatchlistStatus}
          />
        </div>
        <WatchListTable />
      </div>

      <div className="col-span-1 lg:col-span-2 space-y-5">
        <div className="flex items-center justify-between pl-4">
          <h2 className="text-2xl font-bold text-gray-100">Alerts</h2>
          <SearchCommand
            type="alert"
            initialStocks={stocksWithWatchlistStatus}
          />
        </div>
        <AlertsPanel watchlist={watchlistData} />
      </div>
    </div>
  );
}
