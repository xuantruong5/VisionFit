# Tài Liệu Chuẩn Hóa Linh Vật VisionFit — Mascot Kinematic Rig v2

Tài liệu hướng dẫn và đặc tả kỹ thuật cho hệ thống linh vật Gấu VIF & Mèo VIF sau khi hoàn thiện cơ thể liền khối, phân cấp khớp động học và animation tự nhiên.

---

## 1. Các Vấn Đề Đã Được Khắc Phục Triệt Để

1. **Cảm giác chắp vá màu sắc (Seam & Gradient Mismatch):**
   - *Trước:* Từng chi (bắp tay, thân, cẳng chân) sử dụng `<linearGradient>` riêng. Do SVG bounding box của từng bộ phận khác nhau, gradient stop bị lệch sáng/tối tại vị trí tiếp giáp tạo cảm giác tay/chân như miếng dán khác màu.
   - *Sau:* Áp dụng bảng màu lông nền phẳng đồng nhất (`#BA875A` cho Gấu, `#ED9859` cho Mèo) xuyên suốt từ đầu, cổ, thân, vai, bắp tay, cẳng tay đến bàn chân. Các bộ phận nối liền như một khối cơ thể tự nhiên.

2. **Khớp nối 2 đoạn có khuỷu tay (2-Segment Arm Rig):**
   - *Trước:* Cánh tay là 1 khối duy nhất, cử tạ bằng cách xoay cả cánh tay hoặc dùng `translateY(-16px)` làm đứt lìa ổ vai.
   - *Sau:* Tách thành bắp tay (`upper-arm`) xoay quanh vai và cẳng tay (`forearm`) gập quanh khuỷu tay. Bàn tay và tạ nằm trong nhóm cẳng tay, khi nâng tạ (curl) cẳng tay gập lên trước ngực mượt mà, tạ không bị thân che khuất.

3. **Cổ và Thân Chồng Lấp Giải Phẫu (Neck-Torso Overlap):**
   - *Trước:* Đầu kết thúc tại `y=124`, thân bắt đầu tại `y=124` chỉ chạm mép. Khi đầu nghiêng hoặc thân thở làm lộ khe hở nền.
   - *Sau:* Vùng cổ thân kéo dài lên tận `y=108`, tạo độ chồng lấp 15px vững chắc dưới cằm (`y=123`). Xoay đầu ở mọi góc cực trị không bao giờ hở nền.

4. **Bàn Chân Liền Khối:**
   - *Trước:* Bàn chân là vòng nâu bọc lòng trắng rời rạc dán dưới bụng.
   - *Sau:* Bàn chân cùng màu lông nền, nối mượt mà từ hông xuống, có các nếp ngón chân nhỏ tinh tế.

5. **Ăn Mừng Đối Xứng & Bóng Mặt Đất Chuẩn Vật Lý:**
   - *Trước:* `vif-arm-cheer` dùng góc dương cho cả 2 bên làm lệch cánh tay; nhảy kéo cả bóng bay lên không trung.
   - *Sau:* Tách `vif-arm-cheer-left` (góc âm `-120deg` đến `-145deg`) và `vif-arm-cheer-right` (góc dương `120deg` đến `145deg`) tạo dáng chữ V chiến thắng đối xứng. Nhảy diễn ra trên `character-root`, bóng nằm trên sàn chỉ co giãn và mờ dần.

6. **Thời Lượng CSS & Khớp Debug Thật:**
   - *Trước:* `animation-duration: 400%` là cú pháp CSS không hợp lệ. Khớp debug chỉ dùng pseudo-element.
   - *Sau:* Dùng thời lượng chuẩn CSS `3.5s !important` khi bật chế độ Chậm 0.25x. Tích hợp các thẻ SVG `<circle class="joint-marker">` trực tiếp tại tâm khớp vai, khuỷu, cổ, hông.

---

## 2. Bảng Màu Chuẩn (Color Tokens)

### Gấu VIF (Bear)
- **Lông nền chính:** `#BA875A`
- **Lông đậm / Đường nét:** `#8F5C34`
- **Bụng & Mõm sáng:** `#FFE6C7`
- **Mắt hạt nhãn:** `#2A1810`
- **Mũi bo tròn:** `#4A2E1B`

### Mèo VIF (Cat)
- **Lông nền chính:** `#ED9859`
- **Lông đậm / Râu / Đường nét:** `#C25816` & `#A95231`
- **Yếm ngực, bụng & chóp đuôi:** `#FFF4DF`
- **Mắt xanh ngọc bích:** `#154E38`
- **Mũi hồng nhỏ:** `#FF6B81`

### Nhận diện Thương hiệu VisionFit
- **Xanh thương hiệu (Brand Green):** `#198D69`
- **Xanh đậm viền (Brand Dark):** `#0F6F52`
- **Xanh sáng phản quang (Brand Light):** `#73DFAC`
- **Vàng vô địch (Gold Accent):** `#F5C65C`

---

## 3. Cây Phân Cấp Khớp Động Học (Kinematic Joint Hierarchy)

```text
SVG (ViewBox: 0 0 200 240)
├── defs (ID duy nhất theo instance: prefix)
├── layer-shadow (Bóng mặt đất cố định)
└── character-root (Nhảy toàn thân, tiếp đất)
    ├── layer-legs (Chân và bàn chân liền khối)
    ├── layer-tail (Đuôi mèo nối vào hông)
    └── torso-rig (Hệ thân, cổ, tay và đầu)
        ├── layer-body (Thân, cổ nhô cao y=108, bụng kem, áo theo cấp)
        ├── acc-medal (Huy chương Champion quanh cổ)
        ├── layer-arms (Cánh tay nằm trước ngực)
        │   ├── arm-left (Bắp tay trái, pivot vai 64px, 126px)
        │   │   └── forearm-left (Cẳng tay trái, pivot khuỷu 50px, 152px)
        │   │       ├── bàn tay (paw-left)
        │   │       ├── băng cổ tay
        │   │       └── tạ đơn (prop-dumbbell-left)
        │   └── arm-right (Bắp tay phải, pivot vai 136px, 126px)
        │       └── forearm-right (Cẳng tay phải, pivot khuỷu 150px, 152px)
        │           ├── bàn tay (paw-right)
        │           ├── băng cổ tay
        │           └── tạ đơn (prop-dumbbell-right)
        ├── layer-head-group (Pivot cổ 100px, 118px)
        │   ├── layer-ears (Tai)
        │   ├── part-head (Đầu bo tròn)
        │   ├── head-headband (Băng đô VisionFit)
        │   ├── part-snout & part-nose (Mõm & mũi)
        │   ├── layer-eyes (Cụm mắt đồng bộ tâm chớp mắt)
        │   └── layer-mouth (Miệng cười / mở nói)
        └── joint-markers (Các điểm marker SVG hiển thị khi debug)
```

---

## 4. Bảng Ảnh Xem Trước (Generated Previews)

Các file SVG tổng hợp được tạo tự động từ chính source code:
- [Bảng 4 cấp độ tiến hóa của Gấu và Mèo](previews/mascot_evolution_grid.svg)
- [Bảng 7 tư thế chuyển động cực trị](previews/mascot_poses_grid.svg)

---

## 5. Quy Trình Kiểm Thử

Chạy toàn bộ bài test:
```bash
npm run check
npm test
```
Tất cả 27 bài kiểm tra hợp đồng, khớp nối, CSS keyframes và CSP MIME type đều đạt 100%.
