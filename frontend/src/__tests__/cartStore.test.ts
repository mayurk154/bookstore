import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/store/cartStore';
import type { Book } from '@/types';

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  title: 'Test Book',
  author: 'Test Author',
  publisher: { id: 'pub-1', name: 'Publisher' },
  price: 500,
  discountPct: 20,
  coverUrl: '',
  description: '',
  isbn: '1234567890',
  pages: 100,
  language: 'English',
  rating: 4.0,
  reviewCount: 100,
  stock: 10,
  categories: [],
  ...overrides,
});

beforeEach(() => {
  useCartStore.setState({ items: [], giftPointsApplied: 0 });
});

describe('cartStore — addItem', () => {
  it('adds a new item to the cart', () => {
    const book = makeBook();
    useCartStore.getState().addItem(book);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].book.id).toBe('book-1');
  });

  it('increments quantity when adding the same book twice', () => {
    const book = makeBook();
    useCartStore.getState().addItem(book);
    useCartStore.getState().addItem(book);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('does not exceed stock when adding beyond limit', () => {
    const book = makeBook({ stock: 3 });
    useCartStore.getState().addItem(book, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });
});

describe('cartStore — removeItem', () => {
  it('removes an item by id', () => {
    const book = makeBook();
    useCartStore.getState().addItem(book);
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cartStore — updateQuantity', () => {
  it('updates the quantity of an existing item', () => {
    const book = makeBook();
    useCartStore.getState().addItem(book);
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('removes the item when quantity is set to 0', () => {
    const book = makeBook();
    useCartStore.getState().addItem(book);
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cartStore — clearCart', () => {
  it('clears all items and gift points', () => {
    const book = makeBook();
    useCartStore.getState().addItem(book);
    useCartStore.getState().applyGiftPoints(50);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().giftPointsApplied).toBe(0);
  });
});

describe('cartStore — subtotal / discount / total', () => {
  it('calculates subtotal using discounted prices', () => {
    const book = makeBook({ price: 500, discountPct: 20 }); // finalPrice = 400
    useCartStore.getState().addItem(book, 2); // 400 * 2 = 800
    expect(useCartStore.getState().subtotal()).toBe(800);
  });

  it('calculates discount correctly', () => {
    const book = makeBook({ price: 500, discountPct: 20 }); // saved 100 per unit
    useCartStore.getState().addItem(book, 2); // saved 200
    expect(useCartStore.getState().discount()).toBe(200);
  });

  it('applies gift points in total calculation', () => {
    const book = makeBook({ price: 500, discountPct: 0 });
    useCartStore.getState().addItem(book, 2); // subtotal = 1000
    useCartStore.getState().applyGiftPoints(100); // max redeemable = 20% of 1000 = 200 → 100 OK
    expect(useCartStore.getState().total()).toBe(900);
  });
});

describe('cartStore — gift points', () => {
  it('applies and removes gift points', () => {
    useCartStore.getState().applyGiftPoints(75);
    expect(useCartStore.getState().giftPointsApplied).toBe(75);
    useCartStore.getState().removeGiftPoints();
    expect(useCartStore.getState().giftPointsApplied).toBe(0);
  });
});
