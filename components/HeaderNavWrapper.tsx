"use client";

import { useMemo } from "react";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import Link from "next/link";
import { Button } from "./ui/button";

interface HeaderNavWrapperProps {
  user: User | null;
  initialStocks: StockWithWatchlistStatus[];
}

export default function HeaderNavWrapper({
  user,
  initialStocks,
}: HeaderNavWrapperProps) {
  // Memoize initialStocks to provide a stable reference
  const memoizedInitialStocks = useMemo(
    () => initialStocks,
    [initialStocks.length, initialStocks[0]?.symbol]
  );

  return (
    <>
      <nav className="hidden sm:block">
        <NavItems initialStocks={memoizedInitialStocks} />
      </nav>
      {user ? (
        <UserDropdown user={user} initialStocks={memoizedInitialStocks} />
      ) : (
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-app-color"
          asChild
        >
          <Link href="/sign-in">Sign In</Link>
        </Button>
      )}
    </>
  );
}
