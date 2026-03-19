import { describe, it, expect } from 'vitest';
import { SEED_TIERS, getTierForSeed } from '../index';

describe('SEED_TIERS configuration', () => {
  it('has exactly 4 tiers', () => {
    expect(SEED_TIERS).toHaveLength(4);
  });

  it('covers all 16 seeds across all tiers', () => {
    const allSeeds = SEED_TIERS.flatMap((t) => [...t.seeds]);
    expect(allSeeds.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1)
    );
  });

  it('total picks across all tiers equals 10', () => {
    const totalPicks = SEED_TIERS.reduce((sum, t) => sum + t.picks, 0);
    expect(totalPicks).toBe(10);
  });

  it('has correct 4-3-2-1 pick distribution', () => {
    expect(SEED_TIERS.map((t) => t.picks)).toEqual([4, 3, 2, 1]);
  });

  it('each tier has exactly 4 seeds', () => {
    for (const tier of SEED_TIERS) {
      expect(tier.seeds).toHaveLength(4);
    }
  });

  it('tiers are numbered 1 through 4', () => {
    expect(SEED_TIERS.map((t) => t.tier)).toEqual([1, 2, 3, 4]);
  });

  it('each tier has a label', () => {
    for (const tier of SEED_TIERS) {
      expect(tier.label).toBeTruthy();
    }
  });

  it('each tier has a color CSS variable', () => {
    for (const tier of SEED_TIERS) {
      expect(tier.color).toMatch(/^var\(--tier-\d\)$/);
    }
  });
});

describe('getTierForSeed', () => {
  it('returns tier 1 for seeds 1-4', () => {
    for (const seed of [1, 2, 3, 4]) {
      expect(getTierForSeed(seed)!.tier).toBe(1);
    }
  });

  it('returns tier 2 for seeds 5-8', () => {
    for (const seed of [5, 6, 7, 8]) {
      expect(getTierForSeed(seed)!.tier).toBe(2);
    }
  });

  it('returns tier 3 for seeds 9-12', () => {
    for (const seed of [9, 10, 11, 12]) {
      expect(getTierForSeed(seed)!.tier).toBe(3);
    }
  });

  it('returns tier 4 for seeds 13-16', () => {
    for (const seed of [13, 14, 15, 16]) {
      expect(getTierForSeed(seed)!.tier).toBe(4);
    }
  });

  it('returns correct picks for each tier', () => {
    expect(getTierForSeed(1)!.picks).toBe(4);
    expect(getTierForSeed(5)!.picks).toBe(3);
    expect(getTierForSeed(9)!.picks).toBe(2);
    expect(getTierForSeed(13)!.picks).toBe(1);
  });

  it('returns undefined for seed 0', () => {
    expect(getTierForSeed(0)).toBeUndefined();
  });

  it('maps every seed to exactly one tier', () => {
    for (let seed = 1; seed <= 16; seed++) {
      const tier = getTierForSeed(seed);
      expect(tier).toBeDefined();
      expect(tier!.tier).toBeGreaterThanOrEqual(1);
      expect(tier!.tier).toBeLessThanOrEqual(4);
    }
  });
});
