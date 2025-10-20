import { BaseSession, SessionOptions } from './base';
import { NormalizationParams } from '../utils/image';
import { rembgConfig } from '../config';

/**
 * U2Netp model session for lightweight background removal.
 *
 * U2Netp is a smaller, faster version of U2Net with reduced model size.
 * It provides good quality background removal with faster inference times,
 * making it ideal for real-time applications or resource-constrained environments.
 *
 * @example
 * ```typescript
 * // Create a U2Netp session
 * const session = new U2NetpSession();
 *
 * // Or with custom options
 * const session = new U2NetpSession({
 *   preferWebGPU: true,
 *   numThreads: 8
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class U2NetpSession extends BaseSession {
  constructor(options?: SessionOptions) {
    super('u2netp', options);
  }

  /**
   * Get default model URL for U2Netp
   * Matches Python: downloads from GitHub releases
   */
  protected getDefaultModelUrl(): string {
    return `${rembgConfig.getBaseUrl()}/u2netp.onnx`;
  }

  /**
   * Get normalization parameters for U2Netp
   * Matches Python version exactly: mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225), size=(320, 320)
   */
  protected getNormalizationParams(): NormalizationParams {
    return {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
      size: [320, 320],
    };
  }

  /**
   * Get the input tensor name for U2Netp
   */
  protected getInputName(): string {
    if (this.session) {
      // Get the first input name dynamically like Python version
      return this.session.inputNames[0];
    }
    // Fallback to common input name for U2Netp models
    return 'input_image';
  }

  /**
   * Get the output shape for U2Netp
   */
  protected getOutputShape(): [number, number, number, number] {
    return [1, 1, 320, 320];
  }

  /**
   * Get model name
   * Matches Python: return "u2netp"
   */
  static getName(): string {
    return 'u2netp';
  }
}
