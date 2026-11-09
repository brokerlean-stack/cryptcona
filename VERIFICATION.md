## Live email delivery verified (2026-11-09)

At the owner's explicit request, created a disposable Mail.tm inbox and sent an authorized delivery test through the application's actual mail template/helper and configured Resend key. Sender: support@cryptcona.pro. Resend accepted the message, and the destination inbox received it. Verified the received sender, subject and unique marker in the message body. Delivery evidence: test-results/email-delivery.json. No customer accounts or password-reset tokens were used. The inbox service returned an intermittent response error during the first accepted test; a follow-up test confirmed actual receipt. Two emails were accepted by Resend in total. This establishes delivery to this temporary inbox, not inbox placement for every mail provider.

The test helper is scripts/test-email-delivery.cjs and requires the explicit --send flag. Inbox passwords/tokens stay in memory; API keys stay in .env.local. Mail.tm: https://mail.tm/.

## Clickable avatar and deployment preparation (2026-11-09)

The initial/photo avatar now opens the image picker and shows a camera affordance. Saving updates the session name and photo immediately. A shared UserAvatar renders saved ImageKit pictures in the account header, admin clients and admin chat lists, with initials if an image fails to load.

Validation: 38 automated tests passed; the Next.js 16.4.5 production build passed; full browser integration passed, including clicking the avatar to choose a photo, save/reload persistence, immediate header update, authentication, payments, lot/amount trades, and customer/admin layouts at 320/390/768/1024 px. Live ImageKit read access, MongoDB health and the market-reference feed were verified. No live account orders or emails were submitted.

Deployment configuration/artifact checks passed. Production dependency audit reports zero vulnerabilities after package updates. Eight moderate development-tool advisories remain in the ESLint/typescript-eslint minimatch chain; resolving them with npm's suggested forced downgrade was deliberately avoided. These packages are not production dependencies.

The sender is configured privately as Cryptcona Broker <support@cryptcona.pro>. The updated Resend key has sending-only permissions, so domain verification and email delivery remain unverified. Hosting and DNS have not been deployed. See DEPLOYMENT.md. Standalone packaging removes local environment files; runtime secrets must be supplied by the host.

## Lot and amount sizing (2026-11-08)

Removed the fixed lot maximum and three-decimal lot restriction from the active account trading engine. Added an account-currency amount mode with server-side lot derivation and exact currency-rounded margin reservation. Client-provided lots do not override amount orders. Tests cover 1,000-lot execution, 1,001.12345-lot validation, amount-to-lot conversion, USD/NGN/BTC precision, invalid inputs, insufficient balances, duplicate request protection, close/P&L reconciliation and concurrent spending protection. All 38 automated tests and the production build passed. Browser order checks confirmed lots above one, no HTML maximum, amount sizing in NGN with exactly 123.45 reserved, and successful close/settlement. Mobile screenshot: test-results/amount-sizing-mobile.png.

## Chart outage recovery (2026-11-08)

Reproduced the stopped chart: upstream requests timed out and the saved reference exceeded the former 60-second cutoff. Added Coinbase reference fallback, nonblocking refresh during a disclosed 24-hour cached-reference window, reference age/source display and stalled-stream reconnection. Outage, expiry, recovery, backup validation and shared-tick tests pass. Production build passed. Read-only authenticated preview check observed 16 distinct chart paths and 16 prices over approximately nine seconds, with no browser errors and no orders submitted. Screenshot: test-results/chart-recovery.png.

## Currency fallback and editable profiles (2026-11-08)

