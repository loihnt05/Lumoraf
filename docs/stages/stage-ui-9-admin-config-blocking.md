# Stage UI-9: Quản Trị Cấu Hình Thời Gian, Khung Giờ Cố Định, Bảng Giá & Khóa Phòng
*Milestone M5 · Phases: `UI-9.1`, `UI-9.2`, `UI-9.3`, `UI-9.4` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-9
Xây dựng cổng quản trị cấu hình đặt phòng tại `/admin/booking-config` cho phép Admin điều chỉnh toàn bộ quy tắc thời gian, các ca cố định, bảng giá và khóa bảo trì phòng vật lý mà không cần sửa code hay redeploy ứng dụng.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-9.1` — Cấu Hình Chế Độ & Thông Số Thời Gian Theo Hạng Phòng
- Bật/tắt độc lập `fixedEnabled`, `customEnabled`, `overnightEnabled` cho từng `RoomType`.
- Chỉnh sửa thời lượng slot cố định, bước nhảy tùy chỉnh (`30m`), thời lượng tối thiểu/tối đa, khoảng đệm vệ sinh (`30m` / `60m`) và khung giờ đêm (`23:00–06:00`).
- Hàm `validateAdminBookingConfig()` chặn lưu khi tắt cả 3 chế độ hoặc khi thời lượng tối thiểu không chia hết cho bước nhảy.

### Phase `UI-9.2` — Trình Quản Lý Khung Giờ Cố Định (`Fixed Slot Editor`)
- Thêm mới, bật/tắt, chỉnh sửa giờ bắt đầu/kết thúc hoặc xóa ca cố định.
- Tự động hiển thị **Preview giờ trả + khoảng đệm dọn phòng** và tự động gắn nhãn khung đêm.
- Chặn lưu nếu 2 ca đang bật bị chồng lấn thời gian (`errors`) và cảnh báo nếu khoảng cách giữa 2 ca nhỏ hơn thời gian dọn phòng (`warnings`).

### Phase `UI-9.3` — Trình Chỉnh Sửa Bảng Giá Chính Thức (`Pricing Editor`)
- Cấu hình giá gói Fixed Slot (`fixedBasePrice`), giá riêng từng ca (`priceOverride`), đơn giá giờ linh hoạt (`customHourlyPrice`), giá qua đêm (`overnightPrice`) và tỷ lệ phụ phí đêm (`nightSurchargePercent`).
- Tích hợp bảng **Live Quote Comparison Preview** và đồng bộ tức thì sang `fetchPricingQuote()` ngay sau khi lưu.

### Phase `UI-9.4` — Kiểm Soát Khóa Phòng Vật Lý Dành Riêng Cho `ADMIN` (`rooms.is_blocked`)
- Hiển thị danh sách từng phòng vật lý (`No5`, `No6`, `No8`...) kèm công tắc khóa/mở khóa có hộp thoại xác nhận (`Dialog`).
- Phân quyền nghiêm ngặt: Chỉ `ADMIN` mới được phép khóa/mở khóa phòng vật lý; vai trò `MANAGER` chỉ được xem trạng thái và bị chặn `403 Forbidden` ở tầng API `setRoomBlockedStatus()`.

---

## 3. Tệp mã nguồn liên quan
- `src/app/(public)/admin/booking-config/page.tsx`
- `src/lib/api/booking-config.ts`
- `src/lib/api/inventory.ts`
- `src/lib/api/admin-config.test.ts`
