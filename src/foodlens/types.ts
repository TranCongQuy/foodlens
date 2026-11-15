// ============================================================================
// FoodLens — kiểu dữ liệu dùng chung (khớp schema của Edge Function analyze-food)
// ============================================================================

export interface FoodItem {
  name: string;
  amount: string;
  calories: number;
}

export interface FoodAnalysis {
  is_food: true;
  dish_name: string;
  confidence: number; // 0..1
  portion_desc: string;
  calories: number; // kcal theo khẩu phần trong ảnh
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  health_score: number; // 1..10
  items: FoodItem[];
  tips: string;
}

/** Một bản ghi lịch sử (đã lưu ở food_analyses hoặc localStorage ở chế độ local) */
export interface FoodAnalysisRecord extends FoodAnalysis {
  id: string;
  created_at: string; // ISO
  thumbnail: string | null; // data URL ảnh thu nhỏ
}
