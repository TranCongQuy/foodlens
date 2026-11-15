# PROMPT CHO ANTIGRAVITY — DỰ ÁN FOODLENS (KHUNG 3 TIẾNG)

Bạn là Coder. Hãy build dự án **FoodLens** theo đúng đặc tả đính kèm (`dac-ta-foodlens.md` — đọc kỹ trước khi làm, đặc tả là luật). Đây là dự án phái sinh từ DrawToStory: tái dùng khung đã chạy thật, chỉ thêm 1 luồng mới. Tổng thời gian tối đa 3 giờ — làm đúng thứ tự phase trong mục 8 của đặc tả, hết giờ ở đâu dừng ở đó và báo cáo trung thực.

## 0. An toàn & đường lui (làm trước mọi thứ)

1. Clone repo DrawToStory (`nguyendangha10126-svg/Doan-AIBD`) tại commit `0d50df6` sang thư mục MỚI `D:\VSCODE PXU K22\FoodLens`. TUYỆT ĐỐI không sửa trong thư mục DrawToStory gốc.
2. Commit đầu tiên trong bản clone: `chore: base DrawToStory 0d50df6` — đây là đường lui.
3. Không in, không chép, không commit bất kỳ giá trị bí mật nào (API key, mật khẩu, nội dung file .env) vào code, log hay báo cáo. File .env thật không được track lên git (kiểm tra .gitignore như bản gốc).

## 1. Phạm vi — CHỈ làm những việc này

- Đổi tên app thành FoodLens (title, header, package name).
- Migration `005_foodlens.sql`: bảng `food_analyses` + RLS đúng mục 5 đặc tả. Chạy trên Supabase project DÙNG CHUNG của DrawToStory (ref `htvslxbytqoteyimtcxg`) — secrets GEMINI_API_KEY / GEMINI_MODEL đã có sẵn, KHÔNG tạo project mới, KHÔNG nạp lại secret.
- Edge Function `analyze-food` đúng mục 4 + system prompt nguyên văn mục 6 + response schema mục 5 của đặc tả. Mẫu tham chiếu: function `generate-story` hiện có (cách đọc secret, bắt JWT, ghi ai_logs, xử lý lỗi).
- Trang `/foodlens` đúng mục 7 đặc tả (3 trạng thái + thẻ kết quả + hệ số khẩu phần + lịch sử 20 mục). Sau đăng nhập, vai người dùng vào thẳng `/foodlens`. Chép ảnh `pho-mau.webp` từ gói bàn giao vào `public/assets/foodlens/` cho nút "Dùng ảnh mẫu".
- Hạn mức 10 lượt/ngày/user và ghi `ai_logs` operation `analyze_food`.

## 2. Cấm — ngoài phạm vi (mục 10 đặc tả)

Không sửa logic auth/quick-login/ai_logs/Admin của nền. Không gỡ các trang truyện (chỉ gỡ khỏi điều hướng chính). Không cài thêm thư viện UI. Không làm nhật ký theo ngày, biểu đồ, mã vạch, chia sẻ mạng xã hội. Không tự ý đổi model AI hay system prompt.

## 3. Kỷ luật kiểm chứng (mỗi phase xong mới sang phase kế)

- Phase 1 xong phải có bằng chứng curl: ảnh phở mẫu → JSON đúng schema; ảnh phong cảnh → NOT_A_FOOD.
- Phase 2–3 xong phải tự bấm thử trên local đủ 6 luồng của checklist mục 9 (trừ mục deploy).
- Trước khi báo cáo: `npm run build` + `npm run lint` + test sẵn có của nền phải đạt; không đạt thì sửa trong phạm vi, không báo cáo qua loa.
- Deploy (chỉ khi user đã duyệt báo cáo local): `supabase functions deploy analyze-food` + chạy migration + deploy Vercel như quy trình DrawToStory. Secrets KHÔNG nạp qua file .env bằng CLI (bài học ký tự ẩn) — nếu buộc phải đụng secret thì DỪNG và báo user gõ tay trên Dashboard.

## 4. Mẫu báo cáo bắt buộc (trả về đúng cấu trúc này)

```
BÁO CÁO FOODLENS
- Phase hoàn thành: [0/1/2/3/4] — phase dở dang: [mô tả dừng ở đâu]
- Commit: [hash + message từng commit]
- Kiểm chứng: build [đạt/lỗi], lint [đạt/lỗi], test nền [x/y]
- Curl analyze-food: [JSON tóm tắt kết quả ảnh mẫu] / NOT_A_FOOD: [đạt/chưa]
- Checklist mục 9: [đánh dấu từng mục đạt/chưa + bằng chứng ngắn]
- Admin costs: [có/không có dòng analyze_food SUCCESS]
- Vượt phạm vi đã làm: [không có / liệt kê]
- Việc còn nợ + lý do: [...]
```

Không báo cáo "xong" cho bất kỳ mục nào chưa tự kiểm chứng. Nếu một bước thất bại 2 lần liên tiếp, dừng, ghi rõ lỗi nguyên văn và đề xuất hướng khác trong báo cáo — không tự ý mở rộng phạm vi để lách.
