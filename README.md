# Kafe Lilim · Pickup Ordering Platform

**Status: application source prepared for local installation and provider configuration; NOT certified for production.**

Kafe Lilim is a real Next.js App Router / React / TypeScript café ordering application: guest pickup, menu modifiers, persistent cart, PostgreSQL inventory and orders, secured staff sessions, PayMongo Hosted Checkout integration, tracking, Resend email, optional Web Push, and transactional analytics. Demo content is visibly marked. There are no sample sales inserted into the production database.

**Important release gate:** Dependencies, PostgreSQL, PayMongo merchant account, Resend sending domain, Vercel Blob, and VAPID credentials must be configured before external acceptance tests or go-live. Code was written without network access to npm, so no claim of a passing production build is made in this handoff. See `docs/ACCEPTANCE.md`.

## Architecture

- Next.js 15 App Router and server-side Route Handlers; TypeScript strict mode, Tailwind and accessible native controls; client-side cart persists in `localStorage`.
- PostgreSQL and Prisma, normalized entities and versioned initial SQL migration. Monetary values are stored and calculated as integer centavos.
- Staff-only session authentication with Argon2id, random sessions stored as SHA-256 hashes in PostgreSQL, HttpOnly cookies, origin verification, Postgres login rate limiting and server-side staff / administrator roles.
- `createOrder()` performs authoritative price/modifier validation, pickup-slot checks and atomic inventory reservations. Checkout uses `Serializable` transactions, conditional stock decrements, unique idempotency keys and immutable order-item snapshots.
- Guest tracking uses cryptographically random opaque tokens. Only token hashes are indexed; AES-256-GCM encrypted tokens are retained server-side to send order-update links.
- GCash uses PayMongo `/v2/checkout_sessions`, backend secret, provider-signed raw-body webhook (timestamped HMAC), event ID deduplication and merchant payment reference / amount / currency checking. Redirects **never** confirm payment.
- Delivery requests to Resend and browser Web Push are recorded in a database-backed outbox. The ready-for-pickup staff action commits the status then attempts notifications; retry is available via authenticated endpoint and scheduled job.
- Day boundaries use `Asia/Manila`; timestamps persist in UTC. Pay-at-pickup is counted as collected revenue only after actual cash collection is recorded.

## Local installation

Requirements: Node.js 22+, npm, a PostgreSQL database, and a test-mode set of provider credentials for provider testing.

```bash
# Extract the project zip, then:
cd kafe-lilim
npm install
cp .env.example .env.local
```

Enter an actual PostgreSQL connection string in `DATABASE_URL` and `DIRECT_URL`, and use a random 32-byte hex key for `APP_ENCRYPTION_KEY`:

```bash
openssl rand -hex 32
```

Next.js reads `.env.local`, but Prisma CLI and standalone `tsx` scripts may require exports from it. In your shell:

```bash
set -a; . ./.env.local; set +a
npm run db:generate
npm run db:deploy
npm run db:seed
```

Create the first administrator with a strong secret entered without echoing it:

```bash
read -rp "Admin email: " ADMIN_EMAIL
read -rsp "Admin password (14+ characters): " ADMIN_PASSWORD; echo
export ADMIN_EMAIL ADMIN_PASSWORD
npm run staff:init
unset ADMIN_PASSWORD ADMIN_EMAIL
```

Run the development server, then open `http://localhost:3000` for customers and `http://localhost:3000/staff/login` for staff.

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

For Prisma schema changes, run `npm run db:migrate` on development only, review the generated SQL, and commit migrations. **Production uses `npm run db:deploy`, never `db push` or a destructive `migrate reset`.**

Once `npm install` resolves successfully, commit its `package-lock.json` and replace CI's `npm install` with `npm ci` for fully locked installs. A package lock is not included because dependency resolution was unavailable during generation.

## Business configuration

- Seed creates twelve clearly marked demo menu items, variants, sample inventory quantities, and warm stock photography URLs. **Ordering defaults to OFF** until a real pickup address, actual email, business hours and store acceptance flag are saved from `/staff/settings`.
- Update actual image/license, brand name, logo, social links, description, closures, pickup instructions, price and opening hours. Live merchant content has not been verified.
- For managed images, configure `BLOB_READ_WRITE_TOKEN`. Staff can upload PNG, JPEG and WebP images under 4 MB in Menu Management.
- Menu managers add/edit/archive/restore products. Archiving protects historical order snapshots. Modifiers may be added or removed through the staff UI; existing orders retain modifier descriptions and prices.
- Stock numbers represent **unreserved units**. Reserved units are held separately and consumed when the order is completed or restored on cancellation. Staff stock adjustments cannot modify reserved quantities.

