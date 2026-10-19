# Stage UI-2: Trình Bày Chi Nhánh Homestay & Danh Mục Phòng Vật Lý
*Milestone M1 · Phases: `UI-2.1`, `UI-2.2`, `UI-2.3` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-2
Trình bày không gian thương hiệu Homestay theo từng chi nhánh (Đà Lạt, Sài Gòn) kèm bộ sưu tập hình ảnh nghệ thuật 5 khung và danh sách các phòng vật lý cụ thể (`No5`, `No6`, `No8`...).

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-2.1` — Bộ Chuyển Đổi Chi Nhánh & Thư Viện Ảnh (`PropertyHeader` & `PropertyGallery`)
- **Chuyển đổi chi nhánh (`src/components/booking/property-header.tsx`)**:
  - Cho phép chuyển đổi mượt mà giữa **Lumora Đà Lạt** và **Lumora Sài Gòn**.
  - Hiển thị địa chỉ, thông tin giờ Check-in/Check-out tiêu chuẩn và mô tả kiến trúc của từng cơ sở.
- **Thư viện ảnh 5 khung (`src/components/booking/property-gallery.tsx`)**:
  - Bố cục lưới 1 ảnh lớn bên trái + 4 ảnh phụ bên phải theo phong cách Sonder.
  - Hỗ trợ mở hộp thoại xem toàn bộ ảnh độ phân giải cao kèm thanh điều hướng thumbnail.

### Phase `UI-2.2` — Thẻ Phòng Vật Lý (`RoomCard`)
- Đặt phòng dựa trên **phòng vật lý cụ thể** (ví dụ: `No5 Deluxe Room`, `No6 Garden Suite`) chứ không chỉ chọn hạng phòng chung chung.
- Mỗi thẻ `RoomCard` (`src/components/booking/room-card.tsx`) hiển thị:
  - Carousel ảnh riêng của phòng đó.
  - Mã số phòng (`roomNumber`), hạng phòng (`roomType`), diện tích (`m²`), sức chứa tối đa và danh sách tiện nghi nổi bật.
  - Giá khởi điểm tham khảo (`"Từ 299.000₫ / slot 3h"`).
  - Trạng thái khóa phòng (`isBlocked`): Nếu phòng đang bị Admin khóa bảo trì, thẻ phòng hiển thị nhãn `"Tạm ngưng phục vụ"` và chặn thao tác chọn đặt.

### Phase `UI-2.3` — Trang Chi Tiết Phòng & Khu Vực Đặt Phòng (`/booking/[roomId]`)
- Trang chi tiết phòng độc lập tại `src/app/(public)/booking/[roomId]/page.tsx`:
  - **Cột trái**: Thông tin chi tiết phòng vật lý, tiện nghi đầy đủ, hướng dẫn tự nhận phòng bằng khóa thông minh 6 số và quy định lưu trú.
  - **Cột phải (`sticky top-28`)**: Khu vực chọn hình thức lưu trú (Mode Tabs), chọn ngày/giờ và bảng tóm tắt báo giá thời gian thực.

---

## 3. Tệp mã nguồn liên quan
- `src/app/(public)/booking/page.tsx`
- `src/app/(public)/booking/[roomId]/page.tsx`
- `src/components/booking/property-header.tsx`
- `src/components/booking/property-gallery.tsx`
- `src/components/booking/room-card.tsx`
- `src/components/booking/room-booking-panel.tsx`
- `src/lib/api/inventory.ts`
