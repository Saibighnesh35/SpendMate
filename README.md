# SpendMate

SpendMate is a student-first expense tracker that makes manual entry fast, treats payment screenshots as private evidence, and turns a saved transaction ledger into clear monthly insight.

## What is included

- Next.js 16, TypeScript, Tailwind CSS, accessible responsive UI, and Recharts.
- A fast manual entry flow, credit/debit semantics, edit/delete, search/filter, custom categories and payment methods, duplicate warning, dashboard, insights, and monthly report.
- Screenshot capture and review UX. The MVP uses an intentionally isolated placeholder OCR boundary: no OCR value is saved without user confirmation.
- A production Supabase migration with UUIDs, integer paise amounts, private storage, indexes, and per-user RLS policies.
- Deterministic analytics and duplicate-detection tests.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without Supabase variables the site runs as a clearly labelled browser-local preview, with functional sample data after signup. This lets designers and developers verify all primary UI flows without exposing credentials. Configure Supabase before deploying; production authentication, storage, and data persistence must not use the preview store.

## Supabase setup

1. Create a Supabase project and enable email/password authentication.
2. Add the project URL and anonymous key to `.env.local`; keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
3. Link the project using the Supabase CLI and run `supabase db push` to apply `supabase/migrations/202608250001_initial_schema.sql`.
4. Create no public bucket. The migration creates a private `transaction-screenshots` bucket whose object path begins with the authenticated user UUID.
5. Add server-side API handlers for the chosen OCR provider. The extraction response should be normalized, validated, and shown in the review screen before creating a transaction.

## Architecture

The web app is the first client of a reusable backend:

```text
Web / future mobile client -> authenticated API boundary -> Supabase Postgres + private Storage
                                                    -> OCR provider adapter (async in production)
```

The canonical ledger is `transactions`. Dashboard values, category/payment analysis, insight text, and optional cached `monthly_summaries` must be reproducible from active ledger records. Currency uses `amount_minor` (`₹350.50` = `35050` paise), never floating point. A deleted record is excluded from analytics.

## API contract to implement with Supabase/server routes

- `POST /api/v1/transactions`, `PATCH/DELETE /api/v1/transactions/:id`
- `GET /api/v1/transactions` with cursor pagination and search/filter parameters
- `GET /api/v1/dashboard/monthly?month=YYYY-MM`
- `GET /api/v1/insights?month=YYYY-MM`
- `POST /api/v1/uploads` and `POST /api/v1/ocr/jobs`
- `GET /api/v1/categories`, `POST /api/v1/categories`
- `GET /api/v1/payment-methods`, `POST /api/v1/payment-methods`

Every write must derive `user_id` from the authenticated server context. Do not accept it from a client request. Use idempotency keys for transaction and upload retries. Issue signed attachment URLs only after authorization checks.

## Tests and verification

```bash
pnpm test
pnpm build
```

The tests cover exact credit/debit/net aggregation, category aggregation, soft-delete handling, duplicate detection, and monetary parsing. Before production, add Supabase integration tests that assert User A cannot read User B’s rows or screenshot object paths, plus Playwright coverage of mobile layouts and the screenshot review journey.

## Scope decisions

The supplied PRD requested screenshot OCR and the architecture document recommends an asynchronous worker. For this web MVP, the user-approved requirement allows a mock/isolated OCR layer, so the UI implements secure upload/review and leaves provider extraction explicitly unimplemented rather than faking financial results. Budgeting, notifications, recurring transactions, bank/UPI synchronization, and automated imports remain post-MVP per the phase plan.

## Deployment

Deploy the Next.js app to Vercel, configure the public Supabase values there, and store service/OCR credentials only in server-side environment variables. Apply migrations in CI or through a protected release step. Enable structured, redacted server logging, rate limits on authentication/uploads, and an object-storage lifecycle policy for screenshots.
