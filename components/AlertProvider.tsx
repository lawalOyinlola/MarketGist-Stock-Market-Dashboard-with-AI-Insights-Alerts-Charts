"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  createAlert,
  removeAlert,
  updateAlert,
} from "@/lib/actions/alert.actions";

type AlertContextValue = {
  alerts: Map<string, AlertData>;
  hasAlert: (symbol: string) => boolean;
  getAlertsForSymbol: (symbol: string) => AlertData[];
  add: (
    symbol: string,
    company: string,
    alertName: string,
    alertType: "upper" | "lower",
    threshold: number,
    frequency?: "once" | "daily" | "hourly"
  ) => Promise<boolean>;
  remove: (alertId: string) => Promise<boolean>;
  update: (
    alertId: string,
    updates: {
      alertName?: string;
      alertType?: "upper" | "lower";
      threshold?: number;
      frequency?: "once" | "daily" | "hourly";
    }
  ) => Promise<boolean>;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({
  initialAlerts = [],
  children,
}: {
  initialAlerts?: AlertData[];
  children: React.ReactNode;
}) {
  const [alertsState, setAlertsState] = useState<Map<string, AlertData>>(
    () => new Map(initialAlerts.map((alert) => [alert.id, alert]))
  );

  const hasAlert = useCallback(
    (symbol: string) => {
      const normalized = symbol.toUpperCase().trim();
      return Array.from(alertsState.values()).some(
        (alert) => alert.symbol === normalized
      );
    },
    [alertsState]
  );

  const getAlertsForSymbol = useCallback(
    (symbol: string) => {
      const normalized = symbol.toUpperCase().trim();
      return Array.from(alertsState.values()).filter(
        (alert) => alert.symbol === normalized
      );
    },
    [alertsState]
  );

  const add = useCallback(
    async (
      symbol: string,
      company: string,
      alertName: string,
      alertType: "upper" | "lower",
      threshold: number,
      frequency: "once" | "daily" | "hourly" = "daily"
    ) => {
      try {
        const result = await createAlert(
          symbol,
          company,
          alertName,
          alertType,
          threshold,
          frequency
        );

        if (result.success && result.alertId) {
          // We need to fetch the created alert to add to state
          // For now, we'll create a temporary entry
          const newAlert: AlertData = {
            id: result.alertId,
            symbol: symbol.toUpperCase(),
            company,
            alertName,
            alertType,
            threshold,
            frequency,
          };

          setAlertsState((prev) =>
            new Map(prev).set(result.alertId!, newAlert)
          );
          toast.success("Alert created", {
            description: `${alertName} for ${symbol} has been created`,
          });
          return true;
        }

        toast.error("Failed to create alert", {
          description: result.error || "Please try again",
        });
        return false;
      } catch (e) {
        toast.error("Failed to create alert", {
          description: "An unexpected error occurred",
        });
        return false;
      }
    },
    []
  );

  const remove = useCallback(async (alertId: string) => {
    try {
      const result = await removeAlert(alertId);

      if (result.success) {
        setAlertsState((prev) => {
          const next = new Map(prev);
          next.delete(alertId);
          return next;
        });
        toast.success("Alert removed", {
          description: "Alert has been removed successfully",
        });
        return true;
      }

      toast.error("Failed to remove alert", {
        description: result.error || "Please try again",
      });
      return false;
    } catch (e) {
      toast.error("Failed to remove alert", {
        description: "An unexpected error occurred",
      });
      return false;
    }
  }, []);

  const update = useCallback(
    async (
      alertId: string,
      updates: {
        alertName?: string;
        alertType?: "upper" | "lower";
        threshold?: number;
        frequency?: "once" | "daily" | "hourly";
      }
    ) => {
      try {
        const result = await updateAlert(alertId, updates);

        if (result.success) {
          setAlertsState((prev) => {
            const next = new Map(prev);
            const existing = next.get(alertId);
            if (existing) {
              next.set(alertId, { ...existing, ...updates });
            }
            return next;
          });
          toast.success("Alert updated", {
            description: "Alert has been updated successfully",
          });
          return true;
        }

        toast.error("Failed to update alert", {
          description: result.error || "Please try again",
        });
        return false;
      } catch (e) {
        toast.error("Failed to update alert", {
          description: "An unexpected error occurred",
        });
        return false;
      }
    },
    []
  );

  const value = useMemo<AlertContextValue>(
    () => ({
      alerts: alertsState,
      hasAlert,
      getAlertsForSymbol,
      add,
      remove,
      update,
    }),
    [alertsState, hasAlert, getAlertsForSymbol, add, remove, update]
  );

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return ctx;
}
