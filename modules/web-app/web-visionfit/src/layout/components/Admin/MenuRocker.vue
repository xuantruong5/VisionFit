<template>
    <aside class="sidebar">
        <!-- LOGO -->
        <div class="brand">
            <div class="brand-logo">
                VF
            </div>

            <div class="brand-info">
                <strong>VisionFit</strong>
                <span>GYM ADMIN</span>
            </div>
        </div>

        <div class="brand-line"></div>

        <!-- MENU -->
        <div class="menu-scroll">
            <!-- DASHBOARD -->
            <div class="menu-section">
                <span class="section-title">
                    TỔNG QUAN
                </span>

                <router-link to="/admin/dashboard" class="menu-item main-item">
                    <span class="menu-icon">▦</span>
                    <span>Bảng điều khiển</span>
                </router-link>
            </div>

            <!-- QUẢN LÝ -->
            <div class="menu-section">
                <span class="section-title">
                    QUẢN LÝ
                </span>

                <button class="menu-group" :class="{ active: isManagementActive }" @click="toggleGroup('management')">
                    <div class="group-left">
                        <span class="menu-icon">◎</span>
                        <span>Hội viên & HLV</span>
                    </div>

                    <span class="chevron" :class="{ open: openGroup.management }">
                        ›
                    </span>
                </button>

                <transition name="submenu">
                    <div v-if="openGroup.management" class="submenu">
                        <router-link to="/admin/gymmer" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Gymmer
                        </router-link>

                        <router-link to="/admin/trainer" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Huấn luyện viên
                        </router-link>

                        <router-link to="/admin/phan-cong" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Phân công HLV
                        </router-link>
                    </div>
                </transition>

                <button class="menu-group" :class="{ active: isServiceActive }" @click="toggleGroup('service')">
                    <div class="group-left">
                        <span class="menu-icon">▤</span>
                        <span>Gói & Lịch tập</span>
                    </div>

                    <span class="chevron" :class="{ open: openGroup.service }">
                        ›
                    </span>
                </button>

                <transition name="submenu">
                    <div v-if="openGroup.service" class="submenu">
                        <router-link to="/admin/goi-tap" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Gói tập
                        </router-link>

                        <router-link to="/admin/lich-lop" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Lịch & lớp tập
                        </router-link>
                    </div>
                </transition>
            </div>

            <!-- AI -->
            <div class="menu-section">
                <span class="section-title">
                    TẬP LUYỆN & AI
                </span>

                <!-- QUAN TRỌNG NÊN ĐỂ RIÊNG -->
                <router-link to="/admin/phan-tich-ai" class="menu-item important-item">
                    <span class="menu-icon ai-icon">✦</span>

                    <div class="menu-text">
                        <span>Phân tích AI</span>
                        <small>Computer Vision</small>
                    </div>

                    <span class="important-dot"></span>
                </router-link>

                <button class="menu-group" :class="{ active: isAIActive }" @click="toggleGroup('ai')">
                    <div class="group-left">
                        <span class="menu-icon">▷</span>
                        <span>Dữ liệu AI</span>
                    </div>

                    <span class="chevron" :class="{ open: openGroup.ai }">
                        ›
                    </span>
                </button>

                <transition name="submenu">
                    <div v-if="openGroup.ai" class="submenu">
                        <router-link to="/admin/video" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Video tập luyện
                        </router-link>

                        <router-link to="/admin/trainer-review" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Trainer Review
                        </router-link>

                        <router-link to="/admin/bao-cao-ai" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Báo cáo AI
                        </router-link>
                    </div>
                </transition>
            </div>

            <!-- TÀI CHÍNH -->
            <div class="menu-section">
                <span class="section-title">
                    TÀI CHÍNH
                </span>

                <!-- CHỨC NĂNG HAY DÙNG -->
                <router-link to="/admin/ban-goi" class="menu-item sale-item">
                    <span class="menu-icon">＋</span>

                    <div class="menu-text">
                        <span>Bán gói tại quầy</span>
                        <small>Tạo hóa đơn nhanh</small>
                    </div>
                </router-link>

                <button class="menu-group" :class="{ active: isFinanceActive }" @click="toggleGroup('finance')">
                    <div class="group-left">
                        <span class="menu-icon">₫</span>
                        <span>Thanh toán & Báo cáo</span>
                    </div>

                    <span class="chevron" :class="{ open: openGroup.finance }">
                        ›
                    </span>
                </button>

                <transition name="submenu">
                    <div v-if="openGroup.finance" class="submenu">
                        <router-link to="/admin/hoa-don" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Hóa đơn
                        </router-link>

                        <router-link to="/admin/giao-dich" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Giao dịch
                        </router-link>

                        <router-link to="/admin/bao-cao-doanh-thu" class="submenu-item">
                            <span class="submenu-dot"></span>
                            Báo cáo doanh thu
                        </router-link>
                    </div>
                </transition>
            </div>

            <!-- HỆ THỐNG -->
            <div class="menu-section">
                <span class="section-title">
                    HỆ THỐNG
                </span>

                <router-link to="/admin/phan-quyen" class="menu-item">
                    <span class="menu-icon">⚙</span>
                    <span>Tài khoản & Phân quyền</span>
                </router-link>
            </div>
        </div>

        <!-- BOTTOM -->
        <div class="sidebar-bottom">
            <div class="admin-mini">
                <div class="admin-avatar">
                    AD
                </div>

                <div class="admin-text">
                    <strong>VisionFit Admin</strong>
                    <span>Gym Admin</span>
                </div>
            </div>

            <button class="logout-button" @click="logout">
                <span class="logout-icon">
                    ↪
                </span>

                <span>Đăng xuất</span>
            </button>
        </div>
    </aside>
