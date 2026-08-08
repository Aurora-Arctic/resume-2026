#!/usr/bin/env node
// Prints a fresh AES-256-GCM key for src/utils/crypto.ts's encrypt/decrypt
// helpers. Symmetric — the same key value is used to both encrypt (via
// encrypt-value.ts, offline) and decrypt (client-side, via a `?k=` URL
// param); there's no separate "decryption key". Keep the printed key out of
// the repo — store it privately and append it to resume links you share.
//
// Usage: npm run generate:key

import { generateKey } from '../src/utils/crypto.ts';

console.log(generateKey());
