// Symmetric AES-256-GCM helper, isomorphic across the browser and Node
// (Web Crypto's `crypto.subtle` is a global in both — Node 19+ natively,
// jsdom via the polyfill in vitest.setup.ts). Used to keep resume contact
// info out of the static build as plaintext: see claude-docs/CONTACT-ENCRYPTION.md.
//
// The key argument accepts any string — it's SHA-256'd into a fixed 256-bit
// AES key rather than requiring exactly 32 raw bytes. Encryption is
// symmetric: the same key value both encrypts (offline, via
// scripts/encrypt-value.ts) and decrypts (client-side, via a `?k=` URL
// param) — there is no separate "decryption key".

const AES_ALGORITHM = 'AES-GCM';
const IV_LENGTH_BYTES = 12;

async function deriveKey(key: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return crypto.subtle.importKey('raw', keyMaterial, { name: AES_ALGORITHM, length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

function toBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const base64 = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '=');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

/** Generates a random 256-bit key, suitable to pass to `encryptText`/`decryptText` and to share as a `?k=` URL value. */
export function generateKey(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function encryptText(plaintext: string, key: string): Promise<string> {
  const cryptoKey = await deriveKey(key);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv },
    cryptoKey,
    new TextEncoder().encode(plaintext),
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return toBase64Url(combined);
}

/** Throws if `key` doesn't match the key `cipherText` was encrypted with (AES-GCM's auth tag fails to verify) — callers must catch. */
export async function decryptText(cipherText: string, key: string): Promise<string> {
  const cryptoKey = await deriveKey(key);
  const combined = fromBase64Url(cipherText);
  const iv = combined.slice(0, IV_LENGTH_BYTES);
  const data = combined.slice(IV_LENGTH_BYTES);

  const plaintext = await crypto.subtle.decrypt({ name: AES_ALGORITHM, iv }, cryptoKey, data);
  return new TextDecoder().decode(plaintext);
}
