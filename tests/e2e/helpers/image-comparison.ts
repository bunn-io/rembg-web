import { readFile } from 'fs/promises';
import { PNG } from 'pngjs';

declare global {
  interface Window {
    rembg: typeof import('rembg-web');
  }
}

/**
 * Load an image file as Uint8Array
 */
export async function loadImageAsUint8Array(path: string): Promise<Uint8Array> {
  const buffer = await readFile(path);
  return new Uint8Array(buffer);
}

/**
 * Decode PNG image data and return pixel information
 */
export function decodePNG(imageData: Uint8Array): {
  width: number;
  height: number;
  data: Buffer;
} {
  return PNG.sync.read(Buffer.from(imageData));
}

/**
 * Compare two images pixel by pixel
 * Returns comparison statistics
 */
export function compareImages(
  image1Data: Uint8Array,
  image2Data: Uint8Array,
  tolerance: number = 0
): {
  identical: boolean;
  totalPixels: number;
  differentPixels: number;
  percentageDifferent: number;
  maxDifference: number;
  averageDifference: number;
} {
  const png1 = decodePNG(image1Data);
  const png2 = decodePNG(image2Data);

  // Check dimensions
  if (png1.width !== png2.width || png1.height !== png2.height) {
    return {
      identical: false,
      totalPixels: 0,
      differentPixels: 1,
      percentageDifferent: 100,
      maxDifference: 255,
      averageDifference: 255,
    };
  }

  const { width, height } = png1;
  const totalPixels = width * height;
  let differentPixels = 0;
  let totalDifference = 0;
  let maxDifference = 0;

  // Compare each pixel
  for (let i = 0; i < totalPixels; i++) {
    const pixel1Start = i * 4;
    const pixel2Start = i * 4;

    // Compare RGBA values
    let pixelDifference = 0;
    for (let channel = 0; channel < 4; channel++) {
      const diff = Math.abs(
        png1.data[pixel1Start + channel] - png2.data[pixel2Start + channel]
      );
      pixelDifference = Math.max(pixelDifference, diff);
    }

    if (pixelDifference > tolerance) {
      differentPixels++;
    }

    totalDifference += pixelDifference;
    maxDifference = Math.max(maxDifference, pixelDifference);
  }

  const averageDifference = totalPixels > 0 ? totalDifference / totalPixels : 0;
  const percentageDifferent =
    totalPixels > 0 ? (differentPixels / totalPixels) * 100 : 0;

  return {
    identical: differentPixels === 0,
    totalPixels,
    differentPixels,
    percentageDifferent,
    maxDifference,
    averageDifference,
  };
}

/**
 * Compare two images with strict pixel matching
 * Returns true if images are identical within tolerance
 */
export function areImagesIdentical(
  image1Data: Uint8Array,
  image2Data: Uint8Array,
  tolerance: number = 0
): boolean {
  const comparison = compareImages(image1Data, image2Data, tolerance);
  return comparison.identical;
}

/**
 * Load expected result image from source-results folder
 */
export async function loadExpectedResult(
  fixtureName: string,
  modelName: string
): Promise<Uint8Array> {
  const path = `/home/boldizsar-pal/fun/rembg-rewrite/rembg-web/public/calculated-results/${fixtureName}.${modelName}.png`;
  return loadImageAsUint8Array(path);
}
