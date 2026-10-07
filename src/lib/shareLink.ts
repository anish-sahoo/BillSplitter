import { isThemeName, type ThemeName } from "../hooks/useTheme";
import { billSchema, type Bill } from "../types";

const KEY_BYTES = 16;

const IV_BYTES = 12;

// A brand-new link can take a few seconds to reach other Cloudflare locations
const RETRY_DELAYS_MS = [1000, 3000];

async function transformBytes(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): Uint8Array {
  const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

// Parsing first puts keys in schema order, so the same bill always
// serializes to the same bytes
function packBill(bill: Bill): Promise<Uint8Array> {
  const json = new TextEncoder().encode(JSON.stringify(billSchema.parse(bill)));

  return transformBytes(json, new CompressionStream("deflate-raw"));
}

async function hashBytes(bytes: BufferSource): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function unpackBill(packed: Uint8Array): Promise<Bill> {
  const json = await transformBytes(packed, new DecompressionStream("deflate-raw"));

  return billSchema.parse(JSON.parse(new TextDecoder().decode(json)));
}

// Long links carry the whole bill in the URL fragment, which browsers never
// send to the server, so the bill isn't stored anywhere but the link itself.
export async function encodeBill(bill: Bill): Promise<string> {
  return toBase64Url(await packBill(bill));
}

export async function decodeBill(encoded: string): Promise<Bill | null> {
  try {
    return await unpackBill(fromBase64Url(encoded));
  } catch {
    // Truncated, tampered, or outdated links all land here
    return null;
  }
}

// Short links store the bill encrypted on the server and keep the key in the
// fragment. The key and IV are derived from a hash of the bill, so an
// unchanged bill always seals to the same bytes and gets the same link.
export async function sealBill(bill: Bill): Promise<{ sealed: Uint8Array; key: string }> {
  const packed = await packBill(bill);
  const digest = await hashBytes(packed);
  const keyBytes = digest.slice(0, KEY_BYTES);
  const iv = digest.slice(KEY_BYTES, KEY_BYTES + IV_BYTES);
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, packed);

  const sealed = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  sealed.set(iv);
  sealed.set(new Uint8Array(ciphertext), IV_BYTES);

  return { sealed, key: toBase64Url(keyBytes) };
}

export async function openBill(sealed: Uint8Array, key: string): Promise<Bill | null> {
  try {
    const keyBytes = fromBase64Url(key);
    const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);

    const packed = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: sealed.slice(0, IV_BYTES) },
      cryptoKey,
      sealed.slice(IV_BYTES),
    );

    // The key is the bill's own hash, so a link can only open the bill it was
    // made from. Anyone holding a link knows its key and could encrypt some
    // other bill with it; this check catches that.
    const digest = await hashBytes(packed);

    if (digest.slice(0, KEY_BYTES).some((byte, i) => byte !== keyBytes[i])) return null;

    return await unpackBill(new Uint8Array(packed));
  } catch {
    // Wrong key or corrupted data; GCM refuses to decrypt either
    return null;
  }
}

// Only the Share button gets here; bills are never uploaded otherwise
async function uploadBill(bill: Bill): Promise<string> {
  const { sealed, key } = await sealBill(bill);

  const response = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: sealed,
  });

  if (!response.ok) throw new Error(`Share upload failed: ${response.status}`);

  const { id } = await response.json();

  return `${id}.${key}`;
}

// Links carry the sharer's theme so the receipt opens looking the way they see
// the app. Short links put it last in the fragment ("id.key.theme"); long
// links keep it in the query string, as they always have.
export async function shareUrl(bill: Bill, theme: ThemeName): Promise<string> {
  const { origin } = window.location;

  try {
    return `${origin}/s#${await uploadBill(bill)}.${theme}`;
  } catch {
    // Offline, rate limited, out of KV writes, too big, or running without the
    // Worker (vite dev)
    return `${origin}/view?theme=${theme}#${await encodeBill(bill)}`;
  }
}

export function sharedTheme(pathname: string, search: string, hash: string): ThemeName | undefined {
  if (pathname !== "/s" && pathname !== "/view") return undefined;

  const theme =
    pathname === "/s" ? (hash.split(".")[2] ?? null) : new URLSearchParams(search).get("theme");

  return isThemeName(theme) ? theme : undefined;
}

// Short fragments start "id.key"; base64url never contains a dot, so anything
// else is a long link
export async function loadSharedBill(fragment: string): Promise<Bill | null> {
  const [id, key] = fragment.split(".");

  if (key === undefined) return decodeBill(fragment);

  try {
    const url = `/api/share/${encodeURIComponent(id)}`;
    let response = await fetch(url);

    for (const delay of RETRY_DELAYS_MS) {
      if (response.status !== 404) break;

      await new Promise((resolve) => setTimeout(resolve, delay));
      response = await fetch(url);
    }

    if (!response.ok) return null;

    return await openBill(new Uint8Array(await response.arrayBuffer()), key);
  } catch {
    return null;
  }
}
