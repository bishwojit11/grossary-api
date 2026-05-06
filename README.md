# Grosery Backend API

Production-style Node.js + Express + TypeScript backend for grocery inventory and booking, with role-based authorization, JWT auth, refresh token rotation, password recovery, and PostgreSQL via Prisma.

## Features

- Role model: `ADMIN`, `USER`
- Admin grocery management:
  - create item
  - list items
  - update item details
  - update inventory
  - remove item (soft remove / inactive)
- User capabilities:
  - view available grocery list
  - place multi-item booking in a single order
- Auth:
  - registration / login
  - short-lived access token
  - refresh token rotation (httpOnly cookie)
  - logout (refresh token revocation)
  - forgot/recover/reset password flows
- Security hardening:
  - bcrypt password hashing
  - hashed token storage for refresh/reset tokens
  - request validation with Zod
  - rate limits for login and forgot-password
  - helmet + CORS

## Tech Stack

- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- CASL (authorization)
- Docker / Docker Compose

## Project Structure

- `backend/` - API service
- `backend/prisma/` - schema + migrations
- `docker-compose.yml` - local container orchestration

## Environment Variables

Create `backend/.env` from `backend/.env.example`.

Required keys:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Common keys:

- `JWT_ACCESS_EXPIRES_IN` (default: `8h`)
- `JWT_REFRESH_EXPIRES_IN` (default: `30d`)
- `PASSWORD_RESET_EXPIRES_MINUTES` (default: `15`)
- `BCRYPT_SALT_ROUNDS` (default: `12`)
- `PORT` (default: `4000`)

## Local Development

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate:dev
npm run dev
```

Build for production:

```bash
cd backend
npm run build
npm start
```

## Docker Run

From repository root:

```bash
docker compose up --build
```

If your Docker uses legacy compose:

```bash
docker-compose up --build
```

Services:

- API: `http://localhost:4000`
- Postgres: `localhost:5432`

## API Base URL

`/api/v1`

### Auth Endpoints

- `POST /auth/registration`
- `POST /auth/login`
- `POST /auth/refresh-token` (uses `refreshToken` cookie)
- `POST /auth/logout` (uses `refreshToken` cookie)
- `POST /auth/forget-password`
- `POST /auth/recover-password`
- `POST /auth/reset-password` (requires bearer access token)

### Grocery Endpoints

Public:

- `GET /groceries`

Admin:

- `POST /admin/groceries`
- `GET /admin/groceries`
- `GET /admin/groceries/:id`
- `PATCH /admin/groceries/:id`
- `PATCH /admin/groceries/:id/inventory`
- `DELETE /admin/groceries/:id`

### Order Endpoints

- `POST /orders` (book multiple items)
- `GET /orders`
- `GET /orders/:id`

## Auth Flow (Recommended Client Behavior)

1. Login or registration returns `token` (access token) and sets `refreshToken` cookie.
2. Send access token as `Authorization: Bearer <token>` for protected endpoints.
3. On access token expiry, call `POST /api/v1/auth/refresh-token`.
4. Server rotates refresh token cookie and returns a new access token.
5. On sign-out, call `POST /api/v1/auth/logout`.

## Notes for Production

- Replace all placeholder secrets with long random values.
- Configure trusted CORS origins (not wildcard behavior).
- Add real email provider for forgot-password delivery.
- Set `NODE_ENV=production` so secure cookie flags are enforced.
