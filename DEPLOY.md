# Deploying

This app deploys to Cloudflare Workers (static assets) via Wrangler.

```sh
npm run deploy
```

This runs `tsc && tsc -p worker && vite build && wrangler deploy`: type-checks
the app and the Worker, builds the static site into `dist/`, then uploads it.

First time only, authenticate Wrangler with Cloudflare:

```sh
npx wrangler login
```

Worker name and asset config live in `wrangler.jsonc`.

## Short share links

`worker/index.ts` handles `/api/share`. It stores encrypted bills in the
`SHARES` KV namespace for 90 days. Wrangler creates the namespace on the first
deploy. Uploads are limited to 5 a minute and reads to 60 a minute, per IPv4
address or IPv6 /64 (`UPLOAD_LIMITER` and `READ_LIMITER`). Re-sharing a bill
only writes to KV again once its link has less than 60 days left.

If KV runs out of daily writes, uploads return 503 and the app falls back to
long links until the quota resets.

`npm run dev` has no Worker, so sharing falls back to long links there. To try
short links locally, run `npx vite build && npx wrangler dev`.

After changing bindings in `wrangler.jsonc`, regenerate the Worker types:

```sh
npx wrangler types worker/worker-configuration.d.ts
```
