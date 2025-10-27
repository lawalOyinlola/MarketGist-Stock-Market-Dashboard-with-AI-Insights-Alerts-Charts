"use client";

import Link from "next/link";
import { useWatchlist } from "@/components/WatchlistProvider";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import WatchlistButton from "@/components/WatchlistButton";
import AlertButton from "@/components/AlertButton";
import { StarOffIcon } from "lucide-react";

export default function WatchlistTable() {
  const { watchlistData, isInWatchlist } = useWatchlist();

  // Use the watchlist data from context
  const rows: StockWithData[] = watchlistData || [];

  if (rows.length === 0) {
    return (
      <>
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-gray-700/70">
              <StarOffIcon className={`star-icon`} />
            </EmptyMedia>
            <EmptyTitle>No Watchlist Yet</EmptyTitle>
            <EmptyDescription>
              Your watchlist is empty. Use the "add stock" button to add stocks
              to your watchlist.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border !bg-gray-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-700 text-gray-400 hover:bg-gray-700">
            {WATCHLIST_TABLE_HEADER.map((head) => (
              <TableHead key={head} className="h-11 text-left">
                {head}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={`${row.symbol}-${row.userId}`}
              className="*:text-left *:border-border [&>:not(:last-child)]:border-r hover:bg-gray-700/40"
            >
              {/* Company (with watchlist button) */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <WatchlistButton
                    mode="icon"
                    symbol={row.symbol}
                    company={row.company}
                    isInWatchlist={isInWatchlist(row.symbol)}
                  />
                  <Link
                    href={`/stocks/${row.symbol}`}
                    className="font-medium hover:text-app-color/70 transition-colors"
                  >
                    {row.company}
                  </Link>
                </div>
              </TableCell>
              {/* Symbol */}
              <TableCell>{row.symbol}</TableCell>
              {/* Price */}
              <TableCell>
                {row.priceFormatted ??
                  (row.currentPrice ? `$${row.currentPrice.toFixed(2)}` : "-")}
              </TableCell>
              {/* Change */}
              <TableCell
                className={
                  row.changeFormatted &&
                  typeof row.changePercent === "number" &&
                  row.changePercent > 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {row.changeFormatted ??
                  (typeof row.changePercent === "number"
                    ? `${
                        row.changePercent > 0 ? "+" : ""
                      }${row.changePercent.toFixed(2)}%`
                    : "-")}
              </TableCell>
              {/* Market Cap */}
              <TableCell>{row.marketCap ?? "-"}</TableCell>
              {/* P/E Ratio */}
              <TableCell>{row.peRatio ?? "-"}</TableCell>

              {/* Action */}
              <TableCell>
                <AlertButton
                  mode="button"
                  symbol={row.symbol}
                  company={row.company}
                  currentPrice={row.currentPrice ?? 0}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
