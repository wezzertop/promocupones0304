
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export async function analyzeImage(file: File): Promise<{ valid: boolean; reason?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;

      // 1. Resolución mínima
      if (width < 300 || height < 300) {
        resolve({ valid: false, reason: 'La imagen es demasiado pequeña. Mínimo 300x300px.' });
        return;
      }

      // 2. Relación de aspecto extrema
      if (aspectRatio < 0.4 || aspectRatio > 2.5) {
        resolve({ valid: false, reason: 'La imagen es demasiado alta o ancha. Usa una proporción más estándar.' });
        return;
      }

      resolve({ valid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, reason: 'No se pudo leer la imagen.' });
    };
  });
}

export async function compressImage(
  file: File, 
  quality = 0.85, // Aumentamos un poco la calidad base
  maxWidth = 1920, // Full HD como estándar
  format: 'image/jpeg' | 'image/webp' = 'image/webp' // Preferir WebP
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate aspect ratio
        const ratio = width / height;

        // Smart resizing: Only downscale if larger than maxWidth
        if (width > maxWidth) {
          width = maxWidth;
          height = width / ratio;
        }

        // Additional Logic: If height is too big (e.g. huge vertical screenshot), limit height too
        if (height > maxWidth) {
          height = maxWidth;
          width = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Better quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Background for transparent images (if converting to JPEG)
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          format,
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

export async function processAvatar(file: File): Promise<File> {
  // Avatar specific processing: Square, max 400px, WebP, strip metadata (canvas does this automatically)
  const blob = await compressImage(file, 0.9, 400, 'image/webp');
  return new File([blob], 'avatar.webp', { type: 'image/webp' });
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
