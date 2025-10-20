"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StarIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";
import { useWatchlist } from "./WatchlistProvider";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  mode = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isInWatchlist: checkWatchList, add, remove } = useWatchlist();
  const inWatchlist = checkWatchList(symbol);

  const handleToggleWatchlist = async (
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    // Prevent event propagation to avoid triggering parent click handlers
    e?.stopPropagation();
    e?.preventDefault();

    setIsLoading(true);

    try {
      if (inWatchlist) {
        const removed = await remove(symbol);
        if (!removed) return;
        toast.success("Removed from watchlist", {
          description: `${company} (${symbol}) has been removed from your watchlist`,
        });
      } else {
        const added = await add(symbol, company);
        if (!added) return;
        toast.success("Added to watchlist", {
          description: `${company} (${symbol}) has been added to your watchlist`,
        });
      }

      onWatchlistChange?.(symbol, !inWatchlist);
    } catch (error) {
      console.error("Watchlist toggle error:", error);
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => handleToggleWatchlist(e)}
        disabled={isLoading}
        className={`watchlist-icon-btn ${
          inWatchlist ? "watchlist-icon-added" : ""
        }`}
        aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        <div className="watchlist-icon">
          {showTrashIcon ? (
            <Trash2Icon className="trash-icon" />
          ) : (
            <StarIcon
              className={`star-icon ${inWatchlist ? "fill-current" : ""}`}
            />
          )}
        </div>
      </Button>
    );
  }

  return (
    <Button
      onClick={(e) => handleToggleWatchlist(e)}
      disabled={isLoading}
      className={`watchlist-btn ${inWatchlist ? "watchlist-remove" : ""}`}
    >
      {isLoading ? (
        <>
          <Spinner />
          Loading...
        </>
      ) : showTrashIcon ? (
        <>
          <Trash2Icon className="w-4 h-4" />
          Remove from Watchlist
        </>
      ) : inWatchlist ? (
        <>
          <StarIcon className="w-4 h-4 fill-current" />
          Remove from Watchlist
        </>
      ) : (
        <>
          <StarIcon className="w-4 h-4" />
          Add to Watchlist
        </>
      )}
    </Button>
  );
};

export default WatchlistButton;
