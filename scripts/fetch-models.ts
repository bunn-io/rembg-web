#!/usr/bin/env tsx

import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
// https://github.com/bunn-io/rembg-web/releases/download/base-models/isnet-anime.onnx
// Configuration
const REPO_OWNER = 'bunn-io';
const REPO_NAME = 'rembg-web';
const RELEASE_TAG = 'base-models';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// Model definitions with their expected file names and checksums
interface ModelInfo {
    name: string;
    size: string;
    description: string;
    expectedHash?: string;
}

const ISNET_ANIME_HASH =
    'sha256:f15622d853e8260172812b657053460e20806f04b9e05147d49af7bed31a6e99';
const ISNET_GENERAL_USE_HASH =
    'sha256:60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a';
const SILUETA_HASH =
    'sha256:75da6c8d2f8096ec743d071951be73b4a8bc7b3e51d9a6625d63644f90ffeedb';
const U2NET_HASH =
    'sha256:8d10d2f3bb75ae3b6d527c77944fc5e7dcd94b29809d47a739a7a728a912b491';
const U2NETP_HASH =
    'sha256:309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8';
const U2NET_HUMAN_SEG_HASH =
    'sha256:01eb6a29a5c4d8edb30b56adad9bb3a2a0535338e480724a213e0acfd2d1c73c';
const U2NET_CLOTH_SEG_HASH =
    'sha256:6d2cbc27bfbdc989e1fd325656d65902ecc6a3ccbe94b2d3655ec114efcb128e';

const MODELS: Record<string, ModelInfo> = {
    'u2net.onnx': {
        name: 'U2Net General Purpose',
        size: '~176MB',
        description: 'General-purpose background removal model',
        expectedHash: U2NET_HASH,
    },
    'u2netp.onnx': {
        name: 'U2NetP Lightweight',
        size: '~4.7MB',
        description: 'Lightweight version of U2Net for faster processing',
        expectedHash: U2NETP_HASH,
    },
    'u2net_human_seg.onnx': {
        name: 'U2Net Human Segmentation',
        size: '~176MB',
        description: 'Optimized for human subjects',
        expectedHash: U2NET_HUMAN_SEG_HASH,
    },
    'u2net_cloth_seg.onnx': {
        name: 'U2Net Cloth Segmentation',
        size: '~176MB',
        description: 'Specialized for clothing segmentation',
        expectedHash: U2NET_CLOTH_SEG_HASH,
    },
    'isnet-general-use.onnx': {
        name: 'ISNet General Use',
        size: '~178MB',
        description: 'High accuracy general purpose model',
        expectedHash: ISNET_GENERAL_USE_HASH,
    },
    'isnet-anime.onnx': {
        name: 'ISNet Anime',
        size: '~178MB',
        description: 'Optimized for anime-style images',
        expectedHash: ISNET_ANIME_HASH,
    },
    'silueta.onnx': {
        name: 'Silueta',
        size: '~43MB',
        description: 'Silhouette-based background removal',
        expectedHash: SILUETA_HASH,
    },
};

// GitHub API types
interface GitHubAsset {
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string;
}

interface GitHubRelease {
    tag_name: string;
    assets: GitHubAsset[];
}

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
} as const;

type ColorKey = keyof typeof colors;

function log(message: string, color: ColorKey = 'reset'): void {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message: string): void {
    log(`❌ Error: ${message}`, 'red');
}

function logSuccess(message: string): void {
    log(`✅ ${message}`, 'green');
}

function logInfo(message: string): void {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message: string): void {
    log(`⚠️  ${message}`, 'yellow');
}

// Create progress bar
function createProgressBar(
    current: number,
    total: number,
    width: number = 30
): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    return `[${bar}] ${percentage}%`;
}

