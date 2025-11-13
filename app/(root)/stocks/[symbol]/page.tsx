import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
  MARKET_OVERVIEW_WIDGET_CONFIG,
} from "@/lib/constants";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://marketgist.vercel.app";

export async function generateMetadata({
  params,
}: StockDetailsPageProps): Promise<Metadata> {
  const { symbol } = await params;
  const upperSymbol = symbol?.toUpperCase() || "";

  return {
    title: `${upperSymbol} - Stock Price, Charts & Analysis`,
    description: `Track ${upperSymbol} stock price in real-time. View detailed charts, technical analysis, company profile, and financial data. Get personalized alerts and insights. Built by Yero.`,
    keywords: [
      upperSymbol,
      `${upperSymbol} stock`,
      `${upperSymbol} price`,
      `${upperSymbol} chart`,
      "stock analysis",
      "stock tracker",
      "real-time stock prices",
    ],
    openGraph: {
      title: `${upperSymbol} - Stock Price, Charts & Analysis | Marketgist`,
      description: `Track ${upperSymbol} stock price in real-time. View detailed charts, technical analysis, and company profile.`,
      url: `${siteUrl}/stocks/${upperSymbol}`,
      siteName: "Marketgist",
      images: [
        {
          url: `${siteUrl}/assets/images/stock-details.png`,
          width: 1200,
          height: 630,
          alt: `${upperSymbol} Stock Analysis`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${upperSymbol} - Stock Price & Analysis`,
      description: `Track ${upperSymbol} stock price in real-time with detailed charts and technical analysis.`,
      images: [`${siteUrl}/assets/images/stock-details.png`],
    },
    alternates: {
      canonical: `${siteUrl}/stocks/${upperSymbol}`,
    },
  };
}

const StockDetails = async ({ params }: StockDetailsPageProps) => {
  const { symbol } = await params;

  if (!symbol) {
    notFound();
  }

  const company = symbol; // This could be enhanced to fetch actual company name

  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <div className="md:col-span-full">
          <TradingViewWidget
            title={`Market Overview`}
            scriptUrl={`${scriptUrl}ticker-tape.js`}
            config={MARKET_OVERVIEW_WIDGET_CONFIG}
            height={170}
            className="md:col-span-full"
          />
        </div>
        {/* Left Column */}
        <div className="space-y-6 col-span-2">
          {/* Symbol Info Widget */}
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
            height={170}
          />

          {/* Candle Chart Widget */}
          <TradingViewWidget
            title={`${symbol.toUpperCase()} Advanced Chart`}
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={600}
          />

          {/* Baseline Widget */}
          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={600}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Watchlist Button */}
          <div className="mb-6">
            <WatchlistButton
              symbol={symbol}
              company={company}
              isInWatchlist={false}
              mode="button"
            />
          </div>

          {/* Company Analysis Widget */}
          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            height={400}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={240}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            height={500}
          />
        </div>
      </div>
    </div>
  );
};

export default StockDetails;
