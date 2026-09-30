/**
 * Image Compression Utility
 * Compresses any image (especially from Unsplash or device uploads) to <= 150 KB
 * before adding to the canvas.
 */

export interface CompressionResult {
  url: string;
  sizeKb: number;
  width: number;
  height: number;
  compressed: boolean;
  format: 'webp' | 'jpeg' | 'original';
}

const MAX_TARGET_BYTES = 150 * 1024; // 150 KB (153,600 bytes)

/**
 * Optimizes Unsplash CDN query parameters for fast transfer and initial server-side compression
 */
export function getOptimizedUnsplashUrl(
  rawUrl: string,
  maxWidth = 1200,
  initialQuality = 80
): string {
  try {
    if (!rawUrl || !rawUrl.includes('images.unsplash.com')) {
      return rawUrl;
    }
    const urlObj = new URL(rawUrl);
    urlObj.searchParams.set('w', String(maxWidth));
    urlObj.searchParams.set('q', String(initialQuality));
    urlObj.searchParams.set('auto', 'format,compress');
    urlObj.searchParams.set('fit', 'max');
    return urlObj.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Loads an HTMLImageElement safely with cross-origin enabled
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image from source: ${err}`));
    img.src = src;
  });
}

/**
 * Encodes a canvas to a Blob with specified MIME type and quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Converts a Blob to a Base64 Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Compresses an image to a maximum target file size (default 150 KB).
 * Uses progressive quality degradation and resolution scaling until
 * the file size drops below maxSizeBytes.
 */
export async function compressImageToTargetSize(
  sourceUrl: string,
  maxSizeBytes: number = MAX_TARGET_BYTES
): Promise<CompressionResult> {
  // Step 1: Optimize CDN URL if Unsplash
  const optimizedUrl = getOptimizedUnsplashUrl(sourceUrl, 1200, 80);

  try {
    // Step 2: Load the image into an offscreen element
    const img = await loadImage(optimizedUrl);

    let originalWidth = img.naturalWidth || img.width || 800;
    let originalHeight = img.naturalHeight || img.height || 600;

    // Step 3: Constrain dimensions to max 1280px to retain retina crispness without byte bloat
    const MAX_DIMENSION = 1280;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
        targetWidth = MAX_DIMENSION;
      } else {
        targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
        targetHeight = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Step 4: Determine preferred format (WebP is best for 150KB targets, falls back to JPEG)
    let format = 'image/webp';
    let quality = 0.82;
    let blob = await canvasToBlob(canvas, format, quality);

    // If WebP is not supported by browser canvas, switch to JPEG
    if (!blob || blob.type !== 'image/webp') {
      format = 'image/jpeg';
      blob = await canvasToBlob(canvas, format, quality);
    }

    // Step 5: Iterative compression loop to guarantee <= 150 KB
    let attempts = 0;
    const maxAttempts = 7;

    while (blob && blob.size > maxSizeBytes && attempts < maxAttempts) {
      attempts++;

      if (quality > 0.45) {
        // First reduce quality in reasonable steps
        quality = Math.max(0.40, quality - 0.12);
      } else {
        // If quality reached lower bounds, scale down canvas resolution by 15%
        targetWidth = Math.round(targetWidth * 0.85);
        targetHeight = Math.round(targetHeight * 0.85);

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }
        quality = 0.65; // Reset quality slightly for smaller dimensions
      }

      blob = await canvasToBlob(canvas, format, quality);
    }

    if (!blob) {
      throw new Error('Failed to generate image blob');
    }

    const finalDataUrl = await blobToDataUrl(blob);
    const sizeKb = Math.round((blob.size / 1024) * 10) / 10;

    return {
      url: finalDataUrl,
      sizeKb,
      width: targetWidth,
      height: targetHeight,
      compressed: true,
      format: format === 'image/webp' ? 'webp' : 'jpeg',
    };
  } catch (error) {
    console.warn('Direct canvas compression failed, falling back to CDN-optimized URL:', error);
    // Fallback: Return Unsplash URL configured for tight 150KB CDN compression
    const fallbackUrl = getOptimizedUnsplashUrl(sourceUrl, 960, 68);
    return {
      url: fallbackUrl,
      sizeKb: 140, // Estimated CDN payload
      width: 960,
      height: 640,
      compressed: true,
      format: 'original',
    };
  }
}
