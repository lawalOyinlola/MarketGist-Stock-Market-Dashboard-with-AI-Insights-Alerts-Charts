"use client";

import WatchlistButton from "@/components/WatchlistButton";
import { useWatchlist } from "@/components/WatchlistProvider";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
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
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";

export default function WatchlistTable({ watchlist }: WatchlistTableProps) {
  const { isInWatchlist } = useWatchlist();

  // Use the provided watchlist data
  const rows: StockWithData[] = watchlist || [];

  if (rows.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No Watchlist Yet</EmptyTitle>
          <EmptyDescription>
            Your watchlist is empty. Use the search to add stocks to track.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="outline" asChild>
            <Link href="/">Browse Stocks</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
      <div className="overflow-hidden rounded-md border !bg-gray-800 md:col-span-2 lg:col-span-5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-zinc-800">
              {WATCHLIST_TABLE_HEADER.map((head) => (
                <TableHead key={head} className="h-11 text-left">
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.symbol}-${row.userId}`}>
                {/* Company (with watchlist button) */}
                <TableCell className="text-left">
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
                <TableCell className="text-left">{row.symbol}</TableCell>
                {/* Price */}
                <TableCell className="text-left">
                  {row.priceFormatted ??
                    (row.currentPrice
                      ? `$${row.currentPrice.toFixed(2)}`
                      : "-")}
                </TableCell>
                {/* Change */}
                <TableCell className="text-left">
                  {row.changeFormatted ??
                    (typeof row.changePercent === "number"
                      ? `${
                          row.changePercent > 0 ? "+" : ""
                        }${row.changePercent.toFixed(2)}%`
                      : "-")}
                </TableCell>
                {/* Market Cap */}
                <TableCell className="text-left">
                  {row.marketCap ?? "-"}
                </TableCell>
                {/* P/E Ratio */}
                <TableCell className="text-left">
                  {row.peRatio ?? "-"}
                </TableCell>

                {/* Action: Add/Remove Alert UI only */}
                <TableCell className="text-left">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary">
                      Add Alert
                    </Button>
                    <Button size="sm" variant="outline">
                      Remove Alert
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="bg-amber-300 lg:col-span-2"></div>
    </div>
  );
}
