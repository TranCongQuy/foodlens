// ============================================================================
// data.ts — Adapter dữ liệu FoodLens, 2 chế độ qua env (tiền lệ Thám Tử AI):
//   VITE_FOODLENS_BACKEND=supabase (MẶC ĐỊNH): gọi Edge Function analyze-food
//     qua Supabase + đọc lịch sử từ bảng food_analyses (RLS).
//   VITE_FOODLENS_BACKEND=local: bộ phân tích mẫu ngay phía client, lịch sử
//     lưu localStorage. CHỈ để chạy thử UI trên máy bị chặn POST ra Supabase
//     Functions — không dùng cho production.
// ============================================================================
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { validateFoodAnalysis } from './logic';
import type { FoodAnalysis, FoodAnalysisRecord } from './types';

export type FoodLensBackend = 'supabase' | 'local';
export const FOODLENS_BACKEND: FoodLensBackend =
  import.meta.env.VITE_FOODLENS_BACKEND === 'local' ? 'local' : 'supabase';

export interface AnalyzeInput {
  imageBase64: string;
  mimeType: string;
  thumbnailDataUrl: string;
  /** true khi ảnh đến từ nút "Dùng ảnh mẫu" (chỉ dùng ở chế độ local) */
  isSample?: boolean;
}

export type AnalyzeOutcome =
  | { kind: 'ok'; record: FoodAnalysisRecord }
  | { kind: 'not_food' };

export class FoodLensError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'FoodLensError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Chế độ SUPABASE (đường thật)
// ---------------------------------------------------------------------------
async function analyzeViaSupabase(input: AnalyzeInput): Promise<AnalyzeOutcome> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new FoodLensError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/analyze-food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        image_base64: input.imageBase64,
        mime_type: input.mimeType,
        thumbnail: input.thumbnailDataUrl,
      }),
    });
  } catch {
    throw new FoodLensError(
      'AI_NETWORK_ERROR',
      'Không kết nối được tới máy chủ phân tích. Vui lòng kiểm tra mạng và thử lại.'
    );
  }

  const json = (await response.json().catch(() => null)) as {
    code?: string;
    data?: Record<string, unknown>;
    error?: { code?: string; message?: string };
  } | null;

  if (json?.code === 'NOT_A_FOOD') {
    return { kind: 'not_food' };
  }

  if (!response.ok || !json?.data) {
    if (response.status === 404) {
      throw new FoodLensError(
        'EDGE_FUNCTION_NOT_DEPLOYED',
        'Máy chủ phân tích (Edge Function analyze-food) chưa được triển khai. Quản trị viên vui lòng chạy: supabase functions deploy analyze-food.'
      );
    }
    throw new FoodLensError(
      json?.error?.code || 'EDGE_FUNCTION_ERROR',
      json?.error?.message || 'Không thể phân tích món ăn lúc này. Vui lòng thử lại sau giây lát.'
    );
  }

  const analysis = validateFoodAnalysis(json.data);
  if (!analysis) {
    throw new FoodLensError('SCHEMA_ERROR', 'Kết quả phân tích không đúng định dạng. Vui lòng thử lại.');
  }

  return {
    kind: 'ok',
    record: {
      ...analysis,
      id: typeof json.data.id === 'string' ? json.data.id : crypto.randomUUID(),
      created_at:
        typeof json.data.created_at === 'string' ? json.data.created_at : new Date().toISOString(),
      thumbnail: input.thumbnailDataUrl,
    },
  };
}

