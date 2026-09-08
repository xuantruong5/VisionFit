<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Tài khoản & Phân quyền</h2>
                <p>Quản lý tài khoản và quyền truy cập trong hệ thống VisionFit</p>
            </div>

            <button class="btn-add" @click="openCreateModal">
                + Thêm tài khoản
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng tài khoản</span>
                <strong>{{ list_account.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Gym Admin</span>
                <strong>{{ countRole('admin') }}</strong>
            </div>

            <div class="mini-card">
                <span>Trainer</span>
                <strong>{{ countRole('trainer') }}</strong>
            </div>

            <div class="mini-card">
                <span>Đang hoạt động</span>
                <strong>{{ countActive }}</strong>
            </div>
        </div>

        <div class="tab-list">
            <button
                :class="{ active: activeTab === 'account' }"
                @click="activeTab = 'account'"
            >
                Tài khoản
            </button>

            <button
                :class="{ active: activeTab === 'role' }"
                @click="activeTab = 'role'"
            >
                Vai trò & Quyền hạn
            </button>
        </div>

        <div v-if="activeTab === 'account'" class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm tên, email hoặc tài khoản..."
                    >
                </div>

                <select v-model="roleFilter">
                    <option value="">Tất cả vai trò</option>
                    <option value="admin">Gym Admin</option>
                    <option value="trainer">Trainer</option>
                    <option value="gymmer">Gymmer</option>
                </select>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="locked">Đã khóa</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="account-table">
                    <thead>
                        <tr>
                            <th>Tài khoản</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Lần đăng nhập cuối</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="account in filteredAccounts"
                            :key="account.id"
                        >
                            <td>
                                <div class="user-cell">
                                    <div class="avatar">
                                        {{ getInitial(account.ho_ten) }}
                                    </div>

                                    <div>
                                        <strong>{{ account.ho_ten }}</strong>
                                        <span>@{{ account.username }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>{{ account.email }}</td>

                            <td>
                                <span
                                    class="role-badge"
                                    :class="account.role"
                                >
                                    {{ getRoleName(account.role) }}
                                </span>
                            </td>

                            <td>
                                <div class="login-time">
                                    <strong>{{ account.last_login_date }}</strong>
                                    <span>{{ account.last_login_time }}</span>
                                </div>
                            </td>

                            <td>
                                <span
                                    class="status"
                                    :class="account.status"
                                >
                                    <span class="status-dot"></span>

                                    {{
                                        account.status === 'active'
                                            ? 'Đang hoạt động'
                                            : 'Đã khóa'
                                    }}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="btn-detail"
                                    @click="openEditModal(account)"
                                >
                                    Chỉnh sửa
                                </button>
                            </td>
                        </tr>

                        <tr v-if="filteredAccounts.length === 0">
                            <td colspan="6">
                                <div class="empty-state">
                                    Không tìm thấy tài khoản phù hợp
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-else class="content-card">
            <div class="role-header">
                <div>
                    <h3>Ma trận quyền truy cập</h3>
                    <p>Prototype quyền hạn theo từng vai trò trong VisionFit</p>
                </div>

                <span class="note">
                    Gym Admin có toàn quyền trong Gym
                </span>
            </div>

            <div class="permission-table-wrap">
                <table class="permission-table">
                    <thead>
                        <tr>
                            <th>Chức năng</th>
                            <th>Gym Admin</th>
                            <th>Trainer</th>
                            <th>Gymmer</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="permission in permissions"
                            :key="permission.name"
                        >
                            <td>
                                <div class="permission-name">
                                    <strong>{{ permission.name }}</strong>
                                    <span>{{ permission.description }}</span>
                                </div>
                            </td>

                            <td>
                                <span
                                    class="permission-state"
                                    :class="{ allow: permission.admin }"
                                >
                                    {{ permission.admin ? '✓ Toàn quyền' : '—' }}
                                </span>
                            </td>

                            <td>
                                <span
                                    class="permission-state"
                                    :class="{ allow: permission.trainer }"
                                >
                                    {{ permission.trainer ? '✓ Có quyền' : '—' }}
                                </span>
                            </td>

                            <td>
                                <span
                                    class="permission-state"
                                    :class="{ allow: permission.gymmer }"
                                >
                                    {{ permission.gymmer ? '✓ Có quyền' : '—' }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="security-grid">
                <div class="security-card">
                    <div class="security-icon">A</div>

                    <div>
                        <strong>Audit Log</strong>
                        <p>Ghi nhận các thao tác nhạy cảm của Gym Admin.</p>
                    </div>

                    <span class="coming">Prototype</span>
                </div>

                <div class="security-card">
                    <div class="security-icon">S</div>

                    <div>
                        <strong>Session Management</strong>
                        <p>Quản lý phiên đăng nhập và token người dùng.</p>
                    </div>

                    <span class="coming">Prototype</span>
                </div>

                <div class="security-card">
                    <div class="security-icon">P</div>

                    <div>
                        <strong>Permission Control</strong>
                        <p>Backend sẽ kiểm tra quyền trên từng API.</p>
                    </div>

                    <span class="coming">Prototype</span>
                </div>
            </div>
        </div>

        <div
            v-if="showModal"
            class="modal-overlay"
            @click.self="closeModal"
        >
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3>
                            {{ editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản' }}
                        </h3>

                        <p>Thiết lập thông tin đăng nhập và vai trò</p>
                    </div>

                    <button class="btn-close" @click="closeModal">
                        ×
                    </button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Họ và tên</label>

                        <input
                            v-model="form.ho_ten"
                            type="text"
                            placeholder="Nhập họ và tên"
                        >
                    </div>

                    <div class="form-group">
                        <label>Tên đăng nhập</label>

                        <input
                            v-model="form.username"
                            type="text"
                            placeholder="username"
                        >
                    </div>

                    <div class="form-group">
                        <label>Email</label>

                        <input
                            v-model="form.email"
                            type="email"
                            placeholder="example@visionfit.vn"
                        >
                    </div>

                    <div class="form-group">
                        <label>Vai trò</label>

                        <select v-model="form.role">
                            <option value="admin">Gym Admin</option>
                            <option value="trainer">Trainer</option>
                            <option value="gymmer">Gymmer</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Trạng thái</label>

                        <select v-model="form.status">
                            <option value="active">Đang hoạt động</option>
                            <option value="locked">Khóa tài khoản</option>
                        </select>
                    </div>

                    <div
                        v-if="!editingAccount"
                        class="form-group full"
                    >
                        <label>Mật khẩu tạm thời</label>

                        <input
                            v-model="form.password"
                            type="password"
                            placeholder="Nhập mật khẩu tạm thời"
                        >
                    </div>

                    <div class="form-group full">
                        <div class="role-preview">
                            <span>Vai trò được chọn</span>

                            <strong>
                                {{ getRoleName(form.role) }}
                            </strong>

                            <p v-if="form.role === 'admin'">
                                Có quyền truy cập toàn bộ dữ liệu và chức năng
                                quản trị trong Gym.
                            </p>

                            <p v-else-if="form.role === 'trainer'">
                                Truy cập Gymmer được phân công, video, kết quả AI
                                và thực hiện Trainer Review.
                            </p>

                            <p v-else>
                                Truy cập thông tin, lịch sử tập luyện, video và
                                kết quả của chính tài khoản Gymmer.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeModal">
                        Hủy
                    </button>

                    <button class="btn-save" @click="saveAccount">
                        {{ editingAccount ? 'Lưu thay đổi' : 'Tạo tài khoản' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminPhanQuyen",

    data() {
        return {
            activeTab: 'account',
            search: '',
            roleFilter: '',
            statusFilter: '',
            showModal: false,
            editingAccount: null,

            list_account: [
                {
                    id: 1,
                    ho_ten: 'VisionFit Administrator',
                    username: 'admin',
                    email: 'admin@visionfit.vn',
                    role: 'admin',
                    status: 'active',
                    last_login_date: '02/09/2026',
                    last_login_time: '11:42'
                },
                {
                    id: 2,
                    ho_ten: 'Trần Quốc Huy',
                    username: 'huytran',
                    email: 'huytran@visionfit.vn',
                    role: 'trainer',
                    status: 'active',
                    last_login_date: '02/09/2026',
                    last_login_time: '09:20'
                },
                {
                    id: 3,
                    ho_ten: 'Lê Hoàng Nam',
                    username: 'namle',
                    email: 'namle@visionfit.vn',
                    role: 'trainer',
                    status: 'active',
                    last_login_date: '01/09/2026',
                    last_login_time: '21:15'
                },
                {
                    id: 4,
                    ho_ten: 'Nguyễn Minh Anh',
                    username: 'minhanh',
                    email: 'minhanh@gmail.com',
                    role: 'gymmer',
                    status: 'active',
                    last_login_date: '02/09/2026',
                    last_login_time: '10:25'
                },
                {
                    id: 5,
                    ho_ten: 'Hoàng Ngọc Vy',
                    username: 'ngocvy',
                    email: 'vyhoang@gmail.com',
                    role: 'gymmer',
                    status: 'locked',
                    last_login_date: '30/08/2026',
                    last_login_time: '18:32'
                }
            ],

            permissions: [
                {
                    name: 'Quản lý Gymmer',
                    description: 'Xem và quản lý hồ sơ người tập',
                    admin: true,
                    trainer: true,
                    gymmer: false
                },
                {
                    name: 'Quản lý Trainer',
                    description: 'Danh sách và thông tin Huấn luyện viên',
                    admin: true,
                    trainer: false,
                    gymmer: false
                },
                {
                    name: 'Phân công Trainer',
                    description: 'Gán Gymmer cho Trainer phụ trách',
                    admin: true,
                    trainer: false,
                    gymmer: false
                },
                {
                    name: 'Quản lý Gói tập',
                    description: 'Tạo và chỉnh sửa gói tập',
                    admin: true,
                    trainer: false,
                    gymmer: false
                },
                {
                    name: 'Video tập luyện',
                    description: 'Truy cập video tập luyện',
                    admin: true,
                    trainer: true,
                    gymmer: true
                },
                {
                    name: 'Kết quả AI',
                    description: 'Xem kết quả Computer Vision',
                    admin: true,
                    trainer: true,
                    gymmer: true
                },
                {
                    name: 'Trainer Review',
                    description: 'Xác nhận hoặc điều chỉnh kết quả AI',
                    admin: true,
                    trainer: true,
                    gymmer: false
                },
                {
                    name: 'Bán gói & Hóa đơn',
                    description: 'Tạo hóa đơn và xử lý bán gói',
                    admin: true,
                    trainer: false,
                    gymmer: false
                },
                {
                    name: 'Giao dịch & Doanh thu',
                    description: 'Truy cập dữ liệu tài chính',
                    admin: true,
                    trainer: false,
                    gymmer: false
                },
                {
                    name: 'Phân quyền hệ thống',
                    description: 'Quản lý tài khoản và quyền truy cập',
                    admin: true,
                    trainer: false,
                    gymmer: false
                }
            ],

            form: {
                ho_ten: '',
                username: '',
                email: '',
                role: 'trainer',
                status: 'active',
                password: ''
            }
        }
    },

    computed: {
        filteredAccounts() {
            return this.list_account.filter((account) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    account.ho_ten.toLowerCase().includes(keyword) ||
                    account.email.toLowerCase().includes(keyword) ||
                    account.username.toLowerCase().includes(keyword);

                const matchRole =
                    !this.roleFilter ||
                    account.role === this.roleFilter;

                const matchStatus =
                    !this.statusFilter ||
                    account.status === this.statusFilter;

                return matchSearch && matchRole && matchStatus;
            });
        },

        countActive() {
            return this.list_account.filter(
                item => item.status === 'active'
            ).length;
        }
    },

    methods: {
        countRole(role) {
            return this.list_account.filter(
                item => item.role === role
            ).length;
        },

        getInitial(name) {
            if (!name) {
                return '';
            }

            return name
                .trim()
                .split(' ')
                .slice(-2)
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();
        },

        getRoleName(role) {
            if (role === 'admin') return 'Gym Admin';
            if (role === 'trainer') return 'Trainer';
            if (role === 'gymmer') return 'Gymmer';

            return role;
        },

        openCreateModal() {
            this.editingAccount = null;

            this.form = {
                ho_ten: '',
                username: '',
                email: '',
                role: 'trainer',
                status: 'active',
                password: ''
            };

            this.showModal = true;
        },

        openEditModal(account) {
            this.editingAccount = account;

            this.form = {
                ho_ten: account.ho_ten,
                username: account.username,
                email: account.email,
                role: account.role,
                status: account.status,
                password: ''
            };

            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.editingAccount = null;
        },

        saveAccount() {
            if (
                !this.form.ho_ten ||
                !this.form.username ||
                !this.form.email
            ) {
                alert('Vui lòng nhập đầy đủ thông tin tài khoản');
                return;
            }

            if (this.editingAccount) {
                Object.assign(
                    this.editingAccount,
                    {
                        ho_ten: this.form.ho_ten,
                        username: this.form.username,
                        email: this.form.email,
                        role: this.form.role,
                        status: this.form.status
                    }
                );
            } else {
                this.list_account.unshift({
                    id: Date.now(),
                    ho_ten: this.form.ho_ten,
                    username: this.form.username,
                    email: this.form.email,
                    role: this.form.role,
                    status: this.form.status,
                    last_login_date: 'Chưa đăng nhập',
                    last_login_time: ''
                });
            }

            this.closeModal();
        }
    }
}
</script>

<style scoped>
.page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
}

.page-header h2 {
    margin: 0;
    color: #11343a;
    font-size: 25px;
    font-weight: 750;
}

.page-header p {
    margin: 5px 0 0;
    color: #71949a;
    font-size: 12px;
}

.btn-add {
    padding: 10px 15px;
    border: none;
    border-radius: 11px;
    background: #0d7f8d;
    color: white;
    font-size: 11px;
    font-weight: 700;
}

.btn-add:hover {
    background: #075e68;
}

.stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 16px;
}

.mini-card {
    padding: 16px;
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 16px;
    box-shadow: 0 6px 16px rgba(13, 127, 141, 0.05);
}

.mini-card span {
    display: block;
    color: #71949a;
    font-size: 10.5px;
}

.mini-card strong {
    display: block;
    margin-top: 6px;
    color: #11343a;
    font-size: 23px;
}

.tab-list {
    display: inline-flex;
    gap: 5px;
    margin-bottom: 12px;
    padding: 5px;
    border: 1px solid #d8eef1;
    border-radius: 12px;
    background: white;
}

.tab-list button {
    padding: 8px 13px;
    border: none;
    border-radius: 9px;
    background: transparent;
    color: #71949a;
    font-size: 10px;
    font-weight: 700;
}

.tab-list button:hover {
    background: #edf8f9;
}

.tab-list button.active {
    background: #0d7f8d;
    color: white;
}

.content-card {
    padding: 18px;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    background: white;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.06);
}

.filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
}

.search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    background: #fbfeff;
}

.search-box span {
    color: #78a4aa;
}

.search-box input {
    width: 100%;
    height: 40px;
    border: none;
    outline: none;
    background: transparent;
    color: #11343a;
    font-size: 11px;
}

.filter-bar select {
    min-width: 160px;
    height: 42px;
    padding: 0 10px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 10.5px;
}

.account-table,
.permission-table {
    width: 100%;
    border-collapse: collapse;
}

.account-table th,
.permission-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.account-table td,
.permission-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #456a70;
    font-size: 10.5px;
}

