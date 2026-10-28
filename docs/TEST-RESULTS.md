# Actual validation results (October 27, 2026)

Environment: Node.js 22.16.0, system TypeScript compiler. No reachable npm registry, PostgreSQL instance, PayMongo merchant credentials, Resend sender, or live Vercel application in the authoring environment.

**Executed and passed**

- TypeScript syntax-parsing check (global TypeScript API): **87 TypeScript/TSX files**, **0 parse errors**.
- Relative and `@/` alias source import existence check: **179 local import references**, **0 unresolved**.
- Prisma migration consistency audit: **19 Prisma model declarations**, **19 SQL tables**, no missing or extra tables.
- Executable Node.js security smoke assertions using transpiled `lib/security.ts`: **5/5 PASS** for random token, AES-256-GCM roundtrip, SHA-256 hashing, PayMongo HMAC validation, tamper/wrong-environment/stale-replay rejection.

**Not executable in this environment**

- `npm install`, `prisma generate`, `prisma migrate deploy` and database seeds (unavailable npm registry and PostgreSQL)
- ESLint and full TypeScript **type checking**, as project dependencies could not be installed
- Vitest unit/integration suite, Playwright browser tests and Next.js production build
- PayMongo test/live checkout and refund verification
- Resend email, browser push, object storage, and Vercel Cron end-to-end testing

**Do not treat static syntax checks as a passing production build.** Enable ordering only after running the exact README setup, installation, migration, provider-test and acceptance commands.
