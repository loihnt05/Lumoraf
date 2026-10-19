# Stage UI-8: Giữ Phòng 15 Phút, Xử Lý Xung Đột & Cổng Thanh Toán Mô Phỏng
*Milestone M4 · Phases: `UI-8.1`, `UI-8.2`, `UI-8.3` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-8
Triển khai luồng chuyển tiếp từ bước bấm `Reserve` sang tạo đơn giữ chỗ 15 phút (`PENDING_PAYMENT`), bảo vệ chống bấm đúp/xung đột đặt trùng, và cung cấp trang Checkout thanh toán mô phỏng (`Mock Payment Gateway`) cùng trang quản lý đơn của khách (`/my-bookings`).

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-8.1` — Hành Động Đặt Phòng (`Reserve`) & Bảo Vệ Xung Đột
- **Giữ nguyên lựa chọn qua bước Đăng nhập**: Nếu khách chưa đăng nhập khi bấm `Reserve`, hộp thoại `SignInModal` mở ra nhưng toàn bộ lựa chọn phòng/ngày/giờ vẫn được giữ nguyên.
- **Chống Double-Click**: Khóa đồng bộ bằng `submittingLockRef` kết hợp trạng thái `isSubmitting`.
- **Xử lý `409 BOOKING_CONFLICT` & `PRICE_CHANGED`**:
  - Nếu khung giờ vừa bị người khác đặt: tự động làm mới lịch trống và hiển thị cảnh báo xung đột.
  - Nếu giá phòng vừa được Admin cập nhật: hiển thị bảng giá mới để khách xác nhận lại trước khi tạo đơn.

### Phase `UI-8.2` — Màn Hình Giữ Phòng 15 Phút (`/booking/checkout/[bookingId]`)
- Hiển thị mã đơn (`#LMR-YYMMDD-XXXX`), bản chụp báo giá đã chốt (`quoteSnapshot`) và **Đồng hồ đếm ngược 15 phút (`expiresAt`)** cập nhật từng giây.
- Lưu trữ bền vững trong `localStorage`: tải lại trang (`F5`) hoặc quay lại trang phòng không làm mất phiên giữ chỗ.

### Phase `UI-8.3` — Cổng Mock Payment Sandbox & Trang `/my-bookings`
- **3 kịch bản mô phỏng thanh toán trực tiếp trên trang Checkout**:
  1. **Thanh toán Thành công (`PAID`)**: Chuyển đơn sang `CONFIRMED` (idempotent), sinh mã giao dịch `MOCK_TX_...` và mã `Check-in QR`.
  2. **Thanh toán Thất bại (`FAILED`)**: Ghi nhận lần thử lỗi nhưng vẫn giữ đơn ở `PENDING_PAYMENT` (nếu còn thời gian giữ chỗ) để khách bấm thanh toán lại (`Retry`).
  3. **Hết hạn 15 phút (`EXPIRED`) / Hủy giữ chỗ (`CANCELLED`)**: Tự động giải phóng phòng về trạng thái `AVAILABLE` trên lịch trống.
- **Trang `/my-bookings`**: Liệt kê lịch sử đặt phòng của khách kèm bộ lọc theo trạng thái.

---

## 3. Tệp mã nguồn liên quan
- `src/lib/api/bookings.ts`
- `src/app/(public)/booking/checkout/[bookingId]/page.tsx`
- `src/app/(public)/my-bookings/page.tsx`
- `src/lib/api/quote-and-booking.test.ts`
