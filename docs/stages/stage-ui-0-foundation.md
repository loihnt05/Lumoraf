# Stage UI-0: Nền Tảng Thiết Kế UX & Quy Ước Trạng Thái Giao Diện
*Milestone M1 · Phases: `UI-0.1`, `UI-0.2` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-0
Thiết lập hệ thống Design System lấy cảm hứng từ **Sonder** (ấm áp, biên tập nghệ thuật, tối giản tinh tế) và bộ quy ước trạng thái đặt phòng thống nhất cho toàn bộ ứng dụng Frontend `Lumoraf`.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-0.1` — Khởi tạo Design System & Hệ thống Token (`globals.css`)
- **Bảng màu chủ đạo (Color Palette)**:
  - Nền ấm áp (`--background`): `#F6F3EE` (Warm Alabaster / Kem ngà).
  - Bề mặt thẻ (`--surface` / `--card`): `#FFFFFF` (Trắng tinh khiết).
  - Chữ chính (`--foreground`): `#1D1D1B` (Than chì đậm, độ tương phản cao).
  - Chữ phụ (`--muted-foreground`): `#686862` (Xám tro ấm).
  - Viền mảnh (`--border`): `#DEDAD2`.
  - Màu nhấn thương hiệu (`--primary`): `#334A40` (Xanh rừng thông đậm — Deep Forest Green).
- **Hệ thống Typography**:
  - `text-display`: Font Serif nghệ thuật dành cho tiêu đề Hero và tên Chi nhánh.
  - `text-heading`: Tiêu đề phân mục rõ ràng, khoảng cách chữ cân đối.
  - `text-body`, `text-caption`: Văn bản nội dung và nhãn метаdata.
  - `text-price`: Font số `tabular-nums` giúp các cột giá tiền VND luôn thẳng hàng tuyệt đối.
- **UI Primitives cốt lõi (`src/components/ui/`)**:
  - `button.tsx`, `badge.tsx`, `card.tsx`, `skeleton.tsx`, `dialog.tsx`, `tabs.tsx`, `dropdown-menu.tsx`, `avatar.tsx`.

### Phase `UI-0.2` — Quy ước Trạng thái Đặt phòng (`src/lib/booking-states.ts`)
- **4 trạng thái chuẩn hóa (`SlotVisualState`)**:
  1. `AVAILABLE`: Khung giờ/phòng đang trống, cho phép người dùng nhấp chọn và điều hướng bằng bàn phím.
  2. `SELECTED`: Khung giờ đang được khách hàng chọn, nổi bật với viền và nền `--primary`.
  3. `BOOKED`: Khung giờ đã có khách đặt giữ chỗ hoặc đã xác nhận thanh toán (`disabled`, không cho phép tương tác).
  4. `UNAVAILABLE`: Khoảng thời gian không khả dụng (bao gồm cả thời gian dọn phòng/vệ sinh hoặc phòng bị khóa bảo trì).
- **Quy tắc hiển thị Khoảng đệm dọn phòng (Cleaning Buffer)**:
  - Khoảng đệm dọn phòng (`30 phút` cho theo giờ, `60 phút` cho qua đêm) **không bao giờ** hiển thị như một ca đặt phòng độc lập cho khách, mà được gộp tự động vào khoảng không khả dụng phía sau lượt đặt.

---

## 3. Tệp mã nguồn liên quan
- `src/app/globals.css`
- `src/lib/booking-states.ts`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/skeleton.tsx`
