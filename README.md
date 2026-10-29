# 📚 BookVault — E-Commerce Bookstore

A full-stack e-commerce bookstore built as an IBM BOB Capstone Project. BookVault lets users browse a catalogue of 40+ books, manage a shopping cart, apply gift points, and place orders — all with a fully connected React frontend and Node.js/Express backend.

---

## 🖼️ Screenshots

> Home page, Catalogue with filters, Product Detail, Cart with gift points, Checkout flow, Order History with Buy Again & Cancel.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite |
| **Styling** | Tailwind CSS · shadcn/ui (Radix UI) |
| **State** | Zustand (cart + auth, persisted to localStorage) |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form · Zod |
| **Backend** | Node.js · Express · TypeScript |
| **Database** | PostgreSQL (schema + migrations included) |
| **Auth** | JWT (Bearer token) · bcrypt |
| **Validation** | Zod (backend schemas) |
| **Testing** | Vitest · React Testing Library · Supertest |
| **API Spec** | OpenAPI 3.0 (`backend/openapi.yaml`) |

---

## ✨ Features

- **Catalogue** — Browse 40 books across 8 categories with search, filter by category/publisher/price, sort (price, rating, bestseller, newest)
- **Product Detail** — Book info, star ratings, stock indicator, quantity selector, related books
- **Shopping Cart** — Add/remove/update items, gift points redemption (up to 20% of order), free delivery above ₹499
- **Authentication** — Register, login, JWT-protected routes, persisted session
- **Checkout** — 3-step flow: delivery address → gift points → review & place order
- **Payment (Mock)** — Card, UPI, Net Banking, Cash on Delivery; simulates pending/success/failed states with retry
- **Order History** — View all past orders, expand for full details, **Buy Again** (re-adds all items to cart), **Cancel within 48 hours**
- **Gift Points** — Earn 5% of order value on each purchase; redeem on future orders
- **Responsive** — Mobile-first layout, collapsible filter sidebar on mobile
- **Error & Empty States** — Loading skeletons, empty catalogue messages, 404 page

---

## 📁 Project Structure

```
bookstore/
├── backend/
│   ├── src/
│   │   ├── app.ts               # Express app (in-memory, production-ready)
│   │   ├── config/db.ts         # PostgreSQL pool (for DB mode)
│   │   ├── controllers/         # authController, booksController, ordersController
│   │   ├── middleware/          # auth.ts (JWT), errorHandler.ts, validate.ts
│   │   ├── routes/              # auth.ts, books.ts, orders.ts
│   │   └── validators/schemas.ts # Zod schemas
│   ├── migrations/
│   │   ├── 001_initial_schema.sql  # Full PostgreSQL schema (13 tables)
│   │   └── 002_seed_data.sql       # Seed data (books, categories, publishers)
│   ├── tests/api.test.ts        # 23 Supertest integration tests
│   ├── openapi.yaml             # OpenAPI 3.0 spec (all endpoints)
│   ├── vitest.config.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # Home, Catalogue, ProductDetail, Cart, Checkout,
│   │   │                        # Payment, OrderConfirmation, OrderHistory, Login, Register
│   │   ├── components/
│   │   │   ├── books/           # BookCard, BookGrid (with skeleton)
│   │   │   ├── common/          # EmptyState, ErrorAlert, ErrorBoundary, Spinner
│   │   │   ├── layout/          # Layout, Navbar, Footer, ProtectedRoute, SearchBar
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── services/            # authService, bookService, orderService, paymentService
│   │   ├── store/               # authStore, cartStore, uiStore (Zustand)
│   │   ├── types/index.ts       # All TypeScript interfaces
│   │   ├── utils/               # formatPrice, discountedPrice, canCancelOrder, etc.
│   │   └── __tests__/           # utils.test.ts, BookCard.test.tsx, cartStore.test.ts
│   ├── vitest.config.ts
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18 (project uses v20)
- No database required — the backend runs fully in-memory out of the box

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env if needed (defaults work for in-memory mode)

# Frontend
cp frontend/.env.example frontend/.env
# VITE_API_BASE_URL=http://127.0.0.1:3001/api  ← already set
```

### 3. Run the project

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://127.0.0.1:5173** in your browser.

### 4. (Optional) PostgreSQL mode

If you want to use a real PostgreSQL database:

```bash
# Create user & database
createuser -s bookstore --pwprompt   # password: bookstore
createdb bookstore_db -O bookstore

# Run migrations
npm run migrate --prefix backend

# Switch backend to use controllers (currently app.ts uses in-memory)
# The controllers in backend/src/controllers/ are DB-ready
```

