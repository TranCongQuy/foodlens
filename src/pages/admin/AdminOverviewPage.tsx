import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  UtensilsCrossed,
  Users,
  DollarSign,
  Gauge,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyUSD } from '@/lib/utils';

// Tong quan quan tri FoodLens: so lieu that tu food_analyses, profiles va ai_logs.
const CHART_TOKENS = {
  mainStroke: '#166E48',
  mainFill: '#C9F0DD',
  barFill: '#D97706',
  gridStroke: '#FFF3E6',
  textMuted: '#5E5370',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#FCE8D5',
};

interface DayPoint {
  date: string;
  count: number;
}

interface DishPoint {
  name: string;
  count: number;
}

export const AdminOverviewPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [todayCount, setTodayCount] = useState(0);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [avgConfidenceText, setAvgConfidenceText] = useState('—');
  const [byDay7, setByDay7] = useState<DayPoint[]>([]);
  const [byDay30, setByDay30] = useState<DayPoint[]>([]);
  const [topDishes, setTopDishes] = useState<DishPoint[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

        const [
          { count: today },
          { count: total },
          { count: users },
          { data: analyses },
          { data: monthLogs },
        ] = await Promise.all([
          supabase
            .from('food_analyses')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfToday.toISOString()),
          supabase.from('food_analyses').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase
            .from('food_analyses')
            .select('dish_name, confidence, created_at')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true })
            .limit(2000),
          supabase
            .from('ai_logs')
            .select('cost_usd')
            .gte('created_at', startOfMonth.toISOString())
            .limit(2000),
        ]);

        setTodayCount(today || 0);
        setTotalAnalyses(total || 0);
        setTotalUsers(users || 0);
        setMonthlyCost(
          (monthLogs || []).reduce(
            (acc, l) => acc + (Number((l as { cost_usd?: number }).cost_usd) || 0),
            0
          )
        );

        const rows = (analyses || []) as Array<{
          dish_name: string;
          confidence: number;
          created_at: string;
        }>;

        const confs = rows.map((r) => Number(r.confidence) || 0).filter((c) => c > 0);
        setAvgConfidenceText(
          confs.length > 0
            ? `${Math.round((confs.reduce((a, c) => a + c, 0) / confs.length) * 100)}%`
            : '—'
        );

        const buildDays = (days: number): DayPoint[] => {
          const points: DayPoint[] = [];
          for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            points.push({
              date: `${d.getDate()}/${d.getMonth() + 1}`,
              count: rows.filter((r) => {
                const rd = new Date(r.created_at);
                return `${rd.getFullYear()}-${rd.getMonth()}-${rd.getDate()}` === key;
              }).length,
            });
          }
          return points;
        };
        setByDay7(buildDays(7));
        setByDay30(buildDays(30));

        const dishCounts = new Map<string, number>();
        rows.forEach((r) => {
          if (r.dish_name) dishCounts.set(r.dish_name, (dishCounts.get(r.dish_name) || 0) + 1);
        });
        setTopDishes(
          Array.from(dishCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      } catch (err) {
        console.error('Failed to load FoodLens admin overview:', err);
      }
    }

    load();
  }, []);

  const activeChartData = useMemo(
    () => (timeRange === '30d' ? byDay30 : byDay7),
    [timeRange, byDay7, byDay30]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success inline-block animate-pulse" />
            <span className="text-xs text-ink-soft font-bold">Dữ liệu thời gian thực Supabase</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink mt-1">
            Tổng quan FoodLens
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Số liệu phân tích món ăn, người dùng và chi phí AI của hệ thống FoodLens
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface border border-ink/10 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTimeRange('7d')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition-all cursor-pointer min-h-[36px] ${
              timeRange === '7d' ? 'bg-ink text-white shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30d')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition-all cursor-pointer min-h-[36px] ${
              timeRange === '30d' ? 'bg-ink text-white shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            30 ngày qua
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">Phân tích hôm nay</span>
            <UtensilsCrossed className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">{todayCount}</span>
            <span className="text-[11px] text-ink-soft font-bold block mt-0.5">
              {todayCount > 0 ? 'Phát sinh trong ngày' : 'Chưa có phát sinh'}
            </span>
          </div>
        </Card>

        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">Tổng lượt phân tích</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">{totalAnalyses}</span>
            <span className="text-[11px] text-ink-soft font-bold block mt-0.5">Từ khi hệ thống vận hành</span>
          </div>
        </Card>

        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">Tổng người dùng</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">{totalUsers}</span>
            <span className="text-[11px] text-ink-soft font-bold block mt-0.5">Tài khoản đã đăng ký</span>
          </div>
        </Card>

        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">Chi phí AI tháng này</span>
            <DollarSign className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">
              {formatCurrencyUSD(monthlyCost)}
            </span>
            <span className="text-[11px] text-ink-soft font-bold block mt-0.5">Từ nhật ký ai_logs</span>
          </div>
        </Card>

        <Card variant="white" className="p-4 sm:p-5 border border-ink/10 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-heading font-bold">Độ tin cậy TB (30 ngày)</span>
            <Gauge className="w-4 h-4 text-magic-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-magic-600">{avgConfidenceText}</span>
            <span className="text-[11px] text-ink-soft font-bold block mt-0.5">Độ tin cậy nhận diện món ăn</span>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="white" className="p-5 md:p-6 space-y-4 border border-ink/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h2 className="font-heading font-extrabold text-base text-ink">
                Lượt phân tích theo ngày ({timeRange === '30d' ? '30 ngày qua' : '7 ngày qua'})
              </h2>
            </div>
            <Badge variant="mint" size="sm">food_analyses</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_TOKENS.mainFill} stopOpacity={0.85} />
                    <stop offset="95%" stopColor={CHART_TOKENS.mainFill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: CHART_TOKENS.textMuted }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: CHART_TOKENS.textMuted }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_TOKENS.tooltipBg,
                    borderRadius: '1rem',
                    border: `1px solid ${CHART_TOKENS.tooltipBorder}`,
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="count" name="Lượt phân tích" stroke={CHART_TOKENS.mainStroke} fillOpacity={1} fill="url(#colorAnalyses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="white" className="p-5 md:p-6 space-y-4 border border-ink/10">
          <h2 className="font-heading font-extrabold text-base text-ink">
            Món ăn được phân tích nhiều nhất (30 ngày)
          </h2>
          {topDishes.length === 0 ? (
            <div className="h-56 w-full flex flex-col items-center justify-center rounded-2xl bg-surface-2 border border-dashed border-ink/15 p-6 text-center space-y-2">
              <UtensilsCrossed className="w-8 h-8 text-brand-600" />
              <p className="text-xs sm:text-sm font-heading font-bold text-ink">Chưa có lượt phân tích nào</p>
              <p className="text-xs text-ink-soft max-w-sm">
                Khi người dùng bắt đầu phân tích món ăn, bảng xếp hạng món phổ biến sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDishes} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.gridStroke} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: CHART_TOKENS.textMuted }} />
                  <YAxis dataKey="name" type="category" width={115} tick={{ fontSize: 11, fill: '#1F2A1E' }} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', backgroundColor: CHART_TOKENS.tooltipBg, border: `1px solid ${CHART_TOKENS.tooltipBorder}` }} />
                  <Bar dataKey="count" name="Lượt phân tích" fill={CHART_TOKENS.barFill} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* How FoodLens works */}
      <Card variant="white" className="p-5 md:p-6 space-y-3 border border-ink/10 bg-mint/15">
        <h2 className="font-heading font-extrabold text-base text-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-success-text" /> FoodLens vận hành thế nào?
        </h2>
        <p className="text-xs text-ink-soft leading-relaxed">
          Người dùng gửi ảnh món ăn tới Edge Function analyze-food; mô hình Gemini thị giác nhận diện món và ước lượng calo/dinh dưỡng theo khẩu phần, kết quả lưu vào bảng food_analyses và mọi lượt gọi AI đều ghi vào ai_logs để đối soát chi phí. Ảnh không phải món ăn bị từ chối (NOT_A_FOOD) và không tính vào hạn mức 10 lượt mỗi ngày của người dùng.
        </p>
      </Card>
    </div>
  );
};
