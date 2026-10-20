# StockFlow

A backend inventory and purchasing API built with Node.js, Express, Prisma, and PostgreSQL.

This repository implements the authenticated inventory workflow for product management, supplier management, purchase-order lifecycle tracking, stock adjustments, and stock movement history.

## What is included

- Session-based authentication with bcrypt password hashing
- Role-based access checks for admin-only actions
- Product and supplier management with soft-deletion (`isActive`)
- Purchase-order creation, ordering, receiving, canceling, and updates
- Inventory adjustment workflow with negative-stock protection
- Stock movement ledger for audit and traceability
- Automated API tests using Vitest and Supertest
- Prisma ORM schema and migration support

## Stack

- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Zod validation
- Vitest + Supertest

## Repository structure

- `src/app.ts` – Express application setup and route registration
- `src/middleware/auth.ts` – session and role enforcement
- `src/modules/*` – domain logic for auth, products, suppliers, purchase orders, adjustments, and stock movements
- `src/tests/*` – API integration tests
- `prisma/schema.prisma` – database schema
- `docs/API.md` – implementation-aligned API documentation

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from the template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Update `.env` with your PostgreSQL connection URL and local settings.

Example:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockflow?schema=public"
CORS_ORIGIN="http://localhost:3000"
```

Notes:

- `DATABASE_URL` is required for Prisma and the application runtime.
- `CORS_ORIGIN` is optional; if left unset, the app will not enable cross-origin access.
- The API uses a cookie-based session, so browser clients should be configured to send credentials.

4. Apply the database schema:

```bash
npx prisma migrate dev
```

If you want a quick schema sync in a development DB, Prisma push is also acceptable:

```bash
npx prisma db push
```

5. Start the application:

```bash
npm run dev
```

The server listens on the configured `PORT` value, defaulting to `4000`.

## Authentication model

The app uses a signed session token stored in a browser cookie named `stockflow_session`.

Typical flow:

1. `POST /api/auth/login` with valid email/password
2. Server stores a hashed session token in PostgreSQL
3. Browser receives the cookie from the response
4. Protected endpoints read `stockflow_session` and verify the session
5. `POST /api/auth/logout` invalidates it and clears the cookie

The app currently supports the following roles:

- `ADMIN`
- `STAFF`

Admin-only routes are used for privileged actions such as deleting products or suppliers and cancelling certain purchase orders.

## API overview

The primary API areas are:

- `/api/auth` – login, session, logout
- `/api/products` – product CRUD
- `/api/suppliers` – supplier CRUD
- `/api/purchase-orders` – order lifecycle and receiving
- `/api/stock-adjustments` – inventory corrections
- `/api/stock-movements` – movement history and audit trail

The full implementation-aligned contract is documented in [docs/API.md](docs/API.md).

## Testing

The project includes automated API tests with Vitest and Supertest.

Run the suite:

```bash
npm test
```

Run type checking:

```bash
npm run typecheck
```

Create a production build:

```bash
npm run build
```

## Production considerations

This is a working backend implementation intended for a controlled portfolio environment. The following caveats are important:

- The app expects a real PostgreSQL database and a valid `DATABASE_URL`.
- Session cookies are `HttpOnly` and `SameSite=Lax`; they use `Secure` in production.
- The API is intentionally scoped to a backend inventory workflow rather than a broad multi-tenant SaaS platform.
- The app does not include a public user registration flow by default; user creation is expected to be handled in a controlled admin environment.
- The test suite creates and uses a dedicated temporary database rather than altering the primary app database.

## License

This project is intended for portfolio and internal demonstration use.
