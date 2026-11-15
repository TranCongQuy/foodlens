// ============================================================================
// FoodLens — analyze-food Edge Function
// Nhận ảnh món ăn (base64) → Gemini vision ước lượng calo/dinh dưỡng theo
// schema → lưu food_analyses + ghi ai_logs (operation: analyze_food).
// Nguyên tắc (đặc tả mục 2/4): key AI chỉ ở server; NOT_A_FOOD không insert,
// không tính lượt; hạn mức 10 lượt/ngày/user (giờ Việt Nam).
// ============================================================================
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { callGeminiStructured, GeminiError } from '../_shared/gemini.ts';
import {
  FoodAnalysis,
  FoodAnalysisJsonSchema,
  FoodAnalysisLoose,
  FoodAnalysisLooseSchema,
  FoodAnalysisSchema,
} from '../_shared/schemas.ts';

// System prompt — nguyên văn đặc tả FoodLens mục 6
const SYSTEM_PROMPT = `Bạn là chuyên gia dinh dưỡng Việt Nam. Nhiệm vụ: nhìn ảnh món ăn/thức uống và ước lượng dinh dưỡng theo KHẨU PHẦN THỰC TẾ NHÌN THẤY trong ảnh (dĩa/tô/chén theo kích thước món Việt Nam thông thường). Quy tắc: (1) Chỉ phân tích thứ ăn/uống được; nếu ảnh không có món ăn, trả is_food=false. (2) Tên món dùng tên tiếng Việt phổ biến. (3) Calo và macro ước lượng theo bảng dinh dưỡng phổ thông, làm tròn hợp lý, KHÔNG phóng đại độ chính xác. (4) health_score 1–10 theo mật độ dinh dưỡng, lượng dầu mỡ/đường/muối, rau xanh đi kèm. (5) items liệt kê 2–6 thành phần chính kèm lượng ước lượng và calo từng phần; tổng calo các phần xấp xỉ calories. (6) tips tối đa 2 câu, thực tế, tiếng Việt. Chỉ trả JSON đúng schema, không thêm chữ nào ngoài JSON.`;

