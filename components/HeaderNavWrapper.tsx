"use client";

import { useMemo, useState, useEffect } from "react";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import GuestDropdown from "./GuestDropdown";
import { guestStorage } from "@/lib/utils/guest-storage";

interface HeaderNavWrapperProps {
  user: User | null;
  initialStocks: StockWithWatchlistStatus[];
}

export default function HeaderNavWrapper({
  user,
  initialStocks,
}: HeaderNavWrapperProps) {
  const [guestEmail, setGuestEmail] = useState<string | null>(null);

  // Memoize initialStocks to provide a stable reference
  const memoizedInitialStocks = useMemo(
    () => initialStocks,
    [initialStocks.length, initialStocks[0]?.symbol]
  );

  // Load guest email from localStorage
  useEffect(() => {
    const storedEmail = guestStorage.getGuestEmail();
    setGuestEmail(storedEmail);

    // Listen for storage changes to update guest email
    const handleStorageChange = () => {
      const updatedEmail = guestStorage.getGuestEmail();
      setGuestEmail(updatedEmail);
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event for same-window localStorage updates
    window.addEventListener("guestEmailChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("guestEmailChanged", handleStorageChange);
    };
  }, []);

  return (
    <>
      <nav className="hidden sm:block">
        <NavItems initialStocks={memoizedInitialStocks} />
      </nav>
      {user ? (
        <UserDropdown user={user} initialStocks={memoizedInitialStocks} />
      ) : (
        <GuestDropdown
          email={guestEmail}
          initialStocks={memoizedInitialStocks}
        />
      )}
    </>
  );
}
