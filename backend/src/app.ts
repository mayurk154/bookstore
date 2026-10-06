import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-key';

app.use(helmet());
app.use(cors({ origin: 'http://127.0.0.1:5173', credentials: true }));
app.use(express.json());

// ─── In-memory mock data ────────────────────────────────────────────────────

const categories = [
  { id: 'cat-1', name: 'Fiction',      slug: 'fiction' },
  { id: 'cat-2', name: 'Non-Fiction',  slug: 'non-fiction' },
  { id: 'cat-3', name: 'Science',      slug: 'science' },
  { id: 'cat-4', name: 'Technology',   slug: 'technology' },
  { id: 'cat-5', name: 'History',      slug: 'history' },
  { id: 'cat-6', name: 'Self-Help',    slug: 'self-help' },
  { id: 'cat-7', name: 'Biography',    slug: 'biography' },
  { id: 'cat-8', name: 'Children',     slug: 'children' },
];

const publishers = [
  { id: 'pub-1', name: 'Penguin Random House' },
  { id: 'pub-2', name: 'HarperCollins' },
  { id: 'pub-3', name: 'Simon & Schuster' },
  { id: 'pub-4', name: 'Macmillan' },
  { id: 'pub-5', name: 'Oxford University Press' },
];

const books = [
  {
    id: 'book-1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald',
    publisher: publishers[0], price: 499, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/id/8226880-L.jpg',
    description: 'A story of the Jazz Age told through Nick Carraway, who is fascinated by his neighbour Jay Gatsby.',
    isbn: '9780743273565', pages: 180, language: 'English',
    rating: 4.2, reviewCount: 2841, stock: 15,
    categories: [categories[0]], isFeatured: true,
  },
  {
    id: 'book-2', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari',
    publisher: publishers[1], price: 799, discountPct: 25,
    coverUrl: 'https://covers.openlibrary.org/b/id/8739161-L.jpg',
    description: 'A bold survey of human history, from the Stone Age to the present.',
    isbn: '9780062316097', pages: 443, language: 'English',
    rating: 4.5, reviewCount: 5102, stock: 8,
    categories: [categories[1], categories[4]], isFeatured: true,
  },
  {
    id: 'book-3', title: 'Clean Code', author: 'Robert C. Martin',
    publisher: publishers[2], price: 1299, discountPct: 15,
    coverUrl: 'https://covers.openlibrary.org/b/id/8091016-L.jpg',
    description: 'A handbook of agile software craftsmanship.',
    isbn: '9780132350884', pages: 431, language: 'English',
    rating: 4.7, reviewCount: 3988, stock: 12,
    categories: [categories[3]], isFeatured: true,
  },
  {
    id: 'book-4', title: 'To Kill a Mockingbird', author: 'Harper Lee',
    publisher: publishers[0], price: 399, discountPct: 10,
    coverUrl: 'https://covers.openlibrary.org/b/id/8228691-L.jpg',
    description: 'Set in the American South during the 1930s, the novel deals with serious issues of rape and racial inequality.',
    isbn: '9780061743528', pages: 281, language: 'English',
    rating: 4.6, reviewCount: 4512, stock: 20,
    categories: [categories[0]], isFeatured: false,
  },
  {
    id: 'book-5', title: 'A Brief History of Time', author: 'Stephen Hawking',
    publisher: publishers[3], price: 599, discountPct: 18,
    coverUrl: 'https://covers.openlibrary.org/b/id/8739179-L.jpg',
    description: 'Exploring the origins of the universe, the nature of time, and the ultimate fate of the cosmos.',
    isbn: '9780553380163', pages: 212, language: 'English',
    rating: 4.4, reviewCount: 6720, stock: 5,
    categories: [categories[2]], isFeatured: true,
  },
  {
    id: 'book-6', title: 'Atomic Habits', author: 'James Clear',
    publisher: publishers[1], price: 699, discountPct: 22,
    coverUrl: 'https://covers.openlibrary.org/b/id/10527843-L.jpg',
    description: 'How to build good habits, break bad ones, and make small changes that deliver remarkable results.',
    isbn: '9780735211292', pages: 320, language: 'English',
    rating: 4.8, reviewCount: 9201, stock: 30,
    categories: [categories[5]], isFeatured: true,
  },
  {
    id: 'book-7', title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt',
    publisher: publishers[2], price: 1199, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/id/8091013-L.jpg',
    description: 'Examines the core process of software development.',
    isbn: '9780135957059', pages: 352, language: 'English',
    rating: 4.6, reviewCount: 2987, stock: 9,
    categories: [categories[3]], isFeatured: false,
  },
  {
    id: 'book-8', title: 'Steve Jobs', author: 'Walter Isaacson',
    publisher: publishers[2], price: 899, discountPct: 30,
    coverUrl: 'https://covers.openlibrary.org/b/id/7903380-L.jpg',
    description: 'The exclusive biography of Steve Jobs based on more than forty interviews.',
    isbn: '9781451648539', pages: 630, language: 'English',
    rating: 4.3, reviewCount: 7841, stock: 14,
    categories: [categories[6]], isFeatured: false,
  },
];

