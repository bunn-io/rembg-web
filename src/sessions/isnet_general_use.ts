import { BaseSession, SessionOptions } from './base';
import { NormalizationParams } from '../utils/image';
import { rembgConfig } from '../config';

/**
 * ISNet General Use model session for high-quality background removal.
 *
 * ISNet (Interactive Segmentation Network) provides superior quality
 * background removal with better edge detection and detail preservation.
 * Uses larger input resolution (1024x1024) for higher quality results.
 *
 * @example
 * ```typescript
 * // Create an ISNet session
 * const session = new IsNetGeneralUseSession();
 *
 * // Or with custom options
 * const session = new IsNetGeneralUseSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class IsNetGeneralUseSession extends BaseSession {
  constructor(options?: SessionOptions) {
    super('isnet-general-use', options);
  }

  /**
   * Get default model URL for ISNet General Use
   */
  protected getDefaultModelUrl(): string {
    return `${rembgConfig.getBaseUrl()}/isnet-general-use.onnx`;
  }

  /**
   * Get normalization parameters for ISNet General Use
   * These match the Python version: mean=(0.5, 0.5, 0.5), std=(1.0, 1.0, 1.0)
   * DIS models use larger input size: 1024x1024
   */
  protected getNormalizationParams(): NormalizationParams {
    return {
      mean: [0.5, 0.5, 0.5],
      std: [1.0, 1.0, 1.0],
      size: [1024, 1024],
    };
  }

  /**
   * Get the input tensor name for ISNet General Use
   * Uses dynamic input name like Python version: self.inner_session.get_inputs()[0].name
   */
  protected getInputName(): string {
    if (this.session) {
      // Get the first input name dynamically like Python version
      return this.session.inputNames[0];
    }
    // Fallback to common input name for ISNet models
    return 'input_image';
  }

  /**
   * Get the output shape for ISNet General Use
   */
  protected getOutputShape(): [number, number, number, number] {
    return [1, 1, 1024, 1024];
  }

  /**
   * Get model name
   */
  static getName(): string {
    return 'isnet-general-use';
  }
}
