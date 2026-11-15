// ============================================================================
// FoodLens — xử lý ảnh phía client (đặc tả mục 7):
//   - Ảnh gửi AI: nén canvas, cạnh dài nhất 1024px, JPEG 0.85
//   - Thumbnail lưu lịch sử: cạnh dài nhất 320px, data URL ≤ 80KB
// ============================================================================

export interface PreparedImage {
  /** base64 (không có tiền tố data:) của ảnh đã nén để gửi Edge Function */
  base64: string;
  mimeType: 'image/jpeg';
  /** data URL của ảnh đã nén (để hiển thị ngay trên thẻ kết quả) */
  dataUrl: string;
  /** data URL thumbnail ≤ 80KB (lưu vào lịch sử) */
  thumbnailDataUrl: string;
}

const MAX_EDGE = 1024;
const THUMB_MAX_EDGE = 320;
const THUMB_MAX_LENGTH = 80 * 1024; // độ dài chuỗi data URL ~ 80KB

function drawScaled(img: HTMLImageElement, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh (canvas).');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/** Nén một Blob ảnh thành ảnh gửi AI + thumbnail lịch sử */
export async function prepareImageFromBlob(blob: Blob): Promise<PreparedImage> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Không đọc được file ảnh này.'));
      el.src = objectUrl;
    });

    const mainCanvas = drawScaled(img, MAX_EDGE);
    const dataUrl = mainCanvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1] || '';

    const thumbCanvas = drawScaled(img, THUMB_MAX_EDGE);
    let thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
    for (const quality of [0.55, 0.4, 0.25]) {
      if (thumbnailDataUrl.length <= THUMB_MAX_LENGTH) break;
      thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', quality);
    }

    return { base64, mimeType: 'image/jpeg', dataUrl, thumbnailDataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Ảnh mẫu phở đóng gói sẵn trong public/assets/foodlens/ */
export const SAMPLE_IMAGE_URL = '/assets/foodlens/pho-mau.webp';

export async function prepareSampleImage(): Promise<PreparedImage> {
  const res = await fetch(SAMPLE_IMAGE_URL);
  if (!res.ok) throw new Error('Không tải được ảnh mẫu.');
  const blob = await res.blob();
  return prepareImageFromBlob(blob);
}
