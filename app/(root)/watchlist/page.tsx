import { searchStocks } from "@/lib/actions/finnhub.actions";
import WatchlistPageClient from "./WatchlistPageClient";
import type { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://marketgist.vercel.app";

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
    url: `${siteUrl}/watchlist`,
    siteName: "Marketgist",
    images: [
      {
        url: `${siteUrl}/assets/images/dashboard-preview.png`,
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
    images: [`${siteUrl}/assets/images/dashboard-preview.png`],
  },
  alternates: {
    canonical: `${siteUrl}/watchlist`,
  },
};

const WatchlistPage = async () => {
  const initialStocks = await searchStocks();

  return <WatchlistPageClient initialStocks={initialStocks} />;
};

export default WatchlistPage;