// Download file with progress and redirect handling
function downloadFile(
    url: string,
    filepath: string,
    expectedSize?: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        let file: fs.WriteStream | null = null;
        let downloadedBytes = 0;
        let totalSize = expectedSize;

        const makeRequest = (requestUrl: string) => {
            // Create new file stream for each request
            if (file) {
                file.close();
            }
            file = fs.createWriteStream(filepath);

            https
                .get(requestUrl, response => {
                    // Handle redirects (301, 302, 303, 307, 308)
                    if (
                        response.statusCode &&
                        response.statusCode >= 300 &&
                        response.statusCode < 400
                    ) {
                        const location = response.headers.location;
                        if (location) {
                            logInfo(`Following redirect to: ${location}`);
                            response.destroy(); // Close the current response
                            makeRequest(location);
                            return;
                        } else {
                            reject(
                                new Error(
                                    `HTTP ${response.statusCode}: ${response.statusMessage} - No redirect location`
                                )
                            );
                            return;
                        }
                    }

                    if (response.statusCode !== 200) {
                        reject(
                            new Error(
                                `HTTP ${response.statusCode}: ${response.statusMessage}`
                            )
                        );
                        return;
                    }

                    if (!totalSize && response.headers['content-length']) {
                        totalSize = parseInt(
                            response.headers['content-length'],
                            10
                        );
                    }

                    response.on('data', chunk => {
                        downloadedBytes += chunk.length;
                        if (file) {
                            file.write(chunk);
                        }

                        if (totalSize) {
                            const progress = createProgressBar(
                                downloadedBytes,
                                totalSize
                            );
                            process.stdout.write(
                                `\r  ${progress} ${(downloadedBytes / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB`
                            );
                        }
                    });

                    response.on('end', () => {
                        if (file) {
                            file.end();
                        }
                        if (totalSize) {
                            process.stdout.write('\n');
                        }
                        resolve();
                    });

                    response.on('error', err => {
                        if (file) {
                            file.close();
                        }
                        fs.unlink(filepath, () => {}); // Delete partial file
                        reject(err);
                    });
                })
                .on('error', err => {
                    if (file) {
                        file.close();
                    }
                    fs.unlink(filepath, () => {}); // Delete partial file
                    reject(err);
                });
        };

        makeRequest(url);
    });
}

