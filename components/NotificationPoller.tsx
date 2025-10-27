"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const lastCheckTimeRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTabActiveRef = useRef<boolean>(!document.hidden);
  const seenNotificationsRef = useRef<Set<string>>(new Set());

  // Pause polling when tab is inactive to save resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const checkForNewNotifications = useCallback(async () => {
    // Skip if tab is inactive to save battery
    if (!isTabActiveRef.current) {
      return;
    }

    try {
      const since = lastCheckTimeRef.current.toISOString();
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
                  onClick: () => {
                    window.location.href = `/stocks/${notification.symbol}`;
                  },
                }
              : undefined,
          });
        }
      }

      // Update last check time
      lastCheckTimeRef.current = new Date();
    } catch (error) {
      console.error("Error checking for notifications:", error);
    }
  }, []);

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