- Fiat conversions try Frankfurter with a 2.5-second timeout, then the keyless ExchangeRate-API provider with a 3.5-second timeout. Backup responses are shared across currencies and cached for one hour. Previously fetched valid rates remain usable during transient outages for up to seven days from their reference date; expired or invalid rates are rejected.
- Failed browser FX requests retry after five seconds. A failed refresh no longer displays an orders-paused error when a usable conversion exists. Currency changes discard the previous currency conversion. No fixed or fabricated conversion rate is substituted.
- Signup no longer automatically marks identity verification as complete. Existing accounts marked verified without identity documents can submit them for review. The admin review shows the phone number.
- Profile & KYC now supports editing full name and international phone number, plus a validated PNG/JPEG/WebP photo (1 MB) stored through ImageKit. KYC requires name and phone and keeps identity documents private; repeat pending/verified submissions are rejected.
- Production build and 37 automated tests passed. The browser fixture deliberately fails the primary FX provider to exercise fallback trading and includes profile persistence, photo upload, phone validation and verification checks.

# Verification - 8 November 2026

## Random price movement anchored to live references

- Restored visible generated up/down movement in 500 ms steps, bounded to +/-4% of the live Kraken reference. Chart, position P&L and server fills now use the same shared path. Live reference and band appear beside the price.
- Persisted the feed and its latest 240 ticks in MongoDB with compare-and-swap updates; concurrent clients/instances share one accepted tick. Generated prices pause when the reference is over 60 seconds old. Market movement is independent of orders and users.
- All disclosure labels and mechanics remain in `src/components/Demo.tsx`. The settings are in `src/lib/anchoredPriceMath.ts`; there is no fixed win rate.
- Build and 34 tests passed, including 10,000 bounded price steps, both directions, shared ticks across instances and stale-reference freezing. The browser suite passed trading/balance reconciliation, timer/manual exits, delayed-FX loading, navigation reuse and responsive layouts.
- Live preview check: 24 ticks in 12.5 seconds, 11 upward moves and 12 downward moves, every price within the band, no runtime errors. Trading UI ready in 526 ms. Desktop/mobile screenshots reviewed. No trade was submitted against the configured account.

Earlier sections describe superseded raw-market chart behavior.

## Loading performance, streamed ticks and disclosure component

- Added Kraken ticker WebSocket subscriptions for all five instruments, reconnect/backoff, hidden-tab suspension and REST fallback. Updates are batched at 250 ms and live charts contain only actual received quotes. Historical chart results are cached between instrument changes. Fill prices remain server-validated.
- Account data now persists in a shared dashboard provider, so page navigation reuses the current account state. No-position balance reads no longer await upstream market/FX requests. Snapshot queries are combined into one aggregation and overview no longer fetches the expensive dashboard statistics endpoint.
- All disclosure copy, including the accessibility close label and profile-credit API error, lives in `src/components/Demo.tsx`. React UI uses `<Demo />`; non-React string consumers use its `demoCopy` export. The disclosure source scan passed.
- Build and all 32 regression tests passed. Browser checks verified streamed price updates, rendering before a deliberately delayed FX response, account data reuse across navigation, existing trading/payment flows and mobile layouts.
- Measured configured local account: trading ready improved from 1,152 ms to 451 ms; warm account request from 523 ms to 167–197 ms. Isolated navigation check returned to trading in 66 ms with zero additional account fetches. These are local observations, not deployment guarantees.
- Authenticated production-preview check received 22 real streamed ticker messages with zero browser runtime errors. No trade was submitted. Local port 3100 now uses the built production preview; `npm run preview` starts it after a build.

## Market prices and shared account ledger

