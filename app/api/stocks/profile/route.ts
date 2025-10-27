import { NextRequest, NextResponse } from "next/server";
import { fetchJSON } from "@/lib/actions/finnhub.actions";
import { FINNHUB_BASE_URL, FINNHUB_API_KEY } from "@/lib/constants";

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

    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
      symbol
    )}&token=${FINNHUB_API_KEY}`;

    // Cache for 1 hour (3600 seconds)
    const profile = await fetchJSON<Record<string, unknown>>(url, 3600);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching stock profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock profile" },
      { status: 500 }
    );
  }
}
