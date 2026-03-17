import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit } from '../_rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first request', () => {
    const result = checkRateLimit('test-allow-1', { limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('decrements remaining on each request', () => {
    checkRateLimit('test-decrement', { limit: 3, windowMs: 60_000 });
    const r2 = checkRateLimit('test-decrement', { limit: 3, windowMs: 60_000 });
    expect(r2.remaining).toBe(1);
    const r3 = checkRateLimit('test-decrement', { limit: 3, windowMs: 60_000 });
    expect(r3.remaining).toBe(0);
  });

  it('blocks when limit is exceeded', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-block', { limit: 5, windowMs: 60_000 });
    }
    const result = checkRateLimit('test-block', { limit: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-reset', { limit: 3, windowMs: 60_000 });
    }

    // Should be blocked now
    expect(checkRateLimit('test-reset', { limit: 3, windowMs: 60_000 }).allowed).toBe(false);

    // Advance past window
    vi.advanceTimersByTime(61_000);

    const result = checkRateLimit('test-reset', { limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('tracks separate keys independently', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-a', { limit: 3, windowMs: 60_000 });
    }

    expect(checkRateLimit('user-a', { limit: 3, windowMs: 60_000 }).allowed).toBe(false);
    expect(checkRateLimit('user-b', { limit: 3, windowMs: 60_000 }).allowed).toBe(true);
  });

  it('provides resetMs when blocked', () => {
    for (let i = 0; i < 2; i++) {
      checkRateLimit('test-resetms', { limit: 2, windowMs: 60_000 });
    }
    const result = checkRateLimit('test-resetms', { limit: 2, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.resetMs).toBeGreaterThan(0);
    expect(result.resetMs).toBeLessThanOrEqual(60_000);
  });

  it('uses default windowMs of 60_000', () => {
    const result = checkRateLimit('test-default', { limit: 10 });
    expect(result.allowed).toBe(true);
    expect(result.resetMs).toBe(60_000);
  });
});
