# Stage UI-5: Trải Nghiệm Đặt Phòng Theo Giờ Tùy Chỉnh (Custom Time)
*Milestone M3 · Phases: `UI-5.1`, `UI-5.2`, `UI-5.3` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-5
Cho phép khách hàng tự do lựa chọn giờ nhận phòng và trả phòng linh hoạt theo bước nhảy 30 phút, trực quan hóa lịch bận trong ngày bằng thanh thời gian (`AvailabilityTimeline`) và kiểm tra xung đột thời gian thực.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-5.1` — Bộ Điều Khiển Giờ Tùy Chỉnh (`CustomTimePicker`)
- Thành phần `src/components/booking/custom-time-picker.tsx`:
  - **Bước nhảy bắt buộc**: `30 phút` (`:00` hoặc `:30`).
  - **Thời lượng tối thiểu**: `3 giờ` (`180 phút`).
  - **Hỗ trợ lưu trú qua nửa đêm (`+1 ngày / Hôm sau`)**: Nếu khách chọn giờ trả nhỏ hơn hoặc bằng giờ nhận (ví dụ nhận `22:00`, trả `02:00`), hệ thống tự động hiểu là trả phòng vào sáng hôm sau và gắn nhãn `+1 ngày (Hôm sau)`.
  - **Tính toán giờ khung đêm tự động**: Hàm `calculateNightHours()` đếm chính xác số giờ nằm trong khoảng `23:00 – 06:00` để áp dụng phụ phí đêm.

### Phase `UI-5.2` — Thanh Thời Gian Trực Quan (`AvailabilityTimeline`)
- Thành phần `src/components/booking/availability-timeline.tsx`:
  - Biểu diễn trực quan dải thời gian từ `06:00` đến `24:00` với các vạch chia mỗi 2 giờ.
  - Các khoảng đã có khách đặt cộng thêm 30 phút dọn phòng được tô vân sọc xám với nhãn chung `"Đã bận / Không khả dụng"`.
  - Hỗ trợ cuộn ngang mượt mà trên màn hình điện thoại hẹp (`min-w-[420px] sm:min-w-0`) và danh sách `sr-only` cho trình đọc màn hình.

### Phase `UI-5.3` — Kiểm Tra Xung Đột Thời Gian Thực (`Conflict-Aware Selection`)
- Hàm `checkRangeConflict()` kiểm tra giao thoa giữa khoảng khách chọn `[start, end]` và các khoảng bận trên lịch.
- Quy tắc biên chuẩn: Cho phép giờ trả phòng của khách trùng đúng điểm bắt đầu của lượt bận kế tiếp (`end === unavailable.start`) khi khoảng đệm vệ sinh đã được tính.
- Khi phát hiện xung đột, thanh timeline nhấp nháy cảnh báo màu đỏ và khóa nút `Reserve`.

---

## 3. Tệp mã nguồn liên quan
- `src/components/booking/custom-time-picker.tsx`
- `src/components/booking/availability-timeline.tsx`
- `src/lib/api/custom-availability.ts`
