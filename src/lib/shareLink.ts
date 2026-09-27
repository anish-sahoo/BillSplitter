import type { ThemeName } from "../hooks/useTheme";
import { billSchema, type Bill } from "../types";

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

// The whole bill rides in the URL fragment, which browsers never send to the
// server, so shared bills aren't stored anywhere but the link itself.
export async function encodeBill(bill: Bill): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(bill));

  return toBase64Url(await transformBytes(json, new CompressionStream("deflate-raw")));
}

export async function decodeBill(encoded: string): Promise<Bill | null> {
  try {
    const json = await transformBytes(
      fromBase64Url(encoded),
      new DecompressionStream("deflate-raw"),
    );

    return billSchema.parse(JSON.parse(new TextDecoder().decode(json)));
  } catch {
    // Truncated, tampered, or outdated links all land here
    return null;
  }
}

// The theme goes in the query string so the receipt opens looking the way the
// sharer sees the app
export async function shareUrl(bill: Bill, theme: ThemeName): Promise<string> {
  return `${window.location.origin}/view?theme=${theme}#${await encodeBill(bill)}`;
}
