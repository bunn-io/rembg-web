import * as ort from 'onnxruntime-web';
import { BaseSession, SessionOptions } from './base';
import { NormalizationParams, processModelOutput } from '../utils/image';
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
        return 'input.1';
    }

    /**
     * Get the output shape for U2Net
     */
    protected getOutputShape(): [number, number, number, number] {
        return [1, 1, 320, 320];
    }

    /**
     * Process U2Net model outputs to create masks
     */
    protected processOutputs(
        outputs: ort.InferenceSession.OnnxValueMapType,
        originalSize: { width: number; height: number }
    ): HTMLCanvasElement[] {
        // U2Net outputs a single tensor with shape [1, 1, 320, 320]
        const outputTensor = outputs[Object.keys(outputs)[0]] as ort.Tensor;
        const outputData = outputTensor.data as Float32Array;

        // Process the output to create mask canvas
        const maskCanvas = processModelOutput(
            outputData,
            originalSize,
            this.getOutputShape()
        );

        return [maskCanvas];
    }

    /**
     * Get model name
     */
    static getName(): string {
        return 'u2net';
    }
}
