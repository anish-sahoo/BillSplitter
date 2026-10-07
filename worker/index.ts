import { clientKey } from "./clientKey";

// Short share links. The client encrypts the bill before uploading and keeps
// the key in the link's fragment, so this only ever stores ciphertext it
// can't read.

const MAX_BYTES = 8 * 1024;

// IV + AES-GCM tag + at least one byte of ciphertext
const MIN_BYTES = 12 + 16 + 1;

const DAY_SECONDS = 24 * 60 * 60;

const TTL_SECONDS = 90 * DAY_SECONDS;

// Re-sharing a stored bill only spends a KV write once it has less than this
// left, so repeat shares stay cheap but active links keep living
const REFRESH_BELOW_SECONDS = 60 * DAY_SECONDS;

// base64url chars, 60 bits of the ciphertext hash
const ID_LENGTH = 10;

const ID_PATTERN = /^[A-Za-z0-9_-]{10}$/;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// The ID is a hash of the ciphertext, so the same bill always lands on the
// same key and nobody can overwrite someone else's link with other content.
async function contentId(bytes: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));

  return toBase64Url(digest).slice(0, ID_LENGTH);
}

interface ShareMetadata {
  expiresAt: number; // unix seconds
}

async function limited(limiter: RateLimit, request: Request): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const { success } = await limiter.limit({ key: clientKey(ip) });

  return !success;
}

async function createShare(request: Request, env: Env): Promise<Response> {
  if (await limited(env.UPLOAD_LIMITER, request)) {
    return new Response("Too many requests", { status: 429 });
  }

  // A content type that isn't CORS-safelisted makes browsers preflight, which
  // this Worker never approves, so other sites can't upload through visitors
  if (request.headers.get("Content-Type") !== "application/octet-stream") {
    return new Response("Unsupported type", { status: 415 });
  }

  const site = request.headers.get("Sec-Fetch-Site");

  if (site && site !== "same-origin") return new Response("Forbidden", { status: 403 });

  const length = Number(request.headers.get("Content-Length"));

  if (!length || length > MAX_BYTES) return new Response("Bad size", { status: 413 });

  const body = await request.arrayBuffer();

  if (body.byteLength < MIN_BYTES || body.byteLength > MAX_BYTES) {
    return new Response("Bad size", { status: 413 });
  }

  const id = await contentId(body);
  const now = Math.floor(Date.now() / 1000);
  const { metadata } = await env.SHARES.getWithMetadata<ShareMetadata>(id);

  if (metadata && metadata.expiresAt - now > REFRESH_BELOW_SECONDS) return Response.json({ id });

  try {
    await env.SHARES.put(id, body, {
      expirationTtl: TTL_SECONDS,
      metadata: { expiresAt: now + TTL_SECONDS } satisfies ShareMetadata,
    });
  } catch {
    // Out of daily writes, or the same key written twice within a second.
    // The client falls back to a long link.
    return new Response("Unavailable", { status: 503 });
  }

  return Response.json({ id });
}

const NOT_FOUND = () => new Response("Not found", { status: 404 });

async function readShare(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (await limited(env.READ_LIMITER, request)) {
    return new Response("Too many requests", { status: 429 });
  }

  const id = new URL(request.url).pathname.slice("/api/share/".length);

  if (!ID_PATTERN.test(id)) return NOT_FOUND();

  // Stored content never changes under its ID, so cached copies are always
  // right and repeat opens skip the KV read
  const cache = caches.default;
  const cached = await cache.match(request);

  if (cached) return cached;

  const body = await env.SHARES.get(id, "arrayBuffer");

  if (!body) return NOT_FOUND();

  const response = new Response(body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
      // Uploads are opaque bytes; make sure nothing ever renders them
      "Content-Disposition": "attachment",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });

  ctx.waitUntil(cache.put(request, response.clone()));

  return response;
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/share" && request.method === "POST") return createShare(request, env);

    if (pathname.startsWith("/api/share/") && request.method === "GET") {
      return readShare(request, env, ctx);
    }

    return NOT_FOUND();
  },
} satisfies ExportedHandler<Env>;
