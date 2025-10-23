"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BellIcon, BellRingIcon } from "lucide-react";
import { useAlert } from "./AlertProvider";
import { Spinner } from "./ui/spinner";
import AlertModal from "./AlertModal";

type AlertButtonProps = {
  symbol: string;
  company: string;
  currentPrice?: number;
  mode?: "button" | "icon";
};

const AlertButton = ({
  symbol,
  company,
  currentPrice,
  mode = "button",
}: AlertButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasAlert, getAlertsForSymbol } = useAlert();

  const hasActiveAlert = hasAlert(symbol);
  const alertsForSymbol = getAlertsForSymbol(symbol);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (mode === "icon") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenModal}
          disabled={isLoading}
          className={`alert-icon-btn ${
            hasActiveAlert ? "alert-icon-active" : ""
          }`}
          aria-label={hasActiveAlert ? "Manage alerts" : "Add alert"}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
        >
          <div className="alert-icon">
            {hasActiveAlert ? (
              <BellRingIcon className="alert-icon-filled" />
            ) : (
              <BellIcon className="alert-icon-outline" />
            )}
          </div>
        </Button>

        <AlertModal
          symbol={symbol}
          company={company}
          currentPrice={currentPrice}
          existingAlerts={alertsForSymbol}
          open={isModalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        disabled={isLoading}
        className={`alert-btn ${hasActiveAlert ? "alert-active" : ""}`}
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
      >
        {isLoading ? (
          <>
            <Spinner />
            Loading...
          </>
        ) : hasActiveAlert ? (
          <>
            <BellRingIcon className="w-4 h-4" />
            Manage Alerts ({alertsForSymbol.length})
          </>
        ) : (
          <>
            <BellIcon className="w-4 h-4" />
            Add Alert
          </>
        )}
      </Button>

      <AlertModal
        symbol={symbol}
        company={company}
        currentPrice={currentPrice}
        existingAlerts={alertsForSymbol}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default AlertButton;
