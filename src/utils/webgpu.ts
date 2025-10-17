/**
 * WebGPU (Web Graphics Processing Unit) utilities for rembg-web
 *
 * Provides feature detection, configuration validation, and execution provider
 * management for WebGPU hardware acceleration support.
 */

import { SessionOptions } from '../sessions/base';
import { logInfo, logPerformance, logDebug, logWarn } from './logger';

/**
 * WebGPU power preference options.
 *
 * @example
 * ```typescript
 * const powerPref: WebGPUPowerPreference = 'high-performance';
 * const options = { webgpuPowerPreference: powerPref };
 * ```
 */
export type WebGPUPowerPreference =
    | 'default'
    | 'low-power'
    | 'high-performance';

/**
 * WebGPU configuration options.
 *
 * @example
 * ```typescript
 * const config: WebGPUConfig = {
 *   powerPreference: 'high-performance'
 * };
 * ```
 */
export interface WebGPUConfig {
    powerPreference: WebGPUPowerPreference;
}

/**
 * Check if WebGPU API is available in the current browser
 *
 * @returns true if WebGPU is supported, false otherwise
 *
 * @example
 * ```typescript
 * if (isWebGPUAvailable()) {
 *   console.log('WebGPU is supported!');
 * } else {
 *   console.log('WebGPU not available, using fallback');
 * }
 * ```
 */
export function isWebGPUAvailable(): boolean {
    try {
        // Check if the WebGPU API is available
        return (
            typeof navigator !== 'undefined' &&
            'gpu' in navigator &&
            typeof navigator.gpu === 'object' &&
            navigator.gpu !== null
        );
    } catch (error) {
        logDebug('WebGPU availability check failed:', error);
        return false;
    }
}

/**
 * Get the WebGPU device if available
 *
 * @param options - WebGPU adapter options
 * @returns Promise that resolves to GPUDevice or null if not available
 *
 * @example
 * ```typescript
 * const device = await getWebGPUDevice();
 * if (device) {
 *   console.log('WebGPU device available');
 * }
 * ```
 */
export async function getWebGPUDevice(
    options?: GPURequestAdapterOptions
): Promise<GPUDevice | null> {
    const startTime = performance.now();
    logInfo('[getWebGPUDevice] Requesting WebGPU device...');

    if (!isWebGPUAvailable()) {
        const totalTime = performance.now() - startTime;
        logPerformance(
            `[getWebGPUDevice] WebGPU not available: ${totalTime.toFixed(2)}ms`
        );
        return null;
    }

    try {
        // Request adapter
        const adapterRequestStart = performance.now();
        const adapter = await navigator.gpu?.requestAdapter(options);
        const adapterRequestTime = performance.now() - adapterRequestStart;
        logPerformance(
            `[getWebGPUDevice] Adapter request: ${adapterRequestTime.toFixed(2)}ms`
        );

        if (!adapter) {
            const totalTime = performance.now() - startTime;
            logPerformance(
                `[getWebGPUDevice] No adapter available: ${totalTime.toFixed(2)}ms`
            );
            return null;
        }

        // Request device
        const deviceRequestStart = performance.now();
        const device = await adapter.requestDevice();
        const deviceRequestTime = performance.now() - deviceRequestStart;
        logPerformance(
            `[getWebGPUDevice] Device request: ${deviceRequestTime.toFixed(2)}ms`
        );

        const totalTime = performance.now() - startTime;
        logPerformance(
            `[getWebGPUDevice] WebGPU device obtained: ${totalTime.toFixed(2)}ms`
        );

        return device;
    } catch (error) {
        const totalTime = performance.now() - startTime;
        logDebug(
            `[getWebGPUDevice] Failed to get WebGPU device (${totalTime.toFixed(2)}ms):`,
            error
        );
        return null;
    }
}

/**
 * Validate WebGPU configuration options
 *
 * @param options - Session options to validate
 * @returns true if configuration is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validateWebGPUConfig({
 *   preferWebGPU: true,
 *   webgpuPowerPreference: 'high-performance'
 * });
 * ```
 */
