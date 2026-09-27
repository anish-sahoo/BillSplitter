const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

// Short random IDs keep share links compact. 10 chars of base36 is ~52 bits,
// plenty for IDs that only need to be unique within one browser's bills.
export function createId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
