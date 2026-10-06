import { z } from 'zod';

export const registerSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  phone:    z.string().regex(/^\d{10}$/).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const createOrderSchema = z.object({
  addressId:       z.string().uuid(),
  paymentMethod:   z.enum(['card', 'upi', 'netbanking', 'cod']),
  giftPointsToUse: z.number().int().min(0).optional().default(0),
});

export const addCartItemSchema = z.object({
  bookId:   z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export const addressSchema = z.object({
  label:   z.string().min(1),
  street:  z.string().min(5),
  city:    z.string().min(2),
  state:   z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
});

export const redeemGiftPointsSchema = z.object({
  orderId: z.string().uuid(),
  points:  z.number().int().min(1),
});
