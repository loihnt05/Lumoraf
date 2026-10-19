# Tài Liệu Kỹ Thuật Lumora Frontend — Danh Mục Theo Từng Stage (Multi-File Index)
*Cập nhật: 18/10/2026 · Trạng thái: **Hoàn thành 100% (32/32 Booking UI Phases + System Stages 2, 6, 7)***

Tài liệu kỹ thuật của hệ thống Frontend `Lumoraf` được tách riêng thành từng tệp độc lập theo từng **Stage UI** trong thư mục [`docs/stages/`](./stages/) để dễ dàng tra cứu, bảo trì và đối chiếu mã nguồn:

---

## 1. Danh sách các tệp tài liệu theo Stage (`docs/stages/`)

| STT | Stage | Milestone | Tệp tài liệu riêng biệt | Nội dung trọng tâm |
| :-: | :--- | :-: | :--- | :--- |
| 0 | **Foundation** | M1 | [`docs/foundation.md`](./foundation.md) | Kiến trúc kho mã nguồn, quy ước API Client, правила bảo mật & cấu hình gốc. |
| 1 | **Stage UI-0** | M1 | [`stages/stage-ui-0-foundation.md`](./stages/stage-ui-0-foundation.md) | Design System cảm hứng Sonder, bảng màu, typography & 4 trạng thái slot (`UI-0.1`, `UI-0.2`). |
| 2 | **Stage UI-1** | M1 | [`stages/stage-ui-1-app-shell-nav.md`](./stages/stage-ui-1-app-shell-nav.md) | `PublicShell`, thanh `StickyNav` 80px chống giật bố cục & trạng thái đăng nhập (`UI-1.1` – `UI-1.3`). |
| 3 | **Stage UI-2** | M1 | [`stages/stage-ui-2-property-room-presentation.md`](./stages/stage-ui-2-property-room-presentation.md) | Chuyển đổi chi nhánh Đà Lạt/Sài Gòn, Gallery 5 ảnh & thẻ phòng vật lý `RoomCard` (`UI-2.1` – `UI-2.3`). |
| 4 | **Stage UI-3** | M2 | [`stages/stage-ui-3-booking-mode-selector.md`](./stages/stage-ui-3-booking-mode-selector.md) | Bộ chọn 3 chế độ `BookingModeTabs` & hợp đồng cấu hình `RoomTypeBookingConfig` (`UI-3.1`, `UI-3.2`). |
| 5 | **Stage UI-4** | M2 | [`stages/stage-ui-4-fixed-slot.md`](./stages/stage-ui-4-fixed-slot.md) | Trải nghiệm 5 ca cố định 3h (`FixedSlotPicker`), chọn ngày 14 ngày & ẩn buffer 30p (`UI-4.1` – `UI-4.3`). |
| 6 | **Stage UI-5** | M3 | [`stages/stage-ui-5-custom-time.md`](./stages/stage-ui-5-custom-time.md) | Giờ tùy chỉnh bước nhảy 30p (`CustomTimePicker`), `AvailabilityTimeline` & chặn xung đột (`UI-5.1` – `UI-5.3`). |
| 7 | **Stage UI-6** | M3 | [`stages/stage-ui-6-overnight.md`](./stages/stage-ui-6-overnight.md) | Lưu trú qua đêm (`OvernightPicker` 14:00–11:00) & mô hình tính giá đêm độc lập (`UI-6.1`, `UI-6.2`). |
| 8 | **Stage UI-7** | M4 | [`stages/stage-ui-7-quote-summary.md`](./stages/stage-ui-7-quote-summary.md) | Dịch vụ báo giá chính thức `fetchPricingQuote`, phụ phí đêm `+20%` & `BookingSummaryPanel` (`UI-7.1`, `UI-7.2`). |
| 9 | **Stage UI-8** | M4 | [`stages/stage-ui-8-reserve-checkout-payment.md`](./stages/stage-ui-8-reserve-checkout-payment.md) | Giữ phòng 15 phút (`PENDING_PAYMENT`), chống `409 Conflict` & cổng `Mock Payment` (`UI-8.1` – `UI-8.3`). |
| 10 | **Stage UI-9** | M5 | [`stages/stage-ui-9-admin-config-blocking.md`](./stages/stage-ui-9-admin-config-blocking.md) | Trang `/admin/booking-config`: cấu hình giờ, ca cố định, bảng giá & khóa phòng `ADMIN`-only (`UI-9.1` – `UI-9.4`). |
| 11 | **Stage UI-10** | M6 | [`stages/stage-ui-10-responsive-a11y-edge-states.md`](./stages/stage-ui-10-responsive-a11y-edge-states.md) | Đáp ứng Mobile, xử lý trạng thái biên (`booking-edge-states.tsx`) & chuẩn trợ năng WCAG AA (`UI-10.1` – `UI-10.3`). |
| 12 | **Stage UI-11** | M6 | [`stages/stage-ui-11-e2e-verification.md`](./stages/stage-ui-11-e2e-verification.md) | Kiểm thử tích hợp & 6 luồng End-to-End Smoke Flows (`UI-11.1`, `UI-11.2`). |
| 13 | **Stages 2, 6 & 7** | Ops | [`stages/stage-ops-2-6-7-manager-admin-refund-qr.md`](./stages/stage-ops-2-6-7-manager-admin-refund-qr.md) | Trang `/manager`, `/admin/monitor`, phân quyền RBAC chi nhánh, Hủy/Hoàn tiền 3 bậc, QR kép & Smart Lock PIN. |

---

## 2. Tổng kết Kiểm định Chất lượng (`npm run check`)
- **ESLint**: `0 errors, 0 warnings`.
- **TypeScript (`next typegen && tsc --noEmit`)**: `PASS`.
- **Vitest (`vitest run`)**: **5/5 bộ test PASS (21/21 tests PASS)**.
- **Next.js Production Build (`next build`)**: Build thành công toàn bộ 8 route (`/`, `/booking`, `/booking/[roomId]`, `/booking/checkout/[bookingId]`, `/my-bookings`, `/manager`, `/admin/booking-config`, `/admin/monitor`).
