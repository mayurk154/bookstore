// ─── User & Auth ──────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin';
  giftPoints: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// ─── Books ────────────────────────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: Publisher;
  price: number;
  discountPct: number;
  coverUrl: string;
  description: string;
  isbn: string;
  pages: number;
  language: string;
  rating: number;
  reviewCount: number;
  stock: number;
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Publisher {
  id: string;
  name: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  book: Book;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  giftPointsApplied: number;
  total: number;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  book: Book;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  address: Address;
  subtotal: number;
  discount: number;
  giftPointsUsed: number;
  total: number;
  payment: Payment;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'cod';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface Payment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  amount: number;
  paidAt?: string;
}

// ─── Gift Points ──────────────────────────────────────────────────────────────
export interface GiftPointsBalance {
  balance: number;
  pendingEarning: number;
}

export interface GiftPointsTransaction {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

// ─── UI ───────────────────────────────────────────────────────────────────────
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}
