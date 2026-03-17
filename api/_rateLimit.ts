/**
 * In-memory sliding window rate limiter for Vercel serverless functions.
 *
 * Each cold start gets a fresh Map, so this is "best effort" rather than
 * globally consistent. Acceptable for this project's scale — swap to
 * Upstash Redis if global consistency is ever needed.
 */

interface RateEntry {
  timestamps: number[];
}

const store = new Map<string, RateEntry>();

function cleanup(windowMs: number) {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(windowMs: number) {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => cleanup(windowMs), 60_000);
    // Prevent the interval from keeping the process alive
    if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
      cleanupInterval.unref();
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  limit: number;
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs = 60_000 } = config;
  ensureCleanup(windowMs);

  const now = Date.now();
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + windowMs - now,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetMs: windowMs,
  };
}
