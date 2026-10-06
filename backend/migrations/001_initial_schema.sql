-- ============================================================
-- BookVault PostgreSQL Data Model
-- ============================================================
-- Run order: extensions → users → address → catalogue → inventory
--            → cart → orders → payments → gift_points
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    name          TEXT        NOT NULL,
    phone         TEXT,
    role          TEXT        NOT NULL DEFAULT 'customer'
                              CHECK (role IN ('customer', 'admin')),
    gift_points   INTEGER     NOT NULL DEFAULT 0 CHECK (gift_points >= 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- ─── ADDRESSES ────────────────────────────────────────────────────────────────
CREATE TABLE addresses (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    label      TEXT        NOT NULL DEFAULT 'Home',
    street     TEXT        NOT NULL,
    city       TEXT        NOT NULL,
    state      TEXT        NOT NULL,
    pincode    CHAR(6)     NOT NULL CHECK (pincode ~ '^\d{6}$'),
    is_default BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses (user_id);

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
CREATE TABLE categories (
    id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT  NOT NULL UNIQUE,
    slug       TEXT  NOT NULL UNIQUE
);

-- ─── PUBLISHERS (BRANDS) ──────────────────────────────────────────────────────
CREATE TABLE publishers (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- ─── BOOKS ────────────────────────────────────────────────────────────────────
CREATE TABLE books (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT           NOT NULL,
    author        TEXT           NOT NULL,
    publisher_id  UUID           NOT NULL REFERENCES publishers (id),
    price         NUMERIC(10,2)  NOT NULL CHECK (price > 0),
    discount_pct  SMALLINT       NOT NULL DEFAULT 0
                                 CHECK (discount_pct BETWEEN 0 AND 90),
    cover_url     TEXT,
    description   TEXT,
    isbn          TEXT           UNIQUE,
    pages         INTEGER        CHECK (pages > 0),
    language      TEXT           NOT NULL DEFAULT 'English',
    rating        NUMERIC(3,1)   NOT NULL DEFAULT 0
                                 CHECK (rating BETWEEN 0 AND 5),
    review_count  INTEGER        NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_books_publisher ON books (publisher_id);
CREATE INDEX idx_books_title      ON books USING gin (to_tsvector('english', title));
CREATE INDEX idx_books_author     ON books USING gin (to_tsvector('english', author));

-- ─── BOOK → CATEGORY (many-to-many) ──────────────────────────────────────────
CREATE TABLE book_categories (
    book_id     UUID NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, category_id)
);

-- ─── INVENTORY ────────────────────────────────────────────────────────────────
CREATE TABLE inventory (
    book_id      UUID        PRIMARY KEY REFERENCES books (id) ON DELETE CASCADE,
    quantity     INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CARTS ────────────────────────────────────────────────────────────────────
CREATE TABLE carts (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CART ITEMS ───────────────────────────────────────────────────────────────
CREATE TABLE cart_items (
    id         UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id    UUID     NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    book_id    UUID     NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    quantity   INTEGER  NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, book_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items (cart_id);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TYPE order_status_enum AS ENUM (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
);

CREATE TABLE orders (
    id                UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID               NOT NULL REFERENCES users (id),
    address_id        UUID               NOT NULL REFERENCES addresses (id),
    status            order_status_enum  NOT NULL DEFAULT 'pending',
    subtotal          NUMERIC(10,2)      NOT NULL CHECK (subtotal >= 0),
    discount          NUMERIC(10,2)      NOT NULL DEFAULT 0 CHECK (discount >= 0),
    gift_points_used  INTEGER            NOT NULL DEFAULT 0 CHECK (gift_points_used >= 0),
    delivery_fee      NUMERIC(10,2)      NOT NULL DEFAULT 0,
    total             NUMERIC(10,2)      NOT NULL CHECK (total >= 0),
    created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user   ON orders (user_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created ON orders (created_at DESC);

-- ─── ORDER ITEMS ──────────────────────────────────────────────────────────────
CREATE TABLE order_items (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID           NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    book_id     UUID           NOT NULL REFERENCES books (id),
    quantity    INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(10,2)  NOT NULL CHECK (unit_price > 0)   -- price at time of order
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- ─── ORDER STATUS HISTORY ─────────────────────────────────────────────────────
CREATE TABLE order_status_history (
    id         UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID               NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    status     order_status_enum  NOT NULL,
    changed_at TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    note       TEXT
);

CREATE INDEX idx_osh_order ON order_status_history (order_id);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────
CREATE TYPE payment_method_enum AS ENUM ('card', 'upi', 'netbanking', 'cod');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'success', 'failed');

CREATE TABLE payments (
    id              UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID                 NOT NULL UNIQUE REFERENCES orders (id),
    method          payment_method_enum  NOT NULL,
    status          payment_status_enum  NOT NULL DEFAULT 'pending',
    transaction_ref TEXT,
    amount          NUMERIC(10,2)        NOT NULL CHECK (amount > 0),
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- ─── GIFT POINTS LEDGER ───────────────────────────────────────────────────────
CREATE TABLE gift_points (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    delta      INTEGER     NOT NULL,   -- positive = earned, negative = redeemed
    reason     TEXT        NOT NULL,
    order_id   UUID        REFERENCES orders (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gift_points_user ON gift_points (user_id);

-- ─── TRIGGERS: updated_at auto-update ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── TRIGGER: gift_points.users sync ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_user_gift_points()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE users
    SET gift_points = gift_points + NEW.delta
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gift_points_sync
    AFTER INSERT ON gift_points
    FOR EACH ROW EXECUTE FUNCTION sync_user_gift_points();

-- ─── TRIGGER: order cancellation window check (48h) ──────────────────────────
CREATE OR REPLACE FUNCTION check_cancel_window()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'cancelled'
       AND OLD.status NOT IN ('pending', 'confirmed', 'processing')
    THEN
        RAISE EXCEPTION 'Cannot cancel order in status %', OLD.status;
    END IF;

    IF NEW.status = 'cancelled'
       AND (NOW() - OLD.created_at) > INTERVAL '48 hours'
    THEN
        RAISE EXCEPTION 'Cancellation window has expired (48 hours)';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_cancel_check
    BEFORE UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled')
    EXECUTE FUNCTION check_cancel_window();
