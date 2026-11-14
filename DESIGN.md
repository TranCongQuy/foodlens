# DESIGN.md — DrawToStory Design System (Single Source of Truth)

## 1. Visual World & Direction (Thế giới Thị giác)
- **Concept:** *Vintage Children's Illustrated Picture Book Meets Gentle Modern Web*
- **Ambient Scene:** Phòng đọc sách gia đình buổi tối, ánh đèn vàng ấm áp, trang sách giấy thủ công dày dặn có vân sần nhẹ.
- **Tone & Voice:** Ấm áp, khích lệ, trong sáng, đáng tin cậy. Tuyệt đối không dùng thuật ngữ công nghệ giật gân, không dùng biệt ngữ AI khô khan khi nói chuyện với phụ huynh và bé.

---

## 2. Design Tokens Nguồn (CSS Custom Properties at `:root`)

### 2.1. Màu sắc Nền & Bề mặt (Surfaces & Inks)
- `--color-bg: #FFF9F0;` (Nền giấy kem truyền thống - warm cream paper)
- `--color-surface: #FFFFFF;` (Mặt phẳng thẻ trắng sạch)
- `--color-surface-2: #FFF3E6;` (Mặt phẳng giấy ngà nhấn nhẹ)
- `--color-surface-3: #FCE8D5;` (Mặt phẳng kem đậm / viền lót)
- `--color-ink: #2E2540;` (Mực tím thẫm than đá - tương phản ≥10:1 trên nền kem)
- `--color-ink-soft: #5E5370;` (Mực phụ mờ nhạt vừa - tương phản ≥4.5:1 WCAG AA)
- `--color-ink-faint: #8A7F99;` (Mực trang trí, đường kẻ chia tách - tương phản ≥3:1)

### 2.2. Màu Thương hiệu & Điểm nhấn (Brand & Semantic)
- `--color-brand: #D13A5E;` (Hồng mâm xôi chín - ấm áp, thân thiện, tràn đầy tình cảm)
- `--color-brand-hover: #B92F51;`
- `--color-brand-light: #FFE3EA;`
- `--color-magic: #6C5CE7;` (Tím phép thuật AI - điểm xuyết kỳ ảo cho nét vẽ)
- `--color-success: #166E48;` (Xanh lá rừng an toàn)
- `--color-warning: #8A5A00;` (Hổ phách cảnh báo)
- `--color-danger: #B42343;` (Đỏ anh đào từ chối an toàn)
- `--color-info: #1F5FA8;` (Xanh dương thông tin)

### 2.3. Hệ phông chữ & Thước đo Typography
- **Headings & Tiêu đề:** `'Quicksand', system-ui, sans-serif` (Bo tròn đầu nét, thân thiện, font-weight: 700/800).
- **Body & Giao diện:** `'Nunito', system-ui, sans-serif` (Dễ đọc, mở rộng, độ rộng dòng tối ưu 65–75 ký tự).
- **Trang sách đọc cho bé:** `'Baloo 2', 'Quicksand', sans-serif` (Nét bút lông thiếu nhi, khoảng cách chữ thoáng, kích thích thị giác).

### 2.4. Bo góc & Đổ bóng (Border Radius & Depth)
- `--radius-card: 28px;` (Góc bo mềm an toàn cho trẻ)
- `--radius-input: 16px;` (Ô nhập liệu vừa vặn ngón tay)
- `--radius-pill: 9999px;` (Nút bấm hình viên thuốc mềm mại)
- `--shadow-card: 0 1px 2px rgba(46,37,64,0.06), 0 12px 32px -12px rgba(46,37,64,0.14);` (Bóng đổ đa tầng tự nhiên)
- `--shadow-btn: 0 8px 20px -8px rgba(209,58,94,0.45);`

---

## 3. Các Chế độ Giao diện (Modes of Operation)

| Chế độ (Mode) | Màn hình áp dụng | Mục tiêu trải nghiệm | Nguyên tắc thiết kế |
|---|---|---|---|
| **Persuade** | `/trust`, `/login`, `/register`, `/shared/:token` | Thuyết phục phụ huynh tin tưởng vào tính an toàn & giá trị của ứng dụng | 1 section/screen (Taste skill), ảnh tranh vẽ thật, câu chữ truyền cảm hứng, không có đốm mờ giả tạo |
| **Operate** | `/`, `/library`, `/settings`, `/admin/*` | Giúp phụ huynh và Admin hoàn thành tác vụ nhanh nhất | Không lồng thẻ (no nested cards), nút bấm rõ ràng, phân cấp thị giác mạch lạc, Recharts dùng CSS tokens |
| **Experience** | `/story/:id`, `/kid` | Đắm chìm vào thế giới cổ tích của bé | Trực quan toàn màn hình, nút bấm to (`min-h-[48px]`), Screen Wake Lock giữ sáng, giọng đọc Web Speech AI tự nhiên |

---

## 4. Bộ Tiêu Chuẩn Chống "AI Slop" (Hallmark Floor & Craft Standards)
1. **Tuyệt đối không có "Card lồng trong Card" (No Nested Cards):** Một vùng nội dung chỉ có 1 thẻ bao bọc duy nhất. Nội dung bên trong được phân tách bằng khoảng cách và kiểu chữ, không dùng thêm thẻ con lồng vào.
2. **Tuyệt đối không dùng đốm mờ trang trí vô nghĩa (No Random Blurred Blobs):** Cấm các thẻ `div.rounded-full.blur-3xl` đặt bừa bãi làm nền. Bề mặt phải là chất liệu thực (vân giấy sần hoặc gradient phương hướng rõ ràng).
3. **Tuyệt đối không dùng chữ hoa Tracking làm nhãn phụ (No Tracked Uppercase Eyebrows):** Không đặt `<span class="uppercase tracking-wider">` bên trên tiêu đề chính. Tiêu đề mang đầy đủ ý nghĩa và tự khẳng định vị thế.
4. **Không dùng Gradient tím-xanh rập khuôn:** Màu thương hiệu là Hồng mâm xôi `#D13A5E` và Kem `#FFF9F0`, không sử dụng dải màu tím-xanh công nghiệp của các mẫu template AI.
5. **Số liệu luôn có ý nghĩa thực tế:** Tuyệt đối không bịa đặt số liệu quảng cáo không nguồn. Mọi con số trên `/trust` và `/admin` đều phản ánh đúng dữ liệu đang có trong cơ sở dữ liệu.
6. **Mọi mã HTML/CSS/JS tuân thủ Web Platform:** Sử dụng `<dialog>` gốc, `popover`, `overscroll-behavior: contain`, `touch-action: manipulation`, xử lý an toàn bộ gõ IME (`event.isComposing`), và ưu tiên tải ảnh (`fetchpriority="high"` cho ảnh LCP).
