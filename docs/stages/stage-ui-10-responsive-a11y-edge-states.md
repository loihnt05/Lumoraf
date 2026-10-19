# Stage UI-10: Đáp Ứng Thiết Bị Di Động (Mobile Responsive), Trạng Thái Biên & Khả Năng Tiếp Cận WCAG AA
*Milestone M6 · Phases: `UI-10.1`, `UI-10.2`, `UI-10.3` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-10
Đảm bảo toàn bộ giao diện đặt phòng hoạt động mượt mà trên màn hình điện thoại nhỏ (`320px–375px`), xử lý trọn vẹn các trạng thái rỗng/đang tải/lỗi mạng/dữ liệu cũ, và đạt chuẩn tiếp cận bàn phím & trình đọc màn hình WCAG AA.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-10.1` — Đáp Ứng Thiết Bị Di Động (`Mobile Responsive Adaptation`)
- Bố cục tự động chuyển sang 1 cột trên màn hình nhỏ (`<1024px`).
- Toàn bộ vùng chạm cảm ứng (`Mode Tabs`, `Date Radio`, `Fixed Slot Cards`, `Filter Pills`) đạt kích thước tối thiểu từ `min-h-[44px]` đến `min-h-[60px]`.
- Thanh biểu đồ `AvailabilityTimeline` được bọc trong vùng cuộn ngang (`overflow-x-auto` với `min-w-[420px] sm:min-w-0`) giúp các mốc giờ `06:00 – 24:00` không bao giờ bị chồng chữ trên điện thoại.
- Thanh cố định dưới đáy màn hình (`MobileBookingBar`) kết hợp Sheet (`Dialog`) xem chi tiết bảng kê trước khi bấm `Reserve`.

### Phase `UI-10.2` — Trạng Thái Rỗng, Đang Tải, Lỗi Mạng & Dữ Liệu Cũ (`src/components/booking/booking-edge-states.tsx`)
- **`RoomCatalogSkeleton`**: Bộ khung xương tải trang khớp kích thước lưới 4 cột của `RoomCard`.
- **`EmptyRoomsState`**: Hiển thị khi bộ lọc danh mục không có phòng phù hợp, kèm nút 1 chạm `"Xem tất cả phòng khả dụng"`.
- **`AllSlotsBookedBanner`**: Hiển thị trong `FixedSlotPicker` khi toàn bộ ca cố định trong ngày đã kín lịch, cung cấp 2 nút phục hồi nhanh: `"Chọn ngày tiếp theo"` (+1 ngày) hoặc `"Thử Giờ tùy chỉnh (Custom)"`.
- **`NetworkErrorRetryBanner`**: Cảnh báo lỗi mạng (`role="alert"`) kèm nút `"Thử tải lại lịch trống"`.
- **`StaleAvailabilityWarning`**: Cảnh báo dữ liệu cũ (`role="status"`, `aria-live="polite"`) tự động kích hoạt khi Admin thay đổi bảng giá/khóa phòng hoặc sau thời gian chờ, cho phép làm mới tức thì chỉ với 1 cú nhấp.

### Phase `UI-10.3` — Chuẩn Tiếp Cận Bàn Phím & Trình Đọc Màn Hình (`WCAG AA Accessibility Pass`)
- Liên kết bỏ qua điều hướng (`Skip to content` -> `#main-content`) tại `PublicShell`.
- Hỗ trợ phím mũi tên (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home`, `End`) và nhãn đọc chi tiết trên `BookingModeTabs` (`tablist`/`tab`), `DateSelector` (`radiogroup`/`radio`) và `FixedSlotPicker` (`radiogroup`/`radio`).

---

## 3. Tệp mã nguồn liên quan
- `src/components/booking/booking-edge-states.tsx`
- `src/components/booking/booking-mode-tabs.tsx`
- `src/components/booking/date-selector.tsx`
- `src/components/booking/fixed-slot-picker.tsx`
- `src/components/booking/availability-timeline.tsx`
