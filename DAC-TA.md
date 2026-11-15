# Đặc tả FoodLens — chụp món ăn, ra calo & dinh dưỡng

_Bản rút gọn cho khung làm việc 3 TIẾNG. Nguyên tắc xuyên suốt: tái dùng tối đa khung DrawToStory đã chạy thật, chỉ thêm đúng 1 luồng mới._

## 1. Sản phẩm trong 1 câu

Người dùng chụp hoặc tải ảnh một món ăn → AI nhận diện món, ước lượng calo + đạm/béo/tinh bột + điểm lành mạnh → hiện thẻ kết quả đẹp, lưu vào lịch sử cá nhân.

**Vòng lặp cốt lõi (3 bước):** chọn ảnh → phân tích (~5–15 giây) → thẻ kết quả + lưu lịch sử. Không có vòng lặp nào khác trong phạm vi 3 giờ.

## 2. Nguyên tắc khóa cứng (không được phá)

1. **AI chỉ nhận diện và ước lượng theo schema.** Mọi con số hiển thị phải lấy từ JSON đã qua validate ở Edge Function; client không tự bịa số.
2. **Ước lượng là ước lượng.** Mọi màn kết quả phải có dòng chữ: "Số liệu do AI ước lượng từ ảnh, chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng/y tế." Kèm % độ tin cậy (confidence) do AI trả về.
3. **Không phải món ăn thì từ chối lịch sự.** Ảnh không có món ăn/thức uống → trả mã `NOT_A_FOOD`, UI hiện thông báo thân thiện, KHÔNG trừ lượt, KHÔNG lưu lịch sử.
4. **Hệ số khẩu phần là số học phía client.** Người dùng chọn ×0.5 / ×1 / ×1.5 / ×2 → client nhân các con số đã nhận, hiển thị rõ "đã tính theo khẩu phần ×1.5". Không gọi lại AI khi đổi hệ số.
5. **Key AI chỉ ở server.** Trình duyệt không giữ GEMINI_API_KEY; mọi lời gọi đi qua Edge Function như DrawToStory.

## 3. Kiến trúc — tái dùng DrawToStory

- **Nền:** clone repo DrawToStory tại commit `0d50df6` (đã nghiệm thu live 15/11/2026) sang thư mục mới `FoodLens`. Giữ nguyên 100%: auth + đăng nhập nhanh, Supabase client, Admin + trang chi phí AI (`ai_logs`), layout/header.
- **Dùng CHUNG Supabase project của DrawToStory** (`htvslxbytqoteyimtcxg`) — lựa chọn có chủ đích để kịp 3 tiếng: secrets `GEMINI_API_KEY` và `GEMINI_MODEL=gemini-3.5-flash-lite` đã có sẵn và đã kiểm chứng chạy; quick-login đã deploy. Chỉ thêm 1 bảng + 1 function (mục 4, 5). Tách project riêng là việc sau, ngoài phạm vi đợt này.
- **Model:** `gemini-3.5-flash-lite` (đọc từ secret GEMINI_MODEL như generate-story), temperature 0.2.
- **Route mới:** `/foodlens`. Sau đăng nhập, trang chủ của vai người dùng chuyển thẳng tới `/foodlens`. Các route truyện giữ nguyên code (đường lui), chỉ gỡ khỏi điều hướng chính.

## 4. Edge Function mới: `analyze-food`

- Nhận POST `{ image_base64, mime_type }` kèm JWT (bắt buộc đăng nhập, theo đúng mẫu generate-story).
- Giới hạn: ảnh ≤ 4MB sau nén; mime thuộc image/jpeg|png|webp.
- Hạn mức: tối đa **10 lượt/ngày/user** — đếm số dòng `food_analyses` của user trong ngày (giờ VN) trước khi gọi AI; vượt thì trả 429 thân thiện.
- Gọi Gemini vision với system prompt ở mục 6 + response schema ở mục 5; parse + validate JSON phía server; lỗi schema → thử lại 1 lần, vẫn lỗi → trả lỗi thân thiện.
- Ghi `ai_logs` với operation `analyze_food` (model, token, latency, chi phí, trạng thái) — Admin costs thấy được như generate-story.
- Thành công → insert 1 dòng `food_analyses` rồi trả JSON cho client. `NOT_A_FOOD` → không insert, không tính lượt.

## 5. Dữ liệu

**Bảng mới `food_analyses`** (migration `005_foodlens.sql`, chạy chung project DrawToStory):

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | mặc định gen_random_uuid() |
| user_id | uuid FK → profiles | chủ bản ghi |
| dish_name | text | tên món AI nhận diện |
| confidence | numeric | 0–1 |
| calories | int | kcal theo khẩu phần chuẩn trong ảnh |
| protein_g / fat_g / carbs_g | numeric | gam |
| health_score | int | 1–10 |
| items | jsonb | mảng thành phần (mục dưới) |
| tips | text | 1–2 câu gợi ý ăn lành mạnh hơn |
| thumbnail | text | data URL ảnh thu nhỏ ≤ 80KB (client nén 320px) |
| created_at | timestamptz | mặc định now() |

RLS: user chỉ SELECT/INSERT dòng của chính mình (theo mẫu các bảng hiện có).

**Schema JSON AI phải trả (response schema của Gemini):**

```json
{
  "is_food": true,
  "dish_name": "Phở bò tái nạm",
  "confidence": 0.92,
  "portion_desc": "1 tô vừa (~500ml)",
  "calories": 480,
  "protein_g": 28, "fat_g": 12, "carbs_g": 62,
  "health_score": 7,
  "items": [
    { "name": "Bánh phở", "amount": "~200g", "calories": 220 },
    { "name": "Thịt bò", "amount": "~80g", "calories": 150 }
  ],
  "tips": "Ít nước béo và thêm rau thơm sẽ giảm ~60 kcal."
}
```

