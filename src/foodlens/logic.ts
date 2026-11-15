// ============================================================================
// FoodLens — logic thuần (không phụ thuộc DOM/mạng, có unit test ở
// scripts/test-foodlens.js):
//   - scaleAnalysis: nhân hệ số khẩu phần phía client (đặc tả mục 2.4)
//   - macroPercents: % calo của đạm/béo/tinh bột cho 3 thanh macro
//   - validateFoodAnalysis: kiểm tra response đúng schema chặt như server
// ============================================================================
import type { FoodAnalysis, FoodItem } from './types';

export const PORTION_FACTORS = [0.5, 1, 1.5, 2] as const;
export type PortionFactor = (typeof PORTION_FACTORS)[number];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Nhân mọi con số dinh dưỡng theo hệ số khẩu phần. KHÔNG gọi lại AI. */
export function scaleAnalysis(analysis: FoodAnalysis, factor: PortionFactor): FoodAnalysis {
  return {
    ...analysis,
    calories: Math.round(analysis.calories * factor),
    protein_g: round1(analysis.protein_g * factor),
    fat_g: round1(analysis.fat_g * factor),
    carbs_g: round1(analysis.carbs_g * factor),
    items: analysis.items.map((item) => ({
      ...item,
      calories: Math.round(item.calories * factor),
    })),
  };
}

export interface MacroPercents {
  protein: number; // %
  fat: number; // %
  carbs: number; // %
}

/** % calo đóng góp của từng macro (đạm 4 kcal/g, béo 9 kcal/g, tinh bột 4 kcal/g) */
export function macroPercents(analysis: Pick<FoodAnalysis, 'protein_g' | 'fat_g' | 'carbs_g'>): MacroPercents {
  const proteinKcal = analysis.protein_g * 4;
  const fatKcal = analysis.fat_g * 9;
  const carbsKcal = analysis.carbs_g * 4;
  const total = proteinKcal + fatKcal + carbsKcal;
  if (total <= 0) return { protein: 0, fat: 0, carbs: 0 };
  return {
    protein: Math.round((proteinKcal / total) * 100),
    fat: Math.round((fatKcal / total) * 100),
    carbs: Math.round((carbsKcal / total) * 100),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validateFoodItem(value: unknown): FoodItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.name !== 'string' || value.name.trim() === '') return null;
  if (typeof value.amount !== 'string') return null;
  if (!isNonNegativeNumber(value.calories)) return null;
  return { name: value.name, amount: value.amount, calories: value.calories };
}

/**
 * Validate dữ liệu phân tích theo đúng schema chặt phía server (mục 5 đặc tả).
 * Trả về FoodAnalysis đã chuẩn hoá, hoặc null nếu thiếu/sai bất kỳ trường nào.
 */
export function validateFoodAnalysis(data: unknown): FoodAnalysis | null {
  if (!isRecord(data)) return null;
  if (data.is_food !== true) return null;
  if (typeof data.dish_name !== 'string' || data.dish_name.trim() === '') return null;
  if (!isNonNegativeNumber(data.confidence) || data.confidence > 1) return null;
  if (typeof data.portion_desc !== 'string') return null;
  if (!isNonNegativeNumber(data.calories)) return null;
  if (!isNonNegativeNumber(data.protein_g)) return null;
  if (!isNonNegativeNumber(data.fat_g)) return null;
  if (!isNonNegativeNumber(data.carbs_g)) return null;
  if (
    typeof data.health_score !== 'number' ||
    !Number.isInteger(data.health_score) ||
    data.health_score < 1 ||
    data.health_score > 10
  ) {
    return null;
  }
  if (!Array.isArray(data.items) || data.items.length < 1) return null;
  const items: FoodItem[] = [];
  for (const rawItem of data.items) {
    const item = validateFoodItem(rawItem);
    if (!item) return null;
    items.push(item);
  }
  if (typeof data.tips !== 'string') return null;

  return {
    is_food: true,
    dish_name: data.dish_name,
    confidence: data.confidence,
    portion_desc: data.portion_desc,
    calories: data.calories,
    protein_g: data.protein_g,
    fat_g: data.fat_g,
    carbs_g: data.carbs_g,
    health_score: data.health_score,
    items,
    tips: data.tips,
  };
}

/** Nhãn chữ cho điểm lành mạnh */
export function healthScoreLabel(score: number): string {
  if (score >= 8) return 'Rất lành mạnh';
  if (score >= 6) return 'Khá lành mạnh';
  if (score >= 4) return 'Trung bình';
  return 'Nên hạn chế';
}
