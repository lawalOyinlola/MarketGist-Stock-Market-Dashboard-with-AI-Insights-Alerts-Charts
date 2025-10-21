// Simple logging utility for production
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  // Always log errors
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  // Log warnings (always)
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  // Info logs (development only)
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  // Debug logs (development only)
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  // Success logs (always)
  success: (message: string, ...args: any[]) => {
    console.log(`[SUCCESS] ${message}`, ...args);
  },
};
