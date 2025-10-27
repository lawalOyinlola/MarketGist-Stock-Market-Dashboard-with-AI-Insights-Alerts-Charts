"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";
import { Notification } from "@/database/models/notification.model";
import { inngest } from "@/lib/inngest/client";
import { getQuote } from "@/lib/actions/finnhub.actions";

export interface TriggeredAlert {
  alertId: string;
  userId: string;
  symbol: string;
  company: string;
  alertType: "upper" | "lower";
  threshold: number;
  currentPrice: number;
}

/**
 * Check all active alerts and trigger ones that hit their thresholds
 * Returns the list of triggered alerts
 */
export async function checkAlertsAndTrigger(): Promise<{
  triggered: TriggeredAlert[];
  errors: string[];
}> {
  const triggered: TriggeredAlert[] = [];
  const errors: string[] = [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Get all active alerts
    const alerts = await Alert.find({ isActive: true }).lean();

    console.log(`Checking ${alerts.length} active alerts...`);

    // Group alerts by symbol to minimize API calls
    const symbolsMap = new Map<string, any[]>();
    for (const alert of alerts) {
      const symbol = alert.symbol;
      if (!symbolsMap.has(symbol)) {
        symbolsMap.set(symbol, []);
      }
      symbolsMap.get(symbol)!.push(alert);
    }

    // Check each unique symbol
    for (const [symbol, symbolAlerts] of symbolsMap) {
      try {
        // Get current price for this symbol
        const quote = await getQuote(symbol);
        if (!quote || !quote.c) {
          errors.push(`No price data available for ${symbol}`);
          continue;
        }

        const currentPrice = quote.c;

        // Check each alert for this symbol
        for (const alert of symbolAlerts) {
          const shouldTrigger =
            alert.alertType === "upper"
              ? currentPrice >= alert.threshold
              : currentPrice <= alert.threshold;

          if (shouldTrigger) {
            // Check frequency constraints
            const now = new Date();
            const lastTriggered = alert.lastTriggeredAt
              ? new Date(alert.lastTriggeredAt)
              : null;
            let canTrigger = true;

            if (lastTriggered) {
              const timeSinceLastTrigger =
                now.getTime() - lastTriggered.getTime();

              switch (alert.frequency) {
                case "minute":
                  // Can trigger every minute (60 seconds)
                  canTrigger = timeSinceLastTrigger >= 60 * 1000;
                  break;
                case "hourly":
                  // Can trigger every hour
                  canTrigger = timeSinceLastTrigger >= 60 * 60 * 1000;
                  break;
                case "daily":
                  // Can trigger every day (24 hours)
                  canTrigger = timeSinceLastTrigger >= 24 * 60 * 60 * 1000;
                  break;
                case "once":
                  // Only trigger once, deactivate after first trigger
                  canTrigger = false;
                  break;
              }
            }

            if (!canTrigger) {
              console.log(
                `Alert ${alert.alertName} (${symbol}) skipping due to frequency constraint (${alert.frequency})`
              );
              continue;
            }

            console.log(
              `Alert triggered: ${symbol} - ${alert.alertType} threshold ${alert.threshold}, current: ${currentPrice}, frequency: ${alert.frequency}`
            );

            // Get user email
            const user = await db.collection("user").findOne({
              id: alert.userId,
            });

            if (!user?.email) {
              errors.push(`No email found for user ${alert.userId}`);
              continue;
            }

            // Get company name (could be from a profile lookup, but let's use the alert's company field)
            const company = alert.company || symbol;

            const targetPrice = alert.threshold;
            const timestamp = new Date().toISOString();

            // Trigger the appropriate Inngest event
            if (alert.alertType === "upper") {
              await inngest.send({
                name: "app/stock.alert.upper",
                data: {
                  email: user.email,
                  symbol,
                  company,
                  currentPrice,
                  targetPrice,
                  timestamp,
                },
              });
            } else {
              await inngest.send({
                name: "app/stock.alert.lower",
                data: {
                  email: user.email,
                  symbol,
                  company,
                  currentPrice,
                  targetPrice,
                  timestamp,
                },
              });
            }

            triggered.push({
              alertId: (alert._id as any).toString(),
              userId: alert.userId,
              symbol,
              company,
              alertType: alert.alertType,
              threshold: alert.threshold,
              currentPrice,
            });

            // Create a notification for the user
            try {
              await Notification.create({
                userId: alert.userId,
                type: "price_alert",
                title: `Price Alert: ${symbol} ${
                  alert.alertType === "upper" ? "▲" : "▼"
                }`,
                message: `${company} (${symbol}) hit your ${
                  alert.alertType === "upper" ? "upper" : "lower"
                } target of $${targetPrice}. Current price: $${currentPrice.toFixed(
                  2
                )}.`,
                symbol,
                isRead: false,
              });
            } catch (notifError) {
              console.error("Failed to create notification:", notifError);
            }

            // Update lastTriggeredAt and handle frequency
            if (alert.frequency === "once") {
              // Deactivate the alert after first trigger
              await Alert.updateOne(
                { _id: alert._id },
                { isActive: false, lastTriggeredAt: now }
              );
            } else {
              // Just update the lastTriggeredAt timestamp
              await Alert.updateOne(
                { _id: alert._id },
                { lastTriggeredAt: now }
              );
            }
          }
        }
      } catch (error) {
        errors.push(
          `Failed to process alerts for ${symbol}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    console.log(
      `Alert check complete: ${triggered.length} alerts triggered, ${errors.length} errors`
    );

    return { triggered, errors };
  } catch (error) {
    console.error("Error checking alerts:", error);
    errors.push(
      `Failed to check alerts: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return { triggered, errors };
  }
}
