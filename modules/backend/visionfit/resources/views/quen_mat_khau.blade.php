<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #334155; background: #f8fafc; border-radius: 12px;">
    <div style="text-align: center; background: #0D7F8D; padding: 24px; border-radius: 10px;">
        <h1 style="color: white; margin: 0; letter-spacing: 2px;">VISIONFIT</h1>
        <p style="color: white; margin-bottom: 0; font-size: 15px;">Xác nhận đặt lại mật khẩu</p>
    </div>

    <div style="padding: 24px 8px;">
        <h2 style="color: #0D7F8D;">Xin chào {{ $data['ho_ten'] ?? 'Bạn' }}!</h2>

        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản VisionFit liên kết với email này.</p>

        <div style="background: white; padding: 24px; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center; margin: 24px 0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Mã xác thực OTP của bạn là:</p>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0D7F8D; padding: 12px; background: #ecfeff; border-radius: 8px; display: inline-block;">
                {{ $data['otp'] ?? '' }}
            </div>
            <p style="margin: 12px 0 0 0; color: #f59e0b; font-size: 13px; font-weight: bold;">
                ⏱️ Mã này có hiệu lực trong vòng 10 phút.
            </p>
        </div>

        <p style="color: #64748b; font-size: 13.5px; line-height: 20px;">
            Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email và đảm bảo rằng không ai khác có quyền truy cập vào hòm thư của bạn.
        </p>
    </div>

    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
        <p>Email này được gửi tự động từ hệ thống VisionFit ({{ config('mail.from.address', 'visionfit95@gmail.com') }}).</p>
        <p>Vui lòng không trả lời email này.</p>
        <strong>VISIONFIT GYM & FITNESS TEAM</strong>
    </div>
</div>

