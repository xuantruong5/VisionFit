<template>
    <div class="login-page">
        <div class="page-orb page-orb-one"></div>
        <div class="page-orb page-orb-two"></div>

        <div class="login-wrapper">
            <!-- ================= LEFT IMAGE ================= -->
            <section class="brand-panel">
                <img
                    :src="gymLogin"
                    alt="VisionFit Gym"
                    class="brand-image"
                >

                <!-- Chỉ là hiệu ứng trang trí, không phủ màu ảnh -->
                <div class="ring ring-one"></div>
                <div class="ring ring-two"></div>

                <div class="vision-badge">
                    <span class="vision-dot"></span>
                    VISIONFIT AI
                </div>

                <div class="brand-logo">
                    VF
                </div>

                <div class="brand-content">
                    <span class="brand-label">
                        VISIONFIT
                    </span>

                    <h1>
                        Quản lý phòng Gym
                        <br>
                        thông minh với AI
                    </h1>

                    <p>
                        Nền tảng quản lý Gym kết hợp Computer Vision giúp
                        theo dõi quá trình tập luyện và phân tích kỹ thuật.
                    </p>
                </div>

                <div class="feature-list">
                    <button class="feature-item" type="button">
                        <span class="feature-icon">AI</span>

                        <span class="feature-text">
                            <strong>Computer Vision</strong>
                            <small>Phân tích kỹ thuật tập luyện bằng AI.</small>
                        </span>

                        <span class="feature-arrow">↗</span>
                    </button>

                    <button class="feature-item" type="button">
                        <span class="feature-icon">PT</span>

                        <span class="feature-text">
                            <strong>Trainer Review</strong>
                            <small>Trainer xác nhận và phản hồi kết quả AI.</small>
                        </span>

                        <span class="feature-arrow">↗</span>
                    </button>

                    <button class="feature-item" type="button">
                        <span class="feature-icon">GYM</span>

                        <span class="feature-text">
                            <strong>Gym Management</strong>
                            <small>Quản lý Gymmer, Trainer, gói tập và tài chính.</small>
                        </span>

                        <span class="feature-arrow">↗</span>
                    </button>
                </div>

                <div class="brand-footer">
                    <span>VisionFit Admin Portal</span>

                    <div class="brand-line"></div>

                    <span>Computer Vision Fitness</span>
                </div>
            </section>

            <!-- ================= RIGHT LOGIN ================= -->
            <section class="login-panel">
                <div class="login-card">
                    <div class="mobile-logo">
                        VF
                    </div>

                    <div class="login-header">
                        <span class="portal-label">
                            ADMIN PORTAL
                        </span>

                        <h2>Đăng nhập</h2>

                        <p>
                            Đăng nhập để truy cập hệ thống quản trị VisionFit
                        </p>
                    </div>

                    <form @submit.prevent="login">
                        <div class="form-group">
                            <label>Email hoặc tên đăng nhập</label>

                            <div class="input-box">
                                <span class="input-icon">@</span>

                                <input
                                    v-model="form.username"
                                    type="text"
                                    placeholder="admin@visionfit.vn"
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="password-label">
                                <label>Mật khẩu</label>

                                <button
                                    type="button"
                                    class="forgot"
                                    @click="forgotPassword"
                                >
                                    Quên mật khẩu?
                                </button>
                            </div>

                            <div class="input-box">
                                <span class="input-icon">⌁</span>

                                <input
                                    v-model="form.password"
                                    :type="showPassword ? 'text' : 'password'"
                                    placeholder="Nhập mật khẩu"
                                >

                                <button
                                    type="button"
                                    class="show-password"
                                    @click="showPassword = !showPassword"
                                >
                                    {{ showPassword ? 'Ẩn' : 'Hiện' }}
                                </button>
                            </div>
                        </div>

                        <label class="remember">
                            <input
                                v-model="form.remember"
                                type="checkbox"
                            >
                            <span>Ghi nhớ đăng nhập</span>
                        </label>

                        <div
                            v-if="errorMessage"
                            class="error-message"
                        >
                            {{ errorMessage }}
                        </div>

                        <button
                            type="submit"
                            class="btn-login"
                            :disabled="loading"
                        >
                            <span
                                v-if="loading"
                                class="loading"
                            ></span>

                            <span>
                                {{
                                    loading
                                        ? 'Đang đăng nhập...'
                                        : 'Đăng nhập'
                                }}
                            </span>

                            <span
                                v-if="!loading"
                                class="login-arrow"
                            >
                                →
                            </span>
                        </button>

                        <div class="or-divider">
                            <span>Hoặc</span>
                        </div>

                        <button
                            type="button"
                            class="btn-google"
                            @click="loginGoogle"
                        >
                            <span class="google-logo">
                                <span class="google-blue">G</span>
                            </span>

                            <span>Đăng nhập bằng Google</span>
                        </button>
                    </form>

                    <div class="demo-box">
                        <div class="demo-head">
                            <span class="demo-dot"></span>

                            <span>DEMO ACCOUNT</span>
                        </div>

                        <div class="demo-account">
                            <div>
                                <span>Email</span>
                                <strong>admin@visionfit.vn</strong>
                            </div>

                            <div>
                                <span>Password</span>
                                <strong>123456</strong>
                            </div>
                        </div>

                        <button
                            type="button"
                            class="btn-demo"
                            @click="fillDemoAccount"
                        >
                            Dùng tài khoản demo
                        </button>
                    </div>

                    <div class="login-footer">
                        <span>VisionFit © 2026</span>
                        <span>•</span>
                        <span>Admin Management System</span>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import gymLogin from '../../../assets/images/gym-login.jpg'

