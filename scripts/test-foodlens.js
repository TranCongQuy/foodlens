/**
 * Unit test cho logic thuần FoodLens (src/foodlens/logic.ts)
 * Chạy: npm run test:foodlens  (Node >= 22.18, type-stripping mặc định)
 */
import assert from 'node:assert/strict';
import { scaleAnalysis, macroPercents, validateFoodAnalysis } from '../src/foodlens/logic.ts';

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const PHO = {
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

console.log('scaleAnalysis (nhân khẩu phần):');
check('×1 giữ nguyên mọi con số', () => {
  const s = scaleAnalysis(PHO, 1);
  assert.equal(s.calories, 480);
  assert.equal(s.protein_g, 28);
  assert.equal(s.items[0].calories, 220);
});
check('×2 nhân đôi calo, macro và calo từng item', () => {
  const s = scaleAnalysis(PHO, 2);
  assert.equal(s.calories, 960);
  assert.equal(s.protein_g, 56);
  assert.equal(s.fat_g, 24);
  assert.equal(s.carbs_g, 124);
  assert.equal(s.items.reduce((sum, i) => sum + i.calories, 0), 960);
});
check('×0.5 giảm một nửa', () => {
  const s = scaleAnalysis(PHO, 0.5);
  assert.equal(s.calories, 240);
  assert.equal(s.protein_g, 14);
});
check('×1.5 làm tròn hợp lý', () => {
  const s = scaleAnalysis(PHO, 1.5);
  assert.equal(s.calories, 720);
  assert.equal(s.fat_g, 18);
});
check('không sửa object gốc', () => {
  scaleAnalysis(PHO, 2);
  assert.equal(PHO.calories, 480);
});

console.log('macroPercents:');
check('phở: đạm 24% / béo 23% / tinh bột 53% (tổng ~100)', () => {
  const p = macroPercents(PHO);
  assert.equal(p.protein, 24);
  assert.equal(p.fat, 23);
  assert.equal(p.carbs, 53);
  assert.ok(Math.abs(p.protein + p.fat + p.carbs - 100) <= 1);
});
check('toàn 0 → mọi % bằng 0, không chia cho 0', () => {
  assert.deepEqual(macroPercents({ protein_g: 0, fat_g: 0, carbs_g: 0 }), {
    protein: 0,
    fat: 0,
    carbs: 0,
  });
});

console.log('validateFoodAnalysis:');
check('dữ liệu phở hợp lệ → qua', () => {
  const v = validateFoodAnalysis(PHO);
  assert.ok(v);
  assert.equal(v.dish_name, 'Phở bò tái nạm');
  assert.equal(v.items.length, 4);
});
check('is_food=false → null', () => {
  assert.equal(validateFoodAnalysis({ is_food: false }), null);
});
check('thiếu calories → null', () => {
  const bad = { ...PHO };
  delete bad.calories;
  assert.equal(validateFoodAnalysis(bad), null);
});
check('confidence > 1 → null', () => {
  assert.equal(validateFoodAnalysis({ ...PHO, confidence: 1.5 }), null);
});
check('health_score ngoài 1..10 → null', () => {
  assert.equal(validateFoodAnalysis({ ...PHO, health_score: 11 }), null);
  assert.equal(validateFoodAnalysis({ ...PHO, health_score: 0 }), null);
});
check('items rỗng → null', () => {
  assert.equal(validateFoodAnalysis({ ...PHO, items: [] }), null);
});
check('item thiếu calories → null', () => {
  assert.equal(
    validateFoodAnalysis({ ...PHO, items: [{ name: 'X', amount: '~1g' }] }),
    null
  );
});
check('không phải object → null', () => {
  assert.equal(validateFoodAnalysis(null), null);
  assert.equal(validateFoodAnalysis('phở'), null);
  assert.equal(validateFoodAnalysis([PHO]), null);
});

console.log(`\nFoodLens logic: ${passed}/${passed} test đạt`);