- Replaced active browser-generated prices and seeded capital with Kraken public quotes and account-backed simulated positions. Public market pages use the same quotes. BTC, ETH, SOL, EUR and GBP are supported against USD, with one-minute Kraken chart history.
- Verified real public API calls for all five quotes, BTC/EUR chart history and Frankfurter NGN conversion. No market API keys were added. Fiat reference conversions are daily; EUR/GBP/BTC use exchange quotes. All positions fix their account-currency conversion at entry.
- Wallet, overview and trading now read the same available balance. Opening reserves margin atomically; settlement returns margin plus P&L once. Portfolio value explicitly adds reserved margin and unrealized P&L. Old local sample data is not imported.
- Thirty regression tests passed, including transaction rollback, duplicate order and close requests, cross-user access, concurrent insufficient-funds orders, withdrawal-versus-trade races, NGN P&L and stale/malformed quote rejection.
- Browser checks passed for account balance equality across routes, actual provider-shaped quotes, lot sizing, timed/manual exits, persisted history, CSV export, signup currencies, themes and responsive layouts. Tests use a separate MongoDB replica set and a process-only provider mock.
- Authenticated read-only local-preview check passed against the configured database and real market APIs: all five instruments present, account ledger available, chart rendered and no browser runtime errors. No trade, deposit or withdrawal was submitted in the configured account.
- Timing limitation: no background worker. Expired orders/stops/limits settle on the next fresh quote during an account-screen refresh. This is disclosed in the UI and README. Execution remains simulated.

Earlier verification entries describe superseded local-simulation behavior.

## Account overview and signup currency

- `/dashboard` now has its own overview with balances, pending requests, quick actions and filterable payment/trade activity. `/dashboard/trading` retains the trading workspace.
- Regular login, signup and verification redirect to trading. Admin login continues to its admin page.
- Practice account amounts and CSV profit use the signup currency with disclosed fixed illustrative rates; instrument quotes and the underlying USD engine remain consistent. Backend wallet amounts are not converted again.
- Production build and all 27 regression tests passed. Desktop and mobile overview screenshots were reviewed. Browser coverage includes NGN login, GBP signup, activity filters, withdrawal shortcuts and responsive account/admin pages.
- The full isolated browser suite passed, including signup-to-trading, account currency display and layouts at 320, 390, 768 and 1024 pixels. Local preview responded successfully on port 3100.

## Shared disclosure and local trading workspace

- Added `src/components/Demo.tsx` and replaced inline disclosure text with imports across the workspace, navigation, footer, registration, terms, wallet, copy-profile cards and admin profile panels.
- Added the local simulation engine with synthetic prices, lot sizing, posted margin, long/short P&L, timed exits, stop-loss/take-profit handling, pause/resume, persisted history, CSV export and reset. Practice trades do not change the backend account balance.
- All 25 regression tests passed. Browser checks passed for timed settlement, pauses, lot sizing, manual exits, persistence, themes, export, reset, account-balance isolation and responsive layouts at 320/390/768/1024 pixels.
- Reviewed desktop dark/light screenshots and the responsive results. The separate unfinished simulator scaffold was removed; implementation remains in the existing project.
- The original wallet Deposit/Withdraw page was subsequently restored at the user's request. Its previous request handlers and visual flow are retained, with the shared disclosure component added.
- The restored-wallet browser suite passed. Corrected its available-balance lookup to read the account response instead of the payment-method response. Final production build and live read-only wallet checks passed: both tabs, correct balance, no runtime errors, and 320/390/1440px layouts. No live deposit or withdrawal was submitted.

Earlier verification entries below describe previous iterations.

## Latest correction: serialization and demo removal

- Removed all 50 demo profiles and all 50 associated ImageKit avatars. Verified zero remaining demo profiles. No accounts were selected on those profiles; balances and transaction history were unchanged.
- Removed the demo seed script and command to prevent accidental recreation.
- The full admin props tree is converted to JSON primitives before crossing the Server/Client Component boundary, including nested ObjectIds, dates, populated documents and Mixed settings. Password hashes and reset/verification tokens are excluded from the user query.
- All 17 regression tests passed, including a new nested-BSON serialization test.
- Production build passed. After restarting the local preview, authenticated Overview and Clients pages rendered with no serialization warnings or browser runtime errors. The live profile API returned zero demo profiles.

The historical demo creation checks below describe the previous state; those demo records have now been removed.

## Account labels, goals, demo profiles and responsive layouts

