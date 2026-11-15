import React, { useEffect, useState } from 'react';
import {
  Scan,
  Scale,
  HeartHandshake,
  Lock,
  ClipboardList,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Trang Minh bach AI cua FoodLens: giai thich cach AI phan tich mon an,
// so lieu that lay tu food_analyses + ai_logs (RLS: user thay cua minh, admin thay tat ca).
export const TrustPage: React.FC = () => {
  const [stats, setStats] = useState<{
    totalAnalyses: number;
    avgConfidenceText: string;
    avgLatencyText: string;
  }>({
    totalAnalyses: 0,
    avgConfidenceText: '—',
    avgLatencyText: '—',
  });

  useEffect(() => {
    async function loadRealStats() {
      try {
        const [{ count: totalCount, data: confRows }, { data: latencyLogs }] =
          await Promise.all([
            supabase
              .from('food_analyses')
              .select('confidence', { count: 'exact' })
              .limit(200),
            supabase
              .from('ai_logs')
              .select('latency_ms')
              .eq('action', 'analyze_food')
              .limit(200),
          ]);

        const total = typeof totalCount === 'number' ? totalCount : 0;

        const confidences = (confRows || [])
          .map((r) => Number((r as { confidence?: number }).confidence) || 0)
          .filter((c) => c > 0);
        const avgConfidenceText =
          confidences.length > 0
            ? `${Math.round(
                (confidences.reduce((a, c) => a + c, 0) / confidences.length) * 100
              )}%`
            : 'Chưa có dữ liệu';

        const latencies = (latencyLogs || [])
          .map((l) => Number((l as { latency_ms?: number }).latency_ms) || 0)
          .filter((ms) => ms > 0);
        const avgLatencyText =
          latencies.length > 0
            ? `${(latencies.reduce((a, ms) => a + ms, 0) / latencies.length / 1000).toFixed(1)}s`
            : 'Chưa có dữ liệu';

        setStats({ totalAnalyses: total, avgConfidenceText, avgLatencyText });
      } catch (err) {
        console.error('Failed to load FoodLens stats from Supabase:', err);
        setStats({
          totalAnalyses: 0,
          avgConfidenceText: 'Chưa có dữ liệu',
          avgLatencyText: 'Chưa có dữ liệu',
        });
      }
    }

    loadRealStats();
  }, []);

  const layers = [
    {
      step: 'Bước 1',
      title: 'Nhận diện món ăn bằng AI thị giác',
      subtitle: 'Ảnh được gửi thẳng tới mô hình Gemini trên máy chủ',
      icon: Scan,
      badge: 'Phân Tích Ảnh',
      variant: 'mint' as const,
      description:
        'Khi bạn chụp hoặc tải ảnh lên, ảnh được gửi tới Edge Function analyze-food và mô hình AI thị giác nhận diện món ăn, các thành phần chính và khẩu phần nhìn thấy. Nếu ảnh không chứa món ăn nào, hệ thống từ chối phân tích và KHÔNG tính vào hạn mức ngày của bạn.',
      example:
        'Ví dụ thật: gửi ảnh chụp màn hình giao diện máy tính, FoodLens trả về "Ảnh này không có món ăn nào" và không lưu gì vào lịch sử.',
    },
    {
      step: 'Bước 2',
      title: 'Ước lượng calo & dinh dưỡng theo khẩu phần',
      subtitle: 'Con số là ước lượng có độ tin cậy đi kèm, không phải phép đo',
      icon: Scale,
      badge: 'Ước Lượng Minh Bạch',
      variant: 'sky' as const,
      description:
        'Calo, đạm, béo và tinh bột được AI ước lượng theo khẩu phần thực tế nhìn thấy trong ảnh dựa trên bảng dinh dưỡng phổ thông của món Việt. Mỗi kết quả đều kèm độ tin cậy nhận diện, và bạn có thể chỉnh hệ số khẩu phần ×0.5 / ×1 / ×1.5 / ×2 nếu phần ăn thật khác với ảnh.',
      example:
        'Ví dụ thật: một tô phở bò được ước lượng khoảng 450 kcal với độ tin cậy 95% — con số để bạn tham khảo khi cân đối bữa ăn, không phải kết quả đo lường phòng thí nghiệm.',
    },
    {
      step: 'Bước 3',
      title: 'Điểm lành mạnh chỉ để tham khảo',
      subtitle: 'FoodLens không thay thế tư vấn y tế hay chuyên gia dinh dưỡng',
      icon: HeartHandshake,
      badge: 'Dùng Có Trách Nhiệm',
      variant: 'lavender' as const,
      description:
        'Điểm lành mạnh 1–10 được chấm theo mật độ dinh dưỡng, lượng dầu mỡ, đường, muối và rau xanh đi kèm — đây là gợi ý định hướng ăn uống cân bằng cho người khỏe mạnh nói chung. Nếu bạn có bệnh lý nền hoặc chế độ ăn điều trị, hãy luôn ưu tiên tư vấn của bác sĩ và chuyên gia dinh dưỡng.',
      example:
        'Mọi thẻ kết quả trong FoodLens đều hiển thị rõ dòng chữ: kết quả do AI ước lượng, chỉ mang tính tham khảo.',
    },
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight">
          Minh Bạch & Cách FoodLens Dùng AI
        </h1>
        <p className="text-sm md:text-base text-ink-soft max-w-2xl mx-auto leading-relaxed">
          FoodLens dùng AI thị giác để ước lượng dinh dưỡng từ ảnh món ăn. Trang này nói rõ AI làm gì, con số tin cậy tới đâu và dữ liệu của bạn được xử lý thế nào — bằng số liệu thật từ chính hệ thống.
        </p>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-ink/10 shadow-card text-center">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-ink block">
            {stats.totalAnalyses}
          </span>
          <span className="text-xs text-ink-soft mt-1 block font-medium">
            Lượt phân tích đã lưu
          </span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-ink/10 shadow-card text-center">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-brand-600 block">
            {stats.avgConfidenceText}
          </span>
          <span className="text-xs text-ink-soft mt-1 block font-medium">
            Độ tin cậy nhận diện TB
          </span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-ink/10 shadow-card text-center">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-ink block">
            {stats.avgLatencyText}
          </span>
          <span className="text-xs text-ink-soft mt-1 block font-medium">
            Thời gian xử lý AI TB
          </span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-ink/10 shadow-card text-center">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-[#166E48] block">
            10 lượt
          </span>
          <span className="text-xs text-ink-soft mt-1 block font-medium">
            Hạn mức phân tích mỗi ngày
          </span>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink tracking-tight">
            AI Phân Tích Món Ăn Như Thế Nào?
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            Toàn bộ quá trình chạy trên máy chủ bảo mật — khóa AI không bao giờ xuất hiện trong ứng dụng bạn đang dùng.
          </p>
        </div>

        <div className="space-y-4">
          {layers.map((layer) => {
            const Icon = layer.icon;

            return (
              <div
                key={layer.step}
                className="bg-surface p-6 md:p-7 rounded-[26px] border border-ink/10 shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-surface-2 border border-ink/10 flex items-center justify-center text-brand-600 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-brand-600">
                          {layer.step}
                        </span>
                        <span className="text-xs text-ink-faint">•</span>
                        <span className="text-xs font-heading font-bold text-ink-soft">
                          {layer.subtitle}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-heading font-extrabold text-ink mt-0.5">
                        {layer.title}
                      </h3>
                    </div>
                  </div>

                  <Badge variant={layer.variant} size="sm">
                    {layer.badge}
                  </Badge>
                </div>

                <p className="text-sm text-ink-soft leading-relaxed">
                  {layer.description}
                </p>

                <div className="p-3.5 rounded-xl bg-surface-2 border border-ink/10 text-xs text-ink leading-relaxed font-body">
                  <strong className="font-heading font-extrabold text-ink block mb-0.5">
                    Minh chứng thực tế:
                  </strong>
                  {layer.example}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy & Logging */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="white" className="p-6 md:p-8 space-y-3 border border-ink/10 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-mint text-[#166E48] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-ink">
            Lịch Sử Của Bạn Chỉ Bạn Thấy
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            Mỗi kết quả phân tích gắn với tài khoản của bạn và được bảo vệ bằng chính sách bảo mật theo hàng (RLS) trên cơ sở dữ liệu: người dùng khác không xem được lịch sử của bạn. Xóa tài khoản đồng nghĩa xóa toàn bộ lịch sử phân tích đi kèm.
          </p>
        </Card>

        <Card variant="white" className="p-6 md:p-8 space-y-3 border border-ink/10 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-ink">
            Mọi Lượt Gọi AI Đều Được Ghi Log
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            Mỗi lượt phân tích đều ghi lại mô hình AI đã dùng, thời gian xử lý và chi phí ước tính trong nhật ký hệ thống để quản trị viên đối soát minh bạch. Hạn mức 10 lượt mỗi ngày giúp chi phí AI luôn trong tầm kiểm soát.
          </p>
        </Card>
      </div>
    </div>
  );
};
