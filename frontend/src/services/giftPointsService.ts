import api from './api';

interface GiftPointsResponse {
  points: number;
  valuePerPoint: number;
}

export const giftPointsService = {
  getBalance: async (): Promise<GiftPointsResponse> => {
    const { data } = await api.get<GiftPointsResponse>('/gift-points');
    return data;
  },
};
