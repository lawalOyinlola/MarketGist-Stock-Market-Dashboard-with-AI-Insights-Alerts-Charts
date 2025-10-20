import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || undefined;

    // Fetch stock data (user-agnostic, cached)
    const stocks = await searchStocks(query);

    // Get user's watchlist symbols
    const watchlistSymbols = await getWatchlistSymbolsByEmail(
      session.user.email
    );

    // Combine stock data with user's watchlist status
    const stocksWithWatchlistStatus = stocks.map((stock) => ({
      ...stock,
      isInWatchlist: watchlistSymbols.includes(stock.symbol),
    }));

    return NextResponse.json(stocksWithWatchlistStatus);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}