// In-memory stores
const users: Array<{ id: string; name: string; email: string; passwordHash: string; giftPoints: number }> = [];
const orders: Array<{
  id: string; userId: string; items: unknown[]; totalAmount: number;
  status: string; createdAt: string; address: unknown; paymentMethod: string;
}> = [];

// ─── Auth middleware ─────────────────────────────────────────────────────────

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorised' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string };
    (req as express.Request & { userId: string }).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400).json({ message: 'All fields required' }); return; }
  if (users.find(u => u.email === email)) { res.status(409).json({ message: 'Email already registered' }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: `user-${Date.now()}`, name, email, passwordHash, giftPoints: 100 };
  users.push(user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, giftPoints: user.giftPoints } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: 'Invalid credentials' }); return;
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, giftPoints: user.giftPoints } });
});

app.post('/api/auth/logout', authenticate, (_req, res) => {
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = users.find(u => u.id === userId);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  res.json({ id: user.id, name: user.name, email: user.email, giftPoints: user.giftPoints });
});

// ─── Books routes ─────────────────────────────────────────────────────────────

app.get('/api/books/featured', (_req, res) => {
  res.json(books.filter(b => b.isFeatured));
});

app.get('/api/books/recommendations', (_req, res) => {
  res.json([...books].sort(() => Math.random() - 0.5).slice(0, 4));
});

app.get('/api/books', (req, res) => {
  let result = [...books];
  const { q, category, brand, sort } = req.query as Record<string, string>;
  if (q) result = result.filter(b => b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()));
  if (category) result = result.filter(b => b.categories.some((c: { slug: string }) => c.slug === category));
  if (brand) result = result.filter(b => b.publisher.id === brand);
  if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
  res.json({ books: result, total: result.length });
});

app.get('/api/books/:id', (req, res) => {
  const book = books.find(b => b.id === req.params.id);
  if (!book) { res.status(404).json({ message: 'Book not found' }); return; }
  res.json(book);
});

// ─── Categories & brands ──────────────────────────────────────────────────────

app.get('/api/categories', (_req, res) => res.json(categories));
app.get('/api/brands', (_req, res) => res.json(publishers));

// ─── Orders routes ────────────────────────────────────────────────────────────

app.get('/api/orders', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  res.json(orders.filter(o => o.userId === userId));
});

app.post('/api/orders', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { items, address, paymentMethod, giftPointsUsed = 0 } = req.body;
  if (!items?.length || !address || !paymentMethod) {
    res.status(400).json({ message: 'items, address and paymentMethod are required' }); return;
  }
  const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  const discount = giftPointsUsed * 0.5;
  const order = {
    id: `ord-${Date.now()}`,
    userId,
    items,
    totalAmount: Math.max(0, subtotal - discount),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    address,
    paymentMethod,
  };
  orders.push(order);
  // Award gift points (5% of total)
  const user = users.find(u => u.id === userId);
  if (user) {
    user.giftPoints = user.giftPoints - giftPointsUsed + Math.floor(order.totalAmount * 0.05);
  }
  res.status(201).json(order);
});

app.get('/api/orders/:id', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const order = orders.find(o => o.id === req.params.id && o.userId === userId);
  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
  res.json(order);
});

app.patch('/api/orders/:id/cancel', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const order = orders.find(o => o.id === req.params.id && o.userId === userId);
  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
  const hoursSince = (Date.now() - new Date(order.createdAt).getTime()) / 3_600_000;
  if (hoursSince > 48) { res.status(400).json({ message: 'Cannot cancel order after 48 hours' }); return; }
  if (order.status === 'cancelled') { res.status(400).json({ message: 'Order already cancelled' }); return; }
  order.status = 'cancelled';
  res.json(order);
});

// ─── Addresses ────────────────────────────────────────────────────────────────

const addresses: Array<{ id: string; userId: string; label: string; street: string; city: string; state: string; pincode: string; isDefault: boolean }> = [];

app.get('/api/addresses', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  res.json(addresses.filter(a => a.userId === userId));
});

app.post('/api/addresses', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { label, street, city, state, pincode, isDefault = false } = req.body;
  if (isDefault) addresses.filter(a => a.userId === userId).forEach(a => { a.isDefault = false; });
  const addr = { id: `addr-${Date.now()}`, userId, label, street, city, state, pincode, isDefault };
  addresses.push(addr);
  res.status(201).json(addr);
});

// ─── Payments (mock) ──────────────────────────────────────────────────────────

app.post('/api/payments', authenticate, (req, res) => {
  const { orderId, method } = req.body;
  const fail = Math.random() < 0.05; // 5% chance of failure for realism
  setTimeout(() => {
    if (fail) {
      res.status(402).json({ status: 'failed', message: 'Payment declined' });
    } else {
      res.json({ status: 'success', transactionId: `txn-${Date.now()}`, orderId, method });
    }
  }, 800);
});

// ─── Gift points ──────────────────────────────────────────────────────────────

app.get('/api/gift-points', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = users.find(u => u.id === userId);
  res.json({ points: user?.giftPoints ?? 0, valuePerPoint: 0.5 });
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Bookstore API running at http://127.0.0.1:${PORT}`);
});

export default app;