.account-table tbody tr:hover,
.permission-table tbody tr:hover {
    background: #f5fcfd;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 9px;
}

.avatar {
    width: 37px;
    height: 37px;
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

.user-cell strong,
.user-cell span {
    display: block;
}

.user-cell strong {
    color: #11343a;
    font-size: 10.5px;
}

.user-cell span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.role-badge {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 750;
}

.role-badge.admin {
    background: #dff6f8;
    color: #075e68;
}

.role-badge.trainer {
    background: #e8f2ff;
    color: #416e9a;
}

.role-badge.gymmer {
    background: #eeeefe;
    color: #6563a8;
}

.login-time strong,
.login-time span {
    display: block;
}

.login-time strong {
    color: #456a70;
    font-size: 9.5px;
}

.login-time span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8px;
}

.status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 700;
}

.status.active {
    background: #e4f7ef;
    color: #2c7c60;
}

.status.locked {
    background: #feecec;
    color: #b94f4f;
}

.status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
}

.btn-detail {
    padding: 6px 9px;
    border: 1px solid #9ed9df;
    border-radius: 8px;
    background: white;
    color: #0d7f8d;
    font-size: 9.5px;
    font-weight: 700;
}

.btn-detail:hover {
    background: #dff6f8;
}

.empty-state {
    padding: 40px;
    color: #71949a;
    text-align: center;
}

