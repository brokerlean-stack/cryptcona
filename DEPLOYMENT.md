# Cryptcona deployment

This is the existing Cryptcona trading simulation, with its shared disclosures retained.

## Prepare

Use a supported Node.js runtime (22 or 24) and a MongoDB replica set or Atlas deployment. On the deployment host, run `npm ci`, `npm run build`, then `npm start`. Build on the target OS: do not copy Windows native dependencies onto a Linux host.

Set runtime secrets using the host's environment settings. Required configuration is listed in `.env.example`. Never publish `.env.local`, administrator credentials or private keys. Build preparation strips environment files from the standalone output. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://cryptcona.pro`, and preserve the same strong `NEXTAUTH_SECRET` across instances.

For a standalone artifact, deploy `.next/standalone` (including its hidden `.next` directory) and run `node server.js`. The build script already includes public assets and static chunks. Set `PORT` and `HOSTNAME=0.0.0.0` as required by the host.

## Services and domain

- Allow the hosting server to connect to the configured MongoDB database. Transactions require a replica set.
- Configure ImageKit's private key and URL endpoint on the server. Profile pictures are public CDN images; verification and support attachments use authorized private-media access.
- Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL=Cryptcona Broker <support@cryptcona.pro>`. Verify cryptcona.pro's sending DNS records in Resend. Send-only keys cannot list domain verification status; an authorized live test on 2026-11-09 confirmed receipt from support@cryptcona.pro in a temporary Mail.tm inbox. Delivery to other mailbox providers still depends on their filtering.
- Configure DNS and HTTPS for cryptcona.pro. Forward streaming responses without buffering, and allow long-lived `/api/practice-market` SSE connections. JSON polling is a fallback.
- Run `npm run check:deployment` after building. `/api/status` performs a real database ping and returns 503 on failure without exposing connection details.

## Release verification

Run `npm test`, `npm run build`, and `npm run test:browser`. The browser suite uses an isolated database and mocked ImageKit/email integrations. On the actual host, check login, profile image display, price updates, account-currency conversion and admin access. Verify a password-reset email only with an explicitly authorized recipient.

This work prepares the project locally. It does not provision hosting, change DNS or publish the application. Timed exits are evaluated when the account is refreshed; there is no background trade execution worker.
