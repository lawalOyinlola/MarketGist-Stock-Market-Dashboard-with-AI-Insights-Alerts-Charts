import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import {
  sendNewsSummaryEmail,
  sendWelcomeEmail,
  sendStockAlertUpperEmail,
  sendStockAlertLowerEmail,
  sendVolumeAlertEmail,
  sendInactiveUserReminderEmail,
} from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const { country, investmentGoals, riskTolerance, preferredIndustry } =
        event.data;

      if (
        !country ||
        !investmentGoals ||
        !riskTolerance ||
        !preferredIndustry
      ) {
        console.error("Missing required user profile data", event.data);
        return {
          success: false,
          message: "Missing required user profile data",
        };
      }

      const userProfile = `
        - Country: ${country}
        - Investment goals: ${investmentGoals}
        - Risk tolerance: ${riskTolerance}
        - Preferred industry: ${preferredIndustry}
      `;

      const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
        "{{userProfile}}",
        userProfile
      );

      const response = await step.ai.infer("generate-welcome-intro", {
        model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
        body: {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        },
      });

      await step.run("send-welcome-email", async () => {
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const introText =
          (part && "text" in part ? part.text : null) ||
          "Thanks for joining Marketgist. You now have the tools to track markets and make smarter moves.";

        const {
          data: { email, name },
        } = event;

        try {
          return await sendWelcomeEmail({ email, name, intro: introText });
        } catch (error) {
          console.error("Failed to send welcome email to:", email, error);
          throw error;
        }
      });

      return {
        success: true,
        message: "Welcome email sent successfully",
      };
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return {
        success: false,
        message: "Failed to send welcome email",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],

  async ({ step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };

    // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: User;
        articles: MarketNewsArticle[];
      }> = [];
      for (const user of users as User[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            console.log(
              `No articles found for ${user.email}, trying general news...`
            );
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // Step #3: (placeholder) Summarize news via AI
    const userNewsSummaries: {
      user: User;
      newsContent: string | null;
    }[] = [];

    for (const { user, articles } of results) {
      try {
        // If no articles, provide fallback content
        if (!articles || articles.length === 0) {
          console.log(
            `No articles found for ${user.email}, using fallback content`
          );
          const fallbackContent = `
            <h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 18px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">📊 Market Update</h3>
            <div class="dark-info-box" style="background-color: #212328; padding: 24px; margin: 20px 0; border-radius: 8px;">
              <h4 class="dark-text" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #FDD458; line-height: 1.4;">
                Market Data Temporarily Unavailable
              </h4>
              <p class="dark-text-secondary" style="margin: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
                We're experiencing temporary issues fetching the latest market news. Please check back later or visit your dashboard for real-time updates.
              </p>
            </div>
          `;
          userNewsSummaries.push({ user, newsContent: fallbackContent });
          continue;
        }

        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent });
      } catch (error) {
        console.error("Failed to summarize news for : ", user.email, error);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: (placeholder) Send the emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);

// Stock Price Alert Functions
export const sendStockAlertUpper = inngest.createFunction(
  { id: "stock-alert-upper" },
  { event: "app/stock.alert.upper" },
  async ({ event, step }) => {
    try {
      const { email, symbol, company, currentPrice, targetPrice, timestamp } =
        event.data;

      await step.run("send-upper-alert-email", async () => {
        return await sendStockAlertUpperEmail({
          email,
          symbol,
          company,
          currentPrice: currentPrice.toString(),
          targetPrice: targetPrice.toString(),
          timestamp,
        });
      });

      return {
        success: true,
        message: `Upper price alert sent for ${symbol} to ${email}`,
      };
    } catch (error) {
      console.error("Failed to send upper price alert:", error);
      return {
        success: false,
        message: "Failed to send upper price alert",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

export const sendStockAlertLower = inngest.createFunction(
  { id: "stock-alert-lower" },
  { event: "app/stock.alert.lower" },
  async ({ event, step }) => {
    try {
      const { email, symbol, company, currentPrice, targetPrice, timestamp } =
        event.data;

      await step.run("send-lower-alert-email", async () => {
        return await sendStockAlertLowerEmail({
          email,
          symbol,
          company,
          currentPrice: currentPrice.toString(),
          targetPrice: targetPrice.toString(),
          timestamp,
        });
      });

      return {
        success: true,
        message: `Lower price alert sent for ${symbol} to ${email}`,
      };
    } catch (error) {
      console.error("Failed to send lower price alert:", error);
      return {
        success: false,
        message: "Failed to send lower price alert",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

export const sendVolumeAlert = inngest.createFunction(
  { id: "volume-alert" },
  { event: "app/volume.alert" },
  async ({ event, step }) => {
    try {
      const {
        email,
        symbol,
        company,
        currentVolume,
        averageVolume,
        currentPrice,
        changePercent,
        changeDirection,
        volumeSpike,
        alertMessage,
        timestamp,
      } = event.data;

      await step.run("send-volume-alert-email", async () => {
        return await sendVolumeAlertEmail({
          email,
          symbol,
          company,
          currentVolume: currentVolume.toString(),
          averageVolume: averageVolume.toString(),
          currentPrice: currentPrice.toString(),
          changePercent: changePercent.toString(),
          changeDirection,
          volumeSpike,
          alertMessage,
          timestamp,
        });
      });

      return {
        success: true,
        message: `Volume alert sent for ${symbol} to ${email}`,
      };
    } catch (error) {
      console.error("Failed to send volume alert:", error);
      return {
        success: false,
        message: "Failed to send volume alert",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

export const sendInactiveUserReminder = inngest.createFunction(
  { id: "inactive-user-reminder" },
  { event: "app/user.inactive.reminder" },
  async ({ event, step }) => {
    try {
      const { email, name } = event.data;

      await step.run("send-inactive-reminder-email", async () => {
        return await sendInactiveUserReminderEmail({
          email,
          name,
        });
      });

      return {
        success: true,
        message: `Inactive user reminder sent to ${email}`,
      };
    } catch (error) {
      console.error("Failed to send inactive user reminder:", error);
      return {
        success: false,
        message: "Failed to send inactive user reminder",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
