import { describe, it, expect } from 'vitest';
import { SEED_TIERS, getTierForSeed } from '@/types';

// Mirror the tier rules used by the API roster validation
const TIER_RULES = SEED_TIERS.map((t) => ({
  tier: t.tier,
  seeds: [...t.seeds],
  required: t.picks,
}));

function validateTierDistribution(seeds: number[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const seed of seeds) {
    const tier = getTierForSeed(seed);
    tierCounts[tier.tier]++;
  }

  for (const rule of TIER_RULES) {
    if (tierCounts[rule.tier] !== rule.required) {
      errors.push(
        `Tier ${rule.tier}: expected ${rule.required} picks, got ${tierCounts[rule.tier]}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

describe('roster validation rules', () => {
  it('TIER_RULES match SEED_TIERS picks configuration', () => {
    for (const rule of TIER_RULES) {
      const seedTier = SEED_TIERS.find((t) => t.tier === rule.tier)!;
      expect(seedTier.picks).toBe(rule.required);
      expect([...seedTier.seeds]).toEqual(rule.seeds);
    }
  });

  it('requires exactly 10 total players', () => {
    const total = TIER_RULES.reduce((sum, r) => sum + r.required, 0);
    expect(total).toBe(10);
  });
});

describe('validateTierDistribution', () => {
  it('accepts correct 4-3-2-1 distribution', () => {
    // 4 from tier 1, 3 from tier 2, 2 from tier 3, 1 from tier 4
    const seeds = [1, 2, 3, 4, 5, 6, 7, 9, 10, 14];
    const result = validateTierDistribution(seeds);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects when tier 1 has too many picks', () => {
    // 5 from tier 1 (seed 4 twice), 2 from tier 2, 2 from tier 3, 1 from tier 4
    const seeds = [1, 2, 3, 4, 4, 6, 7, 9, 10, 14];
    const result = validateTierDistribution(seeds);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Tier 1'))).toBe(true);
  });

  it('rejects when tier 4 has zero picks', () => {
    // 4 from tier 1, 3 from tier 2, 3 from tier 3, 0 from tier 4
    const seeds = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11];
    const result = validateTierDistribution(seeds);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Tier 4'))).toBe(true);
  });

  it('reports all tier errors at once', () => {
    // All from tier 1 (impossible but tests multi-error)
    const seeds = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const result = validateTierDistribution(seeds);
    expect(result.valid).toBe(false);
    // Should have errors for tiers 1 (too many), 2, 3, and 4 (too few)
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('accepts picks from different seeds within the same tier', () => {
    // Tier 1: seeds 1,2,3,4 (all different) — Tier 2: 5,6,8 — Tier 3: 9,12 — Tier 4: 16
    const seeds = [1, 2, 3, 4, 5, 6, 8, 9, 12, 16];
    const result = validateTierDistribution(seeds);
    expect(result.valid).toBe(true);
  });
});

describe('roster duplicate detection', () => {
  it('detects duplicates in an ID array', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'a'];
    const unique = new Set(ids);
    expect(unique.size).toBeLessThan(ids.length);
  });

  it('passes with all unique IDs', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
