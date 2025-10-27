import { connectToDatabase } from "@/database/mongoose";
import { EmailPreference } from "@/database/models/emailPreference.model";

/**
 * Check if user is unsubscribed from emails
 */
export async function isUserUnsubscribed(email: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const preference = await EmailPreference.findOne({
      email: email.toLowerCase(),
    });
    return preference?.unsubscribed || false;
  } catch (error) {
    console.error("Error checking unsubscribe status:", error);
    // If there's an error, allow the email to be sent (fail open)
    return false;
  }
}

/**
 * Get unsubscribe URL for an email
 */
export function getUnsubscribeUrl(email: string): string {
  const dashboardUrl = process.env.BETTER_AUTH_URL || "https://marketgist.com";
  return `${dashboardUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
}
