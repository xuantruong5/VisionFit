<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #334155; background: #f8fafc; border-radius: 12px;">
    <div style="text-align: center; background: #0D7F8D; padding: 24px; border-radius: 10px;">
        <h1 style="color: white; margin: 0; letter-spacing: 2px;">VISIONFIT</h1>
        <p style="color: white; margin-bottom: 0; font-size: 15px;">Tiếp nhận hồ sơ ứng tuyển Huấn Luyện Viên (PT)</p>
    </div>

    <div style="padding: 24px 8px;">
        <h2 style="color: #0D7F8D;">Xin chào {{ $data['ho_ten'] ?? 'Bạn' }}!</h2>

        <p>Cảm ơn bạn đã nộp hồ sơ ứng tuyển vào đội ngũ <strong>Huấn luyện viên cá nhân (PT)</strong> của Hệ Thống Thể Hình Thông Minh <strong>VisionFit</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <h3 style="color: #0D7F8D; margin-top: 0; font-size: 16px;">Thông tin hồ sơ ứng tuyển đã ghi nhận:</h3>

            <p style="margin: 8px 0;"><strong>Họ và tên:</strong> {{ $data['ho_ten'] ?? '' }}</p>
            <p style="margin: 8px 0;"><strong>Email đăng ký:</strong> {{ $data['email'] ?? '' }}</p>
            <p style="margin: 8px 0;"><strong>Số điện thoại:</strong> {{ $data['so_dien_thoai'] ?? 'Chưa cung cấp' }}</p>
            <p style="margin: 8px 0;"><strong>Tệp CV đính kèm:</strong> <span style="color: #0D7F8D; font-weight: bold;">{{ $data['cv_name'] ?? 'Đã đính kèm tệp' }}</span></p>
            <p style="margin: 8px 0;"><strong>Trạng thái hồ sơ:</strong> <span style="color: #d97706; font-weight: bold;">Chờ xét duyệt & Mời phỏng vấn</span></p>
        </div>

        <h3 style="color: #0D7F8D; font-size: 15px;">Quy trình tuyển dụng tiếp theo:</h3>
        <ol style="padding-left: 20px; line-height: 1.8;">
            <li><strong>Xét duyệt hồ sơ:</strong> Ban Quản Trị VisionFit sẽ kiểm tra CV và bằng cấp chuyên môn của bạn trong vòng 1-2 ngày làm việc.</li>
            <li><strong>Thư mời phỏng vấn:</strong> Khi hồ sơ đạt yêu cầu, chúng tôi sẽ gửi <em>Thư mời phỏng vấn & Kiểm tra kỹ năng thực hành</em> về chính địa chỉ email này.</li>
            <li><strong>Kích hoạt tài khoản PT:</strong> Sau buổi phỏng vấn đạt kết quả, tài khoản của bạn sẽ được kích hoạt kèm Mã Huấn Luyện Viên chính thức.</li>
        </ol>

        <p style="margin-top: 24px;">Chúng tôi đã đính kèm bản sao CV của bạn trong email này để bạn dễ dàng lưu trữ và đối chiếu.</p>
        <p>Chúc bạn sớm trở thành một phần của đội ngũ HLV chuyên nghiệp tại VisionFit!</p>
    </div>

    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
        <p>Email này được gửi tự động từ hệ thống VisionFit ({{ config('mail.from.address', 'visionfit95@gmail.com') }}).</p>
        <p>Vui lòng kiểm tra thường xuyên mục Hộp thư đến (hoặc Thư rác/Quảng cáo) để theo dõi thông báo.</p>
        <strong>BAN TUYỂN DỤNG & QUẢN LÝ HLV VISIONFIT</strong>
    </div>
</div>

