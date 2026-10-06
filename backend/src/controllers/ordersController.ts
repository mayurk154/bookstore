import type { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/auth';

export async function getOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.subtotal, o.discount, o.gift_points_used, o.delivery_fee, o.total,
              o.created_at, o.updated_at,
              json_build_object(
                'id', a.id, 'label', a.label, 'street', a.street,
                'city', a.city, 'state', a.state, 'pincode', a.pincode
              ) AS address,
              json_build_object(
                'id', p.id, 'method', p.method, 'status', p.status,
                'transactionRef', p.transaction_ref, 'amount', p.amount, 'paidAt', p.paid_at
              ) AS payment,
              COALESCE(
                json_agg(json_build_object(
                  'id', oi.id, 'quantity', oi.quantity, 'unitPrice', oi.unit_price,
                  'book', json_build_object('id', b.id, 'title', b.title, 'author', b.author,
                    'coverUrl', b.cover_url, 'price', b.price, 'discountPct', b.discount_pct)
                )) FILTER (WHERE oi.id IS NOT NULL), '[]'
              ) AS items
       FROM orders o
       JOIN addresses a ON a.id = o.address_id
       LEFT JOIN payments p ON p.order_id = o.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN books b ON b.id = oi.book_id
       WHERE o.user_id = $1
       GROUP BY o.id, a.id, p.id
       ORDER BY o.created_at DESC`,
      [req.userId]
    );
    res.json(rows.map(mapOrder));
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.subtotal, o.discount, o.gift_points_used, o.delivery_fee, o.total,
              o.created_at, o.updated_at,
              json_build_object(
                'id', a.id, 'label', a.label, 'street', a.street,
                'city', a.city, 'state', a.state, 'pincode', a.pincode
              ) AS address,
              json_build_object(
                'id', p.id, 'method', p.method, 'status', p.status,
                'transactionRef', p.transaction_ref, 'amount', p.amount, 'paidAt', p.paid_at
              ) AS payment,
              COALESCE(
                json_agg(json_build_object(
                  'id', oi.id, 'quantity', oi.quantity, 'unitPrice', oi.unit_price,
                  'book', json_build_object('id', b.id, 'title', b.title, 'author', b.author,
                    'coverUrl', b.cover_url, 'price', b.price, 'discountPct', b.discount_pct)
                )) FILTER (WHERE oi.id IS NOT NULL), '[]'
              ) AS items
       FROM orders o
       JOIN addresses a ON a.id = o.address_id
       LEFT JOIN payments p ON p.order_id = o.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN books b ON b.id = oi.book_id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id, a.id, p.id`,
      [req.params.id, req.userId]
    );
    if (!rows[0]) throw new AppError('Order not found', 404);
    res.json(mapOrder(rows[0]));
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get cart items
    const cartResult = await client.query(
      `SELECT ci.id, ci.book_id, ci.quantity, b.price, b.discount_pct, inv.quantity AS stock
       FROM carts ca
       JOIN cart_items ci ON ci.cart_id = ca.id
       JOIN books b ON b.id = ci.book_id
       JOIN inventory inv ON inv.book_id = b.id
       WHERE ca.user_id = $1`,
      [req.userId]
    );
    if (cartResult.rows.length === 0) throw new AppError('Cart is empty', 400);

    const { addressId, paymentMethod, giftPointsToUse } = req.body;

    // Validate stock
    for (const item of cartResult.rows) {
      if (item.quantity > item.stock) {
        throw new AppError(`Insufficient stock for book ${item.book_id}`, 400);
      }
    }

    // Compute totals
    let subtotal = 0;
    let discount = 0;
    const orderItems = cartResult.rows.map((item) => {
      const unitPrice = Math.round(item.price * (1 - item.discount_pct / 100));
      const originalPrice = Math.round(item.price);
      subtotal += unitPrice * item.quantity;
      discount += (originalPrice - unitPrice) * item.quantity;
      return { bookId: item.book_id, quantity: item.quantity, unitPrice };
    });

    // Validate gift points
    const userResult = await client.query('SELECT gift_points FROM users WHERE id = $1', [req.userId]);
    const availableGP = userResult.rows[0].gift_points;
    const maxGP = Math.floor(subtotal * 0.2);
    const gpToUse = Math.min(giftPointsToUse ?? 0, availableGP, maxGP);
    const deliveryFee = subtotal - gpToUse >= 499 ? 0 : 99;
    const total = subtotal - gpToUse + deliveryFee;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, address_id, subtotal, discount, gift_points_used, delivery_fee, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [req.userId, addressId, subtotal, discount, gpToUse, deliveryFee, total]
    );
    const orderId = orderResult.rows[0].id;

    // Insert order items + decrement inventory
    for (const oi of orderItems) {
      await client.query(
        'INSERT INTO order_items (order_id, book_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [orderId, oi.bookId, oi.quantity, oi.unitPrice]
      );
      await client.query(
        'UPDATE inventory SET quantity = quantity - $1 WHERE book_id = $2',
        [oi.quantity, oi.bookId]
      );
    }

    // Redeem gift points
    if (gpToUse > 0) {
      await client.query(
        'INSERT INTO gift_points (user_id, delta, reason, order_id) VALUES ($1,$2,$3,$4)',
        [req.userId, -gpToUse, 'redeemed on order', orderId]
      );
    }

    // Create payment record
    await client.query(
      'INSERT INTO payments (order_id, method, amount) VALUES ($1,$2,$3)',
      [orderId, paymentMethod, total]
    );

    // Clear cart
    await client.query(
      'DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)',
      [req.userId]
    );

    // Insert status history
    await client.query(
      'INSERT INTO order_status_history (order_id, status) VALUES ($1,$2)',
      [orderId, 'pending']
    );

    await client.query('COMMIT');

    // Return created order
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    res.status(201).json({ ...rows[0], id: orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(
      'SELECT id, status, created_at, user_id FROM orders WHERE id = $1',
      [req.params.id]
    );
    const order = rows[0];
    if (!order) throw new AppError('Order not found', 404);
    if (order.user_id !== req.userId) throw new AppError('Forbidden', 403);
    if (['cancelled', 'delivered'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled', 400);
    }
    const hoursElapsed = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 3600);
    if (hoursElapsed > 48) {
      throw new AppError('Cancellation window has expired (48 hours)', 400);
    }
    const updated = await pool.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json(mapOrder(updated.rows[0]));
  } catch (err) {
    next(err);
  }
}

function mapOrder(row: Record<string, unknown>) {
  return {
    id:             row.id,
    status:         row.status,
    items:          row.items ?? [],
    address:        row.address,
    subtotal:       parseFloat(row.subtotal as string),
    discount:       parseFloat(row.discount as string ?? '0'),
    giftPointsUsed: row.gift_points_used,
    total:          parseFloat(row.total as string),
    payment:        row.payment,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}
