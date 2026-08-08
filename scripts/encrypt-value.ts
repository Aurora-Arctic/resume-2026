#!/usr/bin/env node
// Encrypts a plaintext value (e.g. an email or phone number) with
// src/utils/crypto.ts's AES-256-GCM helper, for pasting into
// src/data/resume.ts in place of the plaintext. If no key is given, a fresh
// one is generated and printed alongside the ciphertext — see
// claude-docs/CONTACT-ENCRYPTION.md.
//
// Usage: npm run encrypt:value -- "<plaintext>" [key]

import { encryptText, generateKey } from '../src/utils/crypto.ts';

async function main(): Promise<void> {
  const [plaintext, providedKey] = process.argv.slice(2);
  if (!plaintext) {
    console.error('Usage: npm run encrypt:value -- "<plaintext>" [key]');
    process.exitCode = 1;
    return;
  }

  const key = providedKey ?? generateKey();
  const cipherText = await encryptText(plaintext, key);

  if (!providedKey) {
    console.log(`key:        ${key}`);
  }
  console.log(`ciphertext: ${cipherText}`);
}

void main();
