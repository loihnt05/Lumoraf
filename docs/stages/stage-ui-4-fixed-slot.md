# Stage UI-4: Trải Nghiệm Đặt Phòng Theo Khung Giờ Cố Định (Fixed Slot 3h)
*Milestone M2 · Phases: `UI-4.1`, `UI-4.2`, `UI-4.3` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-4
Xây dựng trải nghiệm chọn nhanh các ca nghỉ 3 giờ cố định trong ngày với mức giá gói ưu đãi, tự động ẩn khoảng đệm vệ sinh 30 phút và hiển thị rõ nhãn phụ phí khung đêm.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-4.1` — Thanh Chọn Ngày 14 Ngày (`DateSelector`)
- Thành phần `src/components/booking/date-selector.tsx` hiển thị dải 14 ngày liên tiếp dạng cuộn ngang mượt mà.
- Định dạng thứ/ngày/tháng thân thiện tiếng Việt (`Hôm nay`, `Ngày mai`, `T2`, `T3`...); hỗ trợ điều hướng bàn phím chuẩn `role="radiogroup"`.
- Khi người dùng đổi sang ngày khác, slot đang chọn của ngày cũ tự động được hủy chọn để đảm bảo tính chính xác của báo giá.

### Phase `UI-4.2` — Bộ Chọn 5 Khung Giờ Cố Định Chuẩn (`FixedSlotPicker`)
- Thành phần `src/components/booking/fixed-slot-picker.tsx` hiển thị 5 ca tiêu chuẩn mỗi ngày (mỗi ca **3 giờ = 180 phút**):
  1. **Slot 1**: `07:00 – 10:00` *(Buffer vệ sinh ẩn: 10:00 – 10:30)*
  2. **Slot 2**: `10:30 – 13:30` *(Buffer vệ sinh ẩn: 13:30 – 14:00)*
  3. **Slot 3**: `14:00 – 17:00` *(Buffer vệ sinh ẩn: 17:00 – 17:30)*
  4. **Slot 4**: `17:30 – 20:30` *(Buffer vệ sinh ẩn: 20:30 – 21:00)*
  5. **Slot 5**: `21:00 – 00:00` *(Chạm khung giờ đêm `23:00–06:00` -> Gắn huy hiệu `+20% Phụ phí đêm`)*
- Phân biệt rõ trạng thái `Trống (AVAILABLE)`, `Đang chọn (SELECTED)` và `Đã đặt (BOOKED)`. Các ca `BOOKED` bị vô hiệu hóa hoàn toàn cả chuột lẫn bàn phím.

### Phase `UI-4.3` — Làm Mới Lịch Trống Thời Gian Thực (`Slot Availability Refresh`)
- Tự động truy vấn lại danh sách slot khi đổi phòng, đổi ngày hoặc khi có sự kiện thay đổi từ Admin/Booking.
- Tích hợp nút `"Làm mới lịch"` kèm hiệu ứng xoay `RefreshCw` và xử lý trạng thái khi toàn bộ 5 ca trong ngày đều đã kín (`AllSlotsBookedBanner`).

---

## 3. Tệp mã nguồn liên quan
- `src/components/booking/date-selector.tsx`
- `src/components/booking/fixed-slot-picker.tsx`
- `src/lib/api/availability.ts`
