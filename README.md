# Ứng Dụng Đặt Lịch Hẹn Trực Tuyến Cho Phòng Khám Sức Khỏe

Ứng dụng đặt lịch hẹn trực tuyến cho phòng khám sức khỏe giúp bệnh nhân có thể đặt lịch hẹn với các bác sĩ tại phòng khám một cách dễ dàng và tiện lợi. Ứng dụng hỗ trợ đăng ký, đăng nhập, quản lý lịch hẹn, và cung cấp một giao diện đơn giản để bệnh nhân và bác sĩ có thể theo dõi và quản lý thông tin của mình.

## Mục Tiêu

Ứng dụng giúp giải quyết bài toán thực tế về việc quản lý lịch hẹn cho phòng khám, cung cấp một công cụ hữu ích cho cả bệnh nhân và bác sĩ trong việc theo dõi và quản lý thời gian.

## Các Tính Năng Chính

- **Quản lý người dùng**:
  - Đăng ký/đăng nhập cho bệnh nhân và bác sĩ.
  - Quản lý thông tin cá nhân của bệnh nhân và bác sĩ (hồ sơ, chuyên môn của bác sĩ).
  - Mỗi người dùng có một bảng điều khiển cá nhân để quản lý lịch hẹn và thông tin cá nhân.

- **Đặt lịch hẹn**:
  - Hiển thị danh sách bác sĩ, chuyên khoa và thời gian làm việc.
  - Bệnh nhân chọn bác sĩ, thời gian phù hợp và đặt lịch hẹn.
  - Xác nhận lịch hẹn qua email hoặc thông báo trong hệ thống.
  - Bác sĩ có thể xác nhận hoặc từ chối lịch hẹn.

- **Quản lý lịch hẹn**:
  - Bác sĩ có thể xem và quản lý lịch hẹn, thông báo khi có thay đổi.
  - Bệnh nhân có thể xem, hủy hoặc thay đổi lịch hẹn trước thời gian quy định.

- **Giao diện người dùng (UI/UX)**:
  - Thiết kế giao diện trực quan, dễ sử dụng cho cả bệnh nhân và bác sĩ.
  - Dashboard hiển thị các lịch hẹn sắp tới, lịch hẹn đã xác nhận và đã hoàn thành.
  - Tích hợp bộ lọc giúp bệnh nhân tìm kiếm bác sĩ theo chuyên khoa hoặc ngày làm việc.

- **Thông báo**:
  - Gửi thông báo qua email hoặc SMS khi có sự kiện quan trọng như lịch hẹn sắp diễn ra, thay đổi giờ hẹn.

## Kỹ Thuật Sử Dụng

- **Frontend**:
  - React: Xây dựng giao diện người dùng.
  - React Router: Điều hướng giữa các trang.
  - State management: Sử dụng Zustand hoặc Context API để quản lý trạng thái.
  - Axios hoặc Fetch API: Kết nối với server để đặt và quản lý lịch hẹn.
  - Tailwind CSS hoặc Material UI: Thiết kế giao diện người dùng.

- **Backend**:
  - Node.js hoặc Express: Quản lý API và xác thực người dùng.
  - MongoDB hoặc MySQL: Lưu trữ dữ liệu người dùng, lịch hẹn, và các thông tin khác.

- **Tính năng mở rộng**:
  - Tích hợp Google Calendar API: Đồng bộ lịch hẹn với Google Calendar.
  - Hỗ trợ đặt lịch hẹn cho dịch vụ khám từ xa (telemedicine) qua video call.
  - Tích hợp thanh toán trực tuyến cho các dịch vụ trả phí.

- **Thông báo**:
  - Sử dụng SendGrid hoặc Twilio để gửi thông báo qua email/SMS.

## Hướng Dẫn Cài Đặt

1. Clone repository:
   ```bash
   git clone https://github.com/hnmtri204/Project_PKSK_2024.git
