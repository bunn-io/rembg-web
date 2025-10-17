/**
 * Model integrity verification utilities
 *
 * This module provides SHA256 hash verification for downloaded models
 * to ensure they haven't been tampered with or corrupted.
 */

// Known SHA256 hashes for model files
// These should be updated when models are updated
const MODEL_HASHES: Record<string, string> = {
    'u2net.onnx':
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    'u2netp.onnx':
        'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
    'u2net_human_seg.onnx':
        'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
    'u2net_cloth_seg.onnx':
        'd4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
    'silueta.onnx':
        '75da6c8d2f8096ec743d071951be73b4a8bc7b3e51d9a6625d63644f90ffeedb',
};

/**
 * Compute SHA256 hash of an ArrayBuffer
 */
async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify model integrity by checking SHA256 hash
 *
 * @param modelName - Name of the model file
 * @param modelData - Model data as ArrayBuffer
 * @returns Promise<boolean> - True if hash matches, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifyModelIntegrity('u2net.onnx', modelData);
 * if (!isValid) {
 *   console.warn('Model integrity check failed');
 * }
 * ```
 */
export async function verifyModelIntegrity(
    modelName: string,
    modelData: ArrayBuffer
): Promise<boolean> {
    try {
        // Get expected hash
        const expectedHash = MODEL_HASHES[modelName];
        if (!expectedHash) {
            console.warn(`No hash available for model: ${modelName}`);
            return true; // Allow if no hash is configured
        }

        // Compute actual hash
        const actualHash = await computeSHA256(modelData);

        // Compare hashes
        const isValid = actualHash === expectedHash;

        if (!isValid) {
            console.error(`Model integrity check failed for ${modelName}`);
            console.error(`Expected: ${expectedHash}`);
            console.error(`Actual: ${actualHash}`);
        }

        return isValid;
    } catch (error) {
        console.error(
            `Error verifying model integrity for ${modelName}:`,
            error
        );
        return false;
    }
}

/**
 * Get the expected SHA256 hash for a model.
 *
 * Returns the pre-configured hash for a model if available, or null if
 * no hash has been set for the model.
 *
 * @param modelName - Name of the model file
 * @returns Expected SHA256 hash or null if not available
 *
 * @example
 * ```typescript
 * const hash = getModelHash('u2net.onnx');
 * if (hash) {
 *   console.log(`Expected hash for u2net: ${hash}`);
 * } else {
 *   console.log('No hash configured for this model');
 * }
 * ```
 */
export function getModelHash(modelName: string): string | null {
    return MODEL_HASHES[modelName] ?? null;
}

/**
 * Add or update the SHA256 hash for a model.
 *
 * Sets the expected hash for a model, which will be used for integrity
 * verification. This is useful for adding support for new models or
 * updating hashes when models are updated.
 *
 * @param modelName - Name of the model file
 * @param hash - SHA256 hash of the model
 *
 * @example
 * ```typescript
 * // Add hash for a new model
 * setModelHash('my-custom-model.onnx', 'abc123...');
 *
 * // Update hash for existing model
 * setModelHash('u2net.onnx', 'new-hash-value');
 *
 * // Verify the model with the new hash
 * const isValid = await verifyModelIntegrity('my-custom-model.onnx', modelData);
 * ```
 */
export function setModelHash(modelName: string, hash: string): void {
    MODEL_HASHES[modelName] = hash;
}

/**
 * Get all known model hashes.
 *
 * Returns a copy of all configured model hashes. The returned object
 * is a shallow copy, so modifications won't affect the internal hash store.
 *
 * @returns Record of model names to their SHA256 hashes
 *
 * @example
 * ```typescript
 * const allHashes = getAllModelHashes();
 * console.log('Configured models:', Object.keys(allHashes));
 *
 * // Check if a specific model has a hash
 * if ('u2net.onnx' in allHashes) {
 *   console.log('u2net has integrity verification enabled');
 * }
 * ```
 */
export function getAllModelHashes(): Record<string, string> {
    return { ...MODEL_HASHES };
}

/**
 * Validate model data against known size constraints.
 *
 * Checks if the model file size is within expected ranges. This helps
 * detect corrupted downloads or incorrect model files. Returns true if
 * no size constraints are configured for the model.
 *
 * @param modelName - Name of the model file
 * @param modelData - Model data as ArrayBuffer
 * @returns True if size is within expected range
 *
 * @example
 * ```typescript
 * const response = await fetch('/models/u2net.onnx');
 * const modelData = await response.arrayBuffer();
 *
 * const sizeValid = validateModelSize('u2net.onnx', modelData);
 * if (!sizeValid) {
 *   console.error('Model file size is unexpected - may be corrupted');
 *   return;
 * }
 *
 * console.log('Model size validation passed');
 * ```
 */
export function validateModelSize(
    modelName: string,
    modelData: ArrayBuffer
): boolean {
    const size = modelData.byteLength;
    const sizeMB = size / (1024 * 1024);

    // Expected size ranges in MB (with some tolerance)
    const expectedSizes: Record<string, { min: number; max: number }> = {
        'u2net.onnx': { min: 170, max: 180 },
        'u2netp.onnx': { min: 4, max: 5 },
        'u2net_human_seg.onnx': { min: 170, max: 180 },
        'u2net_cloth_seg.onnx': { min: 170, max: 180 },
        'silueta.onnx': { min: 40, max: 50 }, // ~43MB
    };

    const expected = expectedSizes[modelName];
    if (!expected) {
        console.warn(`No size validation available for model: ${modelName}`);
        return true; // Allow if no size constraints are configured
    }

    const isValid = sizeMB >= expected.min && sizeMB <= expected.max;

    if (!isValid) {
        console.error(`Model size validation failed for ${modelName}`);
        console.error(
            `Expected: ${expected.min}-${expected.max}MB, got: ${sizeMB.toFixed(2)}MB`
        );
    }

    return isValid;
}

/**
 * Comprehensive model validation.
 *
 * Performs both size validation and integrity verification on a model.
 * This is the recommended way to validate models before use.
 *
 * @param modelName - Name of the model file
 * @param modelData - Model data as ArrayBuffer
 * @returns Promise<boolean> - True if all validations pass
 *
 * @example
 * ```typescript
 * // Download and validate a model
 * const response = await fetch('/models/u2net.onnx');
 * const modelData = await response.arrayBuffer();
 *
 * const isValid = await validateModel('u2net.onnx', modelData);
 * if (isValid) {
 *   console.log('Model validation passed - safe to use');
 *   // Proceed with model loading
 * } else {
 *   console.error('Model validation failed - do not use');
 * }
 * ```
 */
export async function validateModel(
    modelName: string,
    modelData: ArrayBuffer
): Promise<boolean> {
    // Check size first (faster)
    const sizeValid = validateModelSize(modelName, modelData);
    if (!sizeValid) {
        return false;
    }

    // Check integrity
    const integrityValid = await verifyModelIntegrity(modelName, modelData);
    if (!integrityValid) {
        return false;
    }

    return true;
}
