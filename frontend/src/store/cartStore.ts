import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Book } from '@/types';
import { discountedPrice, maxRedeemablePoints } from '@/utils';

interface CartStore {
  items: CartItem[];
  giftPointsApplied: number;

  addItem: (book: Book, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  applyGiftPoints: (points: number) => void;
  removeGiftPoints: () => void;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
  discount: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      giftPointsApplied: 0,

      addItem: (book, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.book.id === book.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.book.id === book.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, book.stock) }
                  : i
              ),
            };
          }
          const newItem: CartItem = {
            id: `ci-${book.id}-${Date.now()}`,
            book,
            quantity: Math.min(quantity, book.stock),
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === cartItemId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], giftPointsApplied: 0 }),

      applyGiftPoints: (points) => set({ giftPointsApplied: points }),

      removeGiftPoints: () => set({ giftPointsApplied: 0 }),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, i) => sum + discountedPrice(i.book.price, i.book.discountPct) * i.quantity,
          0
        ),

      discount: () =>
        get().items.reduce(
          (sum, i) =>
            sum +
            (i.book.price - discountedPrice(i.book.price, i.book.discountPct)) *
              i.quantity,
          0
        ),

      total: () => {
        const sub = get().subtotal();
        const gp = get().giftPointsApplied;
        const maxGP = maxRedeemablePoints(sub, gp);
        return Math.max(0, sub - maxGP);
      },
    }),
    {
      name: 'bv-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