`is_food=false` → chỉ cần `{ "is_food": false }`, server đổi thành `NOT_A_FOOD`.

## 6. System prompt cho analyze-food (dùng nguyên văn, chỉ chỉnh khi test fail)

> Bạn là chuyên gia dinh dưỡng Việt Nam. Nhiệm vụ: nhìn ảnh món ăn/thức uống và ước lượng dinh dưỡng theo KHẨU PHẦN THỰC TẾ NHÌN THẤY trong ảnh (dĩa/tô/chén theo kích thước món Việt Nam thông thường). Quy tắc: (1) Chỉ phân tích thứ ăn/uống được; nếu ảnh không có món ăn, trả is_food=false. (2) Tên món dùng tên tiếng Việt phổ biến. (3) Calo và macro ước lượng theo bảng dinh dưỡng phổ thông, làm tròn hợp lý, KHÔNG phóng đại độ chính xác. (4) health_score 1–10 theo mật độ dinh dưỡng, lượng dầu mỡ/đường/muối, rau xanh đi kèm. (5) items liệt kê 2–6 thành phần chính kèm lượng ước lượng và calo từng phần; tổng calo các phần xấp xỉ calories. (6) tips tối đa 2 câu, thực tế, tiếng Việt. Chỉ trả JSON đúng schema, không thêm chữ nào ngoài JSON.

## 7. Giao diện (1 trang, 3 trạng thái)

Phong cách: sáng, tươi, "ngon mắt" — nền kem/trắng ấm, điểm nhấn cam + xanh lá, thẻ bo góc lớn, số calo thật to. Dùng Tailwind sẵn có của nền DrawToStory, không cài thêm thư viện.

1. **Trạng thái chờ:** vùng thả/chọn ảnh lớn (bấm để chọn, kéo thả trên desktop, nút chụp trên mobile qua `capture`), nút phụ **"Dùng ảnh mẫu"** với ảnh phở kèm theo gói bàn giao (`public/assets/foodlens/pho-mau.webp`).
2. **Trạng thái đang phân tích:** skeleton/shimmer trên khung thẻ + dòng trạng thái ("Đang nhận diện món…", "Đang ước lượng dinh dưỡng…"). Ảnh gửi đi phải nén phía client trước (canvas, cạnh dài nhất 1024px, JPEG 0.85).
3. **Trạng thái kết quả — thẻ FoodLens:** ảnh món (bản nén), tên món + confidence, **calo thật to**, 3 thanh macro (đạm/béo/tinh bột, có gam + % calo), vòng điểm lành mạnh /10, bảng items, dòng tips, hàng chọn khẩu phần ×0.5/×1/×1.5/×2, nút "Phân tích món khác". Dòng disclaimer ở chân thẻ (mục 2.2).
4. **Lịch sử:** dưới trang chính, lưới thẻ nhỏ (ảnh thumbnail, tên món, calo, giờ) từ `food_analyses` của user, mới nhất trước, tối đa 20 mục. Bấm vào 1 mục → xem lại chi tiết dạng thẻ kết quả (không gọi AI).

## 8. Lịch trình 3 giờ (làm đúng thứ tự, hết giờ ở phase nào dừng ở đó)

| Phase | Thời gian | Việc | Xong khi |
|---|---|---|---|
| 0 | 0:00–0:15 | Clone nền, đổi tên app, chép ảnh mẫu, build thử | build đạt ở bản clone nguyên trạng |
| 1 | 0:15–1:00 | Edge Function analyze-food + migration 005; test bằng curl với ảnh mẫu | curl trả JSON đúng schema; ảnh không phải món ăn trả NOT_A_FOOD |
| 2 | 1:00–2:00 | Trang /foodlens: chọn ảnh + nén + 3 trạng thái + thẻ kết quả + khẩu phần | phân tích được từ giao diện ở local |
| 3 | 2:00–2:30 | Lịch sử + hạn mức 10/ngày + ghi ai_logs | lịch sử hiện đúng; Admin costs có dòng analyze_food |
| 4 | 2:30–3:00 | Build/lint/test, deploy function + Vercel, kiểm chứng live, báo cáo | checklist mục 9 đạt |

## 9. Checklist nghiệm thu (đạt hết mới gọi là xong)

- [ ] Đăng nhập nhanh Phụ huynh → vào thẳng /foodlens.
- [ ] Dùng ảnh mẫu phở → ra đúng món phở, calo 350–650 (khoảng hợp lý), đủ macro + items + tips.
- [ ] Đổi khẩu phần ×2 → mọi con số nhân đôi, có ghi rõ hệ số.
- [ ] Tải ảnh không phải món ăn (ví dụ ảnh phong cảnh) → thông báo thân thiện, không trừ lượt, không vào lịch sử.
- [ ] Phân tích 1 món thật từ điện thoại (chụp trực tiếp) → chạy được.
- [ ] Lịch sử hiện các lần phân tích trước sau khi tải lại trang (F5).
- [ ] Admin costs có bản ghi `analyze_food` SUCCESS kèm token/chi phí.
- [ ] Build + lint sạch; bản live mở được trên điện thoại.

## 10. NGOÀI phạm vi (khóa — không làm trong đợt 3 giờ này)

Nhật ký ăn uống theo ngày/tuần và biểu đồ xu hướng; quét mã vạch; nhận diện nhiều món riêng lẻ ngoài items trong 1 ảnh; tư vấn thực đơn/giảm cân; chia sẻ kết quả lên mạng xã hội; tách Supabase project riêng; đổi giao diện các trang truyện cũ.
