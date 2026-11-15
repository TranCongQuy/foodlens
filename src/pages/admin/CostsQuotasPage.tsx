import React, { useEffect, useState } from 'react';
import { DollarSign, Cpu, Timer, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyUSD } from '@/lib/utils';

// Chi phi & Han muc AI cua FoodLens: doc truc tiep ai_logs (moi luot analyze-food deu ghi log).
interface AiLogRow {
  id: string;
  action: string;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  latency_ms: number | null;
  status: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  analyze_food: 'Phân tích món ăn',
};

export const CostsQuotasPage: React.FC = () => {
  const [logs, setLogs] = useState<AiLogRow[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('ai_logs')
          .select('id, action, model, tokens_in, tokens_out, cost_usd, latency_ms, status, created_at')
          .order('created_at', { ascending: false })
          .limit(200);
        const rows = (data || []) as AiLogRow[];
        setLogs(rows);
        setTotalCost(rows.reduce((acc, r) => acc + (Number(r.cost_usd) || 0), 0));
        setTotalTokens(
          rows.reduce((acc, r) => acc + (Number(r.tokens_in) || 0) + (Number(r.tokens_out) || 0), 0)
        );
      } catch (err) {
        console.error('Failed to load ai_logs:', err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
          Chi phí & Hạn mức AI
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          Theo dõi chi phí gọi mô hình Gemini của FoodLens theo thời gian thực từ nhật ký hệ thống (ai_logs)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="white" className="p-5 border border-ink/10">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">Tổng chi phí (200 lượt gần nhất)</span>
            <DollarSign className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-ink block mt-2">
            {formatCurrencyUSD(totalCost)}
          </span>
        </Card>

        <Card variant="white" className="p-5 border border-ink/10">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">Tổng token đã dùng</span>
            <Cpu className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-ink block mt-2">
            {totalTokens.toLocaleString('vi-VN')}
          </span>
        </Card>

        <Card variant="white" className="p-5 border border-ink/10">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">Số lượt gọi AI</span>
            <Timer className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-ink block mt-2">
            {logs.length}
          </span>
        </Card>
      </div>

      {/* Limits Info */}
      <Card variant="white" className="p-5 md:p-6 border border-ink/10 bg-mint/15 space-y-2">
        <h2 className="font-heading font-extrabold text-base text-ink flex items-center gap-2">
          <Info className="w-5 h-5 text-brand-600" /> Hạn mức FoodLens đang áp dụng
        </h2>
        <ul className="text-xs text-ink-soft leading-relaxed list-disc pl-5 space-y-1">
          <li>Mỗi người dùng được phân tích tối đa <strong className="text-ink">10 lượt/ngày</strong> — hạn mức được thực thi ngay trong Edge Function analyze-food trước khi gọi AI.</li>
          <li>Ảnh không phải món ăn (NOT_A_FOOD) bị từ chối và <strong className="text-ink">không tính vào hạn mức</strong>.</li>
          <li>Ảnh gửi lên tối đa 5MB, định dạng JPG / PNG / WebP.</li>
          <li>Mô hình đang dùng do biến bí mật GEMINI_MODEL quyết định (hiện tại gemini-3.5-flash-lite) — đổi model không cần sửa code.</li>
        </ul>
      </Card>

      {/* Recent Logs Table */}
      <Card variant="white" className="p-5 md:p-6 border border-ink/10 space-y-4">
        <h2 className="font-heading font-extrabold text-base text-ink">Nhật ký gọi AI gần nhất</h2>
        {isLoading ? (
          <p className="text-xs text-ink-soft">Đang tải nhật ký...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-ink-soft">Chưa có lượt gọi AI nào được ghi lại.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-ink-faint border-b border-ink/10">
                  <th className="py-2 pr-3 font-heading">Thời gian</th>
                  <th className="py-2 pr-3 font-heading">Thao tác</th>
                  <th className="py-2 pr-3 font-heading">Mô hình</th>
                  <th className="py-2 pr-3 font-heading text-right">Token vào/ra</th>
                  <th className="py-2 pr-3 font-heading text-right">Chi phí</th>
                  <th className="py-2 pr-3 font-heading text-right">Độ trễ</th>
                  <th className="py-2 font-heading">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 30).map((row) => (
                  <tr key={row.id} className="border-b border-ink/5">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 pr-3">{ACTION_LABELS[row.action] || row.action}</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">{row.model || '—'}</td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap">
                      {(row.tokens_in || 0).toLocaleString('vi-VN')} / {(row.tokens_out || 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 pr-3 text-right">{formatCurrencyUSD(Number(row.cost_usd) || 0)}</td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap">
                      {row.latency_ms ? `${(row.latency_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="py-2">
                      <Badge variant={row.status === 'success' ? 'success' : 'danger'} size="sm">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
