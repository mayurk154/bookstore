import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatPrice,
  discountedPrice,
  canCancelOrder,
  maxRedeemablePoints,
  truncate,
  generateRef,
  formatDate,
  buildQueryString,
} from '@/utils';

describe('formatPrice', () => {
  it('formats a whole-number price in INR', () => {
    expect(formatPrice(499)).toMatch(/499/);
    expect(formatPrice(499)).toMatch(/₹|INR/);
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toMatch(/0/);
  });
});

describe('discountedPrice', () => {
  it('applies discount correctly', () => {
    expect(discountedPrice(1000, 20)).toBe(800);
  });

  it('returns full price when discount is 0', () => {
    expect(discountedPrice(500, 0)).toBe(500);
  });

  it('rounds to nearest integer', () => {
    expect(discountedPrice(999, 10)).toBe(899); // 999 * 0.9 = 899.1 → 899
  });
});

describe('canCancelOrder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true within 48 hours', () => {
    const now = new Date('2024-01-10T12:00:00Z');
    vi.setSystemTime(now);
    const createdAt = new Date('2024-01-10T00:00:00Z').toISOString(); // 12 hours ago
    expect(canCancelOrder(createdAt)).toBe(true);
  });

  it('returns false after 48 hours', () => {
    const now = new Date('2024-01-13T00:00:00Z');
    vi.setSystemTime(now);
    const createdAt = new Date('2024-01-10T00:00:00Z').toISOString(); // 72 hours ago
    expect(canCancelOrder(createdAt)).toBe(false);
  });

  it('returns false exactly at the boundary (48h)', () => {
    const now = new Date('2024-01-12T00:00:00Z');
    vi.setSystemTime(now);
    const createdAt = new Date('2024-01-10T00:00:00Z').toISOString(); // exactly 48h ago
    expect(canCancelOrder(createdAt)).toBe(false);
  });
});

describe('maxRedeemablePoints', () => {
  it('caps at 20% of order total', () => {
    expect(maxRedeemablePoints(1000, 500)).toBe(200); // 20% of 1000 = 200
  });

  it('caps at available points when those are lower', () => {
    expect(maxRedeemablePoints(1000, 50)).toBe(50); // user only has 50
  });

  it('returns 0 for zero order total', () => {
    expect(maxRedeemablePoints(0, 100)).toBe(0);
  });
});

describe('truncate', () => {
  it('returns the string unchanged when under limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and appends ellipsis when over limit', () => {
    const result = truncate('hello world', 8);
    expect(result).toHaveLength(8);
    expect(result.endsWith('…')).toBe(true);
  });

  it('handles exact-length strings without truncating', () => {
    expect(truncate('abcde', 5)).toBe('abcde');
  });
});

describe('generateRef', () => {
  it('includes the given prefix', () => {
    expect(generateRef('ORD')).toMatch(/^ORD-/);
  });

  it('uses BV as the default prefix', () => {
    expect(generateRef()).toMatch(/^BV-/);
  });

  it('generates unique values on successive calls', () => {
    const a = generateRef();
    const b = generateRef();
    expect(a).not.toBe(b);
  });
});

describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-03-15T10:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the year', () => {
    expect(formatDate('2024-03-15T10:00:00Z')).toMatch(/2024/);
  });
});

describe('buildQueryString', () => {
  it('builds a query string from params', () => {
    const qs = buildQueryString({ page: 1, limit: 20 });
    expect(qs).toContain('page=1');
    expect(qs).toContain('limit=20');
    expect(qs.startsWith('?')).toBe(true);
  });

  it('skips undefined and null values', () => {
    const qs = buildQueryString({ page: 1, category: undefined, brand: null });
    expect(qs).not.toContain('category');
    expect(qs).not.toContain('brand');
  });

  it('returns empty string when all params are empty', () => {
    expect(buildQueryString({})).toBe('');
  });
});