const DAILY_LIMIT = 10;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Đầu ngày hôm nay theo giờ Việt Nam (UTC+7), dạng ISO để so sánh với created_at
function startOfTodayVietnamIso(): string {
  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const startUtcMs =
    Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()) -
    7 * 60 * 60 * 1000;
  return new Date(startUtcMs).toISOString();
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();
  let currentUserId: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Authenticate Request (bắt buộc JWT, theo mẫu generate-story)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(
        { error: { code: 'UNAUTHORIZED', message: 'Thiếu Authorization header' } },
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse(
        { error: { code: 'UNAUTHORIZED', message: 'Phiên đăng nhập không hợp lệ' } },
        401
      );
    }
    currentUserId = user.id;

    // 2. Parse & Validate Payload
    const body = (await req.json()) as {
      image_base64?: string;
      mime_type?: string;
      thumbnail?: string;
    };
    const { image_base64: imageBase64, mime_type: mimeType, thumbnail } = body;

    if (!imageBase64 || !mimeType) {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'Thiếu image_base64 hoặc mime_type' } },
        400
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return jsonResponse(
        {
          error: {
            code: 'UNSUPPORTED_IMAGE',
            message: 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.',
          },
        },
        400
      );
    }

    // Kích thước giải mã xấp xỉ của base64 (mỗi 4 ký tự ≈ 3 byte)
    const approxBytes = Math.floor((imageBase64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return jsonResponse(
        {
          error: {
            code: 'IMAGE_TOO_LARGE',
            message: 'Ảnh quá lớn (tối đa 4MB). Vui lòng chọn ảnh nhỏ hơn.',
          },
        },
        400
      );
    }

    // 3. Hạn mức 10 lượt/ngày/user — đếm food_analyses trong ngày (giờ VN)
    const { count: todayCount } = await supabase
      .from('food_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .gte('created_at', startOfTodayVietnamIso());

    if ((todayCount ?? 0) >= DAILY_LIMIT) {
      return jsonResponse(
        {
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `Bạn đã dùng hết ${DAILY_LIMIT} lượt phân tích hôm nay. Hãy quay lại vào ngày mai nhé!`,
          },
        },
        429
      );
    }

    // 4. Gọi Gemini vision + validate schema (lỗi schema → thử lại 1 lần)
    let analysis: FoodAnalysis | null = null;
    let lastCall: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      latencyMs: number;
      estimatedCostUsd: number;
    } | null = null;

    for (let attempt = 0; attempt < 2 && !analysis; attempt++) {
      const result = await callGeminiStructured<FoodAnalysisLoose>({
        systemInstruction: SYSTEM_PROMPT,
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Hãy phân tích món ăn trong ảnh này và trả JSON đúng schema.' },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          },
        ],
        responseSchema: FoodAnalysisJsonSchema,
        temperature: 0.2,
      });
      lastCall = result;

      let loose: FoodAnalysisLoose;
      try {
        loose = FoodAnalysisLooseSchema.parse(result.data);
      } catch {
        continue; // JSON không khớp schema → thử lại (tối đa 1 lần lặp thêm)
      }

      // Không phải món ăn → NOT_A_FOOD: không insert, không tính lượt
      if (!loose.is_food) {
        await supabase.from('ai_logs').insert({
          user_id: currentUserId,
          story_id: null,
          action: 'analyze_food',
          model: result.model,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          latency_ms: Date.now() - startTime,
          estimated_cost_usd: result.estimatedCostUsd,
          status: 'error',
          error_code: 'NOT_A_FOOD',
        });

        return jsonResponse({
          code: 'NOT_A_FOOD',
          data: { is_food: false },
          message: 'Ảnh này không có món ăn nào. Bạn thử chụp lại món ăn nhé!',
        });
      }

      // is_food = true → bắt buộc đủ mọi trường theo schema chặt
      try {
        analysis = FoodAnalysisSchema.parse(loose);
      } catch {
        analysis = null; // thiếu trường → thử lại (tối đa 1 lần lặp thêm)
      }
    }

    if (!analysis || !lastCall) {
      throw new GeminiError(
        'AI trả về dữ liệu không đúng định dạng. Vui lòng thử lại.',
        'SCHEMA_ERROR',
        502
      );
    }

    // 5. Lưu lịch sử food_analyses
    const { data: inserted, error: insertError } = await supabase
      .from('food_analyses')
      .insert({
        user_id: currentUserId,
        dish_name: analysis.dish_name,
        confidence: analysis.confidence,
        calories: Math.round(analysis.calories),
        protein_g: analysis.protein_g,
        fat_g: analysis.fat_g,
        carbs_g: analysis.carbs_g,
        health_score: analysis.health_score,
        items: analysis.items,
        tips: analysis.tips,
        thumbnail: thumbnail ?? null,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      throw new Error('Không thể lưu kết quả phân tích: ' + insertError?.message);
    }

    // 6. Ghi ai_logs (Admin costs thấy được như generate-story)
    await supabase.from('ai_logs').insert({
      user_id: currentUserId,
      story_id: null,
      action: 'analyze_food',
      model: lastCall.model,
      input_tokens: lastCall.inputTokens,
      output_tokens: lastCall.outputTokens,
      latency_ms: Date.now() - startTime,
      estimated_cost_usd: lastCall.estimatedCostUsd,
      status: 'success',
      error_code: null,
    });

    return jsonResponse({
      data: {
        ...analysis,
        id: inserted.id,
        created_at: inserted.created_at,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    const code = (err as GeminiError)?.code || 'INTERNAL_ERROR';
    const status = (err as GeminiError)?.status || 500;

    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('ai_logs').insert({
        user_id: currentUserId,
        story_id: null,
        action: 'analyze_food',
        model: Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite',
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: Date.now() - startTime,
        estimated_cost_usd: 0,
        status: 'error',
        error_code: code,
      });
    } catch {
      // ignore logging failure
    }

    return jsonResponse(
      {
        error: {
          code,
          message: error.message || 'Đã xảy ra sự cố trong quá trình phân tích món ăn',
        },
      },
      status
    );
  }
});