export default {
    name: "AdminLogin",

    data() {
        return {
            gymLogin,
            loading: false,
            showPassword: false,
            errorMessage: '',

            form: {
                username: '',
                password: '',
                remember: false
            }
        }
    },

    methods: {
        fillDemoAccount() {
            this.form.username = 'admin@visionfit.vn';
            this.form.password = '123456';
        },

        login() {
            this.errorMessage = '';

            if (!this.form.username || !this.form.password) {
                this.errorMessage = 'Vui lòng nhập tài khoản và mật khẩu.';
                return;
            }

            this.loading = true;

            setTimeout(() => {
                this.loading = false;
                this.$router.push('/admin/dashboard');
            }, 500);
        },

        loginGoogle() {
            alert('Demo UI: Đăng nhập Google sẽ nối API sau.');
        },

        forgotPassword() {
            alert('Demo: Chức năng quên mật khẩu sẽ làm sau.');
        }
    }
}
</script>

<style scoped>
/* =========================================================
   PAGE
========================================================= */

.login-page {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background: #f4fbfc;
    color: #11343a;
}

.login-wrapper {
    position: relative;
    z-index: 2;
    min-height: 100vh;
    display: grid;
    grid-template-columns: 56% 44%;
}

/* =========================================================
   LEFT IMAGE
========================================================= */

.brand-panel {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 50px 150px 42px 65px;
    overflow: hidden;
    background: #111;
    color: white;
}

/* Ảnh giữ màu gốc, không overlay */
.brand-image {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 1.1s ease;
}

.brand-panel:hover .brand-image {
    transform: scale(1.025);
}

/*
    Đây mới là phần tạo đường CONG.
    Nó dùng màu nền bên phải "cắt" vào ảnh.
    Ảnh không bị bóp méo.
*/
.brand-panel::after {
    content: "";
    position: absolute;
    z-index: 4;
    top: -12%;
    right: -235px;
    width: 390px;
    height: 124%;
    border-radius: 50%;
    background: #f4fbfc;
    box-shadow:
        -20px 0 40px rgba(13, 127, 141, 0.04);
    pointer-events: none;
}

/* Một đường sáng rất nhẹ ở mép cong */
.brand-panel::before {
    content: "";
    position: absolute;
    z-index: 3;
    top: -12%;
    right: -221px;
    width: 390px;
    height: 124%;
    border-radius: 50%;
    border-left: 1px solid rgba(255, 255, 255, 0.28);
    pointer-events: none;
}

/* =========================================================
   DECORATION TRÊN ẢNH
========================================================= */

.ring {
    position: absolute;
    z-index: 1;
    border-radius: 50%;
    pointer-events: none;
}

.ring-one {
    top: -185px;
    right: 30px;
    width: 390px;
    height: 390px;
    border: 48px solid rgba(255, 255, 255, 0.07);
}

.ring-two {
    left: -115px;
    bottom: -125px;
    width: 275px;
    height: 275px;
    border: 35px solid rgba(255, 255, 255, 0.055);
}

.vision-badge {
    position: absolute;
    z-index: 6;
    top: 52px;
    right: 165px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.34);
    border-radius: 999px;
    background: rgba(10, 22, 24, 0.48);
    color: white;
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 1.3px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.vision-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #8ceada;
    box-shadow:
        0 0 0 4px rgba(140, 234, 218, 0.12),
        0 0 10px rgba(140, 234, 218, 0.55);
}

/* =========================================================
   BRAND CONTENT
========================================================= */

.brand-logo,
.brand-content,
.feature-list,
.brand-footer {
    position: relative;
    z-index: 5;
}