- Customer credit labels now read Account credit, with manual-source details retained. Account-team wording replaces customer-facing administrator labels; staff navigation and internal audit methods retain their roles.
- Optional signup goals record terms consent. Integration tests cover goal validation, net results (payout minus stake), active-goal locking, disabling, resetting after reaching a goal, and existing accounts without stored goal fields. An incomplete goal did not prevent a valid withdrawal.
- Demo copy activation works; crediting a demo profile is rejected and leaves the balance unchanged. Randomized funded-trade execution now returns 503 without moving funds. Paid withdrawal-code instructions were removed.
- Exactly 50 fictional demo profiles were created in the configured database, with illustrated ImageKit avatars and sample positive/negative results. A repeated seed run skipped all 50 and created no duplicates.
- Live authenticated preview verified all 50 profiles, rendered ImageKit avatars, and the admin page. Screenshots: test-results/live-demo-mobile.png and live-demo-desktop.png.
- Browser layout checks passed at 320, 390, 768 and 1024 pixels across dashboard, history, wallet, copying, profile, settings, subscriptions, chat, trading, and all seven admin tabs. This is sampled responsive testing, not a claim to cover every device.
- Final production build passed. All 16 regression tests and the extended browser suite passed; a subsequent admin serialization fix also passed the build and live admin rendering check.

## ImageKit integration

- Credentials are stored only in ignored .env.local; no private key is included in source or .env.example.
- Live ImageKit upload/delivery checks passed: public image HTTP 200, unsigned private image HTTP 403, signed private image HTTP 200. Both temporary verification files were deleted afterward.
- Live database inspection found zero legacy Base64 image records in copyprofiles, messages, and user identity fields, so no migration was needed.
- Production build and 16 regression tests passed, including signature/type/size validation, missing-configuration handling, public profile uploads, and private support/identity references.
- Local development server restarted to load ImageKit credentials.
- Browser integration checks passed with the ImageKit provider mocked: trader photo creation/editing, support images in both directions, identity uploads, owner/admin viewing, anonymous and unrelated-user denial, and rejection of invalid uploads. Existing authentication, payment, exact-profit and copy-trading browser checks also passed.

## Account and copy trading checks

- Production build and all 12 payment, profit, and copy-profile regression tests passed.
- Browser checks passed using disposable MongoDB accounts: profile photo upload, creation/editing, user activation/switch/stop, weekly performance, exact credits, concurrent retry protection, and stale-session/paused-profile rejection.
- Copy-trading desktop/mobile screenshots reviewed; tested pages have no horizontal page overflow.
- Domain references updated to cryptcona.pro. Production NextAuth URL configured and a fresh secret generated in ignored .env.local. Development callbacks use localhost:3100.
- Supplied credentials moved from .env.example to ignored .env.local; example file sanitized.
- Live administrator provisioning succeeded after moving the user's corrected database settings from .env.example into .env.local. Database verification confirmed an active, verified admin account and a bcrypt password matching the supplied administrator password. Existing balances were preserved. Production NextAuth URL and secret presence were verified; deployed sign-in and live email delivery remain untested.
- Copy trading is an administrator-managed subscription and credit ledger; it does not execute market orders. Reported profile performance is separate from user account credits.

## Previous baseline checks - 3 November 2026

- Production build passed.
- TypeScript passed.
- Eight payment and profit regression tests passed.
- Browser checks passed on desktop (1440px) and mobile (390px).
- Public pages, mobile navigation, registration, admin and client login passed.
- Admin custom payment method creation persisted and appeared in the wallet.
- A 1250.75 profit credit updated the balance, ledger and dashboard total by exactly 1250.75.
- A client was denied access to the admin settings API.
- Trading, wallet, history, subscriptions, profile, preferences, messages and support pages loaded.
- No horizontal page overflow was detected on the tested pages and viewport sizes.

Browser tests used a disposable local MongoDB replica set and generated test accounts, not the original project's database. Screenshots and a machine-readable summary are in test-results/.

Live Resend delivery, the production database, DNS and deployment have not been configured or verified. Third-party market data and chart services remain external dependencies. Loading their pages does not verify every trade or financial workflow.
