<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial; color: #34545c; line-height: 1.7;">
    <h2 style="color: #087f8c;">
        VISIONFIT - THƯ MỜI PHỎNG VẤN
    </h2>
    <p>
        Kính gửi bạn <strong>{{ $data['ho_ten'] }}</strong>,
    </p>
    <p>
        Cảm ơn bạn đã đăng ký gia nhập đội ngũ
        Huấn luyện viên thể hình cá nhân (PT) của VisionFit.
    </p>
    <p>
        Ban quản trị trân trọng kính mời bạn tham gia
        buổi phỏng vấn và kiểm tra kỹ năng thực hành chuyên môn:
    </p>
    <ul>
        <li>
            <strong>Thời gian:</strong>
            {{ $data['thoi_gian'] }}
        </li>

        <li>
            <strong>Địa điểm:</strong>
            {{ $data['dia_chi'] }}
        </li>

        <li>
            <strong>Lưu ý:</strong>
            {{ $data['ghi_chu'] }}
        </li>
    </ul>
    <p>
        Hệ thống sẽ gửi thông báo kết quả kích hoạt tài khoản HLV
        qua email trong vòng 2 ngày làm việc sau buổi test.
    </p>
    <p>
        Trân trọng,<br>
        <strong>Ban Tuyển dụng & Quản lý HLV VisionFit</strong>
    </p>

</body>
</html>