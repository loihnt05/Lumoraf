# System Stages 2, 6 & 7: Vận Hành Chi Nhánh (`/manager`), System Monitor (`/admin/monitor`), Phân Quyền RBAC, Hoàn Tiền, QR Kép & Smart Lock PIN
*System Detailed Plan · Stages 2, 6 & 7 (`P2.2–P2.9`, `P6.1–P6.8`, `P7.1–P7.11`) · Trạng thái: **Hoàn thành 100%***

---

## 1. Stage 2 Frontend (`P2.2, P2.3, P2.8, P2.9`) — Chi Nhánh Homestay & Batch Mã Khóa Phòng
- **Quản lý danh mục Chi nhánh Homestay (`savePropertyInventory` tại `/admin/monitor` Tab 3)**:
  - Cho phép `ADMIN` tạo mới hoặc cập nhật chi nhánh Homestay (`Property`) kèm kiểm tra trùng lặp `slug` (`CONFLICT`).
  - Ràng buộc phân quyền: `MANAGER` bị chặn `403 Forbidden` nếu cố tạo chi nhánh mới hoặc sửa chi nhánh ngoài danh sách được gán.
- **Batch Tạo Mã Khóa Phòng 6 Số Hàng Ngày (`runDailyRoomAccessCodeBatch`)**:
  - Tự động sinh mã PIN 6 số cho từng phòng vật lý theo `(roomId, validDate)`.
  - **Idempotent (`P2.9`)**: Chạy batch nhiều lần trong cùng một ngày giữ nguyên các mã đang `ACTIVE`, không ghi đè làm mất hiệu lực mã của khách đang lưu trú; hỗ trợ xoay mã cưỡng bức từng phòng (`forceRotateRoomId`).

---

## 2. Stage 6 Frontend (`P6.1 – P6.8`) — Vận Hành Quản Lý (`/manager`), Phân Quyền RBAC & System Monitor (`/admin/monitor`)
- **Bảng Điều Khiển Quản Lý Chi Nhánh (`/manager` — `src/app/(public)/manager/page.tsx`)**:
  - **`P6.1` (Property Scope Guard)**: Khi `Manager Đà Lạt` chọn xem chi nhánh Sài Gòn ngoài phạm vi `manager_properties`, hệ thống trả về cảnh báo `HTTP 403 Forbidden`.
  - **`P6.2` (Check-in / Check-out Operational Lifecycle)**: Chuyển trạng thái chuẩn `CONFIRMED → CHECKED_IN → CHECKED_OUT` kèm hộp thoại xác nhận, lưu `checkedInAt` / `checkedOutAt`, và chặn tuyệt đối việc Check-out khi chưa Check-in.
  - **`P6.7` (Staff Room Access Code Operations)**: Mặc định che mã PIN (`••••••`), cho phép nhân sự đúng chi nhánh bấm hiện/ẩn hoặc xoay mã PIN mới.
- **Trung Tâm Giám Sát & Phân Quyền Admin (`/admin/monitor` — `src/app/(public)/admin/monitor/page.tsx`)**:
  - **`P6.3 & P6.4` (User Role/Status & `manager_properties` Assignment)**: Đổi vai trò (`USER / MANAGER / ADMIN`), khóa/mở khóa tài khoản (`ACTIVE / DISABLED`), **bảo vệ không cho phép hạ quyền hoặc khóa Admin cuối cùng**, và gán/thu hồi đa chi nhánh cho `MANAGER`.
  - **`P6.5 & P6.6` (System Monitor & KPI Trends)**: 4 thẻ KPI tổng quan, biểu đồ xu hướng 5 ngày, bảng phân bổ trạng thái đơn và bộ lọc theo cơ sở.
  - **`P6.8` (Security Audit Logs)**: Ghi nhận mọi thao tác nhạy cảm và tự động che mọi chuỗi 6 chữ số thành `[REDACTED_PIN]`.

---

## 3. Stage 7 Frontend (`P7.1, P7.2, P7.6 – P7.11`) — Hủy Phòng/Hoàn Tiền, Đối Soát, QR Kép & Mã Khóa Khách Chính Chủ
- **`P7.1, P7.2 & P7.7` (Cancellation Policy v1 & Idempotent Refund trên `/my-bookings`)**:
  - Tự động tính số giờ trước giờ nhận phòng và áp dụng 3 bậc hoàn tiền: **100%** (hủy sớm trước mốc miễn phí), **50%** (hủy trong khoảng trung gian), **0%** (hủy sát giờ).
  - Xử lý hoàn tiền **Idempotent**: Gọi hủy lặp lại trả về cùng một bản ghi `BookingRefundInfo` và giải phóng lịch trống ngay lập tức.
- **`P7.6` (Payment Reconciliation trên `/admin/monitor`)**: Nút `Reconcile → CONFIRMED` khôi phục các đơn `PENDING_PAYMENT` bị nhỡ webhook thanh toán.
- **`P7.8 & P7.9` (Payment QR vs Check-in QR)**:
  - **Payment QR (`VIETQR`)**: Chỉ hiển thị trên `/booking/checkout/[bookingId]` khi đơn đang `PENDING_PAYMENT`.
  - **Check-in QR (`LMR-CHK-...`)**: Chỉ cấp khi đơn đã `CONFIRMED`. Trình quét tại `/manager` từ chối ngay nếu khách đưa nhầm mã `Payment QR`.
- **`P7.10` (Idempotent Email Outbox)**: Ghi nhận email sự kiện `BOOKING_CONFIRMED` và `BOOKING_CANCELLED` kèm `idempotencyKey`.
- **`P7.11` (Secure Guest Room Access Code Delivery)**: Khách chính chủ chỉ có thể bấm hiện mã PIN 6 số (`getGuestRoomAccessCode`) khi đơn ở trạng thái `CONFIRMED` hoặc `CHECKED_IN` (chặn `403 Forbidden` đối với khách lạ hoặc đơn chưa thanh toán).

---

## 4. Tệp mã nguồn liên quan
- `src/lib/types/operations.ts`
- `src/lib/api/operations.ts`
- `src/app/(public)/manager/page.tsx`
- `src/app/(public)/admin/monitor/page.tsx`
- `src/app/(public)/booking/checkout/[bookingId]/page.tsx`
- `src/app/(public)/my-bookings/page.tsx`
- `src/lib/api/operations.test.ts`
