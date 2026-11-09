# Cryptcona Broker

Independent desktop clone with a new Cryptcona design and domain: https://cryptcona.pro.

## Current presentation workspace

`/dashboard` is a separate account overview with quick actions and recent payment/trade activity. Regular login, signup and verification open `/dashboard/trading`; admin login opens `/admin`. Wallet shortcuts select the requested Deposit/Withdraw tab.

Trading now uses the same MongoDB account balance as the overview and wallet. Opening a simulated position reserves its margin; closing returns margin plus or minus P&L. Available funds are cash available for trading/withdrawal. Portfolio value is available funds + reserved margin + unrealized P&L. New accounts start at their actual account balance, without a seeded local portfolio. Old browser sample data is ignored, never imported into the account ledger.

Trading now uses a disclosed, market-anchored random price path for BTC/USD, ETH/USD, SOL/USD, EUR/USD and GBP/USD. Every 500 ms a shared server feed proposes an independent up/down step of 0.04%–0.16% of the live reference, adds a gentle pull toward that reference, and reflects at the +/-4% boundaries. The chart, position valuations, entries and exits use this same generated path. Live reference and range are displayed beside the chart; no win rate is fixed or manipulated.

The price state and latest 240 generated ticks are persisted in MongoDB. Compare-and-swap updates keep different browsers and server instances on the same tick. SSE pushes updates, with JSON polling if streaming is unavailable. Reference requests fail over from Kraken to Coinbase. During outages, generation continues around the last known reference for up to 24 hours with its age displayed; beyond that limit it waits for a fresh reference. Background refreshes do not block chart ticks, and stalled streams reconnect automatically. Live/30s/60s/120s views show the generated path, not historical exchange candles. When nobody requests the feed, missing historical ticks are not invented. Public market pages continue showing actual Kraken quotes separately.

Dashboard pages share one account provider across navigation. Balance-only loads do not wait for external quote or FX providers. Account snapshots use one database aggregation, and overview activity is bounded to 50 rows per category with separate total pending counts. Open positions refresh every three seconds; idle accounts refresh every 15 seconds and on focus. Server execution still independently validates prices and balances.

All balance and P&L values are stored in account currency. EUR/GBP/BTC conversions use market references, and fiat currencies also support Frankfurter with ExchangeRate-API fallback (cached one hour, last valid daily rates usable up to seven days). Each position fixes its conversion at entry. Prices remain quoted in USD. No market API key or paid service is required.

`src/components/Demo.tsx` is the single source of all simulation/virtual-funds disclosure text. UI surfaces render `<Demo />` or its variants; accessibility labels and API error messages reuse the named `demoCopy` export from that same file. A source scan test guards against duplicated disclosure literals. Existing Deposit/Withdraw forms remain in place and use the shared account balance.

`/api/paper-trading` validates orders on the server and uses database transactions for margin and settlement. Duplicate order IDs and close retries cannot charge or credit twice. Timers retain their deadlines, including offline time; stops/limits/expired positions settle at the next fresh quote when an account page refreshes. There is no background execution worker or guaranteed historical fill. Details and omitted fees/spread/slippage are disclosed in How it works. MongoDB must support transactions (Atlas or a replica set).

