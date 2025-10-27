"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BellOffIcon, EditIcon, Trash2Icon } from "lucide-react";
import { useAlert } from "./AlertProvider";
import AlertModal from "./AlertModal";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const AlertsPanel = ({ watchlist }: { watchlist: StockWithData[] }) => {
  const { alerts, getAlertsForSymbol, remove } = useAlert();
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    company: string;
    currentPrice?: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<
    Map<
      string,
      { currentPrice?: number; changePercent?: number; logo?: string }
    >
  >(new Map());

  // Helper function to determine alert status
  const getAlertStatus = (alert: AlertData) => {
    if (alert.frequency === "once" && alert.lastTriggeredAt) {
      return {
        status: "completed",
        label: "Completed",
        bgColor: "bg-green-500",
      };
    }
    if (alert.lastTriggeredAt) {
      return { status: "active", label: "Active", bgColor: "bg-blue-500" };
    }
    return { status: "waiting", label: "Pending", bgColor: "bg-gray-500" };
  };

  // Convert alerts Map to array and limit to 10
  const alertsArray = useMemo(
    () => Array.from(alerts.values()).slice().reverse().slice(0, 10),
    [alerts]
  );

  // Create a map of symbols to stock data for easy lookup
  const stockMap = useMemo(
    () => new Map(watchlist.map((s) => [s.symbol, s] as const)),
    [watchlist]
  );

  // Fetch price and logo data for alerts not in watchlist
  useEffect(() => {
    const fetchAlertData = async () => {
      const alertsToFetch = alertsArray.filter(
        (alert) => !stockMap.has(alert.symbol)
      );

      const pricePromises = alertsToFetch.map(async (alert) => {
        try {
          // Fetch both quote and profile data (like in finnhub.actions.ts)
          const [quoteResponse, profileResponse] = await Promise.all([
            fetch(
              `/api/stocks/quote?symbol=${encodeURIComponent(alert.symbol)}`
            ),
            fetch(
              `/api/stocks/profile?symbol=${encodeURIComponent(alert.symbol)}`
            ),
          ]);

          let currentPrice, changePercent, logo;

          if (quoteResponse.ok) {
            const quoteData = await quoteResponse.json();
            currentPrice = quoteData.c;
            changePercent = quoteData.dp;
          }

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            logo = profileData.logo;
          }

          return {
            symbol: alert.symbol,
            currentPrice,
            changePercent,
            logo,
          };
        } catch (error) {
          console.error(`Failed to fetch data for ${alert.symbol}:`, error);
        }
        return {
          symbol: alert.symbol,
          currentPrice: undefined,
          changePercent: undefined,
          logo: undefined,
        };
      });

      const results = await Promise.all(pricePromises);
      const newPrices = new Map();
      results.forEach((result) => {
        newPrices.set(result.symbol, {
          currentPrice: result.currentPrice,
          changePercent: result.changePercent,
          logo: result.logo,
        });
      });
      setAlertData(newPrices);
    };

    if (alertsArray.length > 0) {
      fetchAlertData();
    }
  }, [alertsArray, stockMap]);

  const handleAddAlert = (
    symbol: string,
    company: string,
    currentPrice?: number
  ) => {
    setSelectedStock({ symbol, company, currentPrice });
    setEditingAlertId(null);
    setIsModalOpen(true);
  };

  const handleEditAlert = (
    symbol: string,
    company: string,
    currentPrice: number | undefined,
    alertId: string
  ) => {
    setSelectedStock({ symbol, company, currentPrice });
    setEditingAlertId(alertId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
    setEditingAlertId(null);
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await remove(alertId);
    } catch (error) {
      console.error("Failed to delete alert:", error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 max-h-180 h-full flex flex-col">
      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {alertsArray.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-gray-700/70">
                <BellOffIcon className="size-6 opacity-50" />
              </EmptyMedia>
              <EmptyTitle>No Alerts Yet</EmptyTitle>
              <EmptyDescription>
                Create alerts to track price changes for any stock
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-3">
            {alertsArray.map((alert) => {
              // Get stock data from watchlist or fetched alert data
              const stockData = stockMap.get(alert.symbol);
              const fetchedAlertData = alertData.get(alert.symbol);

              const currentPrice =
                stockData?.currentPrice ?? fetchedAlertData?.currentPrice;
              const changePercent =
                stockData?.changePercent ?? fetchedAlertData?.changePercent;

              const alertStatus = getAlertStatus(alert);

              return (
                <Item
                  key={alert.id}
                  variant="outline"
                  className="relative bg-gray-700 border-0 border-t border-l border-gray-600 hover:border-gray-500 transition-all overflow-hidden"
                >
                  <div
                    className={`absolute z-10 top-4 -left-10 ${alertStatus.bgColor} text-white text-xs px-10 py-1 -rotate-45 pointer-events-none font-semibold`}
                  >
                    <p>{alertStatus.label}</p>
                  </div>
                  <div className="flex items-center text-sm gap-2.5 w-full">
                    <ItemMedia>
                      <Avatar className="size-11.5 rounded-sm">
                        <AvatarImage
                          src={stockData?.logo || fetchedAlertData?.logo || ""}
                          alt={`${alert.company} logo`}
                        />
                        <AvatarFallback className="size-11.5 rounded-sm">
                          {alert.symbol.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </ItemMedia>

                    <div className="flex flex-col gap-2 justify-between grow">
                      <ItemTitle className="text-gray-400">
                        {alert.company}
                      </ItemTitle>
                      <ItemDescription className="text-white font-semibold">
                        {currentPrice != null
                          ? `$${Number(currentPrice).toFixed(2)}`
                          : `$${alert.threshold}`}
                      </ItemDescription>
                    </div>
                    <div className="flex flex-col gap-2 justify-between">
                      <div className="font-semibold text-white">
                        {alert.symbol}
                      </div>
                      <div
                        className={
                          changePercent && changePercent > 0
                            ? "text-green-400"
                            : changePercent && changePercent < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }
                      >
                        {changePercent
                          ? `${
                              changePercent > 0 ? "+" : ""
                            }${changePercent.toFixed(2)}%`
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  <ItemSeparator />

                  <ItemContent className="flex flex-row items-center justify-between text-sm gap-2.5 w-full">
                    <div className="flex flex-col gap-1 justify-between grow">
                      <h4 className="text-gray-400">Alert:</h4>
                      <div className="text-lg font-bold text-white">
                        Price {alert.alertType === "upper" ? ">" : "<"} $
                        {alert.threshold}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 justify-between items-end">
                      <ItemActions className="gap-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 !p-0 hover:bg-gray-600"
                          onClick={() =>
                            handleEditAlert(
                              alert.symbol,
                              alert.company,
                              currentPrice,
                              alert.id
                            )
                          }
                        >
                          <EditIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 !p-0 hover:bg-gray-600"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2Icon className="w-3 h-3" />
                        </Button>
                      </ItemActions>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-app-color bg-app-color/5 px-2 py-1 rounded">
                          {alert.frequency === "once"
                            ? "Once"
                            : alert.frequency === "daily"
                            ? "Once per day"
                            : alert.frequency === "hourly"
                            ? "Once per hour"
                            : "Once per minute"}
                        </div>
                      </div>
                    </div>
                  </ItemContent>
                </Item>
              );
            })}
          </ItemGroup>
        )}
      </div>

      {selectedStock && (
        <AlertModal
          symbol={selectedStock.symbol}
          company={selectedStock.company}
          currentPrice={selectedStock.currentPrice}
          existingAlerts={getAlertsForSymbol(selectedStock.symbol)}
          open={isModalOpen}
          onClose={handleCloseModal}
          editAlertId={editingAlertId || undefined}
        />
      )}
    </div>
  );
};

export default AlertsPanel;