## Payment and messaging

### PayMongo

1. Create/activate the merchant account and request GCash acceptance, including applicable KYC. Use test credentials first.
2. Add `PAYMONGO_SECRET_KEY` to the **server-side** environment and `APP_URL` to the exact HTTPS origin.
3. Register `POST https://YOUR-DOMAIN/api/payments/paymongo/webhook` in PayMongo, subscribing to `checkout_session.payment.paid` and `refund.succeeded` where those events are available for the account. Verify actual available refund event names in the provider dashboard before activation. Save that webhook's own signing secret as `PAYMONGO_WEBHOOK_SECRET`.
4. Perform signed provider sandbox payments and confirm an order cannot become `PAID` via a redirect alone. Verify replayed / delayed / out-of-order events. Confirm active session expiry behavior against the merchant environment.
5. Keep test and live keys completely separate. No screenshot-based settlement or customer-supplied payment confirmation is accepted.

**Payment abandonment:** Checkout sessions do not expire automatically. Staff can use *Expire pending GCash* to call the provider expiry endpoint. Inventory releases only when PayMongo confirms expiry. If provider reports processing/paid, the order stays reserved pending reconciliation. The background job attempts authoritative reconciliation and safe provider-confirmed expiry for sessions older than 90 minutes, but the default daily Vercel Cron timing is insufficient for timely release. An administrator-only refund initiation flow and refund ledger are included, but real PayMongo refund outcomes must be validated against test/live merchant credentials. Uncertain provider outcomes are left for manual reconciliation, not marked refunded. Checkout expiry timing remains a launch concern for higher-order-volume production use.

### Email and push

- Configure `RESEND_API_KEY`, a verified `EMAIL_FROM`, a public `APP_URL`, and test mail delivery. Missing credentials result in failed outbox jobs with recorded error state, not imaginary sent messages.
- Generate valid VAPID keys, set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and enable browser notification permission by clicking the tracking-page button. Browser support varies; Apple web push may require adding the PWA to the Home Screen.
- A Vercel daily UTC cron calls `/api/jobs/run` with its `CRON_SECRET`; this is a durable backstop, **not** a near-real-time retry SLA. The staff ready operation attempts delivery immediately. For frequent retries, configure an external trusted scheduler to call the same endpoint every few minutes, within provider/Vercel plan limits.
- Staff can click *Retry due notifications* on the dashboard. Service delivery status is visible with orders; no email/SMS/notification is claimed delivered without provider success. SMS is not implemented.

## Deployment on Vercel

1. Create a private GitHub repository. From the unzipped project directory:

   ```bash
   git init
   git add .
   git commit -m "feat: initial Kafe Lilim ordering platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_ACCOUNT/kafe-lilim.git
   git push -u origin main
   ```

2. Import the GitHub repository in Vercel as a Next.js project. Configure Node.js 22 and a **production** PostgreSQL instance (e.g. Neon) with pooled `DATABASE_URL` and unpooled `DIRECT_URL`.
3. Enter all required production secrets in Vercel project Environment Variables (`.env.example`). Do not commit `.env.local`; ensure `APP_URL` matches the live HTTPS site.
4. Run `npm run db:deploy` via a controlled release job or temporary environment with access to the production DB, then `npm run db:seed` and `npm run staff:init` with secure credential entry. Recheck demo data and business settings.
5. Configure Vercel Blob, Resend domain, PayMongo live GCash permissions and webhook, VAPID keys and cron secret. For critical outbox retries, provision the separate job runner described above.
6. Connect the actual domain, verify HTTPS, security headers, webhook delivery, email deliverability, push device support, protected staff APIs, cancellations, inventory, live payment reconciliation and backup/restore on a staging environment.
7. Enable pickup orders only after all external verification gates pass and the shop's address, contact details, preparation slots and policies are approved.

## Security / operational practices

Maintain separate test and live PostgreSQL databases, webhook secrets, email keys and provider keys. Rotate keys via provider dashboards; key rotation of `APP_ENCRYPTION_KEY` will invalidate stored encrypted tracking tokens without a migration/dual-key plan. Keep backups encrypted and test restore. Restrict access to deployment secrets and DB administrative users. Apply dependency/security updates and audit API traffic. Review data retention and final privacy / terms documents with the owner before launch.

**Known gaps:** Provider refunds and refund webhook/ledger are source-implemented but untested against PayMongo test/live accounts; uncertain refund requests require administrator review. Provider payment reconciliation/expiry needs live verification; subdaily scheduling, SMS, full WCAG audits, controlled external E2E and verified live merchant payment flows remain incomplete or untested. See `docs/ACCEPTANCE.md` and `docs/OPERATIONS.md`.