Provider documentation: [Kraken public APIs](https://support.kraken.com/articles/360000919986-public-endpoint-examples-you-can-try-them-directly-in-a-web-browser-), [Frankfurter](https://frankfurter.dev/).

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm ci`.
3. Run `npm run setup:local`. This creates an ignored .env.local with a fresh session secret.
4. For the fast local presentation, run `npm run build` then `npm run preview`, and open http://localhost:3100. Rebuild after changing source files. Use `npm run dev` only while editing with hot reload.

The development command overrides NEXTAUTH_URL to localhost for local sign-in. The production values in .env.local remain https://cryptcona.pro. Keep credentials in .env.local, never in .env.example.

Public pages work without service credentials. Account and admin data require MongoDB. No original database, users, balances, payment destinations, API keys, Git history or remote were copied.

## New database

Set MONGODB_URI to the connection string for your new MongoDB deployment and MONGODB_DB_NAME=cryptcona_broker in .env.local. MongoDB Atlas or a replica set is required for profit-credit transactions. Allow the application host to connect and use a database user restricted to this database. Collections are created as the application writes data.

## New administrator

Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local. Use a unique password of at least 12 characters. Run `npm run setup:admin` to create the admin in your new database. There is no default admin password, login bypass or public seed endpoint. This command preserves an existing account's balance.

## Resend

Use a separate Resend account or API key. Verify cryptcona.pro in Resend and configure its DNS records. Set RESEND_API_KEY and RESEND_FROM_EMAIL (for example, Cryptcona Broker <auth@cryptcona.pro>). Sending is disabled until both values are configured. Email links use NEXT_PUBLIC_SITE_URL; set it to https://cryptcona.pro for production.

## Production

Set NEXTAUTH_URL and NEXT_PUBLIC_SITE_URL to https://cryptcona.pro. Keep a new, private NEXTAUTH_SECRET. Run `npm run build`, then `npm start`. Connect the domain to your hosting separately. No domain registration, cloud database provisioning or deployment is performed by creating this local project.

## Features retained

Authentication and password recovery, dashboard, trading, wallet deposits and withdrawals, history, subscriptions, profile/KYC, preferences, messages, admin clients/funding/settings, custom payment methods and exact profit credits. Payment methods and contact channels start unconfigured and can be added in Admin > Settings.

## Checks

Run `npm test`, `npx tsc --noEmit`, and `npm run build`.
After building, run `npm run test:browser` for browser integration checks. It uses Edge and a disposable MongoDB replica set, generates temporary test credentials, and shuts down the test database afterward. The first run downloads a MongoDB test binary. It does not use your configured database or send email.
Browser screenshots and test output belong in ignored test-results/.

## Copy trading

Users open **Copy trading** in the account sidebar to browse trader photos, bios, regions and weekly results. They can activate one profile, switch profiles, or stop copying. Credits already received remain in their balance after stopping.

Admins open **Admin > Copy trading** to create or edit profiles, upload a PNG/JPEG/WebP photo (maximum 1 MB), publish or pause a profile, and enter up to 52 weekly results. Weeks begin on Monday in UTC. Weekly return is profit/loss divided by starting capital; total reported return compounds those weekly returns. These are explicitly admin-reported figures, separate from member earnings.

Select **View members**, choose a member and enter an amount and credit note to post a profit credit in that member's account currency. Credits update the balance, copy-credit audit log and account ledger in a MongoDB transaction. Retrying the same request cannot credit twice. Stopped copies, changed copy sessions and paused profiles reject new credits. Copy credits count as profit, not deposited capital.

This is an admin-managed subscription and credit workflow. It does not connect to a brokerage execution API or mirror market orders. No fabricated trader profiles or performance histories are seeded. The new collections and indexes are created in the configured Cryptcona database.

## Independence

Only source and public assets were copied. Crown Edge's source folder remains unchanged. Cryptcona uses its own database name, auth cookie, configuration, branding, and email templates. No GitHub remote or publishing target is inherited.

## Goals and demo copying

Signup accepts an optional profit goal and records consent to the terms at `/terms`. Goals track recorded net trade results and manually entered profit credits; deposits are excluded. Goals do not restrict withdrawals. Users may disable a goal at any time, or set a new goal after reaching or disabling the old one. Support links prepare a message about the goal without sending it automatically.

The demo profiles, their ImageKit avatars, and the demo seed command were removed at the owner's request. The server still rejects withdrawable credits for any profile marked as a demo. New profiles can be created manually for authorized participants.

The previous randomized funded-trading endpoint is disabled until a real execution provider is integrated. It returns an explicit unavailable response without moving funds. Withdrawal instructions no longer ask users to purchase codes. Account credit labels retain a manual-source disclosure.

## ImageKit configuration

Set `IMAGEKIT_PRIVATE_KEY` and `IMAGEKIT_URL_ENDPOINT` in `.env.local` (and your deployment environment). Do not put credentials in `.env.example`. The private key stays on the server. This integration uses the official ImageKit Node SDK; no public key is required for server uploads.

New trader photos go to `/cryptcona/profiles` in ImageKit (1 MB maximum). Support attachments and profile identity documents go to `/cryptcona/support` and `/cryptcona/identity` (5 MB each, private files). PNG, JPEG and WebP are supported. MongoDB stores references; `/api/media/:id` checks the signed-in owner or admin before streaming a private image. Failed uploads are reported instead of silently storing Base64. Existing Base64 images remain readable until migrated.

Browser tests mock ImageKit network responses and use a disposable MongoDB database. They verify integration and authorization, not live ImageKit account configuration.


Trade sizing supports lots or an account-currency amount. Amount is the margin reserved, not leveraged notional; the server derives units and lots from its execution price and FX rate. The fixed lot cap and three-decimal lot restriction are removed. Positive finite sizes, representable calculations and available balance are still validated.

## Deployment handoff

See [DEPLOYMENT.md](DEPLOYMENT.md). Run `npm run check:deployment` after the production build. Profile pictures can be selected by clicking the round avatar or its camera button on Profile & verification, then choosing Save profile. The saved photo also appears in the account header and administrator client/chat views.
