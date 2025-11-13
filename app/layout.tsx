import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://marketgist.vercel.app";
const siteName = "Marketgist";
const siteDescription =
  "Track real-time stock prices, get personalized alerts, and explore detailed company insights. Comprehensive stock market tracker with AI integration, real-time charts, and intelligent market insights. Built by Yero.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Marketgist - Real-Time Stock Market Tracker & Alerts",
    template: "%s | Marketgist",
  },
  description: siteDescription,
  keywords: [
    "stock market",
    "stock tracker",
    "real-time stock prices",
    "stock alerts",
    "watchlist",
    "TradingView",
    "stock analysis",
    "market insights",
    "portfolio tracker",
    "stock prices",
    "financial markets",
    "investment tracking",
  ],
  authors: [{ name: "Yero" }],
  creator: "Yero",
  publisher: "Yero",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: "Marketgist - Real-Time Stock Market Tracker & Alerts",
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/assets/screenshots/Screenshot-dashboard.webp`,
        width: 1200,
        height: 630,
        alt: "Marketgist Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketgist - Real-Time Stock Market Tracker & Alerts",
    description: siteDescription,
    images: [`${siteUrl}/assets/screenshots/Screenshot-dashboard.webp`],
    creator: "@HoneyzRich",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": [
        { url: `${siteUrl}/api/rss`, title: "Marketgist RSS Feed" },
      ],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    description: siteDescription,
    url: siteUrl,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Yero",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Yero",
    },
    mainEntity: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  };

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ErrorBoundary>{children}</ErrorBoundary>
        <ErrorBoundary>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
