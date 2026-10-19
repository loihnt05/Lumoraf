# Stage UI-6: Trải Nghiệm Đặt Phòng Lưu Trú Qua Đêm (Overnight)
*Milestone M3 · Phases: `UI-6.1`, `UI-6.2` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-6
Cung cấp chế độ đặt phòng lưu trú qua đêm tiêu chuẩn khách sạn/homestay dài ngày với mô hình tính giá theo đêm hoàn toàn độc lập với giá thuê theo giờ.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-6.1` — Bộ Chọn Ngày Lưu Trú Qua Đêm (`OvernightPicker`)
- Thành phần `src/components/booking/overnight-picker.tsx`:
  - Giờ nhận phòng cố định: **14:00** ngày Check-in.
  - Giờ trả phòng cố định: **11:00** ngày Check-out.
  - Cung cấp dải nút chọn nhanh thời lượng lưu trú (**Quick Stay Pills**): `"1 đêm"`, `"2 đêm"`, `"3 đêm"`, `"5 đêm"`, `"1 tuần"`.
  - Khoảng đệm tổng vệ sinh **60 phút** sau khi trả phòng (`11:00 – 12:00`) được xử lý tự động ở tầng kiểm tra lịch trống.
  - Kiểm tra hợp lệ `checkOutDate > checkInDate` và cảnh báo ngay nếu trong khoảng đêm chọn có đêm đã kín phòng.

### Phase `UI-6.2` — Mô Hình Định Giá Qua Đêm Độc Lập (`Overnight Quote Display`)
- Tuyệt đối không lấy đơn giá giờ của Custom Time nhân lên để tính giá qua đêm.
- Công thức định giá độc lập theo hạng phòng:
  $$\text{Tổng tiền} = \text{Đơn giá 1 đêm (overnightPrice)} \times \text{Số đêm lưu trú}$$
- Hiển thị bảng kê chi tiết gồm: đơn giá mỗi đêm, tổng số đêm, miễn phí dọn phòng tiêu chuẩn và cấp mã khóa điện tử 6 số tự động.

---

## 3. Tệp mã nguồn liên quan
- `src/components/booking/overnight-picker.tsx`
- `src/lib/api/overnight-availability.ts`
