import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  verifyModelIntegrity,
  getModelHash,
  setModelHash,
  getAllModelHashes,
  validateModelSize,
  validateModel,
} from '../../../src/utils/integrity';
import { mockDigest } from '../../mocks/crypto';

describe('Integrity Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getModelHash', () => {
    it('should return hash for known model', () => {
      const hash = getModelHash('u2net.onnx');
      expect(hash).toBe(
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
      );
    });

    it('should return null for unknown model', () => {
      const hash = getModelHash('unknown.onnx');
      expect(hash).toBeNull();
    });
  });

  describe('setModelHash', () => {
    it('should set hash for model', () => {
      const newHash =
        'newhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      setModelHash('test.onnx', newHash);

      const hash = getModelHash('test.onnx');
      expect(hash).toBe(newHash);
    });

    it('should update existing hash', () => {
      const originalHash = getModelHash('u2net.onnx');
      const newHash =
        'updatedhash1234567890abcdef1234567890abcdef1234567890abcdef123456';

      setModelHash('u2net.onnx', newHash);
      const updatedHash = getModelHash('u2net.onnx');

      expect(updatedHash).toBe(newHash);
      expect(updatedHash).not.toBe(originalHash);
    });
  });

  describe('getAllModelHashes', () => {
    it('should return all model hashes', () => {
      const hashes = getAllModelHashes();

      expect(hashes).toHaveProperty('u2net.onnx');
      expect(hashes).toHaveProperty('u2netp.onnx');
      expect(hashes).toHaveProperty('u2net_human_seg.onnx');
      expect(hashes).toHaveProperty('u2net_cloth_seg.onnx');
      expect(hashes).toHaveProperty('silueta.onnx');
    });

    it('should return a copy of the hashes', () => {
      const hashes1 = getAllModelHashes();
      const hashes2 = getAllModelHashes();

      expect(hashes1).toEqual(hashes2);
      expect(hashes1).not.toBe(hashes2); // Should be different objects
    });
  });

  describe('verifyModelIntegrity', () => {
    it('should return true for valid hash', async () => {
      // Reset the hash to the original value
      setModelHash(
        'u2net.onnx',
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
      );

      const modelData = new ArrayBuffer(100);
      const expectedHash =
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

      // Mock the digest to return the expected hash
      mockDigest.mockResolvedValueOnce(
        new Uint8Array(Buffer.from(expectedHash, 'hex')) as any
      );

      const isValid = await verifyModelIntegrity('u2net.onnx', modelData);

      expect(isValid).toBe(true);
      expect(mockDigest).toHaveBeenCalledWith('SHA-256', modelData);
    });

    it('should return false for invalid hash', async () => {
      const modelData = new ArrayBuffer(100);
      const wrongHash =
        'wronghash1234567890abcdef1234567890abcdef1234567890abcdef123456';

      // Mock the digest to return a different hash
      mockDigest.mockResolvedValueOnce(
        new Uint8Array(Buffer.from(wrongHash, 'hex')) as any
      );

      const isValid = await verifyModelIntegrity('u2net.onnx', modelData);

      expect(isValid).toBe(false);
    });

    it('should return true for unknown model (no hash configured)', async () => {
      const modelData = new ArrayBuffer(100);

      const isValid = await verifyModelIntegrity('unknown.onnx', modelData);

      expect(isValid).toBe(true);
      expect(mockDigest).not.toHaveBeenCalled();
    });

    it('should handle digest errors', async () => {
      const modelData = new ArrayBuffer(100);

      mockDigest.mockRejectedValueOnce(new Error('Digest failed'));

      const isValid = await verifyModelIntegrity('u2net.onnx', modelData);

      expect(isValid).toBe(false);
    });

    it('should log error for invalid hash', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const modelData = new ArrayBuffer(100);
      const wrongHash =
        'wronghash1234567890abcdef1234567890abcdef1234567890abcdef123456';

      mockDigest.mockResolvedValueOnce(
        new Uint8Array(Buffer.from(wrongHash, 'hex')) as any
      );

      await verifyModelIntegrity('u2net.onnx', modelData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Model integrity check failed for u2net.onnx'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Expected:/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Actual:/));
    });

    it('should log error for digest failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const modelData = new ArrayBuffer(100);

      mockDigest.mockRejectedValueOnce(new Error('Digest failed'));

      await verifyModelIntegrity('u2net.onnx', modelData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error verifying model integrity for u2net.onnx:',
        expect.any(Error)
      );
    });
  });

  describe('validateModelSize', () => {
    it('should return true for valid size', () => {
      const modelData = new ArrayBuffer(175 * 1024 * 1024); // 175MB
      const isValid = validateModelSize('u2net.onnx', modelData);

      expect(isValid).toBe(true);
    });

    it('should return false for size too small', () => {
      const modelData = new ArrayBuffer(100 * 1024 * 1024); // 100MB
      const isValid = validateModelSize('u2net.onnx', modelData);

      expect(isValid).toBe(false);
    });

    it('should return false for size too large', () => {
      const modelData = new ArrayBuffer(200 * 1024 * 1024); // 200MB
      const isValid = validateModelSize('u2net.onnx', modelData);

      expect(isValid).toBe(false);
    });

    it('should return true for unknown model (no size constraints)', () => {
      const modelData = new ArrayBuffer(1000 * 1024 * 1024); // 1GB
      const isValid = validateModelSize('unknown.onnx', modelData);

      expect(isValid).toBe(true);
    });

    it('should log error for invalid size', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const modelData = new ArrayBuffer(100 * 1024 * 1024); // 100MB

      validateModelSize('u2net.onnx', modelData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Model size validation failed for u2net.onnx'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Expected: 170-180MB, got: 100.00MB'
      );
    });

    it('should validate different model sizes correctly', () => {
      // Test u2netp (smaller model)
      const u2netpData = new ArrayBuffer(4.5 * 1024 * 1024); // 4.5MB
      expect(validateModelSize('u2netp.onnx', u2netpData)).toBe(true);

      // Test silueta
      const siluetaData = new ArrayBuffer(43 * 1024 * 1024); // 43MB
      expect(validateModelSize('silueta.onnx', siluetaData)).toBe(true);
    });
  });

  describe('validateModel', () => {
    it('should return true for valid model', async () => {
      // Reset the hash to the original value
      setModelHash(
        'u2net.onnx',
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
      );

      const modelData = new ArrayBuffer(175 * 1024 * 1024); // 175MB
      const expectedHash =
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

      mockDigest.mockResolvedValueOnce(
        new Uint8Array(Buffer.from(expectedHash, 'hex')) as any
      );

      const isValid = await validateModel('u2net.onnx', modelData);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid size', async () => {
      const modelData = new ArrayBuffer(100 * 1024 * 1024); // 100MB (too small)

      const isValid = await validateModel('u2net.onnx', modelData);

      expect(isValid).toBe(false);
      expect(mockDigest).not.toHaveBeenCalled(); // Should not check hash if size is invalid
    });

    it('should return false for invalid hash', async () => {
      const modelData = new ArrayBuffer(175 * 1024 * 1024); // 175MB (valid size)
      const wrongHash =
        'wronghash1234567890abcdef1234567890abcdef1234567890abcdef123456';

      mockDigest.mockResolvedValueOnce(
        new Uint8Array(Buffer.from(wrongHash, 'hex')) as any
      );

      const isValid = await validateModel('u2net.onnx', modelData);

      expect(isValid).toBe(false);
    });

    it('should return true for unknown model', async () => {
      const modelData = new ArrayBuffer(1000 * 1024 * 1024); // 1GB

      const isValid = await validateModel('unknown.onnx', modelData);

      expect(isValid).toBe(true);
      expect(mockDigest).not.toHaveBeenCalled();
    });

    it('should handle digest errors', async () => {
      const modelData = new ArrayBuffer(175 * 1024 * 1024); // 175MB

      mockDigest.mockRejectedValueOnce(new Error('Digest failed'));

      const isValid = await validateModel('u2net.onnx', modelData);

      expect(isValid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ArrayBuffer', async () => {
      const modelData = new ArrayBuffer(0);

      const isValid = await validateModel('unknown.onnx', modelData);
      expect(isValid).toBe(true);
    });

    it('should handle very large ArrayBuffer', async () => {
      const modelData = new ArrayBuffer(10 * 1024 * 1024 * 1024); // 10GB

      const isValid = await validateModel('unknown.onnx', modelData);
      expect(isValid).toBe(true);
    });

    it('should handle model names with special characters', () => {
      const hash =
        'testhash1234567890abcdef1234567890abcdef1234567890abcdef123456';
      setModelHash('model-with-dashes.onnx', hash);

      const retrievedHash = getModelHash('model-with-dashes.onnx');
      expect(retrievedHash).toBe(hash);
    });

    it('should handle empty hash strings', () => {
      setModelHash('empty.onnx', '');

      const hash = getModelHash('empty.onnx');
      expect(hash).toBe('');
    });
  });
});
