import { BaseSession, SessionOptions } from './base';
import { NormalizationParams } from '../utils/image';
import { rembgConfig } from '../config';

/**
 * U2Net model session for general-purpose background removal.
 *
 * U2Net is a deep learning model designed for salient object detection and
 * background removal. It works well on a wide variety of images including
 * people, objects, and animals.
 *
 * @example
 * ```typescript
 * // Create a U2Net session
 * const session = new U2NetSession();
 *
 * // Or with custom options
 * const session = new U2NetSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class U2NetSession extends BaseSession {
  constructor(options?: SessionOptions) {
    super('u2net', options);
  }

  /**
   * Get default model URL for U2Net
   */
  protected getDefaultModelUrl(): string {
    return `${rembgConfig.getBaseUrl()}/u2net.onnx`;
  }

  /**
   * Get normalization parameters for U2Net
   * These match the Python version: mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)
   */
  protected getNormalizationParams(): NormalizationParams {
    return {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
      size: [320, 320],
    };
  }

  /**
   * Get the input tensor name for U2Net
   */
  protected getInputName(): string {
    if (this.session) {
      // Get the first input name dynamically like Python version
      return this.session.inputNames[0];
    }
    // Fallback to common input name for U2Net models
    return 'input_image';
  }

  /**
   * Get the output shape for U2Net
   */
  protected getOutputShape(): [number, number, number, number] {
    return [1, 1, 320, 320];
  }

  /**
   * Get model name
   */
  static getName(): string {
    return 'u2net';
  }
}