</template>

<script>
export default {
    name: "MenuRocker",

    data() {
        return {
            openGroup: {
                management: false,
                service: false,
                ai: false,
                finance: false
            }
        }
    },

    computed: {
        currentPath() {
            return this.$route.path;
        },

        isManagementActive() {
            return [
                '/admin/gymmer',
                '/admin/trainer',
                '/admin/phan-cong'
            ].includes(this.currentPath);
        },

        isServiceActive() {
            return [
                '/admin/goi-tap',
                '/admin/lich-lop'
            ].includes(this.currentPath);
        },

        isAIActive() {
            return [
                '/admin/video',
                '/admin/trainer-review',
                '/admin/bao-cao-ai'
            ].includes(this.currentPath);
        },

        isFinanceActive() {
            return [
                '/admin/hoa-don',
                '/admin/giao-dich',
                '/admin/bao-cao-doanh-thu'
            ].includes(this.currentPath);
        }
    },

    watch: {
        '$route.path': {
            immediate: true,

            handler() {
                this.openActiveGroup();
            }
        }
    },

    methods: {
        toggleGroup(group) {
            this.openGroup[group] =
                !this.openGroup[group];
        },

        openActiveGroup() {
            if (this.isManagementActive) {
                this.openGroup.management = true;
            }

            if (this.isServiceActive) {
                this.openGroup.service = true;
            }

            if (this.isAIActive) {
                this.openGroup.ai = true;
            }

            if (this.isFinanceActive) {
                this.openGroup.finance = true;
            }
        },

        logout() {
            this.$router.push('/admin/login');
        }
    }
}
</script>

<style scoped>
.sidebar {
    width: 250px;
    height: 100vh;

    position: sticky;
    top: 0;

    display: flex;
    flex-direction: column;

    flex-shrink: 0;

    border-right: 1px solid #d4ecef;

    background:
        rgba(255, 255, 255, 0.97);

    box-shadow:
        8px 0 28px rgba(13, 127, 141, 0.045);

    overflow: hidden;
}

/* BRAND */

.brand {
    display: flex;
    align-items: center;

    gap: 12px;

    padding: 24px 22px 18px;
}