export function validateWebGPUConfig(options: SessionOptions): boolean {
    // Check power preference
    if (
        options?.webgpuPowerPreference &&
        !['default', 'low-power', 'high-performance'].includes(
            options.webgpuPowerPreference
        )
    ) {
        logWarn(
            `Invalid WebGPU power preference: ${options.webgpuPowerPreference}`
        );
        return false;
    }

    return true;
}

/**
 * Get WebGPU context options based on session configuration
 *
 * @param options - Session options
 * @returns WebGPU context options object
 *
 * @example
 * ```typescript
 * const contextOptions = getWebGPUContextOptions({
 *   webgpuPowerPreference: 'high-performance'
 * });
 * ```
 */
export function getWebGPUContextOptions(
    options: SessionOptions
): SessionOptions & Partial<WebGPUConfig> {
    const contextOptions: SessionOptions & Partial<WebGPUConfig> = {};

    if (options.webgpuPowerPreference) {
        contextOptions.powerPreference = options.webgpuPowerPreference;
    }

    return contextOptions;
}

/**
 * Get information about WebGPU support and capabilities
 *
 * @returns Object containing WebGPU support information
 *
 * @example
 * ```typescript
 * const info = await getWebGPUInfo();
 * console.log('WebGPU available:', info.available);
 * console.log('Adapter info:', info.adapterInfo);
 * ```
 */
export async function getWebGPUInfo(): Promise<{
    available: boolean;
    adapterInfo: GPUAdapterInfo | null;
    userAgent: string;
}> {
    const startTime = performance.now();
    logInfo('[getWebGPUInfo] Gathering WebGPU information...');

    const availabilityCheckStart = performance.now();
    const available = isWebGPUAvailable();
    const availabilityCheckTime = performance.now() - availabilityCheckStart;
    logPerformance(
        `[getWebGPUInfo] Availability check: ${availabilityCheckTime.toFixed(2)}ms`
    );

    let adapterInfo: GPUAdapterInfo | null = null;

    if (available) {
        try {
            const adapterRequestStart = performance.now();
            const adapter = await navigator.gpu?.requestAdapter();
            const adapterRequestTime = performance.now() - adapterRequestStart;
            logPerformance(
                `[getWebGPUInfo] Adapter request: ${adapterRequestTime.toFixed(2)}ms`
            );

            if (adapter && 'requestAdapterInfo' in adapter) {
                const infoRequestStart = performance.now();
                adapterInfo = (await (
                    adapter.requestAdapterInfo as unknown as () => Promise<GPUAdapterInfo>
                )()) as unknown as GPUAdapterInfo;
                const infoRequestTime = performance.now() - infoRequestStart;
                logPerformance(
                    `[getWebGPUInfo] Adapter info request: ${infoRequestTime.toFixed(2)}ms`
                );
            }
        } catch (error) {
            logDebug('[getWebGPUInfo] Failed to get adapter info:', error);
        }
    }

    const totalTime = performance.now() - startTime;
    logPerformance(
        `[getWebGPUInfo] Total info gathering: ${totalTime.toFixed(2)}ms (available: ${available})`
    );

    return {
        available,
        adapterInfo,
        userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
}

/**
 * Log WebGPU support information to console
 * Useful for debugging and user information
 *
 * @example
 * ```typescript
 * logWebGPUInfo();
 * // Outputs: "WebGPU Support: Available" or "WebGPU Support: Not Available"
 * ```
 */
export async function logWebGPUInfo(): Promise<void> {
    const info = await getWebGPUInfo();

    if (info.available) {
        logInfo('WebGPU Support: Available');
        if (info.adapterInfo) {
            logInfo(
                `WebGPU Adapter: ${info.adapterInfo.vendor} ${info.adapterInfo.architecture}`
            );
        }
    } else {
        logInfo('WebGPU Support: Not Available');
    }
}
