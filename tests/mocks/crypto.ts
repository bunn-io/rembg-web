import { vi } from 'vitest';
import { createHash } from 'crypto';

// Mock crypto.subtle.digest
const mockDigest = vi.fn(async (algorithm: string, data: ArrayBuffer) => {
  if (algorithm === 'SHA-256') {
    const hash = createHash('sha256');
    hash.update(new Uint8Array(data));
    return hash.digest();
  }
  throw new Error(`Unsupported algorithm: ${algorithm}`);
});

// Mock crypto.subtle
const mockSubtle = {
  digest: mockDigest,
};

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: mockSubtle,
  },
  writable: true,
});

export { mockDigest, mockSubtle };
