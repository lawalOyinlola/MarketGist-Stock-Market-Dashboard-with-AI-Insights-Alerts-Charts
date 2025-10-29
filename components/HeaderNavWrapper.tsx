"use client";

import { useMemo } from "react";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";

interface HeaderNavWrapperProps {
  user: User;
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
      <UserDropdown user={user} initialStocks={memoizedInitialStocks} />
    </>
  );
}
