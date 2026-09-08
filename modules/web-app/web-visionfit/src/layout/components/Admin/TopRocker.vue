<template>
    <header class="top-rocker">
        <div class="top-left">
            <div class="page-info">
                <span>VISIONFIT</span>
                <strong>Admin Portal</strong>
            </div>
        </div>

        <div class="top-right">
            <div class="system-status">
                <span class="status-dot"></span>
                Hệ thống hoạt động
            </div>

            <div class="divider"></div>

            <div class="admin-wrapper">
                <button
                    class="admin-button"
                    @click="showMenu = !showMenu"
                >
                    <div class="admin-avatar">
                        AD
                    </div>

                    <div class="admin-info">
                        <strong>VisionFit Admin</strong>
                        <span>Gym Admin</span>
                    </div>

                    <span
                        class="arrow"
                        :class="{ active: showMenu }"
                    >
                        ▾
                    </span>
                </button>

                <div
                    v-if="showMenu"
                    class="profile-menu"
                >
                    <div class="menu-profile">
                        <div class="admin-avatar large">
                            AD
                        </div>

                        <div>
                            <strong>VisionFit Admin</strong>
                            <span>admin@visionfit.vn</span>
                        </div>
                    </div>

                    <div class="menu-divider"></div>

                    <button
                        class="menu-item"
                        @click="goAccount"
                    >
                        <span class="menu-icon">A</span>

                        <div>
                            <strong>Tài khoản</strong>
                            <small>Thông tin & phân quyền</small>
                        </div>
                    </button>

                    <button
                        class="menu-item logout"
                        @click="logout"
                    >
                        <span class="menu-icon">↪</span>

                        <div>
                            <strong>Đăng xuất</strong>
                            <small>Thoát khỏi Admin Portal</small>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </header>
</template>

<script>
export default {
    name: "TopRocker",

    data() {
        return {
            showMenu: false
        }
    },

    methods: {
        goAccount() {
            this.showMenu = false;
            this.$router.push('/admin/phan-quyen');
        },

        logout() {
            this.showMenu = false;
            this.$router.push('/admin/login');
        }
    }
}
</script>

<style scoped>
.top-rocker {
    position: sticky;
    top: 0;
    z-index: 50;
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    border-bottom: 1px solid #d8eef1;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(10px);
}

.top-left,
.top-right {
    display: flex;
    align-items: center;
}

.page-info > span {
    display: block;
    color: #0d7f8d;
    font-size: 7.5px;
    font-weight: 800;
    letter-spacing: 1.4px;
}

.page-info > strong {
    display: block;
    margin-top: 2px;
    color: #11343a;
    font-size: 13px;
}

.top-right {
    gap: 14px;
}

.system-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 9px;
    border-radius: 999px;
    background: #eaf8f2;
    color: #2c7c60;
    font-size: 8.5px;
    font-weight: 700;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #36a576;
}

.divider {
    width: 1px;
    height: 30px;
    background: #d8eef1;
}

.admin-wrapper {
    position: relative;
}

.admin-button {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 5px 7px;
    border: none;
    border-radius: 11px;
    background: transparent;
    text-align: left;
    transition: 0.15s ease;
}

.admin-button:hover {
    background: #edf8f9;
}

.admin-avatar {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 10px;
    background: #dff6f8;
    color: #075e68;
    font-size: 9px;
    font-weight: 800;
}

.admin-avatar.large {
    width: 42px;
    height: 42px;
}

.admin-info strong,
.admin-info span {
    display: block;
}

.admin-info strong {
    color: #11343a;
    font-size: 9.5px;
}

.admin-info span {
    margin-top: 2px;
    color: #71949a;
    font-size: 8px;
}

.arrow {
    color: #71949a;
    font-size: 9px;
    transition: 0.2s ease;
}

.arrow.active {
    transform: rotate(180deg);
}

.profile-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 265px;
    padding: 10px;
    border: 1px solid #d8eef1;
    border-radius: 15px;
    background: white;
    box-shadow: 0 15px 38px rgba(13, 127, 141, 0.14);
}

.menu-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
}

.menu-profile strong,
.menu-profile span {
    display: block;
}

.menu-profile strong {
    color: #11343a;
    font-size: 10px;
}

.menu-profile span {
    margin-top: 3px;
    color: #71949a;
    font-size: 8px;
}

.menu-divider {
    height: 1px;
    margin: 6px 0;
    background: #e7f2f3;
}

.menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px;
    border: none;
    border-radius: 10px;
    background: transparent;
    text-align: left;
}

.menu-item:hover {
    background: #edf8f9;
}

.menu-icon {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 9px;
    background: #dff6f8;
    color: #075e68;
    font-size: 9px;
    font-weight: 800;
}

.menu-item strong,
.menu-item small {
    display: block;
}

.menu-item strong {
    color: #11343a;
    font-size: 9.5px;
}

.menu-item small {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 7.5px;
}

.menu-item.logout:hover {
    background: #fff3f3;
}

.menu-item.logout .menu-icon {
    background: #feecec;
    color: #b94f4f;
}

.menu-item.logout strong {
    color: #b94f4f;
}
</style>