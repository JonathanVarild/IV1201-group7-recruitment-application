# Recruitment Application


## Requirements
- Node.js 18.18+ (20 LTS recommended)
- pnpm 9+

## Setup
```bash
pnpm install
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
```

## Production build
```bash
pnpm build
pnpm start
```
