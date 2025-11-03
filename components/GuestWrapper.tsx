"use client";

import { useState, useEffect } from "react";
import { WatchlistProvider } from "./WatchlistProvider";
import { AlertProvider } from "./AlertProvider";
import GuestEmailModal from "./GuestEmailModal";
import { guestStorage } from "@/lib/utils/guest-storage";

interface GuestWrapperProps {
  children: React.ReactNode;
  initialWatchlistSymbols?: string[];
  initialWatchlistData?: StockWithData[];
  initialAlerts?: AlertData[];
  authenticatedEmail?: string;
}

export default function GuestWrapper({
  children,
  initialWatchlistSymbols = [],
  initialWatchlistData = [],
  initialAlerts = [],
  authenticatedEmail,
}: GuestWrapperProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  // Initialize guest email from localStorage immediately
  const [guestEmail, setGuestEmail] = useState<string | null>(() => {
    if (typeof window !== "undefined" && !authenticatedEmail) {
      return guestStorage.getGuestEmail();
    }
    return null;
  });

  // Load guest email from localStorage on mount (backup)
  useEffect(() => {
    if (!authenticatedEmail && !guestEmail) {
      const stored = guestStorage.getGuestEmail();
      if (stored) {
        setGuestEmail(stored);
      }
    }
  }, [authenticatedEmail, guestEmail]);

  const handleEmailProvided = (email: string) => {
    setGuestEmail(email);
    setShowEmailModal(false);
  };

  const handleEmailRequired = () => {
    setShowEmailModal(true);
  };

  return (
    <>
      <WatchlistProvider
        initialSymbols={initialWatchlistSymbols}
        initialWatchlistData={initialWatchlistData}
        email={authenticatedEmail || guestEmail || undefined}
        onEmailRequired={handleEmailRequired}
      >
        <AlertProvider
          initialAlerts={initialAlerts}
          email={authenticatedEmail || guestEmail || undefined}
          onEmailRequired={handleEmailRequired}
        >
          {children}
        </AlertProvider>
      </WatchlistProvider>

      <GuestEmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        onEmailProvided={handleEmailProvided}
      />
    </>
  );
}
