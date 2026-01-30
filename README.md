# Recruitment Application

## Requirements

- Node.js 18.18+ (20 LTS recommended)
- pnpm 9+

## Setup

```bash
pnpm install
pnpm exec playwright install --with-deps  # Needed for local testing
```

### Environment variables

Copy the template and fill in Sentry values.

```bash
cp .env.example .env.local
# edit .env.local
```

## Development

```bash
pnpm dev
```

Visit http://localhost:3000/sentry-example-page to play around with Sentry.

## Quality checks

```bash
pnpm lint
pnpm test              # Run all tests
pnpm test:unit         # Run unit tests only (Vitest)
pnpm test:end2end      # Run e2e tests only (Playwright)
```

## Production build

```bash
pnpm build
pnpm start
```
