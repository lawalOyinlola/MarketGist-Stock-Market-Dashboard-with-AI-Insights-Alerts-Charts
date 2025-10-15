import { Inngest } from "inngest";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const inngest = new Inngest({
  id: "signalist",
  ai: { gemini: { apiKey: process.env.GEMINI_API_KEY } },
});
