import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// ─── Health ───────────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

// ─── Books ────────────────────────────────────────────────────────────────────
describe('GET /api/books', () => {
  it('returns a list of books with total count', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filters books by search query', async () => {
    const res = await request(app).get('/api/books?q=gatsby');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].title.toLowerCase()).toContain('gatsby');
  });

  it('returns empty books array for a non-matching search', async () => {
    const res = await request(app).get('/api/books?q=zzznomatch999');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('sorts by price ascending', async () => {
    const res = await request(app).get('/api/books?sort=price_asc');
    expect(res.status).toBe(200);
    const prices: number[] = res.body.data.map((b: { price: number }) => b.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });
});

describe('GET /api/books/featured', () => {
  it('returns an array of featured books', async () => {
    const res = await request(app).get('/api/books/featured');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /api/books/:id', () => {
  it('returns a book by id', async () => {
    const res = await request(app).get('/api/books/book-1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('book-1');
    expect(typeof res.body.title).toBe('string');
  });

  it('returns 404 for a non-existent book', async () => {
    const res = await request(app).get('/api/books/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toBeDefined();
  });
});

// ─── Categories & Brands ──────────────────────────────────────────────────────
describe('GET /api/categories', () => {
  it('returns an array of categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('slug');
  });
});

describe('GET /api/brands', () => {
  it('returns an array of publishers', async () => {
    const res = await request(app).get('/api/brands');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('name');
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'Password1',
    });
    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toContain('@example.com');
    expect(res.body.user.giftPoints).toBe(100);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('returns 409 when the email is already registered', async () => {
    const email = `dup_${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({
      name: 'User A',
      email,
      password: 'Password1',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email,
      password: 'Password1',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const email = `login_${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email,
      password: 'Password1',
    });
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'Password1',
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 401 for wrong password', async () => {
    const email = `wrong_${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({
      name: 'WP User',
      email,
      password: 'Password1',
    });
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'WrongPassword99',
    });
    expect(res.status).toBe(401);
  });
});

// ─── Protected routes ────────────────────────────────────────────────────────
describe('Protected routes — unauthenticated', () => {
  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/orders returns 401 without token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('GET /api/addresses returns 401 without token', async () => {
    const res = await request(app).get('/api/addresses');
    expect(res.status).toBe(401);
  });
});

// ─── Orders — full flow ───────────────────────────────────────────────────────
describe('Orders — authenticated flow', () => {
  let token: string;

  it('setup: registers and logs in', async () => {
    const email = `order_${Date.now()}@example.com`;
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Order User',
      email,
      password: 'Password1',
    });
    token = reg.body.token;
    expect(token).toBeDefined();
  });

  it('GET /api/orders returns empty array for new user', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('POST /api/orders creates an order', async () => {
    // First create an address
    const addrRes = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        label: 'Home',
        street: '42 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        isDefault: true,
      });
    expect(addrRes.status).toBe(201);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ bookId: 'book-1', quantity: 1, price: 399 }],
        address: addrRes.body,
        paymentMethod: 'card',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('confirmed');
  });

  it('PATCH /api/orders/:id/cancel cancels the order within 48h', async () => {
    // Place another order to cancel
    const addrRes = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        label: 'Home',
        street: '10 Park St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        isDefault: false,
      });

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ bookId: 'book-2', quantity: 1, price: 599 }],
        address: addrRes.body,
        paymentMethod: 'upi',
      });
    const orderId = orderRes.body.id;

    const cancelRes = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('cancelled');
  });
});

// ─── Gift points ──────────────────────────────────────────────────────────────
describe('GET /api/gift-points', () => {
  it('returns gift points balance for authenticated user', async () => {
    const email = `gp_${Date.now()}@example.com`;
    const reg = await request(app).post('/api/auth/register').send({
      name: 'GP User',
      email,
      password: 'Password1',
    });
    const res = await request(app)
      .get('/api/gift-points')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.points).toBe('number');
    expect(res.body.points).toBe(100); // new users get 100
  });
});
