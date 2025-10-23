"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BellIcon, PlusIcon, EditIcon, Trash2Icon } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const AlertsPanel = ({ watchlist }: { watchlist: StockWithData[] }) => {
  const { alerts, getAlertsForSymbol } = useAlert();
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    company: string;
    currentPrice?: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert alerts Map to array and limit to 10
  const alertsArray = Array.from(alerts.values()).slice(0, 10);

  // Create a map of symbols to stock data for easy lookup
  const stockMap = new Map(watchlist.map((stock) => [stock.symbol, stock]));

  const handleAddAlert = (
    symbol: string,
    company: string,
    currentPrice?: number
  ) => {
    setSelectedStock({ symbol, company, currentPrice });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full flex flex-col">
      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {alertsArray.length === 0 ? (
          <Item variant="muted" className="text-center py-8">
            <ItemMedia variant="icon">
              <BellIcon className="w-12 h-12 opacity-50" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-gray-400">No alerts yet</ItemTitle>
              <ItemDescription className="text-gray-500">
                Create your first alert to get started
              </ItemDescription>
            </ItemContent>
          </Item>
        ) : (
          <ItemGroup className="space-y-3">
            {alertsArray.map((alert) => {
              // Get stock data from watchlist
              const stockData = stockMap.get(alert.symbol);
              const currentPrice = stockData?.currentPrice;
              const changePercent = stockData?.changePercent;

              return (
                <Item
                  key={alert.id}
                  variant="outline"
                  className="bg-gray-700 border-0 border-t border-l border-gray-600 hover:border-gray-500 transition-all"
                >
                  <div className="flex items-center text-sm gap-2.5 w-full">
                    <ItemMedia>
                      <Avatar className="size-11.5 rounded-sm">
                        <AvatarImage
                          src={stockData?.logo || ""}
                          alt={`${alert.company} logo`}
                        />
                        <AvatarFallback>
                          {alert.symbol.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </ItemMedia>

                    <div className="flex flex-col gap-2 justify-between grow">
                      <ItemTitle className="text-gray-400">
                        {alert.company}
                      </ItemTitle>
                      <ItemDescription className="text-white font-semibold">
                        {currentPrice ?? currentPrice === 0
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
                            handleAddAlert(
                              alert.symbol,
                              alert.company,
                              currentPrice
                            )
                          }
                        >
                          <EditIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 !p-0 hover:bg-gray-600"
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
    </div>
  );
};

export default AlertsPanel;
