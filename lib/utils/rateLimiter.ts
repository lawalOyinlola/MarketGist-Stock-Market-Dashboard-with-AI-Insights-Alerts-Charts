// Simple in-memory rate limiter for API calls
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);
    if (validRequests.length === 0) {
      this.requests.delete(key);
      // Record first use
      this.requests.set(key, [now]);
      return true;
    }

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  getTimeUntilReset(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter((time) => now - time < this.windowMs);
    if (validRequests.length === 0) {
      this.requests.delete(key);
      return 0;
    }
    const oldestRequest = Math.min(...validRequests);
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }
}

export const apiRateLimiter = new RateLimiter(50, 60000); // 50 requests per minute
