import { NextResponse } from "next/server";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

// Generate RSS feed XML
function generateRSSFeed() {
  const currentDate = new Date().toUTCString();

  // You can fetch dynamic content here (e.g., recent stock updates, market news, etc.)
  // For now, this is a basic RSS feed structure that can be enhanced
  const items = [
    {
      title: "Marketgist - Real-Time Stock Market Tracker & Alerts",
      link: SITE_URL,
      description:
        "Track real-time stock prices, get personalized alerts, and explore detailed company insights. Comprehensive stock market tracker with AI integration, real-time charts, and intelligent market insights. Built by Yero.",
      pubDate: currentDate,
      guid: `${SITE_URL}#home`,
    },
    {
      title: "Watchlist - Track Your Favorite Stocks",
      link: `${SITE_URL}/watchlist`,
      description:
        "Create a personalized watchlist to track your favorite stocks in real-time with comprehensive analytics and insights.",
      pubDate: currentDate,
      guid: `${SITE_URL}/watchlist`,
    },
    {
      title: "Stock Alerts - Get Notified on Price Changes",
      link: `${SITE_URL}`,
      description:
        "Set up intelligent price alerts with customizable thresholds and frequency options. Get notified when stocks hit your target prices.",
      pubDate: currentDate,
      guid: `${SITE_URL}#alerts`,
    },
  ];

  const rssItems = items
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="false">${item.guid}</guid>
    </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${SITE_NAME} - Stock Market Tracker]]></title>
    <link>${SITE_URL}</link>
    <description><![CDATA[Track real-time stock prices, get personalized alerts, and explore detailed company insights. Built by Yero.]]></description>
    <language>en-US</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <pubDate>${currentDate}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml" />
    <managingEditor>support@marketgist.vercel.app</managingEditor>
    <webMaster>support@marketgist.vercel.app</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</copyright>
    ${rssItems}
  </channel>
</rss>`;
}

export async function GET() {
  try {
    const rssFeed = generateRSSFeed();

    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new NextResponse("Error generating RSS feed", { status: 500 });
  }
}
