<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #334155; background: #f8fafc; border-radius: 12px;">
    <div style="text-align: center; background: #0D7F8D; padding: 24px; border-radius: 10px;">
        <h1 style="color: white; margin: 0; letter-spacing: 2px;">VISIONFIT</h1>
        <p style="color: white; margin-bottom: 0; font-size: 15px;">Chào mừng thành viên mới!</p>
    </div>

    <div style="padding: 24px 8px;">
        <h2 style="color: #0D7F8D;">Xin chào {{ $data['ho_ten'] ?? 'Hội viên' }}!</h2>

        <p>Chúc mừng bạn đã đăng ký thành công tài khoản trên ứng dụng thể hình thông minh <strong>VisionFit</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <h3 style="color: #0D7F8D; margin-top: 0; font-size: 16px;">Thông tin tài khoản của bạn</h3>

            <p style="margin: 8px 0;"><strong>Họ và tên:</strong> {{ $data['ho_ten'] ?? '' }}</p>
            <p style="margin: 8px 0;"><strong>Email đăng nhập:</strong> {{ $data['email'] ?? '' }}</p>
            <p style="margin: 8px 0;"><strong>Mã giới thiệu của bạn:</strong> <span style="color: #0D7F8D; font-weight: bold; font-size: 16px;">{{ $data['ma_gioi_thieu'] ?? '' }}</span></p>
            <p style="margin: 8px 0;"><strong>Trạng thái:</strong> <span style="color: #16a34a; font-weight: bold;">Đã kích hoạt</span></p>
        </div>

        <p>Bây giờ bạn đã có thể khám phá hàng trăm bài tập thể hình, theo dõi chỉ số cơ thể và nhận sự hỗ trợ từ huấn luyện viên và trợ lý AI VisionFit.</p>
        <p style="margin-top: 24px;">Chúc bạn có một hành trình rèn luyện sức khỏe đầy hứng khởi và đạt được vóc dáng mơ ước!</p>
    </div>

    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
        <p>Email này được gửi tự động từ hệ thống VisionFit ({{ config('mail.from.address', 'visionfit95@gmail.com') }}).</p>
        <p>Vui lòng không trả lời email này.</p>
        <strong>VISIONFIT GYM & FITNESS TEAM</strong>
    </div>
</div>

