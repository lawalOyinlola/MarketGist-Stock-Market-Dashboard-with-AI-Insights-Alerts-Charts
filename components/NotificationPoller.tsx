"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NotificationData {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  symbol?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationResponse {
  notifications: NotificationData[];
  unreadCount: number;
}

export function NotificationPoller() {
  const router = useRouter();
  const lastCheckTimeRef = useRef<Date | null>(null); // null => first run
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Proper type for browser timers
  const isTabActiveRef = useRef<boolean>(true);
  const seenNotificationsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<boolean>(false); // Prevent overlapping polls

  const checkForNewNotifications = useCallback(async () => {
    // Prevent overlapping polls
    if (inFlightRef.current) {
      return;
    }

    // Skip if tab is inactive to save battery
    if (!isTabActiveRef.current) {
      return;
    }

    inFlightRef.current = true;

    try {
      // Handle null lastCheckTimeRef (initial mount)
      const since =
        lastCheckTimeRef.current?.toISOString() || new Date(0).toISOString();
      const response = await fetch(
        `/api/notifications?since=${since}&isRead=false`
      );

      if (!response.ok) {
        console.error("Failed to fetch notifications");
        return;
      }

      const data: NotificationResponse = await response.json();

      // Show toast for each new notification (deduplicate by ID)
      for (const notification of data.notifications) {
        if (
          notification.type === "price_alert" &&
          !seenNotificationsRef.current.has(notification._id)
        ) {
          seenNotificationsRef.current.add(notification._id);

          toast.success(notification.title, {
            description: notification.message,
            duration: 5000,
            action: notification.symbol
              ? {
                  label: "View",
                  onClick: () => router.push(`/stocks/${notification.symbol}`),
                }
              : undefined,
          });
        }
      }

      // Update last check time
      lastCheckTimeRef.current = new Date();
    } catch (error) {
      console.error("Error checking for notifications:", error);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Pause polling when tab is inactive to save resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasActive = isTabActiveRef.current;
      isTabActiveRef.current = !document.hidden;

      // When tab becomes visible, trigger an immediate check
      if (!wasActive && isTabActiveRef.current) {
        checkForNewNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForNewNotifications]);

  useEffect(() => {
    // Check immediately on mount
    checkForNewNotifications();

    // Poll every 30 seconds (less aggressive than 10s, reduces requests by 66%)
    intervalRef.current = setInterval(checkForNewNotifications, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkForNewNotifications]);

  // This component doesn't render anything
  return null;
}
