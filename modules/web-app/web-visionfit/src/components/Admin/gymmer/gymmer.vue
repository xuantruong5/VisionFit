<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Quản lý Gymmer</h2>
                <p>Quản lý thông tin, gói tập và trạng thái của người tập</p>
            </div>

            <button class="btn-add" @click="openCreateModal">
                + Thêm Gymmer
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng Gymmer</span>
                <strong>{{ list_gymmer.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Đang hoạt động</span>
                <strong>{{ countActive }}</strong>
            </div>

            <div class="mini-card">
                <span>Chưa có Trainer</span>
                <strong>{{ countNoTrainer }}</strong>
            </div>

            <div class="mini-card">
                <span>Sắp hết hạn gói</span>
                <strong>4</strong>
            </div>
        </div>

        <div class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm tên, email hoặc số điện thoại..."
                    >
                </div>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="gymmer-table">
                    <thead>
                        <tr>
                            <th>Gymmer</th>
                            <th>Liên hệ</th>
                            <th>Gói tập</th>
                            <th>Trainer</th>
                            <th>Phiên AI</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="gymmer in filteredGymmers"
                            :key="gymmer.id"
                        >
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">
                                        {{ getInitial(gymmer.ho_ten) }}
                                    </div>

                                    <div>
                                        <strong>{{ gymmer.ho_ten }}</strong>
                                        <span>#GM{{ gymmer.id }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <div class="contact">
                                    <span>{{ gymmer.email }}</span>
                                    <small>{{ gymmer.so_dien_thoai }}</small>
                                </div>
                            </td>

                            <td>
                                <span
                                    v-if="gymmer.goi_tap"
                                    class="package"
                                >
                                    {{ gymmer.goi_tap }}
                                </span>

                                <span v-else class="empty-text">
                                    Chưa có gói
                                </span>
                            </td>

                            <td>
                                <span v-if="gymmer.trainer">
                                    {{ gymmer.trainer }}
                                </span>

                                <span v-else class="warning-text">
                                    Chưa phân công
                                </span>
                            </td>

                            <td>
                                {{ gymmer.phien_ai }}
                            </td>

                            <td>
                                <span
                                    class="status"
                                    :class="gymmer.trang_thai"
                                >
                                    <span class="status-dot"></span>

                                    {{
                                        gymmer.trang_thai === 'active'
                                            ? 'Đang hoạt động'
                                            : 'Ngừng hoạt động'
                                    }}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="btn-detail"
                                    @click="viewGymmer(gymmer)"
                                >
                                    Chi tiết
                                </button>
                            </td>
                        </tr>

                        <tr v-if="filteredGymmers.length === 0">
                            <td colspan="7">
                                <div class="empty-state">
                                    Không tìm thấy Gymmer phù hợp
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div
            v-if="showCreateModal"
            class="modal-overlay"
            @click.self="closeCreateModal"
        >
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3>Thêm Gymmer</h3>
                        <p>Tạo mới người tập trong VisionFit</p>
                    </div>

                    <button class="btn-close" @click="closeCreateModal">
                        ×
                    </button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Họ và tên</label>
                        <input
                            v-model="create_gymmer.ho_ten"
                            type="text"
                            placeholder="Nhập họ và tên"
                        >
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input
                            v-model="create_gymmer.email"
                            type="email"
                            placeholder="example@gmail.com"
                        >
                    </div>

                    <div class="form-group">
                        <label>Số điện thoại</label>
                        <input
                            v-model="create_gymmer.so_dien_thoai"
                            type="text"
                            placeholder="0905..."
                        >
                    </div>

                    <div class="form-group">
                        <label>Ngày sinh</label>
                        <input
                            v-model="create_gymmer.ngay_sinh"
                            type="date"
                        >
                    </div>

                    <div class="form-group">
                        <label>Giới tính</label>

                        <select v-model="create_gymmer.gioi_tinh">
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeCreateModal">
                        Hủy
                    </button>

                    <button class="btn-save" @click="themMoiGymmer">
                        Thêm Gymmer
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminGymmer",

    data() {
        return {
            search: '',
            statusFilter: '',
            showCreateModal: false,

            list_gymmer: [
                {
                    id: '00128',
                    ho_ten: 'Nguyễn Minh Anh',
                    email: 'minhanh@gmail.com',
                    so_dien_thoai: '0905 221 889',
                    goi_tap: 'Personal 12 buổi',
                    trainer: 'Trần Quốc Huy',
                    phien_ai: 16,
                    trang_thai: 'active'
                },
                {
                    id: '00127',
                    ho_ten: 'Phạm Gia Hân',
                    email: 'hanpham@gmail.com',
                    so_dien_thoai: '0935 440 120',
                    goi_tap: 'Gym + AI 3 tháng',
                    trainer: 'Lê Hoàng Nam',
                    phien_ai: 22,
                    trang_thai: 'active'
                },
                {
                    id: '00122',
                    ho_ten: 'Võ Thanh Tùng',
                    email: 'tungvo@gmail.com',
                    so_dien_thoai: '0777 109 333',
                    goi_tap: 'Gym + AI 1 tháng',
                    trainer: null,
                    phien_ai: 8,
                    trang_thai: 'active'
                },
                {
                    id: '00119',
                    ho_ten: 'Hoàng Ngọc Vy',
                    email: 'vyhoang@gmail.com',
                    so_dien_thoai: '0914 672 018',
                    goi_tap: null,
                    trainer: 'Nguyễn Khánh Linh',
                    phien_ai: 12,
                    trang_thai: 'inactive'
                }
            ],

            create_gymmer: {
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                ngay_sinh: '',
                gioi_tinh: 'Nam'
            }
        }
    },

    computed: {
        filteredGymmers() {
            return this.list_gymmer.filter((gymmer) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    gymmer.ho_ten.toLowerCase().includes(keyword) ||
                    gymmer.email.toLowerCase().includes(keyword) ||
                    gymmer.so_dien_thoai.includes(keyword);

                const matchStatus =
                    !this.statusFilter ||
                    gymmer.trang_thai === this.statusFilter;

                return matchSearch && matchStatus;
            });
        },

        countActive() {
            return this.list_gymmer.filter(
                gymmer => gymmer.trang_thai === 'active'
            ).length;
        },

        countNoTrainer() {
            return this.list_gymmer.filter(
                gymmer => !gymmer.trainer
            ).length;
        }
    },

    methods: {
        getInitial(name) {
            const words = name.trim().split(' ');

            return words
                .slice(-2)
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();
        },

        openCreateModal() {
            this.showCreateModal = true;
        },

        closeCreateModal() {
            this.showCreateModal = false;
        },

        themMoiGymmer() {
            if (!this.create_gymmer.ho_ten) {
                alert('Vui lòng nhập họ tên');
                return;
            }

            const gymmer = {
                id: Date.now().toString().slice(-5),
                ...this.create_gymmer,
                goi_tap: null,
                trainer: null,
                phien_ai: 0,
                trang_thai: 'active'
            };

            this.list_gymmer.unshift(gymmer);

            this.create_gymmer = {
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                ngay_sinh: '',
                gioi_tinh: 'Nam'
            };

            this.closeCreateModal();
        },

        viewGymmer(gymmer) {
            console.log('Gymmer:', gymmer);
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
    border: none;
    padding: 10px 15px;
    border-radius: 11px;
    background: #0d7f8d;
    color: white;
    font-size: 12px;
    font-weight: 700;
    transition: 0.18s ease;
}

.btn-add:hover {
    background: #075e68;
    transform: translateY(-1px);
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

.content-card {
    padding: 18px;
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 18px;
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
    font-size: 11.5px;
}

.filter-bar select {
    min-width: 180px;
    height: 42px;
    padding: 0 10px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 11px;
}

.gymmer-table {
    width: 100%;
    border-collapse: collapse;
}

.gymmer-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9.5px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.gymmer-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #34585d;
    font-size: 11.5px;
}

.gymmer-table tbody tr {
    transition: 0.15s ease;
}

.gymmer-table tbody tr:hover {
    background: #f5fcfd;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-avatar {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: #dff6f8;
    color: #075e68;
    font-size: 11px;
    font-weight: 800;
}

.user-cell strong {
    display: block;
    color: #11343a;
    font-size: 11.5px;
}

.user-cell span {
    display: block;
    margin-top: 2px;
    color: #94b2b6;
    font-size: 9px;
}

.contact span,
.contact small {
    display: block;
}

.contact small {
    margin-top: 3px;
    color: #8aa7ab;
}

.package {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    background: #e3f8fb;
    color: #0b7481;
    font-size: 9.5px;
    font-weight: 700;
}

.status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 9.5px;
    font-weight: 700;
}

.status.active {
    background: #e4f7ef;
    color: #2c7c60;
}

.status.inactive {
    background: #f1f5f9;
    color: #64748b;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.warning-text {
    color: #b47a23;
    font-size: 10px;
}

.empty-text {
    color: #94a3b8;
    font-size: 10px;
}

.btn-detail {
    border: 1px solid #9ed9df;
    padding: 6px 9px;
    border-radius: 8px;
    background: white;
    color: #0d7f8d;
    font-size: 10px;
    font-weight: 700;
}

.btn-detail:hover {
    background: #dff6f8;
}

.empty-state {
    padding: 35px;
    color: #71949a;
    text-align: center;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(8, 58, 64, 0.18);
    backdrop-filter: blur(4px);
}

.modal-box {
    width: 560px;
    max-width: 100%;
    padding: 22px;
    border: 1px solid #9ed9df;
    border-radius: 22px;
    background: white;
    box-shadow: 0 20px 50px rgba(13, 127, 141, 0.18);
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
    font-size: 10.5px;
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
    font-size: 11.5px;
}

.form-group input:focus,
.form-group select:focus {
    border-color: #0d7f8d;
    box-shadow: 0 0 0 3px rgba(13, 127, 141, 0.08);
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
    font-size: 11px;
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

@media (max-width: 1000px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>