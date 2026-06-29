import { Area } from 'react-easy-crop';

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to the cropped area size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Calculate the center of the original image
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  // Save the context state
  ctx.save();

  // Move the canvas origin to the center of the cropped area
  ctx.translate(pixelCrop.width / 2, pixelCrop.height / 2);

  // Rotate the canvas if needed
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  // Draw the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    -pixelCrop.width / 2,
    -pixelCrop.height / 2,
    pixelCrop.width,
    pixelCrop.height
  );

  // Restore the context state
  ctx.restore();

  // Return as a Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * High-quality crop function for post images
 * Outputs at 1080x1080px (optimal for social media)
 * Uses adaptive quality based on output size
 */
export async function getCroppedPostImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0,
  isPreview: boolean = false
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Target size for output (1080x1080 for high quality, smaller for preview)
  const targetSize = isPreview ? 256 : 1080;

  // Set canvas size
  canvas.width = targetSize;
  canvas.height = targetSize;

  // Enable image smoothing for high quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill with white background (for transparent images)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate scale factor to fit cropped area to target size
  const scaleX = pixelCrop.width / targetSize;
  const scaleY = pixelCrop.height / targetSize;

  // Save context state
  ctx.save();

  // Move to center of canvas
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Apply rotation if needed
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  // Draw the cropped region scaled to target size
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    -targetSize / 2,
    -targetSize / 2,
    targetSize,
    targetSize
  );

  // Restore context state
  ctx.restore();

  // Adaptive quality: higher for final, lower for preview
  const quality = isPreview ? 0.7 : 0.92;
  const mimeType = 'image/jpeg';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}
