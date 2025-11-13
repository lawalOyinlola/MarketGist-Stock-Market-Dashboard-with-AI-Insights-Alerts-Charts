import { searchStocks } from "@/lib/actions/finnhub.actions";
import WatchlistPageClient from "./WatchlistPageClient";
import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Watchlist - Track Your Favorite Stocks",
  description:
    "Create and manage your personalized stock watchlist. Track your favorite stocks in real-time with comprehensive analytics, price changes, and market insights. Built by Yero.",
  keywords: [
    "stock watchlist",
    "portfolio tracker",
    "stock tracker",
    "favorite stocks",
    "stock monitoring",
    "market insights",
  ],
  openGraph: {
    title: "Watchlist - Track Your Favorite Stocks | Marketgist",
    description:
      "Create and manage your personalized stock watchlist. Track your favorite stocks in real-time with comprehensive analytics.",
    url: `${SITE_URL}/watchlist`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/assets/images/dashboard-preview.png`,
        width: 1200,
        height: 630,
        alt: "Marketgist Watchlist",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Watchlist - Track Your Favorite Stocks",
    description:
      "Create and manage your personalized stock watchlist with real-time tracking.",
    images: [`${SITE_URL}/assets/images/dashboard-preview.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/watchlist`,
  },
};

const WatchlistPage = async () => {
  const initialStocks = await searchStocks();

  return <WatchlistPageClient initialStocks={initialStocks} />;
};

export default WatchlistPage;