.brand-logo {
    width: 45px;
    height: 45px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    border-radius: 15px;

    background:
        linear-gradient(135deg,
            #0d7f8d,
            #118d9b);

    color: white;

    font-size: 14px;
    font-weight: 850;

    box-shadow:
        0 8px 18px rgba(13, 127, 141, 0.18);
}

.brand-info strong,
.brand-info span {
    display: block;
}

.brand-info strong {
    color: #11343a;

    font-size: 18px;
    font-weight: 800;
}

.brand-info span {
    margin-top: 2px;

    color: #7ba0a6;

    font-size: 8px;
    font-weight: 800;

    letter-spacing: 1.8px;
}

.brand-line {
    height: 1px;

    margin: 0 20px;

    background: #d8eef1;
}

/* SCROLL */

.menu-scroll {
    flex: 1;

    padding: 16px 14px;

    overflow-y: auto;

    scrollbar-width: thin;

    scrollbar-color:
        #d8eef1 transparent;
}

.menu-scroll::-webkit-scrollbar {
    width: 4px;
}

.menu-scroll::-webkit-scrollbar-thumb {
    border-radius: 999px;

    background: #d8eef1;
}

/* SECTION */

.menu-section {
    margin-bottom: 20px;
}

.section-title {
    display: block;

    margin:
        0 9px 8px;

    color: #81a6ab;

    font-size: 8px;
    font-weight: 800;

    letter-spacing: 1.5px;
}

/* NORMAL ITEM */

.menu-item,
.menu-group {
    width: 100%;
    min-height: 43px;

    display: flex;
    align-items: center;

    gap: 10px;

    padding: 8px 11px;

    border: none;
    border-radius: 12px;

    background: transparent;

    color: #648b91;

    font-size: 10.5px;
    font-weight: 700;

    text-decoration: none;
    text-align: left;

    cursor: pointer;

    transition: 0.18s ease;
}

.menu-item:hover,
.menu-group:hover {
    background: #eef9fa;

    color: #0d7f8d;
}

.menu-item.router-link-active {
    background: #0d7f8d;

    color: white;

    box-shadow:
        0 8px 18px rgba(13, 127, 141, 0.15);
}

.menu-icon {
    width: 22px;

    flex-shrink: 0;

    color: #7da8ae;

    font-size: 12px;

    text-align: center;
}

.menu-item.router-link-active .menu-icon {
    color: white;
}

/* GROUP */

.menu-group {
    justify-content: space-between;
}

.group-left {
    display: flex;
    align-items: center;

    gap: 10px;
}

.menu-group.active {
    color: #0d7f8d;
}

.menu-group.active .menu-icon {
    color: #0d7f8d;
}

.chevron {
    color: #9bb8bc;

    font-size: 17px;

    transition: 0.2s ease;
}

.chevron.open {
    transform: rotate(90deg);

    color: #0d7f8d;
}

/* SUB MENU */

.submenu {
    position: relative;

    display: grid;

    gap: 3px;

    margin:
        4px 0 6px 21px;

    padding-left: 15px;

    border-left:
        1px solid #d5ecef;
}

.submenu-item {
    display: flex;
    align-items: center;

    gap: 8px;

    min-height: 34px;

    padding: 6px 9px;

    border-radius: 9px;

    color: #789ba0;

    font-size: 9.5px;
    font-weight: 650;

    text-decoration: none;

    transition: 0.15s ease;
}

.submenu-item:hover {
    background: #f0fafb;

    color: #0d7f8d;
}

.submenu-item.router-link-active {
    background: #dff6f8;

    color: #075e68;

    font-weight: 750;
}

.submenu-dot {
    width: 5px;
    height: 5px;

    border-radius: 50%;

    background: #a9c8cc;
}

.submenu-item.router-link-active .submenu-dot {
    background: #0d7f8d;

    box-shadow:
        0 0 0 3px rgba(13, 127, 141, 0.10);
}

/* IMPORTANT AI */

.important-item {
    position: relative;

    margin-bottom: 5px;

    border:
        1px solid #d6edef;

    background:
        linear-gradient(135deg,
            #f1fbfc,
            #f9ffff);
}

.important-item.router-link-active {
    border-color: transparent;

    background:
        linear-gradient(135deg,
            #0d7f8d,
            #118d9b);
}

.ai-icon {
    color: #13a8b7;
}

.menu-text {
    flex: 1;
}

.menu-text span,
.menu-text small {
    display: block;
}

.menu-text small {
    margin-top: 2px;

    color: #94b1b5;

    font-size: 7px;
    font-weight: 600;
}

.menu-item.router-link-active .menu-text small {
    color:
        rgba(255, 255, 255, 0.67);
}

.important-dot {
    width: 6px;
    height: 6px;

    border-radius: 50%;

    background: #25c69b;

    box-shadow:
        0 0 0 4px rgba(37, 198, 155, 0.09);
}

/* SALE */

.sale-item {
    margin-bottom: 5px;

    border:
        1px solid #d3ecee;

    background: #f7fdfd;
}

/* BOTTOM */

.sidebar-bottom {
    padding: 13px 14px 15px;

    border-top:
        1px solid #d8eef1;

    background:
        rgba(255, 255, 255, 0.98);
}

.admin-mini {
    display: flex;
    align-items: center;

    gap: 9px;

    padding: 8px 9px;
}

.admin-avatar {
    width: 33px;
    height: 33px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    border-radius: 10px;

    background: #dff6f8;

    color: #075e68;

    font-size: 8px;
    font-weight: 800;
}

.admin-text strong,
.admin-text span {
    display: block;
}

.admin-text strong {
    color: #11343a;

    font-size: 9px;
}

.admin-text span {
    margin-top: 2px;

    color: #8ba7ab;

    font-size: 7.5px;
}

/* LOGOUT */

.logout-button {
    width: 100%;
    height: 38px;

    display: flex;
    align-items: center;

    gap: 9px;

    margin-top: 5px;

    padding: 0 11px;

    border:
        1px solid transparent;

    border-radius: 11px;

    background: transparent;

    color: #718f94;

    font-size: 9.5px;
    font-weight: 700;

    text-align: left;

    transition: 0.18s ease;
}

.logout-button:hover {
    border-color: #f1dada;

    background: #fff5f5;

    color: #b94f4f;
}

.logout-icon {
    width: 22px;

    color: #9aafb2;

    font-size: 13px;

    text-align: center;
}

.logout-button:hover .logout-icon {
    color: #b94f4f;
}

/* SUB MENU ANIMATION */

.submenu-enter-active,
.submenu-leave-active {
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}

.submenu-enter-from,
.submenu-leave-to {
    opacity: 0;

    transform:
        translateY(-4px);
}

@media (max-width: 900px) {
    .sidebar {
        width: 220px;
    }

    .brand {
        padding-left: 17px;
        padding-right: 17px;
    }
}

.ring-one {
    animation: floatRing 7s ease-in-out infinite;
}

.ring-two {
    animation: floatRing 9s ease-in-out infinite reverse;
}

@keyframes floatRing {
    0%, 100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(12px);
    }
}
</style>