.brand-logo,
.mobile-logo {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.96);
    color: #0d7f8d;
    font-size: 17px;
    font-weight: 850;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.17);
}

.brand-content {
    max-width: 475px;
    margin-top: auto;
    margin-bottom: 27px;
}

.brand-label {
    display: inline-flex;
    margin-bottom: 11px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 2.4px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
}

.brand-content h1 {
    margin: 0;
    color: white;
    font-size: 39px;
    line-height: 1.17;
    font-weight: 800;
    letter-spacing: -0.7px;
    text-shadow:
        0 3px 8px rgba(0, 0, 0, 0.55),
        0 8px 25px rgba(0, 0, 0, 0.25);
}

.brand-content p {
    max-width: 470px;
    margin: 16px 0 0;
    color: rgba(255, 255, 255, 0.92);
    font-size: 11.5px;
    line-height: 1.75;
    text-shadow:
        0 2px 6px rgba(0, 0, 0, 0.72);
}

/* =========================================================
   FEATURE BUTTONS
========================================================= */

.feature-list {
    display: grid;
    gap: 9px;
    max-width: 470px;
}

.feature-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    border: 1px solid rgba(255, 255, 255, 0.26);
    border-radius: 17px;
    background: rgba(10, 18, 20, 0.70);
    color: white;
    text-align: left;
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.10);
    transition:
        transform 0.2s ease,
        background 0.2s ease,
        border-color 0.2s ease;
}

.feature-item:hover {
    transform: translateX(5px);
    border-color: rgba(151, 231, 235, 0.65);
    background: rgba(7, 68, 75, 0.86);
}

.feature-icon {
    width: 39px;
    height: 39px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.17);
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.13);
    color: white;
    font-size: 8px;
    font-weight: 800;
}

.feature-text {
    flex: 1;
}

.feature-text strong,
.feature-text small {
    display: block;
}

.feature-text strong {
    color: white;
    font-size: 10px;
}

.feature-text small {
    margin-top: 3px;
    color: rgba(255, 255, 255, 0.68);
    font-size: 8px;
}

.feature-arrow {
    margin-right: 4px;
    color: rgba(255, 255, 255, 0.46);
    font-size: 11px;
    transition: 0.2s ease;
}

.feature-item:hover .feature-arrow {
    color: #9ce6e8;
    transform: translate(2px, -2px);
}

.brand-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;
    padding-top: 22px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 7.8px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
}

.brand-line {
    width: 25px;
    height: 1px;
    background: rgba(255, 255, 255, 0.35);
}

/* =========================================================
   RIGHT PANEL
========================================================= */

.login-panel {
    position: relative;
    z-index: 6;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 35px 48px 35px 15px;
}

.login-card {
    width: 100%;
    max-width: 430px;
    padding: 32px 34px 27px;
    border: 1px solid rgba(158, 217, 223, 0.72);
    border-radius: 32px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow:
        0 25px 65px rgba(13, 127, 141, 0.11),
        0 10px 30px rgba(17, 52, 58, 0.045);
}

.mobile-logo {
    display: none;
    margin-bottom: 18px;
    background: #0d7f8d;
    color: white;
}

/* =========================================================
   LOGIN HEADER
========================================================= */

.portal-label {
    color: #0d7f8d;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1.7px;
}

.login-header h2 {
    margin: 6px 0 0;
    color: #11343a;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.3px;
}

.login-header p {
    margin: 6px 0 0;
    color: #71949a;
    font-size: 10px;
}

/* =========================================================
   FORM
========================================================= */

form {
    margin-top: 23px;
}

.form-group {
    margin-bottom: 14px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    color: #456a70;
    font-size: 9px;
    font-weight: 700;
}

.password-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.password-label label {
    margin-bottom: 6px;
}

.forgot {
    margin-bottom: 6px;
    padding: 0;
    border: none;
    background: transparent;
    color: #0d7f8d;
    font-size: 8px;
    font-weight: 700;
}

.input-box {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 46px;
    padding: 0 13px;
    border: 1px solid #cfe8eb;
    border-radius: 15px;
    background: #fbfeff;
    transition: 0.18s ease;
}

.input-box:focus-within {
    border-color: #0d7f8d;
    background: white;
    box-shadow:
        0 0 0 3px rgba(13, 127, 141, 0.07);
}

.input-icon {
    color: #79a4aa;
    font-size: 11px;
}

.input-box input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: #11343a;
    font-size: 10px;
}

.input-box input::placeholder {
    color: #a0b6ba;
}

.show-password {
    padding: 4px;
    border: none;
    background: transparent;
    color: #0d7f8d;
    font-size: 8px;
    font-weight: 700;
}

