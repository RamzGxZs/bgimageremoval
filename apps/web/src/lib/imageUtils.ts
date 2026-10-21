export function loadImage(src: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));

    if (src instanceof Blob) {
      const url = URL.createObjectURL(src);
      img.src = url;
      // We should ideally revoke when done, or rely on GC after load
    } else {
      img.src = src;
    }
  });
}

export async function resizeImageIfNeeded(
  file: Blob,
  maxDimension = 2048
): Promise<{ blob: Blob; width: number; height: number; originalWidth: number; originalHeight: number }> {
  const img = await loadImage(file);
  const { naturalWidth: origW, naturalHeight: origH } = img;

  if (origW <= maxDimension && origH <= maxDimension) {
    return {
      blob: file,
      width: origW,
      height: origH,
      originalWidth: origW,
      originalHeight: origH,
    };
  }

  let targetW = origW;
  let targetH = origH;

  if (origW > origH) {
    targetW = maxDimension;
    targetH = Math.round((origH * maxDimension) / origW);
  } else {
    targetH = maxDimension;
    targetW = Math.round((origW * maxDimension) / origH);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create 2D canvas context for resizing');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const resizedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to convert canvas to blob'));
    }, file.type || 'image/png', 0.95);
  });

  return {
    blob: resizedBlob,
    width: targetW,
    height: targetH,
    originalWidth: origW,
    originalHeight: origH,
  };
}

export async function copyImageToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard?.write) {
    throw new Error('Clipboard API not supported in this browser');
  }

  // Ensure blob is PNG for clipboard compatibility
  let pngBlob = blob;
  if (blob.type !== 'image/png') {
    const img = await loadImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      pngBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || blob), 'image/png');
      });
    }
  }

  const item = new ClipboardItem({ 'image/png': pngBlob });
  await navigator.clipboard.write([item]);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
