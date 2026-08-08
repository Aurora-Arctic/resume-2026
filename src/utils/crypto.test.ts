import { describe, it, expect } from 'vitest';
import { generateKey, encryptText, decryptText } from './crypto';

describe('crypto', () => {
  it('round-trips plaintext through encrypt/decrypt with the same key', async () => {
    const key = generateKey();
    const cipherText = await encryptText('hello@example.com', key);
    await expect(decryptText(cipherText, key)).resolves.toBe('hello@example.com');
  });

  it('produces different ciphertext for the same plaintext across calls (random IV)', async () => {
    const key = generateKey();
    const [a, b] = await Promise.all([
      encryptText('hello@example.com', key),
      encryptText('hello@example.com', key),
    ]);
    expect(a).not.toBe(b);
  });

  it('rejects decryption with the wrong key', async () => {
    const key = generateKey();
    const cipherText = await encryptText('hello@example.com', key);
    await expect(decryptText(cipherText, 'wrong-key')).rejects.toThrow();
  });

  it('generates distinct, non-empty keys', () => {
    const a = generateKey();
    const b = generateKey();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });
});
