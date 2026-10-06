import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AppError } from '../middleware/errorHandler';

const BOOK_SELECT = `
  b.id, b.title, b.author, b.price, b.discount_pct, b.cover_url,
  b.description, b.isbn, b.pages, b.language, b.rating, b.review_count,
  b.created_at,
  json_build_object('id', p.id, 'name', p.name) AS publisher,
  COALESCE(inv.quantity, 0) AS stock,
  COALESCE(
    json_agg(DISTINCT json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
    FILTER (WHERE c.id IS NOT NULL),
    '[]'
  ) AS categories
`;

const BOOK_FROM = `
  FROM books b
  JOIN publishers p ON p.id = b.publisher_id
  LEFT JOIN book_categories bc ON bc.book_id = b.id
  LEFT JOIN categories c ON c.id = bc.category_id
  LEFT JOIN inventory inv ON inv.book_id = b.id
`;

function mapBook(row: Record<string, unknown>) {
  return {
    id:          row.id,
    title:       row.title,
    author:      row.author,
    publisher:   row.publisher,
    price:       parseFloat(row.price as string),
    discountPct: row.discount_pct,
    coverUrl:    row.cover_url,
    description: row.description,
    isbn:        row.isbn,
    pages:       row.pages,
    language:    row.language,
    rating:      parseFloat(row.rating as string),
    reviewCount: row.review_count,
    stock:       row.stock,
    categories:  row.categories,
  };
}

export async function getBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page     = parseInt(req.query.page as string) || 1;
    const limit    = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset   = (page - 1) * limit;
    const search   = req.query.search as string;
    const category = req.query.category as string;
    const brand    = req.query.brand as string;
    const sort     = req.query.sort as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : null;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(to_tsvector('english', b.title || ' ' || b.author) @@ plainto_tsquery('english', $${pIdx}))`);
      params.push(search); pIdx++;
    }
    if (category) {
      conditions.push(`EXISTS (SELECT 1 FROM book_categories bc2 JOIN categories c2 ON c2.id = bc2.category_id WHERE bc2.book_id = b.id AND c2.slug = $${pIdx})`);
      params.push(category); pIdx++;
    }
    if (brand) {
      conditions.push(`b.publisher_id = $${pIdx}`);
      params.push(brand); pIdx++;
    }
    if (minPrice !== null) {
      conditions.push(`b.price * (1 - b.discount_pct / 100.0) >= $${pIdx}`);
      params.push(minPrice); pIdx++;
    }
    if (maxPrice !== null) {
      conditions.push(`b.price * (1 - b.discount_pct / 100.0) <= $${pIdx}`);
      params.push(maxPrice); pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderMap: Record<string, string> = {
      'price-asc':   'b.price * (1 - b.discount_pct / 100.0) ASC',
      'price-desc':  'b.price * (1 - b.discount_pct / 100.0) DESC',
      'rating':      'b.rating DESC',
      'newest':      'b.created_at DESC',
      'bestseller':  'b.review_count DESC',
    };
    const orderClause = `ORDER BY ${orderMap[sort] ?? 'b.created_at DESC'}`;

    const countQ = await pool.query(
      `SELECT COUNT(*) FROM books b ${whereClause}`,
      params
    );
    const total = parseInt(countQ.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT ${BOOK_SELECT} ${BOOK_FROM} ${whereClause} GROUP BY b.id, p.id, inv.quantity ${orderClause} LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
      params
    );

    res.json({
      data: rows.map(mapBook),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

export async function getBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(
      `SELECT ${BOOK_SELECT} ${BOOK_FROM} WHERE b.id = $1 GROUP BY b.id, p.id, inv.quantity`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('Book not found', 404);
    res.json(mapBook(rows[0]));
  } catch (err) {
    next(err);
  }
}

export async function getFeaturedBooks(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(
      `SELECT ${BOOK_SELECT} ${BOOK_FROM} GROUP BY b.id, p.id, inv.quantity ORDER BY b.rating DESC LIMIT 8`
    );
    res.json(rows.map(mapBook));
  } catch (err) {
    next(err);
  }
}

export async function getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookId = req.query.bookId as string;
    const { rows } = await pool.query(
      `SELECT ${BOOK_SELECT} ${BOOK_FROM}
       WHERE b.id != $1
         AND EXISTS (
           SELECT 1 FROM book_categories bc2
           WHERE bc2.book_id = b.id
             AND bc2.category_id IN (SELECT category_id FROM book_categories WHERE book_id = $1)
         )
       GROUP BY b.id, p.id, inv.quantity
       ORDER BY b.rating DESC LIMIT 4`,
      [bookId]
    );
    res.json(rows.map(mapBook));
  } catch (err) {
    next(err);
  }
}

export async function getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query('SELECT id, name, slug FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getBrands(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query('SELECT id, name FROM publishers ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
