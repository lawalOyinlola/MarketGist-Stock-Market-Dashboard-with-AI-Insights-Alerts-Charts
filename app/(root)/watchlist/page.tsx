import AlertsPanel from "@/components/AlertsPanel";
import { Button } from "@/components/ui/button";
import WatchListTable from "@/components/WatchListTable";
import { getWatchlistWithData } from "@/lib/actions/finnhub.actions";
import { BellIcon, PlusIcon } from "lucide-react";
import React from "react";

const WatchlistPage = async () => {
  const watchlistData = await getWatchlistWithData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-5">
      <div className="md:col-span-2 lg:col-span-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-100">Watchlist</h2>
          <Button variant="outline">
            <PlusIcon className="w-4 h-4" />
            Add Stock
          </Button>
        </div>
        <WatchListTable watchlist={watchlistData} />
      </div>

      <div className="col-span-1 lg:col-span-2 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-100">Alerts</h2>
          <Button variant="outline">
            <BellIcon className="w-4 h-4" />
            Create Alert
          </Button>
        </div>
        <AlertsPanel watchlist={watchlistData} />
      </div>
    </div>
  );
};

export default WatchlistPage;
