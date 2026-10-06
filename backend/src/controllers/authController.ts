import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { AppError } from '../middleware/errorHandler';

function signToken(userId: string, role: string): string {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
  );
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      throw new AppError('Email already registered', 409);
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone) VALUES ($1,$2,$3,$4)
       RETURNING id, email, name, phone, role, gift_points, created_at`,
      [name, email, hash, phone ?? null]
    );
    const user = rows[0];
    const token = signToken(user.id, user.role);
    res.status(201).json({ user: mapUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      'SELECT id, email, name, phone, role, gift_points, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Invalid email or password', 401);
    }
    const token = signToken(user.id, user.role);
    res.json({ user: mapUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // Stateless JWT — client discards token. Could add to blocklist here.
  res.status(204).send();
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as { userId?: string }).userId;
    const { rows } = await pool.query(
      'SELECT id, email, name, phone, role, gift_points, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!rows[0]) throw new AppError('User not found', 404);
    res.json(mapUser(rows[0]));
  } catch (err) {
    next(err);
  }
}

function mapUser(row: Record<string, unknown>) {
  return {
    id:          row.id,
    email:       row.email,
    name:        row.name,
    phone:       row.phone,
    role:        row.role,
    giftPoints:  row.gift_points,
    createdAt:   row.created_at,
  };
}
