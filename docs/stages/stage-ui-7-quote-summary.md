# Stage UI-7: Báo Giá Chính Thức, Phụ Phí Khung Đêm & Bảng Tóm Tắt Đặt Phòng
*Milestone M4 · Phases: `UI-7.1`, `UI-7.2` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-7
Kết nối mọi lựa chọn hợp lệ từ 3 chế độ đặt phòng vào dịch vụ Báo giá chính thức (`fetchPricingQuote`), hiển thị minh bạch phụ phí khung đêm (`23:00–06:00`) và trình bày thẻ tóm tắt đặt phòng trên cả Desktop lẫn Mobile.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-7.1` — Tích Hợp Dịch Vụ Báo Giá Chính Thức (`src/lib/api/quote.ts`)
- Mọi thay đổi hợp lệ về phòng, chế độ, ngày hoặc khung giờ đều kích hoạt `fetchPricingQuote()` kèm cơ chế **Debounce** (`250ms` cho Custom Time, `40ms` cho Fixed/Overnight) và hủy request cũ qua `AbortController`.
- **Nguyên tắc định giá chuẩn**:
  - Giá gói **Fixed Slot 3h** luôn ưu đãi rẻ hơn **Custom Time 3h** (do cấu hình bảng giá quy định, không hard-code công thức chênh lệch ở giao diện).
  - Phụ phí khung đêm (`NIGHT_SURCHARGE`, mặc định `+20%`) được tính tự động khi chạm khoảng `23:00 – 06:00` và hiển thị `"—"` khi không phát sinh.
  - Bảng báo giá trả về kèm tóm tắt chính sách hủy phòng (`cancellationPolicy`) tương ứng với từng hình thức lưu trú.

### Phase `UI-7.2` — Thành phần `BookingSummaryPanel` & `MobileBookingBar`
- Thành phần `src/components/booking/booking-summary-panel.tsx`:
  - **Trên Desktop**: Thẻ *"Your stay · Chi tiết đặt chỗ"* cố định bên phải, hiển thị tên phòng, chi nhánh, nhãn chế độ, ngày/giờ nhận trả, thời lượng, bảng bóc tách từng khoản phí, tổng tiền VND và chính sách hủy.
  - **Trên Mobile (`<1024px`)**: Thanh cố định dưới đáy màn hình (`MobileBookingBar`) hiển thị tổng tiền và nút mở **Sheet (`Dialog`)** xem toàn bộ chi tiết báo giá trước khi bấm `Reserve`.

---

## 3. Tệp mã nguồn liên quan
- `src/lib/types/quote.ts`
- `src/lib/api/quote.ts`
- `src/components/booking/booking-summary-panel.tsx`
