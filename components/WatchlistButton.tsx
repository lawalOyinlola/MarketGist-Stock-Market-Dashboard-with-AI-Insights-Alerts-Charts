"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StarIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import { Spinner } from "./ui/spinner";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  mode = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);

  const handleToggleWatchlist = async () => {
    setIsLoading(true);

    try {
      if (inWatchlist) {
        const result = await removeFromWatchlist(symbol);
        if (result?.success === false) {
          toast.error("Failed to remove from watchlist", {
            description: result.error || "Please try again",
          });
          return;
        }
        setInWatchlist(false);
        toast.success("Removed from watchlist", {
          description: `${company} (${symbol}) has been removed from your watchlist`,
        });
      } else {
        const result = await addToWatchlist(symbol, company);
        if (result?.success === false) {
          toast.error("Failed to add to watchlist", {
            description: result.error || "Please try again",
          });
          return;
        }
        setInWatchlist(true);
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
        onClick={handleToggleWatchlist}
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
      onClick={handleToggleWatchlist}
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
