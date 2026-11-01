<template>
    <div class="forgot-page">
        <div class="page-orb page-orb-one"></div>
        <div class="page-orb page-orb-two"></div>

        <div class="forgot-card">
            <div class="logo">VF</div>

            <!-- BƯỚC 1: NHẬP EMAIL -->
            <template v-if="!sent">
                <span class="portal-label">ADMIN PORTAL</span>
                <h2>Quên mật khẩu</h2>
                <p class="desc">
                    Nhập email quản trị, chúng tôi sẽ gửi đường dẫn để đặt lại mật khẩu cho bạn.
                </p>

                <form @submit.prevent="sent = true">
                    <label>Email quản trị</label>
                    <div class="input-box">
                        <span class="input-icon">@</span>
                        <input v-model="email" type="email" placeholder="admin@visionfit.vn">
                    </div>

                    <button type="submit" class="btn-main">
                        Gửi liên kết đặt lại
                    </button>
                </form>
            </template>

            <!-- BƯỚC 2: ĐÃ GỬI -->
            <template v-else>
                <div class="success-icon">✓</div>
                <h2>Kiểm tra email của bạn</h2>
                <p class="desc">
                    Chúng tôi đã gửi liên kết đặt lại mật khẩu tới
                    <strong>{{ email || 'admin@visionfit.vn' }}</strong>. Liên kết có hiệu lực trong 15 phút.
                </p>

                <div class="tips">
                    <p>• Không thấy email? Hãy kiểm tra thư mục Spam.</p>
                    <p>• Vẫn chưa nhận được? Liên hệ IT: it@visionfit.vn</p>
                </div>

                <button type="button" class="btn-outline" @click="sent = false">
                    Gửi lại email
                </button>
            </template>

            <router-link to="/admin/login" class="back-link">‹ Quay lại đăng nhập</router-link>
        </div>

        <p class="footer">VisionFit © 2026 • Admin Management System</p>
    </div>
</template>

<script>
// Chỉ giao diện, phần gửi email sẽ nối API sau
export default {
    data() {
        return {
            email: '',
            sent: false,
        };
    },
};
</script>

<style scoped>
.forgot-page {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
    overflow: hidden;
    background: linear-gradient(160deg, #f4fbfc 0%, #e6f5f6 100%);
}

.page-orb {
    position: absolute;
    border-radius: 50%;
    background: rgba(13, 127, 141, 0.07);
}

.page-orb-one {
    top: -120px;
    right: -100px;
    width: 380px;
    height: 380px;
}

.page-orb-two {
    bottom: -140px;
    left: -120px;
    width: 420px;
    height: 420px;
}

.forgot-card {
    position: relative;
    width: 100%;
    max-width: 440px;
    padding: 36px 34px 28px;
    border: 1px solid #d8eef1;
    border-radius: 26px;
    background: white;
    box-shadow: 0 20px 50px rgba(13, 127, 141, 0.12);
}

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin-bottom: 22px;
    border-radius: 16px;
    background: #0d7f8d;
    color: white;
    font-size: 20px;
    font-weight: 800;
}

.portal-label {
    color: #0d7f8d;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
}

h2 {
    margin: 6px 0 8px;
    color: #11343a;
    font-size: 28px;
    font-weight: 800;
}

.desc {
    margin: 0 0 24px;
    color: #51777d;
    font-size: 15px;
    line-height: 1.55;
}

.desc strong {
    color: #11343a;
}

label {
    display: block;
    margin-bottom: 8px;
    color: #11343a;
    font-size: 14.5px;
    font-weight: 700;
}

.input-box {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 50px;
    padding: 0 14px;
    border: 1px solid #d3e9ec;
    border-radius: 13px;
    background: #fbfeff;
}

.input-icon {
    color: #78a4aa;
    font-weight: 700;
}

.input-box input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: #11343a;
    font-size: 15px;
}

.btn-main,
.btn-outline {
    width: 100%;
    height: 50px;
    margin-top: 20px;
    border-radius: 13px;
    font-size: 15.5px;
    font-weight: 700;
}

.btn-main {
    border: none;
    background: #0d7f8d;
    color: white;
    box-shadow: 0 10px 22px rgba(13, 127, 141, 0.22);
}

.btn-main:hover {
    background: #075e68;
}

.btn-outline {
    border: 1px solid #b9e5e9;
    background: white;
    color: #0d7f8d;
}

.success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    border-radius: 50%;
    background: #e8f8f0;
    color: #0f8a5f;
    font-size: 30px;
    font-weight: 800;
}

.tips {
    padding: 14px 16px;
    border-radius: 13px;
    background: #f4fafb;
}

.tips p {
    margin: 0;
    color: #51777d;
    font-size: 14px;
    line-height: 1.7;
}

.back-link {
    display: block;
    margin-top: 22px;
    color: #0d7f8d;
    font-size: 15px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
}

.footer {
    position: relative;
    margin-top: 22px;
    color: #8aa3a7;
    font-size: 13px;
}
</style>