async function fetchHistoryViaSupabase(): Promise<FoodAnalysisRecord[]> {
  const { data, error } = await supabase
    .from('food_analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new FoodLensError('HISTORY_ERROR', 'Không tải được lịch sử phân tích.');
  return ((data as Array<Record<string, unknown>> | null) || [])
    .map((row) => {
      const analysis = validateFoodAnalysis({ ...row, is_food: true });
      if (!analysis) return null;
      return {
        ...analysis,
        id: String(row.id),
        created_at: String(row.created_at),
        thumbnail: typeof row.thumbnail === 'string' ? row.thumbnail : null,
      } as FoodAnalysisRecord;
    })
    .filter((r): r is FoodAnalysisRecord => r !== null);
}

// ---------------------------------------------------------------------------
// Chế độ LOCAL (chỉ dev/test UI — dữ liệu mẫu, không gọi AI thật)
// ---------------------------------------------------------------------------
const LOCAL_HISTORY_KEY = 'foodlens_history_v1';
const MAX_HISTORY = 20;

/** Kết quả cố định cho ảnh mẫu phở — khớp ví dụ mục 5 của đặc tả */
export const LOCAL_PHOTO_SAMPLE: FoodAnalysis = {
  is_food: true,
  dish_name: 'Phở bò tái nạm',
  confidence: 0.92,
  portion_desc: '1 tô vừa (~500ml)',
  calories: 480,
  protein_g: 28,
  fat_g: 12,
  carbs_g: 62,
  health_score: 7,
  items: [
    { name: 'Bánh phở', amount: '~200g', calories: 220 },
    { name: 'Thịt bò', amount: '~80g', calories: 150 },
    { name: 'Nước dùng phở', amount: '~300ml', calories: 60 },
    { name: 'Rau thơm & giá đỗ', amount: '~50g', calories: 50 },
  ],
  tips: 'Ít nước béo và thêm rau thơm sẽ giảm ~60 kcal.',
};

/** Kết quả mẫu chung cho mọi ảnh khác ở chế độ local */
const LOCAL_GENERIC_SAMPLE: FoodAnalysis = {
  is_food: true,
  dish_name: 'Món ăn Việt Nam (kết quả mẫu — chế độ local)',
  confidence: 0.5,
  portion_desc: '1 phần vừa',
  calories: 520,
  protein_g: 22,
  fat_g: 18,
  carbs_g: 64,
  health_score: 6,
  items: [
    { name: 'Thành phần chính (mẫu)', amount: '~250g', calories: 300 },
    { name: 'Rau & phụ liệu (mẫu)', amount: '~100g', calories: 90 },
    { name: 'Nước sốt & gia vị (mẫu)', amount: 'vừa đủ', calories: 130 },
  ],
  tips: 'Đây là dữ liệu mẫu ở chế độ local — kết nối backend Supabase để AI phân tích thật từ ảnh của bạn.',
};

function readLocalHistory(): FoodAnalysisRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        if (typeof row !== 'object' || row === null) return null;
        const record = row as Record<string, unknown>;
        const analysis = validateFoodAnalysis(record);
        if (!analysis) return null;
        return {
          ...analysis,
          id: String(record.id ?? ''),
          created_at: String(record.created_at ?? ''),
          thumbnail: typeof record.thumbnail === 'string' ? record.thumbnail : null,
        } as FoodAnalysisRecord;
      })
      .filter((r): r is FoodAnalysisRecord => r !== null);
  } catch {
    return [];
  }
}

function saveLocalRecord(record: FoodAnalysisRecord): void {
  try {
    const next = [record, ...readLocalHistory()].slice(0, MAX_HISTORY);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // localStorage đầy/không khả dụng — bỏ qua, kết quả vẫn hiển thị
  }
}

async function analyzeViaLocal(input: AnalyzeInput): Promise<AnalyzeOutcome> {
  // Mô phỏng thời gian chờ AI để UI trạng thái "đang phân tích" hiện đúng
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const analysis = input.isSample ? LOCAL_PHOTO_SAMPLE : LOCAL_GENERIC_SAMPLE;
  const record: FoodAnalysisRecord = {
    ...analysis,
    items: analysis.items.map((item) => ({ ...item })),
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    thumbnail: input.thumbnailDataUrl,
  };
  saveLocalRecord(record);
  return { kind: 'ok', record };
}

// ---------------------------------------------------------------------------
// API thống nhất cho trang FoodLens
// ---------------------------------------------------------------------------
export function analyzeFood(input: AnalyzeInput): Promise<AnalyzeOutcome> {
  return FOODLENS_BACKEND === 'local' ? analyzeViaLocal(input) : analyzeViaSupabase(input);
}

export function fetchFoodHistory(): Promise<FoodAnalysisRecord[]> {
  return FOODLENS_BACKEND === 'local'
    ? Promise.resolve(readLocalHistory())
    : fetchHistoryViaSupabase();
}
