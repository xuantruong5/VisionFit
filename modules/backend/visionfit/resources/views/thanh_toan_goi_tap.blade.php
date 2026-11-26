# VISIONFIT - THANH TOÁN GÓI TẬP

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #334155; background: #f8fafc; border-radius: 12px;">
    <div style="text-align: center; background: #0D7F8D; padding: 24px; border-radius: 10px;">
        <h1 style="color: white; margin: 0;">VISIONFIT</h1>
        <p style="color: white; margin-bottom: 0;">Thông báo thanh toán thành công</p>
    </div>

    <div style="padding: 24px 8px;">
        <h2 style="color: #0D7F8D;">Xin chào {{ $data['ho_ten'] ?? 'Hội viên' }}!</h2>

        <p>VisionFit xin thông báo thanh toán gói tập của bạn đã được xác nhận thành công.</p>

        <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <h3 style="color: #0D7F8D; margin-top: 0;">Thông tin đăng ký</h3>

            <p><strong>Họ tên:</strong> {{ $data['ho_ten'] ?? '' }}</p>
            <p><strong>Gói tập:</strong> {{ $data['ten_goi_tap'] ?? '' }}</p>
            <p><strong>Số tiền thanh toán:</strong> {{ number_format((float) ($data['so_tien'] ?? 0), 0, ',', '.') }} VNĐ</p>
            <p><strong>Ngày bắt đầu:</strong> {{ $data['ngay_bat_dau'] ?? '' }}</p>
            <p><strong>Ngày kết thúc:</strong> {{ $data['ngay_ket_thuc'] ?? '' }}</p>
            <p><strong>Trạng thái:</strong> <span style="color: #16a34a; font-weight: bold;">Đã thanh toán</span></p>
        </div>

        <p style="margin-top: 24px;">Cảm ơn bạn đã tin tưởng và lựa chọn VisionFit. Chúc bạn có những buổi tập luyện hiệu quả!</p>
    </div>

    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
        <p>Đây là email tự động từ hệ thống VisionFit.</p>
        <p>Vui lòng không trả lời email này.</p>
        <strong>VISIONFIT TEAM</strong>
    </div>
</div>