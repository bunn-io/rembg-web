import * as ort from 'onnxruntime-web';
import { BaseSession, SessionOptions } from './base';
import { NormalizationParams, processModelOutput } from '../utils/image';
import { rembgConfig } from '../config';

/**
 * U2Net Human Segmentation model session.
 *
 * Specialized version of U2Net trained specifically for human segmentation.
 * Provides superior results for images containing people, with better
 * edge detection and more accurate human body segmentation.
 *
 * @example
 * ```typescript
 * // Create a human segmentation session
 * const session = new U2NetHumanSegSession();
 *
 * // Or with custom options
 * const session = new U2NetHumanSegSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class U2NetHumanSegSession extends BaseSession {
    constructor(options?: SessionOptions) {
        super('u2net_human_seg', options);
    }

    /**
     * Get default model URL for U2Net Human Segmentation
     * Matches Python: downloads from GitHub releases
     */
    protected getDefaultModelUrl(): string {
        return `${rembgConfig.getBaseUrl()}/u2net_human_seg.onnx`;
    }

    /**
     * Get normalization parameters for U2Net Human Segmentation
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
     * Get the input tensor name for U2Net Human Segmentation
     */
    protected getInputName(): string {
        return 'input.1';
    }

    /**
     * Get the output shape for U2Net Human Segmentation
     */
    protected getOutputShape(): [number, number, number, number] {
        return [1, 1, 320, 320];
    }

    /**
     * Process U2Net Human Segmentation model outputs to create masks
     * Matches Python logic: pred = ort_outs[0][:, 0, :, :], min/max normalization, squeeze, resize
     */
    protected processOutputs(
        outputs: ort.InferenceSession.OnnxValueMapType,
        originalSize: { width: number; height: number }
    ): HTMLCanvasElement[] {
        // U2Net Human Segmentation outputs a single tensor with shape [1, 1, 320, 320]
        // Python: pred = ort_outs[0][:, 0, :, :]
        const outputTensor = outputs[Object.keys(outputs)[0]] as ort.Tensor;
        const outputData = outputTensor.data as Float32Array;

        // Process the output to create mask canvas
        // This matches the Python min/max normalization and squeeze logic
        const maskCanvas = processModelOutput(
            outputData,
            originalSize,
            this.getOutputShape()
        );

        return [maskCanvas];
    }

    /**
     * Get model name
     * Matches Python: return "u2net_human_seg"
     */
    static getName(): string {
        return 'u2net_human_seg';
    }
}