---

## 🧪 Running Tests

```bash
# Frontend — 41 tests (utils, BookCard component, cart store)
cd frontend && npm test

# Backend — 23 tests (API integration with Supertest)
cd backend && npm test
```

**Total: 64 tests, all passing.**

Test coverage includes:
- All 8 utility functions (`formatPrice`, `discountedPrice`, `canCancelOrder`, `maxRedeemablePoints`, etc.)
- `BookCard` component rendering (title, author, price, discount badge, link, rating)
- `cartStore` — add, remove, update, clear, subtotal, discount, total, gift points
- API endpoints — health, books (list/search/sort/404), auth (register/login/409/401), orders (create/cancel), gift points, protected routes

---

## 📖 API Reference

The full API is documented in [`backend/openapi.yaml`](backend/openapi.yaml) (OpenAPI 3.0).

### Key endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |
| `GET` | `/api/books` | — | List books (search, filter, sort, paginate) |
| `GET` | `/api/books/featured` | — | Featured books |
| `GET` | `/api/books/:id` | — | Single book detail |
| `GET` | `/api/books/recommendations?bookId=` | — | Related books |
| `GET` | `/api/categories` | — | All categories |
| `GET` | `/api/brands` | — | All publishers |
| `GET` | `/api/orders` | ✅ | User's order history |
| `POST` | `/api/orders` | ✅ | Place an order |
| `PATCH` | `/api/orders/:id/cancel` | ✅ | Cancel order (within 48h) |
| `GET` | `/api/addresses` | ✅ | User's saved addresses |
| `POST` | `/api/addresses` | ✅ | Save a new address |
| `POST` | `/api/payments` | ✅ | Process payment (mock) |
| `GET` | `/api/gift-points` | ✅ | Gift points balance |

---

## 🤖 IBM BOB Usage

This project was built using **IBM BOB** as an AI-assisted development assistant throughout the capstone. BOB was used for:

1. **Project Analysis & Architecture** — Analysed requirements, proposed folder structure, routes, API contracts, and PostgreSQL data model
2. **Frontend Foundation** — Scaffolded React + TypeScript + Vite setup, Tailwind config, shadcn/ui integration, routing, Layout/Navbar/Footer components
3. **Page Implementation** — Generated all 10 pages (Home, Catalogue, ProductDetail, Cart, Checkout, Payment, OrderHistory, OrderConfirmation, Login, Register)
4. **Backend Implementation** — Built Express controllers, JWT middleware, Zod validators, error handler, and in-memory API
5. **PostgreSQL Data Model** — Designed full normalised schema with 13 tables, indexes, and triggers
6. **OpenAPI Specification** — Generated complete OpenAPI 3.0 spec for all endpoints
7. **Frontend–Backend Integration (P14)** — Connected all pages to real API services, replacing mock functions
8. **Testing (P15)** — Wrote 64 tests covering utilities, components, store logic, and API endpoints
9. **Gap Analysis** — Used BOB's code review to identify and systematically close all capstone requirement gaps
10. **Book Catalogue Expansion** — Used BOB to expand from 8 to 40 books with real ISBN-based cover images from Open Library

### Example BOB prompts used

```
"Compare with prompts and check what is required — give me the gap report"
"Fulfil P14 Frontend–Backend Integration and P15 Testing gaps"
"Add 40 hardcoded books from free API across all 8 categories"
"Create README, .gitignore, feature branch, and PR for GitHub submission"
```

---

## 📋 Capstone Checklist

| Prompt | Feature | Status |
|---|---|---|
| 1 | Project Analysis & Architecture | ✅ |
| 2 | Frontend Foundation | ✅ |
| 3 | Homepage | ✅ |
| 4 | Catalogue with filters | ✅ |
| 5 | Product Detail | ✅ |
| 6 | Shopping Cart | ✅ |
| 7 | Authentication | ✅ |
| 8 | Order History + Buy Again | ✅ |
| 9 | Checkout | ✅ |
| 10 | Payment (Mock) | ✅ |
| 11 | PostgreSQL Data Model | ✅ |
| 12 | REST API / OpenAPI | ✅ |
| 13 | Backend Implementation | ✅ |
| 14 | Frontend–Backend Integration | ✅ |
| 15 | Testing (64 tests) | ✅ |
| 16 | Code Review | ✅ |
| 17 | UI Refinement | ✅ |
| 18 | Final Validation | ✅ |
| 19 | GitHub Submission | ✅ |

---

## 📄 License

MIT
