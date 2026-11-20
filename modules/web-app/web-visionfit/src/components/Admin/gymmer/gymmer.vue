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
                <strong>{{ countExpiring }}</strong>
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
                                    @click="doiTrangThai(gymmer)"
                                    style="cursor: pointer;"
                                    title="Nhấn để đổi trạng thái"
                                >
                                    <span class="status-dot"></span>

                                    {{
                                        gymmer.trang_thai === 'active'
                                            ? 'Đang hoạt động'
                                            : 'Ngừng hoạt động'
                                    }}
                                </span>
                            </td>

                            <td class="action-cell">
                                <button
                                    class="btn-edit-sm"
                                    @click="openEditModal(gymmer)"
                                >
                                    Sửa
                                </button>
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
            v-if="showModal"
            class="modal-overlay"
            @click.self="closeModal"
        >
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3>{{ isEdit ? 'Chỉnh sửa Gymmer' : 'Thêm Gymmer' }}</h3>
                        <p>{{ isEdit ? 'Cập nhật thông tin người tập' : 'Tạo mới người tập trong VisionFit' }}</p>
                    </div>

                    <button class="btn-close" @click="closeModal">
                        ×
                    </button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Họ và tên</label>
                        <input
                            v-model="form_gymmer.ho_ten"
                            type="text"
                            placeholder="Nhập họ và tên"
                        >
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input
                            v-model="form_gymmer.email"
                            type="email"
                            placeholder="example@gmail.com"
                        >
                    </div>

                    <div class="form-group">
                        <label>Số điện thoại</label>
                        <input
                            v-model="form_gymmer.so_dien_thoai"
                            type="text"
                            placeholder="0905..."
                        >
                    </div>

                    <div class="form-group">
                        <label>Ngày sinh</label>
                        <input
                            v-model="form_gymmer.ngay_sinh"
                            type="date"
                        >
                    </div>

                    <div class="form-group">
                        <label>Giới tính</label>

                        <select v-model="form_gymmer.gioi_tinh">
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeModal">
                        Hủy
                    </button>

                    <button class="btn-save" :disabled="loading" @click="luuGymmer">
                        {{ isEdit ? 'Lưu thay đổi' : 'Thêm Gymmer' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- MODAL XÁC NHẬN ĐỔI TRẠNG THÁI -->
        <div
            v-if="confirmModal.show"
            class="modal-overlay"
            @click.self="confirmModal.show = false"
        >
            <div class="confirm-box">
                <div
                    class="confirm-icon"
                    :class="confirmModal.isLock ? 'lock' : 'unlock'"
                >
                    {{ confirmModal.isLock ? '🔒' : '🔓' }}
                </div>
                <h3>{{ confirmModal.isLock ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}</h3>
                <p>
                    Bạn có chắc chắn muốn {{ confirmModal.isLock ? 'khóa' : 'mở khóa' }} tài khoản của
                    <strong>{{ confirmModal.target?.ho_ten }}</strong>?
                    <span v-if="confirmModal.isLock"><br>Hội viên sẽ tạm thời không thể đăng nhập app.</span>
                </p>

                <div class="modal-actions center">
                    <button
                        class="btn-cancel"
                        @click="confirmModal.show = false"
                    >
                        Hủy
                    </button>
                    <button
                        :class="confirmModal.isLock ? 'btn-danger' : 'btn-save'"
                        :disabled="confirmModal.loading"
                        @click="thucHienDoiTrangThai"
                    >
                        {{ confirmModal.loading ? 'Đang xử lý...' : (confirmModal.isLock ? 'Khóa tài khoản' : 'Mở khóa') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import baseRequestAdmin from '@/core/baseRequestAdmin';

export default {
    name: "AdminGymmer",

    data() {
        return {
            search: '',
            statusFilter: '',
            showModal: false,
            isEdit: false,
            loading: false,

            confirmModal: {
                show: false,
                loading: false,
                isLock: false,
                target: null,
            },

            list_gymmer: [],

            form_gymmer: {
                id: null,
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                ngay_sinh: '',
                gioi_tinh: 'Nam'
            }
        };
    },

    computed: {
        filteredGymmers() {
            return this.list_gymmer.filter((gymmer) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    gymmer.ho_ten.toLowerCase().includes(keyword) ||
                    gymmer.email.toLowerCase().includes(keyword) ||
                    (gymmer.so_dien_thoai && gymmer.so_dien_thoai.includes(keyword));

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
        },

        countExpiring() {
            return this.list_gymmer.filter(
                gymmer => gymmer.sap_het_han
            ).length;
        }
    },

    methods: {
        getInitial(name) {
            const words = (name || '').trim().split(' ');

            return words
                .slice(-2)
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();
        },

        openCreateModal() {
            this.isEdit = false;
            this.form_gymmer = { id: null, ho_ten: '', email: '', so_dien_thoai: '', ngay_sinh: '', gioi_tinh: 'Nam' };
            this.showModal = true;
        },

        openEditModal(gymmer) {
            this.isEdit = true;
            this.form_gymmer = {
                id: gymmer.raw_id,
                ho_ten: gymmer.ho_ten || '',
                email: gymmer.email || '',
                so_dien_thoai: (gymmer.so_dien_thoai && gymmer.so_dien_thoai !== 'Chưa cập nhật') ? gymmer.so_dien_thoai : '',
                ngay_sinh: gymmer.ngay_sinh ? gymmer.ngay_sinh.substring(0, 10) : '',
                gioi_tinh: gymmer.gioi_tinh == 1 ? 'Nữ' : 'Nam',
            };
            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
        },

        async layDanhSachGymmer() {
            try {
                this.loading = true;
                const response = await baseRequestAdmin.get('admin/gymmers');
                if (response.data.status || response.data.success) {
                    this.list_gymmer = response.data.data;
                }
            } catch (error) {
                console.error('Lỗi lấy danh sách gymmer:', error);
            } finally {
                this.loading = false;
            }
        },

        async luuGymmer() {
            if (!this.form_gymmer.ho_ten.trim()) {
                alert('Vui lòng nhập họ và tên Gymmer!');
                return;
            }
            if (!this.form_gymmer.email.trim()) {
                alert('Vui lòng nhập địa chỉ email!');
                return;
            }

            try {
                this.loading = true;
                let res;
                if (this.isEdit) {
                    res = await baseRequestAdmin.put(`admin/gymmers/${this.form_gymmer.id}`, this.form_gymmer);
                } else {
                    res = await baseRequestAdmin.post('admin/gymmers', this.form_gymmer);
                }

                if (res.data.status || res.data.success) {
                    alert(this.isEdit ? 'Cập nhật Gymmer thành công!' : 'Thêm Gymmer thành công!\nMật khẩu mặc định là: 123456');
                    this.closeModal();
                    this.layDanhSachGymmer();
                }
            } catch (error) {
                alert(error.response?.data?.message || 'Có lỗi xảy ra!');
            } finally {
                this.loading = false;
            }
        },

        doiTrangThai(gymmer) {
            this.confirmModal = {
                show: true,
                loading: false,
                isLock: gymmer.trang_thai === 'active',
                target: gymmer,
            };
        },

        async thucHienDoiTrangThai() {
            const gymmer = this.confirmModal.target;
            if (!gymmer) return;

            try {
                this.confirmModal.loading = true;
                const response = await baseRequestAdmin.post(`admin/gymmers/${gymmer.raw_id}/trang-thai`);
                if (response.data.status || response.data.success) {
                    gymmer.trang_thai = response.data.trang_thai;
                    this.confirmModal.show = false;
                }
            } catch (error) {
                alert(error.response?.data?.message || 'Không thể cập nhật trạng thái!');
            } finally {
                this.confirmModal.loading = false;
            }
        },

        viewGymmer(gymmer) {
            this.$router.push('/admin/gymmer/' + gymmer.raw_id);
        }
    },

    mounted() {
        this.layDanhSachGymmer();
    }
};
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
    font-size: 28px;
    font-weight: 700;
}

.page-header p {
    margin: 5px 0 0;
    color: #71949a;
    font-size: 15px;
}

.btn-add {
    border: none;
    padding: 10px 15px;
    border-radius: 11px;
    background: #0d7f8d;
    color: white;
    font-size: 15px;
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
    font-size: 14px;
}

.mini-card strong {
    display: block;
    margin-top: 6px;
    color: #11343a;
    font-size: 26px;
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
    font-size: 15px;
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
    font-size: 14.5px;
}

.gymmer-table {
    width: 100%;
    border-collapse: collapse;
}

.gymmer-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    text-transform: uppercase;
}

.gymmer-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #34585d;
    font-size: 15px;
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
    font-size: 14.5px;
    font-weight: 800;
}

.user-cell strong {
    display: block;
    color: #11343a;
    font-size: 15px;
}

.user-cell span {
    display: block;
    margin-top: 2px;
    color: #94b2b6;
    font-size: 12.5px;
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
    font-size: 13px;
    font-weight: 700;
}

.status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 13px;
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
    font-size: 13.5px;
}

.empty-text {
    color: #94a3b8;
    font-size: 13.5px;
}

.action-cell {
    display: flex;
    gap: 6px;
    align-items: center;
}

.btn-edit-sm {
    border: 1px solid #cfe8eb;
    padding: 6px 9px;
    border-radius: 8px;
    background: #edf8f9;
    color: #0d7f8d;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
}

.btn-edit-sm:hover {
    background: #0d7f8d;
    color: white;
}

.btn-detail {
    border: 1px solid #9ed9df;
    padding: 6px 9px;
    border-radius: 8px;
    background: white;
    color: #0d7f8d;
    font-size: 13.5px;
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
    font-size: 20px;
}

.modal-header p {
    margin: 4px 0 0;
    color: #71949a;
    font-size: 14px;
}

.btn-close {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 9px;
    background: #edf8f9;
    color: #51777d;
    font-size: 20px;
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
    font-size: 13.5px;
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
    font-size: 15px;
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
    font-size: 14.5px;
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

/* CONFIRM MODAL */
.confirm-box {
    width: 90%;
    max-width: 420px;
    padding: 28px 24px;
    border-radius: 22px;
    background: white;
    text-align: center;
    box-shadow: 0 20px 50px rgba(13, 127, 141, 0.2);
    animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-icon {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
}

.confirm-icon.lock {
    background: #fee2e2;
    color: #ef4444;
}

.confirm-icon.unlock {
    background: #ecfdf5;
    color: #10b981;
}

.confirm-box h3 {
    margin: 0 0 8px;
    color: #11343a;
    font-size: 20px;
    font-weight: 700;
}

.confirm-box p {
    margin: 0 0 22px;
    color: #64748b;
    font-size: 14.5px;
    line-height: 1.5;
}

.confirm-box p strong {
    color: #11343a;
}

.modal-actions.center {
    display: flex;
    justify-content: center;
    gap: 12px;
}

.btn-danger {
    padding: 9px 18px;
    border: none;
    border-radius: 10px;
    background: #ef4444;
    color: white;
    font-size: 14.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
}

.btn-danger:hover {
    background: #dc2626;
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.92);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@media (max-width: 1000px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>