#!/usr/bin/env tsx

import https from 'https';
import fs from 'fs';
import path from 'path';

// Configuration
const REPO_OWNER = 'bunn-io';
const REPO_NAME = 'rembg-web';
const RELEASE_TAG = 'v1.0.0';
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// Model definitions with their expected file names and checksums
interface ModelInfo {
    name: string;
    size: string;
    description: string;
}

const MODELS: Record<string, ModelInfo> = {
    'u2net.onnx': {
        name: 'U2Net General Purpose',
        size: '~176MB',
        description: 'General-purpose background removal model',
    },
    'u2netp.onnx': {
        name: 'U2NetP Lightweight',
        size: '~4.7MB',
        description: 'Lightweight version of U2Net for faster processing',
    },
    'u2net_human_seg.onnx': {
        name: 'U2Net Human Segmentation',
        size: '~176MB',
        description: 'Optimized for human subjects',
    },
    'u2net_cloth_seg.onnx': {
        name: 'U2Net Cloth Segmentation',
        size: '~176MB',
        description: 'Specialized for clothing segmentation',
    },
    'isnet-general-use.onnx': {
        name: 'ISNet General Use',
        size: '~178MB',
        description: 'High accuracy general purpose model',
    },
    'isnet-anime.onnx': {
        name: 'ISNet Anime',
        size: '~178MB',
        description: 'Optimized for anime-style images',
    },
    'silueta.onnx': {
        name: 'Silueta',
        size: '~43MB',
        description: 'Silhouette-based background removal',
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

// Download file with progress
function downloadFile(
    url: string,
    filepath: string,
    expectedSize?: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        let downloadedBytes = 0;
        let totalSize = expectedSize;

        https
            .get(url, response => {
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
                    file.write(chunk);

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
                    file.end();
                    if (totalSize) {
                        process.stdout.write('\n');
                    }
                    resolve();
                });

                response.on('error', err => {
                    file.close();
                    fs.unlink(filepath, () => {}); // Delete partial file
                    reject(err);
                });
            })
            .on('error', err => {
                file.close();
                fs.unlink(filepath, () => {}); // Delete partial file
                reject(err);
            });
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

// Main function
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
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

            // Check if file already exists
            if (!force && isFileValid(filepath, asset.size)) {
                logSuccess(`Already downloaded: ${modelFile}`);
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
if (require.main === module) {
    main();
}

export { main, MODELS };