.role-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 15px;
}

.role-header h3 {
    margin: 0;
    color: #11343a;
    font-size: 14px;
}

.role-header p {
    margin: 4px 0 0;
    color: #71949a;
    font-size: 9.5px;
}

.note {
    padding: 6px 9px;
    border-radius: 999px;
    background: #dff6f8;
    color: #075e68;
    font-size: 8.5px;
    font-weight: 700;
}

.permission-name strong,
.permission-name span {
    display: block;
}

.permission-name strong {
    color: #11343a;
    font-size: 10px;
}

.permission-name span {
    margin-top: 3px;
    color: #8aa7ab;
    font-size: 8px;
}

.permission-state {
    color: #b0bfc1;
    font-size: 9px;
    font-weight: 700;
}

.permission-state.allow {
    color: #2c7c60;
}

.security-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 16px;
}

.security-card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 13px;
    border: 1px solid #d8eef1;
    border-radius: 13px;
    background: #f9fdfe;
}

.security-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 10px;
    background: #dff6f8;
    color: #075e68;
    font-size: 10px;
    font-weight: 800;
}

.security-card strong {
    color: #11343a;
    font-size: 10px;
}

.security-card p {
    margin: 4px 0 0;
    color: #71949a;
    font-size: 8.5px;
    line-height: 1.5;
}

