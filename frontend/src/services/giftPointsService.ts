import api from './api';
import type { GiftPointsBalance } from '@/types';

export const giftPointsService = {
  getBalance: async (): Promise<GiftPointsBalance> => {
    const { data } = await api.get<GiftPointsBalance>('/gift-points/balance');
    return data;
  },

  redeem: async (orderId: string, points: number): Promise<GiftPointsBalance> => {
    const { data } = await api.post<GiftPointsBalance>('/gift-points/redeem', {
      orderId,
      points,
    });
    return data;
  },
};
