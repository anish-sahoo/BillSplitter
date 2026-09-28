# Bill Splitter

Split a bill between friends. A bill (say "Apartment stuff") holds one or more receipts, each paid by one person. Add people, assign items, set tax and tip per receipt, and the app tells you who owes who.

It's a static React app. There are no accounts and no server-side storage.

- Bills are saved in your browser's IndexedDB. They don't sync between devices or browsers.
- Browsers can clear site storage (Safari does after 7 days without a visit), so don't treat it as permanent.
- "Share" copies a read-only link that renders the bill as a receipt. The bill is compressed into the part of the URL after `#`, which browsers never send to the server. The link is a snapshot, so edits made afterwards need a new link.

## Development

```sh
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run test`, `npm run lint`, `npm run format`.

## Deploying

See `DEPLOY.md`. The app deploys to Cloudflare as static assets only, which fits the free plan.
