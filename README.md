# Recruitment Application

A full-stack web application that lets job seekers submit applications to an amusement park, and lets recruiters (admins) review and manage those applications. Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **PostgreSQL**, and **Tailwind CSS v4**.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Environment Variables](#environment-variables)
5. [Local Development Setup](#local-development-setup)
6. [Database](#database)
7. [Running the Application](#running-the-application)
8. [Testing](#testing)
9. [Project Structure](#project-structure)
10. [Key Features](#key-features)
11. [Internationalisation](#internationalisation)
12. [Error Monitoring](#error-monitoring)
13. [Production Build & Deployment](#production-build--deployment)
14. [Code Quality](#code-quality)

---

## Overview

The application serves two types of users:

| Role                  | Capabilities                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Applicant**         | Register an account, log in, build a profile (competences + availability), submit a job application, reset credentials                                         |
| **Recruiter (admin)** | View all applications on a kanban board, filter by status (unhandled / accepted / rejected), inspect individual application details, update application status |

---

## Architecture

The project follows a **layered architecture** within a single Next.js monorepo:

```
Browser / Client
       │
       ▼
Next.js App Router (app/)
  ├── Pages & Layouts   – React Server Components + Client Components
  └── API Routes        – app/api/**  (Next.js Route Handlers)
       │
       ▼
Server Services (server/services/)
  ├── authenticationService  – Registration, login, credential reset
  ├── applicationService     – Application lifecycle, competences, availability
  └── adminService           – Recruiter queries, status updates
       │
       ▼
PostgreSQL
  └── Connection pool in lib/database.ts
```

Session management is handled server-side. A random token is generated on login and is stored in the `session` table as well as in a HTTP-only cookie in the clients browser.

---

## Tech Stack

| Layer                  | Technology                 |
| ---------------------- | -------------------------- |
| Framework              | Next.js 16 (App Router)    |
| Language               | TypeScript 5               |
| UI library             | React 19 + Tailwind CSS v4 |
| Component primitives   | Radix UI / shadcn/ui       |
| Forms & validation     | React Hook Form + Zod      |
| Database               | PostgreSQL 13+             |
| Error monitoring       | Sentry (`@sentry/nextjs`)  |
| Unit tests             | Vitest + Testing Library   |
| E2E / Acceptance tests | Playwright                 |
| Linting                | ESLint + Prettier          |
| Git hooks              | Husky + lint-staged        |

---

## Environment Variables

Copy the template and fill in every value before starting the application.

```bash
cp .env.example .env.local   # development
# cp .env.example .env.production  # production
```

| Variable                 | Description                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `DB_HOST`                | PostgreSQL host (e.g. `localhost` or a cloud hostname)                              |
| `DB_PORT`                | PostgreSQL port (default `5432`)                                                    |
| `DB_USER`                | PostgreSQL user                                                                     |
| `DB_PASSWORD`            | PostgreSQL password                                                                 |
| `DB_NAME`                | Database name                                                                       |
| `SESSION_SECRET`         | A long random string used to HMAC-sign session tokens. **Keep secret.**             |
| `SENTRY_DSN`             | Server-side Sentry DSN (from the Sentry project settings)                           |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side Sentry DSN (same value as above)                                        |
| `SENTRY_AUTH_TOKEN`      | Token for uploading source maps during build (from Sentry → Settings → Auth Tokens) |

---

## Local Development Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Install Playwright browsers (needed for e2e tests)
pnpm exec playwright install --with-deps

# 3. Configure environment
cp .env.example .env.local

# 4. Start the development server
pnpm dev
```

The application is available at **http://localhost:3000** as default.

---

## Database

The application uses a **PostgreSQL** database.

### Schema

The schema for the new database must be created in your PostgreSQL instance before running the application. Use the SQL-query found in `migration/existing-database.sql` as a reference for the expected table structure.

### Migrating from the Legacy Database

If you are migrating data from the old database, a Docker-based workflow is provided:

```bash
# Start a local Postgres container with the legacy database
pnpm docker:setup

# Run the migration script against your new database (reads .env.local)
pnpm migrate

# Clean up the local legacy container when done
pnpm docker:stop
```

The migration script (`migration/migration.ts`) transfers:

- **Roles** and **competences**
- **Person / user** records
- **Competence profiles**
- **Availability windows**

---

## Running the Application

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build && pnpm start
```

---

## Testing

The project has two levels of automated tests.

### Unit & Component Tests (Vitest + Testing Library)

Tests are located in `tests/units/` and cover individual services, utilities, and React components.

```bash
pnpm test:unit
```

### End-to-End / Acceptance Tests (Playwright)

Tests are located in `tests/acceptance-tests/` and run against a live instance at `http://localhost:3000`. They execute on Chromium, Firefox, and WebKit.

```bash
pnpm test:e2e
```

### Run All Tests

```bash
pnpm test   # runs test:unit then test:e2e sequentially
```

HTML reports for Playwright results are written to `playwright-report/`.

---

## Project Structure

```
├── app/
│   ├── [locale]/              # Locale-aware routes (en / sv)
│   │   ├── layout.tsx         # Root layout – header, footer, auth context
│   │   ├── page.tsx           # Home page
│   │   ├── apply/             # Applicant apply page
│   │   ├── privacy/           # Privacy page
│   │   ├── tos/               # Terms of service page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── profile/           # Applicant profile
│   │   ├── resetcredentials/  # Credential reset page
│   │   └── admin/             # Recruiter dashboard
│   └── api/                   # Next.js Route Handlers
│       ├── admin/             # Admin application queries & status updates
│       ├── application/       # Application CRUD (competences, availability, submit)
│       ├── login/             # Authenticate user
│       ├── logout/            # Invalidate session
│       ├── resetcredentials/  # Credential reset endpoints + token validation
│       ├── signup/            # Create new user
│       ├── profile/           # Applicant profile data
│       └── whoami/            # Current session info
├── components/                # Shared UI components (Header, Footer, Nav, …)
│   └── ui/                    # UI components from shadcn/ui
├── server/
│   └── services/              # Server-side business logic
├── lib/
│   ├── database.ts            # PostgreSQL connection pool
│   ├── session.ts             # Session generation & validation
│   ├── logging.ts             # Structured activity logging to DB
│   ├── api.ts                 # Client-side fetch helpers
│   ├── errors/                # Custom error classes
│   ├── schemas/               # Data Transfer Objects (DTOs)
│   └── types/                 # Shared TypeScript interfaces
├── i18n/                      # next-intl routing & request config
├── messages/                  # Translation files (en.json, sv.json)
├── migration/                 # Legacy DB migration script + SQL dump
├── tests/
│   ├── units/                 # Vitest unit/component tests
│   └── acceptance-tests/      # Playwright e2e tests
├── .env.example               # Environment variable template
├── next.config.ts             # Next.js + Sentry + next-intl config
├── playwright.config.ts       # Playwright configuration
└── vitest.config.ts           # Vitest configuration
```

---

## Key Features

### Authentication & Sessions

- Cookie-based sessions (HTTP-only, HMAC-SHA256 signed token stored in database)
- Sessions expire after 7 days
- Password hashing with bcrypt

### Applicant Flow

1. Register a user account
2. Build a profile: add/remove competences with years of experience, add/remove availability date ranges
3. Submit a job application

### Recruiter (Admin) Flow

1. View all applications in a kanban board (Unhandled / Accepted / Rejected)
2. Paginated loading with "load more" functionality
3. Open an application to see full details
4. Accept or reject an application

---

## Internationalisation

The application supports **English** (`en`) and **Swedish** (`sv`) via [next-intl](https://next-intl.dev). The locale is part of the URL path (e.g. `/en/login`, `/sv/login`). English is the default locale.

Translation strings are maintained in:

- `messages/en.json`
- `messages/sv.json`

To add a new language, add a locale entry in `i18n/routing.ts` and create the corresponding messages file.

---

## Error Monitoring

[Sentry](https://sentry.io) is integrated for error tracking via `@sentry/nextjs`. It is configured in:

- `sentry.server.config.ts` – server/edge configurations
- `sentry.edge.config.ts` – edge runtime config
- `instrumentation.ts` / `instrumentation-client.ts` – Next.js instrumentation hooks

Source maps are uploaded automatically during `pnpm build` using the `SENTRY_AUTH_TOKEN` environment variable.

---

## Production Build & Deployment

```bash
# Set all environment variables in .env.production (or via your hosting provider)
pnpm build
pnpm start
```

The `pnpm build` command:

1. Compiles the Next.js application
2. Uploads source maps to Sentry (requires `SENTRY_AUTH_TOKEN`)

The application is designed to be deployed to any Node.js-compatible hosting platform (e.g. Vercel or a self-hosted VM) with a separatly managed PostgreSQL instance.

---

## Code Quality

```bash
pnpm lint           # ESLint
pnpm format         # Prettier (auto-fix)
pnpm format:check   # Prettier
```

Pre-commit hooks (via Husky + lint-staged) automatically run ESLint and Prettier on staged `.ts/.tsx` files and Prettier on `.json/.css/.md` files before every commit.
