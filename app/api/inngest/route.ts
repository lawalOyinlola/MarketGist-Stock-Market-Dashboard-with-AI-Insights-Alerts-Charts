import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  sendSignUpEmail,
  sendDailyNewsSummary,
  sendStockAlertUpper,
  sendStockAlertLower,
  sendVolumeAlert,
  sendInactiveUserReminder,
} from "@/lib/inngest/functions";

export const runtime = "nodejs";
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendSignUpEmail,
    sendDailyNewsSummary,
    sendStockAlertUpper,
    sendStockAlertLower,
    sendVolumeAlert,
    sendInactiveUserReminder,
  ],
});
