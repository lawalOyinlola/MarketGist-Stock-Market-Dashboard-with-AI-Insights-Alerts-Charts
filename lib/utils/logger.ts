// Simple logging utility for production
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  // Always log errors
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  // Log warnings (always)
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  // Info logs (development only)
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  // Debug logs (development only)
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  // Success logs (always)
  success: (message: string, ...args: unknown[]) => {
    console.log(`[SUCCESS] ${message}`, ...args);
  },
};