.coming {
    position: absolute;
    top: 9px;
    right: 9px;
    color: #8aa7ab;
    font-size: 7px;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(8, 58, 64, 0.20);
    backdrop-filter: blur(4px);
}

.modal-box {
    width: 600px;
    max-width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 22px;
    border: 1px solid #9ed9df;
    border-radius: 22px;
    background: white;
    box-shadow: 0 20px 50px rgba(13, 127, 141, 0.18);
    animation: showModal 0.2s ease;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 18px;
}

.modal-header h3 {
    margin: 0;
    color: #11343a;
    font-size: 18px;
}

.modal-header p {
    margin: 4px 0 0;
    color: #71949a;
    font-size: 10px;
}

.btn-close {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 9px;
    background: #edf8f9;
    color: #51777d;
    font-size: 18px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 13px;
}

.form-group.full {
    grid-column: 1 / -1;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    color: #51777d;
    font-size: 10px;
    font-weight: 700;
}

.form-group input,
.form-group select {
    width: 100%;
    height: 42px;
    padding: 0 11px;
    border: 1px solid #cfe8eb;
    border-radius: 10px;
    outline: none;
    color: #11343a;
    font-size: 11px;
}

.form-group input:focus,
.form-group select:focus {
    border-color: #0d7f8d;
    box-shadow: 0 0 0 3px rgba(13, 127, 141, 0.08);
}

.role-preview {
    padding: 13px;
    border: 1px solid #d8eef1;
    border-radius: 12px;
    background: #f7fcfd;
}

.role-preview span,
.role-preview strong {
    display: block;
}

.role-preview span {
    color: #71949a;
    font-size: 8.5px;
}

.role-preview strong {
    margin-top: 4px;
    color: #075e68;
    font-size: 11px;
}

.role-preview p {
    margin: 6px 0 0;
    color: #597d82;
    font-size: 9px;
    line-height: 1.6;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    margin-top: 20px;
}

.btn-cancel,
.btn-save {
    padding: 9px 15px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
}

.btn-cancel {
    border: 1px solid #9ed9df;
    background: white;
    color: #0d7f8d;
}

.btn-save {
    border: 1px solid #0d7f8d;
    background: #0d7f8d;
    color: white;
}

.btn-save:hover {
    background: #075e68;
}

@keyframes showModal {
    from {
        opacity: 0;
        transform: scale(0.97);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@media (max-width: 1050px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .security-grid {
        grid-template-columns: 1fr;
    }

    .filter-bar {
        flex-wrap: wrap;
    }
}
</style>