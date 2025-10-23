import { NextRequest, NextResponse } from "next/server";
import { fetchJSON } from "@/lib/actions/finnhub.actions";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(
      symbol
    )}&token=${FINNHUB_API_KEY}`;
    const quoteData = await fetchJSON<{
      c?: number; // current price
      d?: number; // change
      dp?: number; // percent change
      h?: number; // high price of the day
      l?: number; // low price of the day
      o?: number; // open price of the day
      pc?: number; // previous close price
      t?: number; // timestamp
    }>(url, 60); // Cache for 1 minute

    return NextResponse.json(quoteData);
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote data" },
      { status: 500 }
    );
  }
}

