import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  UtensilsCrossed,
  Flame,
  Drumstick,
  Droplets,
  Wheat,
  Leaf,
  History,
  RotateCcw,
  Info,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  analyzeFood,
  fetchFoodHistory,
  FOODLENS_BACKEND,
  FoodLensError,
} from '@/foodlens/data';
import {
  prepareImageFromBlob,
  prepareSampleImage,
  type PreparedImage,
} from '@/foodlens/image';
import {
  PORTION_FACTORS,
  scaleAnalysis,
  macroPercents,
  healthScoreLabel,
  type PortionFactor,
} from '@/foodlens/logic';
import type { FoodAnalysisRecord } from '@/foodlens/types';

const DISCLAIMER =
  'Số liệu do AI ước lượng từ ảnh, chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng/y tế.';

type PageState = 'idle' | 'analyzing' | 'result';

const ANALYZING_MESSAGES = ['Đang nhận diện món…', 'Đang ước lượng dinh dưỡng…'];

// ---------------------------------------------------------------------------
// Vòng điểm lành mạnh
// ---------------------------------------------------------------------------
const HealthRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 10) * circumference;
  const color = score >= 8 ? '#16A34A' : score >= 6 ? '#65A30D' : score >= 4 ? '#F59E0B' : '#EA580C';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[84px] h-[84px]">
        <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
          <circle cx="42" cy="42" r={radius} fill="none" stroke="#FDE8D7" strokeWidth="8" />
          <circle
            cx="42"
            cy="42"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading font-extrabold text-2xl leading-none" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] font-bold text-ink-faint">/ 10</span>
        </div>
      </div>
      <span className="text-[11px] font-heading font-bold text-ink-soft">{healthScoreLabel(score)}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Thanh macro