// Get GitHub release assets
async function getReleaseAssets(): Promise<GitHubAsset[]> {
    return new Promise((resolve, reject) => {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${RELEASE_TAG}`;

        https
            .get(
                url,
                {
                    headers: {
                        'User-Agent': 'rembg-web-fetch-models',
                        Accept: 'application/vnd.github.v3+json',
                    },
                },
                response => {
                    let data = '';

                    response.on('data', chunk => {
                        data += chunk;
                    });

                    response.on('end', () => {
                        try {
                            const release: GitHubRelease = JSON.parse(data);
                            if (response.statusCode !== 200) {
                                reject(
                                    new Error(
                                        `Failed to fetch release: ${(release as unknown as { message: string }).message || 'Unknown error'}`
                                    )
                                );
                                return;
                            }
                            resolve(release.assets);
                        } catch (err) {
                            reject(
                                new Error(
                                    `Failed to parse release data: ${(err as Error).message}`
                                )
                            );
                        }
                    });
                }
            )
            .on('error', reject);
    });
}

// Find asset by filename
function findAsset(
    assets: GitHubAsset[],
    filename: string
): GitHubAsset | undefined {
    return assets.find(asset => asset.name === filename);
}

// Check if file exists and has correct size
function isFileValid(filepath: string, expectedSize?: number): boolean {
    if (!fs.existsSync(filepath)) {
        return false;
    }

    const stats = fs.statSync(filepath);
    if (expectedSize && stats.size !== expectedSize) {
        return false;
    }

    return true;
}

// Check if file exists, has correct size, and valid hash
async function isFileValidWithHash(
    filepath: string,
    expectedSize?: number,
    expectedHash?: string
): Promise<boolean> {
    if (!isFileValid(filepath, expectedSize)) {
        return false;
    }

    if (expectedHash) {
        const isValidHash = await validateFileHash(filepath, expectedHash);
        if (!isValidHash) {
            logWarning(`Hash validation failed for ${path.basename(filepath)}`);
            return false;
        }
    }

    return true;
}

// Calculate SHA256 hash of a file
function calculateFileHash(filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filepath);

        stream.on('data', data => {
            hash.update(data);
        });

        stream.on('end', () => {
            const fileHash = hash.digest('hex');
            resolve(`sha256:${fileHash}`);
        });

        stream.on('error', err => {
            reject(err);
        });
    });
}

// Validate file hash against expected hash
async function validateFileHash(
    filepath: string,
    expectedHash: string
): Promise<boolean> {
    try {
        const actualHash = await calculateFileHash(filepath);
        return actualHash === expectedHash;
    } catch (err) {
        logError(
            `Failed to calculate hash for ${filepath}: ${(err as Error).message}`
        );
        return false;
    }
}

// Main function
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const validate = args.includes('--validate');
    const specificModel = args.find(arg => !arg.startsWith('--'));

    log('🚀 rembg-web Model Downloader', 'bright');
    log(`Repository: ${REPO_OWNER}/${REPO_NAME}`, 'cyan');
    log(`Release: ${RELEASE_TAG}`, 'cyan');
    log('');

    // Create models directory
    if (!fs.existsSync(MODELS_DIR)) {
        fs.mkdirSync(MODELS_DIR, { recursive: true });
        logInfo(`Created directory: ${MODELS_DIR}`);
    }

    // Handle validation-only mode
    if (validate) {
        logInfo('Running hash validation on existing files...');

        const modelsToValidate = specificModel
            ? [specificModel]
            : Object.keys(MODELS);

        let validCount = 0;
        let invalidCount = 0;

        for (const modelFile of modelsToValidate) {
            if (!MODELS[modelFile]) {
                logWarning(`Unknown model: ${modelFile}`);
                continue;
            }

            const modelInfo = MODELS[modelFile];
            const filepath = path.join(MODELS_DIR, modelFile);

            log(`\n🔍 Validating ${modelInfo.name}`, 'bright');

            if (!fs.existsSync(filepath)) {
                logError(`File not found: ${modelFile}`);
                invalidCount++;
                continue;
            }

            if (modelInfo.expectedHash) {
                const isValidHash = await validateFileHash(
                    filepath,
                    modelInfo.expectedHash
                );
                if (isValidHash) {
                    logSuccess(`Hash validation passed: ${modelFile}`);
                    validCount++;
                } else {
                    logError(`Hash validation failed: ${modelFile}`);
                    invalidCount++;
                }
            } else {
                logWarning(`No expected hash defined for ${modelFile}`);
                validCount++;
            }
        }

        log('\n📊 Validation Summary:', 'bright');
        log(`   Valid: ${validCount} models`, 'green');
        log(`   Invalid: ${invalidCount} models`, 'red');

        if (invalidCount > 0) {
            log(
                '\n💡 Tip: Run with --force to re-download invalid files',
                'yellow'
            );
        }

        return;
    }

    try {
        logInfo('Fetching release information...');
        const assets = await getReleaseAssets();

        if (assets.length === 0) {
            logError(`No assets found in release ${RELEASE_TAG}`);
            logInfo(
                'Make sure the release exists and contains ONNX model files.'
            );
            process.exit(1);
        }

        logSuccess(`Found ${assets.length} assets in release`);

        // Filter models to download
        const modelsToDownload = specificModel
            ? [specificModel]
            : Object.keys(MODELS);

        let downloadedCount = 0;
        let skippedCount = 0;

        for (const modelFile of modelsToDownload) {
            if (!MODELS[modelFile]) {
                logWarning(`Unknown model: ${modelFile}`);
                continue;
            }

            const modelInfo = MODELS[modelFile];
            const filepath = path.join(MODELS_DIR, modelFile);
            const asset = findAsset(assets, modelFile);

            if (!asset) {
                logError(`Model ${modelFile} not found in release assets`);
                continue;
            }

            log(`\n📦 ${modelInfo.name}`, 'bright');
            log(`   ${modelInfo.description}`);
            log(`   Size: ${modelInfo.size}`);

            // Check if file already exists and is valid (including hash validation)
            if (
                !force &&
                (await isFileValidWithHash(
                    filepath,
                    asset.size,
                    modelInfo.expectedHash
                ))
            ) {
                logSuccess(`Already downloaded and validated: ${modelFile}`);
                skippedCount++;
                continue;
            }

            if (force && fs.existsSync(filepath)) {
                logInfo(`Force re-downloading: ${modelFile}`);
                fs.unlinkSync(filepath);
            }

            try {
                logInfo(`Downloading ${modelFile}...`);
                await downloadFile(
                    asset.browser_download_url,
                    filepath,
                    asset.size
                );

                // Validate downloaded file hash if expected hash is provided
                if (modelInfo.expectedHash) {
                    logInfo(`Validating hash for ${modelFile}...`);
                    const isValidHash = await validateFileHash(
                        filepath,
                        modelInfo.expectedHash
                    );
                    if (!isValidHash) {
                        logError(
                            `Hash validation failed for ${modelFile}. File may be corrupted.`
                        );
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath);
                        }
                        continue;
                    }
                    logSuccess(`Hash validation passed for ${modelFile}`);
                }

                logSuccess(`Downloaded: ${modelFile}`);
                downloadedCount++;
            } catch (err) {
                logError(
                    `Failed to download ${modelFile}: ${(err as Error).message}`
                );
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            }
        }

        log('\n📊 Summary:', 'bright');
        log(`   Downloaded: ${downloadedCount} models`, 'green');
        log(`   Skipped: ${skippedCount} models`, 'yellow');

        if (downloadedCount > 0) {
            log('\n🎉 Models downloaded successfully!', 'green');
            logInfo('You can now use rembg-web with the downloaded models.');
        } else if (skippedCount > 0) {
            log('\n✨ All models are already up to date!', 'green');
        }

        log('\n💡 Usage:', 'bright');
        log('   yarn fetch-models          # Download all models');
        log('   yarn fetch-models --force  # Re-download all models');
        log('   yarn fetch-models --validate  # Validate existing models');
        log('   yarn fetch-models u2net.onnx  # Download specific model');
    } catch (err) {
        logError(`Failed to download models: ${(err as Error).message}`);
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('uncaughtException', err => {
    logError(`Uncaught exception: ${err.message}`);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    logError(`Unhandled rejection: ${(err as Error).message}`);
    process.exit(1);
});

// Run main function
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main, MODELS };
