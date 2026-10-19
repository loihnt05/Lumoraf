# Stage UI-11: Kiểm Chứng Tích Hợp & 6 Luồng Đặt Phòng Đầu-Cuối (End-to-End Verification)
*Milestone M6 · Phases: `UI-11.1`, `UI-11.2` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-11
Kiểm chứng toàn diện sự phối hợp giữa các thành phần giao diện, dịch vụ báo giá, lịch trống, giữ chỗ 15 phút, thanh toán mô phỏng và cấu hình Admin thông qua bộ kiểm thử tự động Vitest.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-11.1` — Kiểm Thử Tích Hợp Thành Phần & Nghiệp Vụ (`Component & Integration Verification`)
- Kiểm thử định tuyến API, timeout và xử lý lỗi cấu trúc (`src/lib/api/client.test.ts`).
- Kiểm thử báo giá chính thức, giữ chỗ 15 phút, chống xung đột đặt trùng (`409 BOOKING_CONFLICT`) và thanh toán mô phỏng (`src/lib/api/quote-and-booking.test.ts`).
- Kiểm thử ràng buộc cấu hình Admin, cập nhật bảng giá thời gian thực và phân quyền khóa phòng `ADMIN`-only (`src/lib/api/admin-config.test.ts`).

### Phase `UI-11.2` — Kiểm Chứng 6 Luồng End-to-End Smoke Flows (`src/lib/api/e2e-booking-flows.test.ts`)
1. **Flow 1 (Fixed Slot Journey)**: Duyệt danh mục -> chọn phòng vật lý `No5 Deluxe Room` -> chọn `Fixed Slot 5 (21:00–00:00)` có phụ phí đêm `+20%` -> nhận báo giá chính thức -> `Reserve` giữ chỗ 15 phút -> `Mock Payment PAID` -> chuyển sang `CONFIRMED` và đánh dấu slot `BOOKED`.
2. **Flow 2 (Custom Time Journey)**: Chọn `Custom Time` -> kiểm tra chặn xung đột với khoảng bận + buffer dọn phòng -> chọn khung giờ qua nửa đêm (`22:00` đến `02:00 +1 ngày`) -> tính chính xác 3 giờ đêm (`23:00–06:00`) và phụ phí.
3. **Flow 3 (Overnight Journey)**: Chọn `Overnight` (`Check-in 14:00` – `Check-out 11:00`) -> kiểm tra chặn ngày trả trước ngày nhận -> xác nhận mô hình tính giá độc lập theo đêm (`overnightPrice × số đêm`).
4. **Flow 4 (Conflict & Price Change Guard)**: Kiểm tra bảo vệ xung đột đặt trùng (`409 BOOKING_CONFLICT`) và biến động giá (`PRICE_CHANGED`).
5. **Flow 5 (15m Hold Lifecycle)**: Kiểm tra vòng đời giữ chỗ 15 phút (`PENDING_PAYMENT`) -> mô phỏng thanh toán lỗi (`FAILED`) cho phép thử lại -> mô phỏng hết hạn 15 phút (`EXPIRED`) tự động giải phóng slot về trạng thái `AVAILABLE`.
6. **Flow 6 (Admin Live Config & Blocking)**: Kiểm tra Admin cập nhật bảng giá (`updateRoomTypeBookingConfig`) phản ánh tức thì vào báo giá khách hàng -> kiểm tra phân quyền khóa phòng vật lý (`MANAGER` bị chặn `403`, `ADMIN` khóa thành công và chặn đặt phòng).

---

## 3. Tệp mã nguồn liên quan
- `src/lib/api/e2e-booking-flows.test.ts`
- `src/lib/api/quote-and-booking.test.ts`
- `src/lib/api/admin-config.test.ts`
- `src/lib/api/client.test.ts`