// ---------------------------------------------------------------------------
const MacroBar: React.FC<{
  icon: React.ReactNode;
  label: string;
  grams: number;
  percent: number;
  color: string;
}> = ({ icon, label, grams, percent, color }) => (
  <div>
    <div className="flex items-center justify-between text-xs font-heading font-bold text-ink-soft mb-1">
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span>
        {grams}g · {percent}%
      </span>
    </div>
    <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Thẻ kết quả
// ---------------------------------------------------------------------------
const ResultCard: React.FC<{
  record: FoodAnalysisRecord;
  imageSrc: string | null;
  onReset: () => void;
}> = ({ record, imageSrc, onReset }) => {
  const [factor, setFactor] = useState<PortionFactor>(1);
  useEffect(() => {
    setFactor(1);
  }, [record.id]);

  const scaled = scaleAnalysis(record, factor);
  const percents = macroPercents(scaled);

  return (
    <section className="bg-surface rounded-3xl border border-ink/10 shadow-card overflow-hidden">
      {imageSrc && (
        <img src={imageSrc} alt={record.dish_name} className="w-full h-56 sm:h-64 object-cover" />
      )}
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading font-extrabold text-2xl text-ink leading-tight">
              {record.dish_name}
            </h2>
            <p className="text-sm text-ink-soft mt-1">
              {record.portion_desc} · Độ tin cậy {Math.round(record.confidence * 100)}%
            </p>
          </div>
          <HealthRing score={record.health_score} />
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="flex items-center gap-2 font-heading font-extrabold text-6xl leading-none text-[#EA580C]">
            <Flame className="w-9 h-9" />
            {scaled.calories}
          </span>
          <span className="font-heading font-bold text-lg text-ink-soft pb-1">kcal</span>
          {factor !== 1 && (
            <span className="pb-1.5 text-xs font-bold text-[#EA580C] bg-[#FFF1E6] border border-[#FDBA74] rounded-full px-2.5 py-1">
              đã tính theo khẩu phần ×{factor}
            </span>
          )}
        </div>

        {/* Chọn khẩu phần — nhân phía client, không gọi lại AI */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-heading font-bold text-ink-soft mr-1">Khẩu phần:</span>
          {PORTION_FACTORS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFactor(f)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-sm font-heading font-bold border transition-all cursor-pointer min-h-[36px]',
                factor === f
                  ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-btn-primary'
                  : 'bg-surface text-ink-soft border-ink/15 hover:border-[#EA580C] hover:text-[#EA580C]'
              )}
            >
              ×{f}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MacroBar
            icon={<Drumstick className="w-4 h-4 text-[#F97316]" />}
            label="Đạm"
            grams={scaled.protein_g}
            percent={percents.protein}
            color="#F97316"
          />
          <MacroBar
            icon={<Droplets className="w-4 h-4 text-[#F59E0B]" />}
            label="Béo"
            grams={scaled.fat_g}
            percent={percents.fat}
            color="#F59E0B"
          />
          <MacroBar
            icon={<Wheat className="w-4 h-4 text-[#22C55E]" />}
            label="Tinh bột"
            grams={scaled.carbs_g}
            percent={percents.carbs}
            color="#22C55E"
          />
        </div>

        <div className="mt-6 rounded-2xl bg-surface-2 border border-ink/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="px-4 py-2.5 font-heading">Thành phần</th>
                <th className="px-4 py-2.5 font-heading">Lượng</th>
                <th className="px-4 py-2.5 font-heading text-right">kcal</th>
              </tr>
            </thead>
            <tbody>
              {scaled.items.map((item, idx) => (
                <tr key={idx} className="border-t border-ink/5">
                  <td className="px-4 py-2 font-bold text-ink">{item.name}</td>
                  <td className="px-4 py-2 text-ink-soft">{item.amount}</td>
                  <td className="px-4 py-2 text-right font-heading font-bold text-ink">
                    {item.calories}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {record.tips && (
          <p className="mt-4 flex gap-2 text-sm text-ink-soft bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl px-4 py-3">
            <Leaf className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
            <span>{record.tips}</span>
          </p>
        )}

        <p className="mt-4 flex gap-1.5 text-[11px] leading-relaxed text-ink-faint">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{DISCLAIMER}</span>
        </p>

        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-heading font-bold text-sm px-5 py-2.5 rounded-full shadow-btn-primary transition-all cursor-pointer min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4" />
          Phân tích món khác
        </button>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Trang FoodLens
// ---------------------------------------------------------------------------
export const FoodLensPage: React.FC = () => {
  const [state, setState] = useState<PageState>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [current, setCurrent] = useState<FoodAnalysisRecord | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<FoodAnalysisRecord[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await fetchFoodHistory());
    } catch {
      // Lịch sử lỗi không chặn luồng chính
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (state !== 'analyzing') return;
    const timer = window.setInterval(
      () => setStatusIdx((i) => (i + 1) % ANALYZING_MESSAGES.length),
      1400
    );
    return () => window.clearInterval(timer);
  }, [state]);

  const runAnalysis = useCallback(
    async (prepared: PreparedImage, isSample: boolean) => {
      setNotice(null);
      setError(null);
      setPreviewUrl(prepared.dataUrl);
      setState('analyzing');
      try {
        const outcome = await analyzeFood({
          imageBase64: prepared.base64,
          mimeType: prepared.mimeType,
          thumbnailDataUrl: prepared.thumbnailDataUrl,
          isSample,
        });
        if (outcome.kind === 'not_food') {
          setState('idle');
          setPreviewUrl(null);
          setNotice('Ảnh này không có món ăn nào. Bạn thử chụp lại món ăn nhé!');
          return;
        }
        setCurrent(outcome.record);
        setCurrentImage(prepared.dataUrl);
        setState('result');
        void loadHistory();
      } catch (err) {
        setState('idle');
        setPreviewUrl(null);
        setError(
          err instanceof FoodLensError
            ? err.message
            : 'Đã xảy ra sự cố khi phân tích. Vui lòng thử lại.'
        );
      }
    },
    [loadHistory]
  );

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('File bạn chọn không phải ảnh. Vui lòng chọn ảnh món ăn (JPEG, PNG hoặc WebP).');
        return;
      }
      setError(null);
      try {
        const prepared = await prepareImageFromBlob(file);
        await runAnalysis(prepared, false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không đọc được file ảnh này.');
      }
    },
    [runAnalysis]
  );

  const handleSample = useCallback(async () => {
    setError(null);
    try {
      const prepared = await prepareSampleImage();
      await runAnalysis(prepared, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được ảnh mẫu.');
    }
  }, [runAnalysis]);

  const handleReset = useCallback(() => {
    setState('idle');
    setCurrent(null);
    setCurrentImage(null);
    setPreviewUrl(null);
    setNotice(null);
    setError(null);
  }, []);

  const handleHistoryClick = useCallback((record: FoodAnalysisRecord) => {
    setCurrent(record);
    setCurrentImage(record.thumbnail);
    setState('result');
    setNotice(null);
    setError(null);
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Tiêu đề */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center shadow-btn-primary">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-ink leading-none">FoodLens</h1>
          <p className="text-sm text-ink-soft mt-1">Chụp món ăn — biết ngay calo & dinh dưỡng</p>
        </div>
        {FOODLENS_BACKEND === 'local' && (
          <span className="text-[11px] font-heading font-bold text-[#92400E] bg-[#FEF3C7] border border-[#FCD34D] rounded-full px-2.5 py-1">
            LOCAL — dữ liệu mẫu, chưa gọi AI thật
          </span>
        )}
      </div>

      <div ref={resultRef} className="scroll-mt-24">
        {state === 'result' && current ? (
          <ResultCard record={current} imageSrc={currentImage} onReset={handleReset} />
        ) : state === 'analyzing' ? (
          <section className="bg-surface rounded-3xl border border-ink/10 shadow-card overflow-hidden">
            {previewUrl && (
              <img src={previewUrl} alt="Món ăn đang phân tích" className="w-full h-56 sm:h-64 object-cover opacity-80" />
            )}
            <div className="p-5 sm:p-7">
              <p className="flex items-center gap-2 font-heading font-bold text-ink">
                <Loader2 className="w-5 h-5 animate-spin text-[#EA580C]" />
                {ANALYZING_MESSAGES[statusIdx]}
              </p>
              <div className="mt-5 space-y-3 animate-pulse">
                <div className="h-8 w-2/3 rounded-xl bg-surface-3" />
                <div className="h-14 w-1/2 rounded-xl bg-surface-3" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-10 rounded-xl bg-surface-3" />
                  <div className="h-10 rounded-xl bg-surface-3" />
                  <div className="h-10 rounded-xl bg-surface-3" />
                </div>
                <div className="h-24 rounded-2xl bg-surface-3" />
              </div>
              <p className="mt-4 text-[11px] text-ink-faint">{DISCLAIMER}</p>
            </div>
          </section>
        ) : (
          <section
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              'bg-surface rounded-3xl border-2 border-dashed shadow-card p-6 sm:p-10 text-center transition-colors',
              dragOver ? 'border-[#EA580C] bg-[#FFF7ED]' : 'border-ink/15'
            )}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF1E6] flex items-center justify-center">
              <ImagePlus className="w-8 h-8 text-[#EA580C]" />
            </div>
            <h2 className="mt-4 font-heading font-extrabold text-xl text-ink">
              Chọn ảnh món ăn của bạn
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Kéo thả ảnh vào đây, chụp trực tiếp hoặc chọn từ thư viện.
              <br className="hidden sm:block" />
              AI sẽ nhận diện món và ước lượng calo trong vài giây.
            </p>

            {notice && (
              <p className="mt-4 text-sm font-bold text-[#92400E] bg-[#FEF3C7] border border-[#FCD34D] rounded-2xl px-4 py-3">
                {notice}
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm font-bold text-[#B42343] bg-[#FFE3EA] border border-[#F0607F]/40 rounded-2xl px-4 py-3">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-heading font-bold text-sm px-5 py-2.5 rounded-full shadow-btn-primary transition-all cursor-pointer min-h-[44px]"
              >
                <Camera className="w-4 h-4" />
                Chụp ảnh
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-surface hover:bg-surface-2 text-ink font-heading font-bold text-sm px-5 py-2.5 rounded-full border border-ink/15 transition-all cursor-pointer min-h-[44px]"
              >
                <ImagePlus className="w-4 h-4 text-[#EA580C]" />
                Chọn ảnh
              </button>
              <button
                type="button"
                onClick={() => void handleSample()}
                className="inline-flex items-center gap-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] font-heading font-bold text-sm px-5 py-2.5 rounded-full border border-[#BBF7D0] transition-all cursor-pointer min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" />
                Dùng ảnh mẫu
              </button>
            </div>

            <p className="mt-5 text-[11px] text-ink-faint">{DISCLAIMER}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </section>
        )}
      </div>

      {/* Lịch sử */}
      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-heading font-extrabold text-lg text-ink mb-3">
            <History className="w-5 h-5 text-[#EA580C]" />
            Lịch sử phân tích
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {history.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => handleHistoryClick(record)}
                className="bg-surface rounded-2xl border border-ink/10 shadow-xs overflow-hidden text-left hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {record.thumbnail ? (
                  <img
                    src={record.thumbnail}
                    alt={record.dish_name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-surface-3 flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-ink-faint" />
                  </div>
                )}
                <div className="p-3">
                  <div className="font-heading font-bold text-sm text-ink truncate">
                    {record.dish_name}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-ink-soft">
                    <span className="font-bold text-[#EA580C]">{record.calories} kcal</span>
                    <span>
                      {new Date(record.created_at).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
