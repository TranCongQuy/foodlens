import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

// In-memory rate limiting map: IP -> array of timestamps (ms)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(clientIp) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(clientIp, timestamps);
    return false;
  }

  timestamps.push(now);
  rateLimitMap.set(clientIp, timestamps);
  return true;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Phương thức không hợp lệ' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 1. Basic Rate Limiting by IP
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Bạn đang thao tác quá nhanh. Vui lòng đợi 1 phút rồi thử lại.',
        },
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 2. Parse and Validate Request Payload
    const body = await req.json().catch(() => null);
    const role = body?.role;

    if (role !== 'parent' && role !== 'admin') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_ROLE',
            message: 'Vai trò đăng nhập nhanh không hợp lệ. Chỉ chấp nhận parent hoặc admin.',
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Read Server-Side Demo Credentials from Environment Secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'CONFIG_ERROR',
            message: 'Máy chủ Edge Function thiếu cấu hình kết nối Supabase.',
          },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetEmail = role === 'admin' ? 'admin@drawtostory.vn' : 'me@phuhuynh.vn';
    const targetPassword =
      role === 'admin'
        ? Deno.env.get('DEMO_ADMIN_PASSWORD')
        : Deno.env.get('DEMO_PARENT_PASSWORD');

    if (!targetPassword) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'SECRET_MISSING',
            message: `Chưa thiết lập biến bí mật mật khẩu cho vai trò ${role} trên Edge Function Secrets.`,
          },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Authenticate server-side via Supabase GoTrue
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error: signInError } = await authClient.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });

    if (signInError || !data?.session) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'AUTH_FAILED',
            message: 'Đăng nhập phía máy chủ thất bại: tài khoản hoặc mật khẩu demo không hợp lệ.',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Return real GoTrue JWT Session to Client (Zero Password Leaked)
    return new Response(
      JSON.stringify({
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: `Lỗi xử lý đăng nhập nhanh: ${message}`,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
