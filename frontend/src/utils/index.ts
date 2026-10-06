import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price in Indian Rupees.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate the discounted price.
 */
export function discountedPrice(price: number, discountPct: number): number {
  return Math.round(price * (1 - discountPct / 100));
}

/**
 * Returns true if the order can still be cancelled (within 48 hours of placement).
 */
export function canCancelOrder(createdAt: string): boolean {
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAt).getTime() < FORTY_EIGHT_HOURS_MS;
}

/**
 * Clamp gift points so they do not exceed 20% of the order total.
 * Returns the maximum redeemable points (1 point = ₹1).
 */
export function maxRedeemablePoints(orderTotal: number, availablePoints: number): number {
  const maxFromTotal = Math.floor(orderTotal * 0.2);
  return Math.min(availablePoints, maxFromTotal);
}

/**
 * Truncate a string to `maxLength` characters, appending "…" if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Generate a random order-confirmation-style ID for mock usage.
 */
export function generateRef(prefix = 'BV'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Build query string from params object (skips undefined/null values).
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}
