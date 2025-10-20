import { BaseSession, SessionOptions } from './base';
import { NormalizationParams } from '../utils/image';
import { rembgConfig } from '../config';

/**
 * Silueta model session for background removal.
 *
 * Silueta is a specialized model for background removal with focus on
 * clean silhouette extraction. It provides good results for objects
 * with well-defined boundaries and is particularly effective for
 * product photography and object isolation.
 *
 * @example
 * ```typescript
 * // Create a Silueta session
 * const session = new SiluetaSession();
 *
 * // Or with custom options
 * const session = new SiluetaSession({
 *   preferWebGPU: true,
 *   numThreads: 8
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class SiluetaSession extends BaseSession {
  constructor(options?: SessionOptions) {
    super('silueta', options);
  }

  /**
   * Get default model URL for Silueta
   */
  protected getDefaultModelUrl(): string {
    return `${rembgConfig.getBaseUrl()}/silueta.onnx`;
  }

  /**
   * Get normalization parameters for Silueta
   * These match the Python version: mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)
   * Silueta uses the same normalization as U2Net
   */
  protected getNormalizationParams(): NormalizationParams {
    return {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
      size: [320, 320],
    };
  }

  /**
   * Get the input tensor name for Silueta
   */
  protected getInputName(): string {
    if (this.session) {
      // Get the first input name dynamically like Python version
      return this.session.inputNames[0];
    }
    // Fallback to common input name for Silueta models
    return 'input_image';
  }

  /**
   * Get the output shape for Silueta
   */
  protected getOutputShape(): [number, number, number, number] {
    return [1, 1, 320, 320];
  }

  /**
   * Get model name
   */
  static getName(): string {
    return 'silueta';
  }
}
