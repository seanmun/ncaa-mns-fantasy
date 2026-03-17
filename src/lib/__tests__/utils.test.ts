import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getProjectedScore,
  isRosterLocked,
  getRosterLockDate,
  cn,
  formatScore,
  truncateAddress,
} from '../utils';

describe('getProjectedScore', () => {
  it('sums three valid float strings', () => {
    expect(getProjectedScore('15.5', '7.2', '4.3')).toBeCloseTo(27.0);
  });

  it('handles zero strings', () => {
    expect(getProjectedScore('0', '0', '0')).toBe(0);
  });

  it('handles whole numbers as strings', () => {
    expect(getProjectedScore('20', '10', '5')).toBe(35);
  });

  it('returns NaN for non-numeric strings', () => {
    expect(getProjectedScore('abc', '7.2', '4.3')).toBeNaN();
  });

  it('handles decimal precision', () => {
    expect(getProjectedScore('12.3', '4.5', '6.7')).toBeCloseTo(23.5);
  });
});

describe('isRosterLocked', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when current time is before lock date', () => {
    vi.setSystemTime(new Date('2026-03-18T10:00:00-05:00'));
    expect(isRosterLocked()).toBe(false);
  });

  it('returns true when current time is at lock date', () => {
    vi.setSystemTime(new Date('2026-03-19T12:00:00-05:00'));
    expect(isRosterLocked()).toBe(true);
  });

  it('returns true when current time is after lock date', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'));
    expect(isRosterLocked()).toBe(true);
  });
});

describe('getRosterLockDate', () => {
  it('returns a Date object', () => {
    expect(getRosterLockDate()).toBeInstanceOf(Date);
  });

  it('returns a valid (non-NaN) date', () => {
    expect(getRosterLockDate().getTime()).not.toBeNaN();
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('formatScore', () => {
  it('formats a number as a string', () => {
    expect(typeof formatScore(1234)).toBe('string');
  });

  it('handles zero', () => {
    expect(formatScore(0)).toBe('0');
  });
});

describe('truncateAddress', () => {
  it('truncates a long address with default chars', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    const result = truncateAddress(addr);
    expect(result).toBe('0x1234...345678');
  });

  it('truncates with custom char count', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    expect(truncateAddress(addr, 4)).toBe('0x12...5678');
  });

  it('returns empty string for empty input', () => {
    expect(truncateAddress('')).toBe('');
  });
});
