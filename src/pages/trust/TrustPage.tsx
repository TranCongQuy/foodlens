import React, { useEffect, useState } from 'react';
import {
  Scan,
  BookOpenCheck,
  Scale,
  Lock,
  HeartHandshake,
} from 'lucide-react';
import { useStoryStore } from '@/store/storyStore';
import { isUsingDemoSession } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { isStoryApproved } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const TrustPage: React.FC = () => {
  const { stories } = useStoryStore();

  const [stats, setStats] = useState<{
    approvalRateText: string;
    avgReviewTimeText: string;
    blockedCount: number;
    totalStories: number;
  }>({
    approvalRateText: '—',
    avgReviewTimeText: '—',
    blockedCount: 0,
    totalStories: 0,
  });

  useEffect(() => {
    async function loadRealStats() {
      if (!isUsingDemoSession()) {
        try {
          const [
            { count: totalCount },
            { count: approvedCount },
            { count: rejectedCount },
            { data: latencyLogs },
          ] = await Promise.all([
            supabase.from('stories').select('*', { count: 'exact', head: true }),
            supabase
              .from('stories')
              .select('*', { count: 'exact', head: true })
              .in('status', ['auto_approved', 'approved', 'parent_approved']),
            supabase
              .from('stories')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'rejected'),
            supabase
              .from('ai_logs')
              .select('latency_ms, action, status')
              .limit(100),
          ]);

          const total = totalCount ?? stories.length;
          const approved =
            approvedCount ?? stories.filter((s) => isStoryApproved(s.status)).length;
          const rejected =
            rejectedCount ?? stories.filter((s) => s.status === 'rejected').length;

          const validLatencies = (latencyLogs || [])
            .map((l) => Number((l as { latency_ms?: number }).latency_ms) || 0)
            .filter((ms) => ms > 0);

          const inputBlocked = (latencyLogs || []).filter(
            (l) => (l as { action?: string }).action === 'layer1_input_safety_blocked'
          ).length;

          const avgLatencyText =
            validLatencies.length > 0
              ? `${(
                  validLatencies.reduce((acc, ms) => acc + ms, 0) /
                  validLatencies.length /
                  1000
                ).toFixed(1)}s`
              : 'Chưa có dữ liệu';

          setStats({
            approvalRateText: total > 0 ? `${Math.round((approved / total) * 100)}%` : 'Chưa có dữ liệu',
            avgReviewTimeText: avgLatencyText,
            blockedCount: rejected + inputBlocked,
            totalStories: total,
          });
        } catch {
          computeFromStore();
        }
      } else {
        computeFromStore();
      }
    }

    function computeFromStore() {
      const total = stories.length;
      const approved = stories.filter((s) => isStoryApproved(s.status)).length;
      const rejected = stories.filter((s) => s.status === 'rejected').length;

      setStats({
        approvalRateText: total > 0 ? `${Math.round((approved / total) * 100)}%` : 'Chưa có dữ liệu',
        avgReviewTimeText: 'Chưa có dữ liệu',
        blockedCount: rejected,
        totalStories: total,
      });
    }

    loadRealStats();
  }, [stories]);

  const layers = [
    {
      step: 'Lớp 1',
      title: 'Xác thực nét vẽ & Bảo vệ ảnh gia đình',
      subtitle: 'Chỉ chấp nhận tranh vẽ trên giấy, từ chối ảnh chụp đời thực',
      icon: Scan,
      badge: 'Bảo vệ Đầu Vào',
      variant: 'mint' as const,
      description:
        'Hệ thống phân tích thị giác trên máy chủ xác định ảnh có phải tranh vẽ tay của bé hay không. Đồng thời tự động phát hiện và từ chối ảnh chứa khuôn mặt người thật ngoài đời, thông tin cá nhân (PII như số điện thoại, địa chỉ nhà) hoặc ảnh logo thương mại.',
      example:
        'Ví dụ: Ảnh chụp màn hình tài liệu hay ảnh logo công ty sẽ bị từ chối và xóa ngay khỏi kho lưu trữ tạm với thông điệp thân thiện: "Mình chưa thấy nét vẽ của bé, thử chụp lại tranh trên giấy nhé".',
    },
    {
      step: 'Lớp 2',
      title: 'Sáng tác bám sát tranh vẽ & Từ vựng thuần khiết',
      subtitle: 'Toàn bộ đồ vật con vẽ là sự thật bắt buộc',
      icon: BookOpenCheck,
      badge: 'Chống Bịa Đặt AI',
      variant: 'sky' as const,
      description:
        'Toàn bộ danh sách đồ vật, nhân vật, màu sắc và cảm xúc nhận diện từ tranh vẽ được truyền trực tiếp vào mô hình như "sự thật bắt buộc". Cốt truyện 4–5 trang dẫn dắt từ chính nét vẽ của con, từ ngữ được tinh chỉnh chuẩn mực theo lứa tuổi 2–12.',
      example:
        'Ví dụ: Khi bé vẽ chú voi màu hồng, AI bắt buộc dùng hình tượng chú voi tai hồng làm trọng tâm, tuyệt đối không tự ý thay thế bằng nhân vật ngoài tranh.',
    },
    {
      step: 'Lớp 3',
      title: 'Giám định viên độc lập & Kiểm duyệt có con người',
      subtitle: 'Thẩm định an toàn và độ bám tranh trước khi gửi đến bé',
      icon: Scale,
      badge: 'Thẩm Định Độc Lập',
      variant: 'lavender' as const,
      description:
        'Mô hình giám định độc lập chấm điểm rủi ro (Risk Score 0–100) và độ bám sát nét vẽ (Faithfulness Score 0–100). Những câu chuyện chạm ngưỡng nghi vấn sẽ được chuyển sang hàng chờ để Quản trị viên kiểm duyệt thủ công (Human-in-the-Loop).',
      example:
        'Ví dụ: Truyện có độ bám tranh dưới 60 điểm sẽ tự động được sinh lại kèm góp ý cải thiện hoặc chuyển sang hàng chờ duyệt trước khi cho bé đọc.',
    },
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2">
      {/* Header (Hallmark Floor: Clear headline without tracked uppercase eyebrow) */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight">
          Minh Bạch & An Toàn AI Cho Trẻ Thơ
        </h1>
        <p className="text-sm md:text-base text-ink-soft max-w-2xl mx-auto leading-relaxed">
          DrawToStory xây dựng môi trường sáng tạo trong sáng, bảo vệ quyền riêng tư của trẻ em theo nguyên tắc GDPR (Tối thiểu hóa dữ liệu & Quyền được xóa vĩnh viễn) và Trí tuệ Nhân tạo Có trách nhiệm.
        </p>
      </div>

      {/* Live Database Metrics (Equal Edges & Real Data - Taste Standard) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-ink/10 shadow-card text-center">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-ink block">
            {stats.totalStories}
          </span>
          <span className="text-xs text-ink-soft mt-1 block font-medium">
            Tổng truyện đã thẩm định
          </span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-ink/10 shadow-card text-center">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-brand-600 block">
            {stats.approvalRateText}
          </span>
          <span className="text-xs text-ink-soft mt-1 block font-medium">
            Tỷ lệ truyện đạt chuẩn
          </span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-ink/10 shadow-card text-center">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-ink block">
            {stats.avgReviewTimeText}
          </span>
          <span className="text-xs text-ink-soft mt-1 block font-medium">
            Thời gian xử lý AI TB
          </span>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-ink/10 shadow-card text-center">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-[#166E48] block">
            {stats.blockedCount}
          </span>
          <span className="text-xs text-ink-soft mt-1 block font-medium">
            Nội dung rủi ro đã chặn
          </span>
        </div>
      </div>

      {/* 3-Layer Defense (Purposeful Cards without Artificial Timeline Line) */}
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink tracking-tight">
            Kiến Trúc Phòng Thủ 3 Lớp Chuyên Biệt
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            Mọi bức tranh và câu chuyện đều trải qua quy trình xác thực tự động trên máy chủ trước khi bé có thể mở đọc.
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

      {/* Data Privacy & Family Ownership */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="white" className="p-6 md:p-8 space-y-3 border border-ink/10 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-mint text-[#166E48] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-ink">
            Quyền Kiểm Soát & Xóa Vĩnh Viễn (GDPR)
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            Phụ huynh có toàn quyền xuất toàn bộ dữ liệu gia đình dạng JSON hoặc kích hoạt Xóa vĩnh viễn tài khoản để xóa sạch hồ sơ xác thực, tranh vẽ trên Storage và lịch sử truyện.
          </p>
        </Card>

        <Card variant="white" className="p-6 md:p-8 space-y-3 border border-ink/10 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-ink">
            Đạo Đức & Giáo Dục Lành Mạnh
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            Mỗi cốt truyện đều hướng tới lòng nhân ái, sự sẻ chia, tình cảm gia đình và khuyến khích bé tiếp tục cầm bút vẽ lên ước mơ của mình.
          </p>
        </Card>
      </div>
    </div>
  );
};
