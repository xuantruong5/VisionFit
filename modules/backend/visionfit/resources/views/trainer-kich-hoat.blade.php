 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #334155; background: #f8fafc; border-radius: 12px;">
    <div style="text-align: center; background: #0D7F8D; padding: 24px; border-radius: 10px;">
        <h1 style="color: white; margin: 0; letter-spacing: 2px;">VISIONFIT</h1>
        <p style="color: white; margin-bottom: 0; font-size: 15px;">Chào mừng Huấn luyện viên mới!</p>
    </div>

    <div style="padding: 24px 8px;">
        <h2 style="color: #0D7F8D;">Xin chào Huấn luyện viên {{ $data['ho_ten'] ?? '' }}!</h2>

        <p>Chúc mừng bạn! Hồ sơ ứng tuyển của bạn đã được xét duyệt thành công. Tài khoản Huấn luyện viên trên hệ thống <strong>VisionFit</strong> đã chính thức được kích hoạt.</p>

        <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <h3 style="color: #0D7F8D; margin-top: 0; font-size: 16px;">Thông tin tài khoản Huấn luyện viên</h3>

            <p><strong>Họ và tên:</strong> {{ $data['ho_ten'] ?? '' }}</p>

            <p><strong>Email đăng nhập:</strong> {{ $data['email'] ?? '' }}</p>

            <p><strong>Mã PT của bạn:</strong></p>

            <div style="background: #ecfeff; border: 1px dashed #0D7F8D; padding: 16px; text-align: center; border-radius: 8px;">
                <span style="color: #0D7F8D; font-weight: bold; font-size: 24px; letter-spacing: 3px;">
                    {{ $data['ma_gioi_thieu'] ?? '' }}
                </span>
            </div>

            <p style="margin-top: 16px;"><strong>Trạng thái tài khoản:</strong> <span style="color: #16a34a; font-weight: bold;">Đã kích hoạt</span></p>
        </div>

        <h3 style="color: #0D7F8D;">Hướng dẫn đăng nhập</h3>

        <p>Để bắt đầu sử dụng hệ thống, bạn thực hiện đăng nhập bằng các thông tin sau:</p>

        <ul>
            <li><strong>Mã PT:</strong> Mã được cung cấp phía trên.</li>
            <li><strong>Email:</strong> Email đã đăng ký tài khoản.</li>
            <li><strong>Mật khẩu:</strong> Mật khẩu bạn đã tạo khi đăng ký.</li>
        </ul>

        <p>Lưu ý: Vui lòng bảo mật thông tin đăng nhập và không chia sẻ mã PT của bạn cho người khác.</p>

        <p style="margin-top: 24px;">Chào mừng bạn chính thức trở thành một phần của đội ngũ huấn luyện viên VisionFit. Chúc bạn có những trải nghiệm tuyệt vời và đồng hành thành công cùng các hội viên!</p>
    </div>

    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
        <p>Email này được gửi tự động từ hệ thống VisionFit ({{ config('mail.from.address', 'visionfit95@gmail.com') }}).</p>
        <p>Vui lòng không trả lời email này.</p>
        <strong>VISIONFIT GYM & FITNESS TEAM</strong>
    </div>
</div>