.remember {
    display: flex;
    align-items: center;
    gap: 7px;
    width: fit-content;
    color: #66898e;
    cursor: pointer;
    font-size: 8.5px;
}

.remember input {
    accent-color: #0d7f8d;
}

.error-message {
    margin-top: 10px;
    padding: 9px 11px;
    border: 1px solid #f2cccc;
    border-radius: 10px;
    background: #fff5f5;
    color: #b94f4f;
    font-size: 8.5px;
}

/* =========================================================
   LOGIN BUTTON
========================================================= */

.btn-login {
    width: 100%;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    margin-top: 16px;
    border: none;
    border-radius: 15px;
    background: #0d7f8d;
    color: white;
    font-size: 10px;
    font-weight: 750;
    box-shadow:
        0 9px 22px rgba(13, 127, 141, 0.18);
    transition: 0.2s ease;
}

.btn-login:hover:not(:disabled) {
    transform: translateY(-2px);
    background: #086e7a;
    box-shadow:
        0 13px 28px rgba(13, 127, 141, 0.23);
}

.btn-login:disabled {
    opacity: 0.65;
}

.login-arrow {
    font-size: 13px;
    transition: 0.2s ease;
}

.btn-login:hover .login-arrow {
    transform: translateX(3px);
}

.loading {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}

/* =========================================================
   OR + GOOGLE
========================================================= */

.or-divider {
    position: relative;
    margin: 17px 0;
    text-align: center;
}

.or-divider::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background: #dceef0;
}

.or-divider span {
    position: relative;
    z-index: 1;
    padding: 0 12px;
    background: white;
    color: #91aaae;
    font-size: 8px;
}

.btn-google {
    width: 100%;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 1px solid #cfe8eb;
    border-radius: 15px;
    background: white;
    color: #34585d;
    font-size: 9.5px;
    font-weight: 700;
    transition: 0.2s ease;
}

.btn-google:hover {
    transform: translateY(-2px);
    border-color: #8fcfd5;
    background: #f9fefe;
    box-shadow:
        0 9px 22px rgba(13, 127, 141, 0.08);
}

.google-logo {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #edf1f2;
    border-radius: 9px;
    background: white;
}

.google-blue {
    color: #4285f4;
    font-size: 15px;
    font-weight: 900;
}

/* =========================================================
   DEMO
========================================================= */

.demo-box {
    margin-top: 18px;
    padding: 12px;
    border: 1px dashed #9ed9df;
    border-radius: 15px;
    background: #f4fcfd;
}

.demo-head {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #0d7f8d;
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 1px;
}

.demo-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #0d7f8d;
}

.demo-account {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 9px;
}

.demo-account div {
    padding: 8px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.72);
}

.demo-account span,
.demo-account strong {
    display: block;
}

.demo-account span {
    color: #839fa4;
    font-size: 7px;
}

.demo-account strong {
    margin-top: 3px;
    color: #34585d;
    font-size: 8px;
}

.btn-demo {
    margin-top: 9px;
    padding: 7px 10px;
    border: 1px solid #9ed9df;
    border-radius: 9px;
    background: white;
    color: #0d7f8d;
    font-size: 8px;
    font-weight: 700;
    transition: 0.18s ease;
}

.btn-demo:hover {
    transform: translateY(-1px);
    background: #dff6f8;
}

/* =========================================================
   FOOTER
========================================================= */

.login-footer {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 17px;
    color: #9bb2b6;
    font-size: 7px;
}

/* =========================================================
   PAGE DECOR
========================================================= */

.page-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
}

.page-orb-one {
    top: 6%;
    right: 8%;
    width: 190px;
    height: 190px;
    background: rgba(13, 127, 141, 0.045);
}

.page-orb-two {
    right: 33%;
    bottom: 5%;
    width: 150px;
    height: 150px;
    background: rgba(159, 156, 231, 0.075);
}

/* =========================================================
   ANIMATION
========================================================= */

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1150px) {
    .login-wrapper {
        grid-template-columns: 52% 48%;
    }

    .brand-panel {
        padding: 45px 120px 40px 45px;
    }

    .brand-content h1 {
        font-size: 33px;
    }

    .vision-badge {
        display: none;
    }

    .login-panel {
        padding-right: 30px;
    }
}

@media (max-width: 900px) {
    .login-wrapper {
        grid-template-columns: 1fr;
    }

    .brand-panel {
        display: none;
    }

    .login-panel {
        min-height: 100vh;
        padding: 22px;
    }

    .login-card {
        max-width: 430px;
        padding: 28px;
    }

    .mobile-logo {
        display: flex;
    }
}
</style>