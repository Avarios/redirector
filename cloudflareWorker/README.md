# Redirector Cloudflare Worker

A URL redirector service built for Cloudflare Workers using D1 database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create D1 database:
```bash
npm run db:create
```

3. Update `wrangler.toml` with your database ID from the previous command.

4. Run database migration:
```bash
npm run db:migrate
```

5. Start development server:
```bash
npm run dev
```

## Usage

### Create a redirect
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Use the redirect
Visit the returned subdomain URL to be redirected to the original URL.

## Deployment

```bash
npm run deploy
```

## Free Tier Limits

This worker should stay within Cloudflare's free tier limits:
- 100,000 requests/day
- D1: 5GB storage, 25M row reads/day
- 10ms CPU time per request