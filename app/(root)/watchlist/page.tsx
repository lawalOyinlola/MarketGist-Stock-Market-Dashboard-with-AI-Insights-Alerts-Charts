import { searchStocks } from "@/lib/actions/finnhub.actions";
import WatchlistPageClient from "./WatchlistPageClient";

const WatchlistPage = async () => {
  const initialStocks = await searchStocks();

  return <WatchlistPageClient initialStocks={initialStocks} />;
};

export default WatchlistPage;
