# Stage UI-1: Khung Ứng Dụng (App Shell), Thanh Điều Hướng & Trạng Thái Đăng Nhập
*Milestone M1 · Phases: `UI-1.1`, `UI-1.2`, `UI-1.3` · Trạng thái: **Hoàn thành 100%***

---

## 1. Mục tiêu Stage UI-1
Xây dựng khung bố cục công khai (`PublicShell`), thanh điều hướng cố định phía trên (`StickyNav`) không gây giật bố cục (Zero CLS), và trải nghiệm đăng nhập/quản lý tài khoản khách hàng.

---

## 2. Chi tiết các Phase đã hoàn thành

### Phase `UI-1.1` — Booking Route & Page Shell (`PublicShell`)
- Bố cục chuẩn trong `src/components/layouts/public-shell.tsx` với container rộng tối đa `1280px`, khoảng cách lề đáp ứng mọi kích thước màn hình (`responsive gutters`).
- Tích hợp liên kết trợ năng `Skip to content` (`#main-content`) hỗ trợ người dùng bàn phím nhảy thẳng vào vùng nội dung chính.

### Phase `UI-1.2` — Sticky Top Navigation (`StickyNav`)
- Chiều cao cố định `80px` (`h-20`), sử dụng `React.useSyncExternalStore` để theo dõi vị trí cuộn trang mà không gọi `setState` đồng bộ trong `useEffect`.
- Khi cuộn xuống quá `12px`, thanh điều hướng tự động chuyển sang nền mờ (`backdrop-blur-md`) kèm bóng đổ nhẹ tinh tế.
- Các liên kết điều hướng chính:
  - `Booking` (`/booking`)
  - `My Bookings` (`/my-bookings`)
  - `Manager Ops` (`/manager`)
  - `Admin Config` (`/admin/booking-config`)
  - `Admin Monitor` (`/admin/monitor`)

### Phase `UI-1.3` — Trạng thái Xác thực Người dùng (`AuthContext` & `SignInModal`)
- **Khi chưa đăng nhập**: Hiển thị nút `"Sign in"` bo tròn mở hộp thoại `SignInModal` hỗ trợ đăng nhập nhanh mà không làm mất trang hiện tại.
- **Khi đã đăng nhập**: Hiển thị `Avatar` chữ cái viết tắt tên người dùng, tên hiển thị và menu thả xuống (`My Bookings`, `Sign out`).
- **Bảo mật hiển thị**: Không tự suy diễn hoặc hiển thị quyền nội bộ (`ADMIN`/`MANAGER`) từ lớp giao diện công khai; có nút chuyển đổi nhanh trong chế độ `development` để kiểm thử trạng thái đăng nhập/đăng xuất.

---

## 3. Tệp mã nguồn liên quan
- `src/components/layouts/public-shell.tsx`
- `src/components/layouts/sticky-nav.tsx`
- `src/components/auth/sign-in-modal.tsx`
- `src/lib/auth/auth-context.tsx`
