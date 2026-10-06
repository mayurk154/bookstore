import api from './api';
import type { Order, Address } from '@/types';
import type { PaymentMethod } from '@/types';

export interface CreateOrderPayload {
  addressId: string;
  paymentMethod: PaymentMethod;
  giftPointsToUse: number;
}

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await api.post<Order>('/orders', payload);
    return data;
  },

  cancelOrder: async (id: string): Promise<Order> => {
    const { data } = await api.patch<Order>(`/orders/${id}/cancel`);
    return data;
  },

  getAddresses: async (): Promise<Address[]> => {
    const { data } = await api.get<Address[]>('/addresses');
    return data;
  },

  addAddress: async (address: Omit<Address, 'id'>): Promise<Address> => {
    const { data } = await api.post<Address>('/addresses', address);
    return data;
  },
};
