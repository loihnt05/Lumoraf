# Stage UI-3: Bộ Điều Khiển Hình Thức Lưu Trú (Booking Mode Selector)
*Milestone M2 · Phases: `UI-3.1`, `UI-3.2` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-3
Cung cấp thanh chuyển đổi linh hoạt giữa 3 chế độ đặt phòng (**Khung giờ cố định - Fixed Slot**, **Giờ tùy chỉnh - Custom Time**, **Qua đêm - Overnight**) dựa trên cấu hình động của từng hạng phòng (`RoomTypeBookingConfig`).

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-3.1` — Thành phần `BookingModeTabs` (`src/components/booking/booking-mode-tabs.tsx`)
- Thiết kế dạng Segmented Pill Tabs hỗ trợ đầy đủ chuẩn WAI-ARIA (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`) và điều hướng bằng phím mũi tên (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
- **Tự động thu gọn thông minh**:
  - Chỉ hiển thị các chế độ được bật (`fixedEnabled`, `customEnabled`, `overnightEnabled`).
  - Nếu hạng phòng chỉ bật duy nhất 1 chế độ, thanh tab tự động ẩn để giao diện gọn gàng.
- **Làm sạch dữ liệu tạm khi đổi chế độ**:
  - Khi khách chuyển từ `FIXED` sang `CUSTOM` hoặc `OVERNIGHT`, các lựa chọn không tương thích của chế độ cũ được xóa sạch để tránh gửi nhầm tham số lên API báo giá.
- **Lưu trạng thái phiên (`sessionStorage`)**:
  - Ghi nhớ chế độ khách đang chọn theo từng `roomId` trong phiên làm việc.

### Phase `UI-3.2` — Hợp đồng Cấu hình Hình thức Đặt phòng (`src/lib/api/booking-config.ts`)
- Cung cấp cấu hình thời gian thực cho từng hạng phòng (`RoomTypeBookingConfig`), bao gồm:
  - Cờ bật/tắt 3 hình thức (`fixedEnabled`, `customEnabled`, `overnightEnabled`).
  - Thời lượng slot cố định (`180 phút`), bước nhảy tùy chỉnh (`30 phút`), thời lượng tối thiểu (`180 phút`), thời gian đệm dọn phòng (`30 phút` / `60 phút`) và khung giờ đêm (`23:00–06:00`).
- Có cơ chế fallback an toàn nếu cấu hình mạng gặp sự cố.

---

## 3. Tệp mã nguồn liên quan
- `src/components/booking/booking-mode-tabs.tsx`
- `src/components/ui/tabs.tsx`
- `src/lib/api/booking-config.ts`
- `src/lib/types/booking-config.ts`
