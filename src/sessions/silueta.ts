import * as ort from 'onnxruntime-web';
import { BaseSession, SessionOptions } from './base';
import { NormalizationParams, processModelOutput } from '../utils/image';
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
        return 'input.1';
    }

    /**
     * Get the output shape for Silueta
     */
    protected getOutputShape(): [number, number, number, number] {
        return [1, 1, 320, 320];
    }

    /**
     * Process Silueta model outputs to create masks
     */
    protected processOutputs(
        outputs: ort.InferenceSession.OnnxValueMapType,
        originalSize: { width: number; height: number }
    ): HTMLCanvasElement[] {
        // Silueta outputs a single tensor with shape [1, 1, 320, 320]
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
        return 'silueta';
    }
}
