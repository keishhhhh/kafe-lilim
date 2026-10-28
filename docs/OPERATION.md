# Operational runbook

## Order lifecycle

`PAY_AT_PICKUP`: `CONFIRMED / UNPAID` → `PREPARING` → `READY_FOR_PICKUP` → `COMPLETED / PAID`. Staff must explicitly record collected cash, which updates `Payment` and `Order` atomically. Duplicate attempts are rejected.

`GCASH`: `PENDING_PAYMENT / PENDING` → provider confirms signed paid event → `CONFIRMED / PAID` → `PREPARING` → `READY_FOR_PICKUP` → `COMPLETED`.

Order cancellation is permitted from live preparation states and releases active reservations once. Paid cancellations set `refundRequired`. An ADMIN may request a provider GCash refund or record already-returned cash through a separate audited refund action. A GCash refund counts as completed only after the provider reports success. Neither an API timeout nor an unverified refund request is treated as returned funds.

## Incident handling

- **Delayed payment webhook**: do not use the customer success page as payment proof. Check provider dashboard for order reference, event history, amount, and session. Retry provider events or reconcile manually using provider evidence.
- **Checkout abandoned**: use the staff Expire action only after safe provider confirmation; if provider rejects expiry, investigate pending/paid state before releasing stock. Provider checkout stays active indefinitely until explicitly expired.
- **Low stock or concurrent checkout**: atomic conditional update prevents reserving unavailable units. Reload menu and adjust stock through the staff portal.
- **Ready email failed**: order status remains ready. Check Resend API key/domain and `Notification.lastError`. Use dashboard Retry or trusted scheduled job.
- **Push not arriving**: check browser support and permission, VAPID values, HTTPS, service worker registration, subscription cleanup; email remains main channel.
- **Paid cancellation / refund**: an administrator uses the Refund action on the cancelled order. For GCash, record the provider refund ID and verify its status in PayMongo. For cash, physically return money before choosing Confirm returned cash. Refund ledger entries with `SUCCEEDED` status reduce net collected sales on the date completed. A refund in `REQUESTED`, `PENDING`, or `PROCESSING` must not be counted as returned. If a request times out or its provider ID is missing, stop and manually reconcile with PayMongo before another request to avoid duplicate refunds. Provider-test validation is required before launch.
- **Backups**: schedule managed PostgreSQL point-in-time backups, restrict database access, test restore before launch and regularly thereafter.

## Privacy and operations

Order tracking tokens are capabilities. Treat URLs as sensitive, remove tracking links from third-party analytics and logs, and avoid sharing screenshots of order details. Restrict staff export permissions to administrators. Staff access is separate from guest checkout. Implement an approved retention and deletion plan before handling production customer data.

## Release checks

Run lint, typecheck, unit tests, a clean migration on an empty staging database, a production build, and Playwright tests against an isolated seeded store. Send test signed PayMongo webhooks (valid, invalid, replay, wrong currency, duplicate payment), verify mail/push on real devices, verify webhook URLs are public, check refunds before launch, and exercise a backup restore.
