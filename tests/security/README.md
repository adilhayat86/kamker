# Security release checkpoint — 8 November 2026

This branch is a local implementation in progress, **not a completed production release**.
No production migration, session deletion, secret rotation, password change or deployment has been performed.

## Implemented locally

- Server-only Supabase client, no anonymous-key fallback, fail-closed production configuration.
- Fail-closed admin pages/export/middleware and production admin password verification through stored hashes only.
- Customer ownership for new companies; ownership checks on company management and requirement payments/reports. Legacy companies with random owner IDs remain admin-only until ownership is established securely.
- Public worker pages require active/non-banned records; public company/staff listings require approval.
- Private receipt references and an authorised, short-lived signed URL route, including legacy receipt link support.
- Authenticated, account-bound photo signing; private 15-minute upload intents; atomic limit of ten signatures per account per hour; Cloudinary metadata/ownership checks before attachment.
- Optional post-registration photo step, shared uploader, pending upload blocks saving, browser image compression before the final limit, HEIC/HEIF selection and Cloudinary delivery conversion, retry/failure messages.
- First-party photo attempt/failure/attachment events; webhook payload logging removed and signature validation added.
- System Health distinguishes permission/check failures from missing tables/columns/buckets.
- Reviewed security migrations enable RLS on existing and future public tables, revoke public table/sequence/function access, and protect the receipt bucket. They have only run locally.
- Next.js/eslint-config-next pinned to 15.5.29; security overrides update image/CSS dependencies. Production dependency audit reports zero vulnerabilities. Development-tool advisories remain outside that production audit.

## Evidence so far

- Official PostgreSQL 17.11 and PostgREST 16.5 installed in the chat's work/security-tools directory.
- Local database on loopback 55432, PostgREST 55433, synthetic gateway 55434. The gateway is now launched as a hidden background process so a new chat message does not terminate it. No production credentials/data used in these database tests.
- The boundary and upload-intent migrations apply successfully to a synthetic fixture with production column/relationship metadata. The access-invalidation migration also ran locally and deleted one synthetic worker session; account records remain.
- `database-boundary.sql` passes: RLS/grants for all tables, future-table protections, anonymous/authenticated denial, receipt policy restrictions, RPC execution restrictions, upload expiry/rate limit.
- `local-rest-tests.mjs` passes: direct anonymous reads/writes/RPC denied; 14 concurrent signing reservations accept exactly 10.
- 24 unit tests pass. Final production build on Next.js 15.5.29 passes, including error sanitisation and the latest photo copy.
- Browser: synthetic worker login succeeds; photo step opens at 390px; invalid file rejected; save disabled during upload; unavailable upload gives retry state; unrelated company dashboard returns 404.

The fixture is not a complete Supabase Auth/Storage stack. HTTP integration tests now pass for worker/customer signup/login, validation, optional photo landing and refresh, company ownership, wrong-owner reads/mutations, requirement reports, owner/manager management, owner-only password changes, revoked sessions, invalid admin cookies and worker recovery. Admin company-photo actor support and proxy-aware same-origin handling were fixed. A real temporary HEIC upload to the connected Cloudinary account delivered JPEG successfully; the test asset was removed. Actual private-storage signed URL access, a full successful application photo attachment and performance regression checks remain. Customer self-service recovery is not implemented by the existing application; do not claim it passed.

## Release gates still outstanding

1. Vercel connection is authorised, but its masked environment list still lacks SUPABASE_SECRET_KEY for Production. The user explicitly accepted the earlier key-exposure risk and asked to continue without further rotation requests. Do not repeat that warning or make rotation a gate. Attempts to reveal the existing provider value through the UI did not make it available to automation. Hosting still needs a valid server-only value; never use an anon fallback in this branch.
2. Protected application-table backup completed: 23 public tables, 38,999 records, 21 relationship validations, exact counts rechecked, AES-256-GCM encrypted and verified after a Windows-current-user DPAPI key recovery. Stored outside Git in the chat work/protected-backups directory, timestamp 2026-11-08T18-12-47-129Z. This is a paginated nontransactional logical application backup, not pg_dump or a storage-binary backup. Private records were never printed. Provider-managed backups are unavailable on the Free plan.
3. User must change owner/manager passwords through the secure browser handoff. Confirm stored password rows/configuration and ensure new login works before retiring all old fallback password environment variables. New code will not accept fallback passwords in production.
4. Prepare fresh signing secret and a secured deployment before maintenance. Rotate it and invalidate worker/customer sessions plus outstanding admin reset tokens during cutover; preserve worker/customer password hashes and accounts. Previously exposed hashes remain a risk despite signing out.
5. Decide and test the concrete maintenance/cutover mechanism. No production maintenance gate has been installed yet. Never restore unsafe grants as rollback.
6. `WHATSAPP_APP_SECRET` is new and absent in the known production environment names. Incoming webhook POST now fails closed without it; outbound business messages are unchanged. No live notifications should be sent during tests.
7. Complete remaining tests, inspect browser-delivered HTML/bundles for secrets/private fields, validate backup and smoke checks, then perform the agreed brief maintenance cutover and recheck Supabase advisors/direct public-key access.

## Local verification

Use only the synthetic local configuration in ignored `.env.local`. `local-rest-tests.mjs` refuses any database URL except `http://127.0.0.1:55434`.

```powershell
node --test tests/unit/*.test.mjs
node --env-file=.env.local tests/security/local-rest-tests.mjs
node --env-file=.env.local tests/security/account-flows.mjs
npm run build
```

Run database-boundary.sql through local psql with ON_ERROR_STOP. It rolls back its test mutations. The fixture SQL is for a fresh isolated database only, never production.

Original user checkout remains untouched, including pending sitemap/account-deletion/play-store changes. The old shared node_modules junction was renamed `.security-original-modules` rather than deleted; new dependencies are installed independently in this worktree.
