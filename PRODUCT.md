# PRODUCT.md — DrawToStory (Đồ án AIBP)

## 1. Tầm nhìn & Sứ mệnh (Vision & Mission)
DrawToStory là nền tảng ứng dụng AI đa phương thức (Multimodal AI) dành cho gia đình Việt, biến những bức tranh vẽ tay ngây ngô trên giấy của trẻ em thành những cuốn sách truyện tranh thiếu nhi cổ tích rực rỡ, cá nhân hóa theo từng lứa tuổi (2–12 tuổi).

**Sứ mệnh:**
- **Bảo tồn nét vẽ tuổi thơ:** Tranh vẽ của con không còn nằm im trong ngăn kéo mà trở thành nhân vật chính trong cuốn truyện cổ tích riêng của bé.
- **AI An Toàn Có Trách Nhiệm (Responsible AI):** Bảo vệ tuyệt đối quyền riêng tư và thế giới tinh thần của trẻ nhỏ với Kiến trúc Phòng thủ 3 lớp (Input Safety → Grounded Generation → Output Judge).
- **Gắn kết gia đình:** Tạo ra những khoảnh khắc ba mẹ cùng con đọc sách mỗi tối (Bedtime Stories) hoặc in thành sách kỷ niệm thật.

---

## 2. Đối tượng Người dùng & Bối cảnh Sử dụng (Audience & Context)

### 2.1. Trẻ em (2–12 tuổi) — Role `kid`
- **Tâm lý:** Thích màu sắc tươi sáng, tò mò, háo hức khi thấy nét vẽ của mình "biến hóa", chú ý ngắn (cần chữ to, dễ nghe, có giọng đọc hỗ trợ).
- **Ngữ cảnh:** Cầm iPad/điện thoại đọc truyện, bấm nút nghe đọc hoặc cùng ba mẹ lật từng trang sách.
- **Yêu cầu UI:** Chế độ Bé (Kid Mode) toàn màn hình, nút bấm lớn, không quảng cáo, khóa cổng phụ huynh bằng mã PIN an toàn.

### 2.2. Phụ huynh (Parent) — Role `parent`
- **Tâm lý:** Yêu thương con nhưng bận rộn; cẩn trọng tối đa với các nội dung độc hại trên internet; muốn con bớt dán mắt vào video ngắn độc hại.
- **Ngữ cảnh:** Dùng điện thoại chụp ảnh bức vẽ của con trên bàn học, nhập biệt danh và lứa tuổi, chọn bài học giáo dục (yêu thương, chia sẻ, dũng cảm) và nhận câu chuyện sau vài giây.
- **Yêu cầu UI:** Giao diện tinh tế, ấm áp kiểu sách tranh vintage, thông tin rõ ràng, thao tác tạo truyện không quá 3 bước, có thể tải PDF in sách thật.

### 2.3. Khách & Người thân (Guest) — Public
- **Ngữ cảnh:** Ông bà, thầy cô hoặc bạn bè nhận được đường link chia sẻ `/shared/:token` để xem cuốn sách của bé mà không cần phải tạo tài khoản phức tạp.
- **Yêu cầu UI:** Mở xem ngay lập tức, hỗ trợ đọc to bằng giọng đọc AI, hiển thị rõ lời khen tặng và nét vẽ gốc của bé.

### 2.4. Quản trị viên & Kiểm duyệt viên (Admin) — Role `admin`
- **Tâm lý:** Cần kiểm soát chi phí API, giám sát các nội dung bị AI gắn cờ cảnh báo (Human-in-the-Loop), tinh chỉnh luật an toàn.
- **Yêu cầu UI:** Bảng điều khiển mật độ thông tin cao (High density), trực quan hóa bằng biểu đồ Recharts chuẩn mực, phím tắt duyệt bài nhanh.

---

## 3. Các Nguyên tắc Thiết kế Bất biến (Core Product Principles)
1. **Nét vẽ của con là nhân vật chính (Grounded Truth):** AI không bao giờ tự ý vẽ một nhân vật lạ hoắc thay thế tranh của bé. Nét vẽ gốc luôn xuất hiện trân trọng ở bìa sách và các trang phân cảnh.
2. **Không có "Dark Patterns" & Tôn trọng quyền riêng tư (GDPR):** Không quảng cáo, không lưu trữ ảnh khuôn mặt thật ngoài đời, hỗ trợ xóa vĩnh viễn toàn bộ dữ liệu tài khoản và tranh vẽ chỉ bằng một nút bấm.
3. **Ấm áp như trang sách giấy thật (Editorial Storybook Feel):** Tone màu nền giấy kem ấm `#FFF9F0`, phông chữ tròn trịa thân thiện (`Baloo 2`, `Quicksand`, `Nunito`), từ chối các hiệu ứng hào nhoáng rẻ tiền (AI-slop blur blobs, gradient tím-xanh công nghiệp).
