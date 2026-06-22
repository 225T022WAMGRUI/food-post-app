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
