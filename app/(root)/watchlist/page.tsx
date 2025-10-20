import WatchListTable from "@/components/WatchListTable";
import { getWatchlistWithData } from "@/lib/actions/finnhub.actions";
import React from "react";

const WatchlistPage = async () => {
  const watchlistData = await getWatchlistWithData();

  return (
    <div>
      <WatchListTable watchlist={watchlistData} />
    </div>
  );
};

export default WatchlistPage;
