import api from './api';
import type { Book, PaginatedResponse } from '@/types';
import { buildQueryString } from '@/utils';

export interface BookFilters {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const bookService = {
  getBooks: async (filters: BookFilters = {}): Promise<PaginatedResponse<Book>> => {
    const qs = buildQueryString(filters as Record<string, string | number | boolean | undefined>);
    const { data } = await api.get<PaginatedResponse<Book>>(`/books${qs}`);
    return data;
  },

  getBook: async (id: string): Promise<Book> => {
    const { data } = await api.get<Book>(`/books/${id}`);
    return data;
  },

  getFeaturedBooks: async (): Promise<Book[]> => {
    const { data } = await api.get<Book[]>('/books/featured');
    return data;
  },

  getRecommendations: async (bookId: string): Promise<Book[]> => {
    const { data } = await api.get<Book[]>(`/books/recommendations?bookId=${bookId}`);
    return data;
  },
};
