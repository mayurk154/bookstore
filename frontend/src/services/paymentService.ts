import type { PaymentMethod, PaymentStatus } from '@/types';
import { generateRef } from '@/utils';

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  // Card fields
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
  // UPI
  upiId?: string;
  // Net banking
  bankCode?: string;
}

export interface PaymentResult {
  transactionRef: string;
  status: PaymentStatus;
  message: string;
  paidAt?: string;
}

/**
 * Mock payment service that simulates real-world payment states.
 * - UPI with ID "fail@upi" → failed
 * - Any card ending in "0000" → failed
 * - Otherwise → success after realistic delay
 */
export async function processPayment(req: PaymentRequest): Promise<PaymentResult> {
  const delay = req.method === 'cod' ? 300 : 1500 + Math.random() * 1000;
  await new Promise((r) => setTimeout(r, delay));

  // Simulate failure scenarios
  if (req.method === 'upi' && req.upiId === 'fail@upi') {
    return {
      transactionRef: generateRef('TXN'),
      status: 'failed',
      message: 'UPI transaction declined by bank.',
    };
  }

  if (req.method === 'card' && req.cardNumber?.replace(/\s/g, '').endsWith('0000')) {
    return {
      transactionRef: generateRef('TXN'),
      status: 'failed',
      message: 'Card declined. Please check your card details.',
    };
  }

  // COD always succeeds instantly
  if (req.method === 'cod') {
    return {
      transactionRef: generateRef('COD'),
      status: 'success',
      message: 'Cash on Delivery order confirmed.',
      paidAt: new Date().toISOString(),
    };
  }

  return {
    transactionRef: generateRef('TXN'),
    status: 'success',
    message: 'Payment successful.',
    paidAt: new Date().toISOString(),
  };
}

/** Format card number with spaces every 4 digits */
export function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

/** Format MM/YY expiry */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}
