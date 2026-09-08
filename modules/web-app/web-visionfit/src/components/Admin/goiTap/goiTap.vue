<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Quản lý Gói tập</h2>
                <p>Quản lý giá, thời hạn và quyền lợi của các gói tập VisionFit</p>
            </div>

            <button class="btn-add" @click="openCreateModal">
                + Thêm gói tập
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng gói tập</span>
                <strong>{{ list_goi_tap.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Đang kinh doanh</span>
                <strong>{{ countActive }}</strong>
            </div>

            <div class="mini-card">
                <span>Có tính năng AI</span>
                <strong>{{ countAI }}</strong>
            </div>

            <div class="mini-card">
                <span>Gói PT</span>
                <strong>{{ countPT }}</strong>
            </div>
        </div>

        <div class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm theo tên gói..."
                    >
                </div>

                <select v-model="typeFilter">
                    <option value="">Tất cả loại gói</option>
                    <option value="gym">Gym</option>
                    <option value="ai">Gym + AI</option>
                    <option value="pt">Personal Trainer</option>
                </select>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang bán</option>
                    <option value="inactive">Ngừng bán</option>
                </select>
            </div>

            <div class="package-grid">
                <div
                    v-for="goi in filteredPackages"
                    :key="goi.id"
                    class="package-card"
                    :class="{ featured: goi.noi_bat }"
                >
                    <div v-if="goi.noi_bat" class="featured-label">
                        PHỔ BIẾN
                    </div>

                    <div class="package-top">
                        <div>
                            <span class="package-type">
                                {{ getTypeName(goi.loai) }}
                            </span>

                            <h3>{{ goi.ten_goi }}</h3>
                        </div>

                        <span class="status" :class="goi.trang_thai">
                            <span class="status-dot"></span>
                            {{ goi.trang_thai === 'active' ? 'Đang bán' : 'Ngừng bán' }}
                        </span>
                    </div>

                    <div class="price">
                        {{ formatMoney(goi.gia) }}
                        <span>VNĐ</span>
                    </div>

                    <div class="duration">
                        {{ goi.thoi_han }} ngày sử dụng
                    </div>

                    <div class="benefit-list">
                        <div>
                            <span class="check">✓</span>
                            Tập luyện tại phòng Gym
                        </div>

                        <div v-if="goi.co_ai">
                            <span class="check">✓</span>
                            Phân tích tư thế bằng AI
                        </div>

                        <div v-if="goi.so_buoi_pt > 0">
                            <span class="check">✓</span>
                            {{ goi.so_buoi_pt }} buổi với Trainer
                        </div>

                        <div v-if="goi.co_trainer_review">
                            <span class="check">✓</span>
                            Trainer Review kết quả AI
                        </div>

                        <div>
                            <span class="check">✓</span>
                            Theo dõi lịch sử tập luyện
                        </div>
                    </div>

                    <div class="package-footer">
                        <div>
                            <span>Đã bán</span>
                            <strong>{{ goi.da_ban }}</strong>
                        </div>

                        <button class="btn-edit" @click="openEditModal(goi)">
                            Chỉnh sửa
                        </button>
                    </div>
                </div>

                <div v-if="filteredPackages.length === 0" class="empty-state">
                    Không tìm thấy gói tập phù hợp
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
                            {{ editingPackage ? 'Chỉnh sửa gói tập' : 'Thêm gói tập' }}
                        </h3>
                        <p>Thiết lập thông tin và quyền lợi của gói</p>
                    </div>

                    <button class="btn-close" @click="closeModal">
                        ×
                    </button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Tên gói</label>
                        <input
                            v-model="form.ten_goi"
                            type="text"
                            placeholder="Ví dụ: Gym + AI 3 tháng"
                        >
                    </div>

                    <div class="form-group">
                        <label>Loại gói</label>

                        <select v-model="form.loai">
                            <option value="gym">Gym</option>
                            <option value="ai">Gym + AI</option>
                            <option value="pt">Personal Trainer</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Giá bán</label>
                        <input
                            v-model.number="form.gia"
                            type="number"
                            min="0"
                            placeholder="Nhập giá gói"
                        >
                    </div>

                    <div class="form-group">
                        <label>Thời hạn</label>
                        <input
                            v-model.number="form.thoi_han"
                            type="number"
                            min="1"
                            placeholder="Số ngày"
                        >
                    </div>

                    <div class="form-group">
                        <label>Số buổi PT</label>
                        <input
                            v-model.number="form.so_buoi_pt"
                            type="number"
                            min="0"
                            placeholder="0"
                        >
                    </div>

                    <div class="form-group full">
                        <label>Quyền lợi</label>

                        <div class="checkbox-group">
                            <label class="checkbox-item">
                                <input v-model="form.co_ai" type="checkbox">
                                <span>Phân tích tư thế bằng AI</span>
                            </label>

                            <label class="checkbox-item">
                                <input v-model="form.co_trainer_review" type="checkbox">
                                <span>Trainer Review kết quả AI</span>
                            </label>

                            <label class="checkbox-item">
                                <input v-model="form.noi_bat" type="checkbox">
                                <span>Đánh dấu là gói nổi bật</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group full">
                        <label>Mô tả</label>
                        <textarea
                            v-model="form.mo_ta"
                            rows="3"
                            placeholder="Mô tả ngắn về gói tập..."
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label>Trạng thái</label>

                        <select v-model="form.trang_thai">
                            <option value="active">Đang bán</option>
                            <option value="inactive">Ngừng bán</option>
                        </select>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeModal">
                        Hủy
                    </button>

                    <button class="btn-save" @click="savePackage">
                        {{ editingPackage ? 'Lưu thay đổi' : 'Thêm gói tập' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminGoiTap",

    data() {
        return {
            search: '',
            typeFilter: '',
            statusFilter: '',
            showModal: false,
            editingPackage: null,

            list_goi_tap: [
                {
                    id: 1,
                    ten_goi: 'Gym Cơ bản 1 tháng',
                    loai: 'gym',
                    gia: 500000,
                    thoi_han: 30,
                    co_ai: false,
                    co_trainer_review: false,
                    so_buoi_pt: 0,
                    da_ban: 34,
                    noi_bat: false,
                    trang_thai: 'active'
                },
                {
                    id: 2,
                    ten_goi: 'Gym + AI 1 tháng',
                    loai: 'ai',
                    gia: 850000,
                    thoi_han: 30,
                    co_ai: true,
                    co_trainer_review: true,
                    so_buoi_pt: 0,
                    da_ban: 42,
                    noi_bat: true,
                    trang_thai: 'active'
                },
                {
                    id: 3,
                    ten_goi: 'Gym + AI 3 tháng',
                    loai: 'ai',
                    gia: 2200000,
                    thoi_han: 90,
                    co_ai: true,
                    co_trainer_review: true,
                    so_buoi_pt: 0,
                    da_ban: 28,
                    noi_bat: false,
                    trang_thai: 'active'
                },
                {
                    id: 4,
                    ten_goi: 'Personal Trainer 12 buổi',
                    loai: 'pt',
                    gia: 3600000,
                    thoi_han: 60,
                    co_ai: true,
                    co_trainer_review: true,
                    so_buoi_pt: 12,
                    da_ban: 17,
                    noi_bat: false,
                    trang_thai: 'active'
                },
                {
                    id: 5,
                    ten_goi: 'Personal Trainer 24 buổi',
                    loai: 'pt',
                    gia: 6500000,
                    thoi_han: 90,
                    co_ai: true,
                    co_trainer_review: true,
                    so_buoi_pt: 24,
                    da_ban: 9,
                    noi_bat: false,
                    trang_thai: 'inactive'
                }
            ],

            form: {
                ten_goi: '',
                loai: 'gym',
                gia: '',
                thoi_han: 30,
                co_ai: false,
                co_trainer_review: false,
                so_buoi_pt: 0,
                noi_bat: false,
                mo_ta: '',
                trang_thai: 'active'
            }
        }
    },

    computed: {
        filteredPackages() {
            return this.list_goi_tap.filter((goi) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    goi.ten_goi.toLowerCase().includes(keyword);

                const matchType =
                    !this.typeFilter ||
                    goi.loai === this.typeFilter;

                const matchStatus =
                    !this.statusFilter ||
                    goi.trang_thai === this.statusFilter;

                return matchSearch && matchType && matchStatus;
            });
        },

        countActive() {
            return this.list_goi_tap.filter(
                goi => goi.trang_thai === 'active'
            ).length;
        },

        countAI() {
            return this.list_goi_tap.filter(
                goi => goi.co_ai
            ).length;
        },

        countPT() {
            return this.list_goi_tap.filter(
                goi => goi.loai === 'pt'
            ).length;
        }
    },

    methods: {
        formatMoney(value) {
            return new Intl.NumberFormat('vi-VN').format(value);
        },

        getTypeName(type) {
            if (type === 'gym') return 'GYM';
            if (type === 'ai') return 'GYM + AI';
            if (type === 'pt') return 'PERSONAL TRAINER';
            return type;
        },

        openCreateModal() {
            this.editingPackage = null;

            this.form = {
                ten_goi: '',
                loai: 'gym',
                gia: '',
                thoi_han: 30,
                co_ai: false,
                co_trainer_review: false,
                so_buoi_pt: 0,
                noi_bat: false,
                mo_ta: '',
                trang_thai: 'active'
            };

            this.showModal = true;
        },

        openEditModal(goi) {
            this.editingPackage = goi;

            this.form = {
                ten_goi: goi.ten_goi,
                loai: goi.loai,
                gia: goi.gia,
                thoi_han: goi.thoi_han,
                co_ai: goi.co_ai,
                co_trainer_review: goi.co_trainer_review,
                so_buoi_pt: goi.so_buoi_pt,
                noi_bat: goi.noi_bat,
                mo_ta: goi.mo_ta || '',
                trang_thai: goi.trang_thai
            };

            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.editingPackage = null;
        },

        savePackage() {
            if (!this.form.ten_goi || !this.form.gia) {
                alert('Vui lòng nhập tên gói và giá bán');
                return;
            }

            if (this.editingPackage) {
                Object.assign(this.editingPackage, this.form);
            } else {
                this.list_goi_tap.unshift({
                    id: Date.now(),
                    ...this.form,
                    da_ban: 0
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
    transition: 0.18s ease;
}

.mini-card:hover {
    transform: translateY(-2px);
    border-color: #9ed9df;
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
    margin-bottom: 18px;
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
    min-width: 160px;
    height: 42px;
    padding: 0 10px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 11px;
}

.package-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.package-card {
    position: relative;
    padding: 20px;
    overflow: hidden;
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.05);
    transition: 0.18s ease;
}

.package-card:hover {
    transform: translateY(-3px);
    border-color: #9ed9df;
    box-shadow: 0 12px 24px rgba(13, 127, 141, 0.10);
}

.package-card.featured {
    border: 1.5px solid #0d7f8d;
}

.featured-label {
    position: absolute;
    top: 0;
    right: 0;
    padding: 6px 11px;
    border-radius: 0 17px 0 11px;
    background: #0d7f8d;
    color: white;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.8px;
}

.package-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.package-type {
    color: #0d7f8d;
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 1px;
}

.package-top h3 {
    margin: 5px 0 0;
    color: #11343a;
    font-size: 15px;
    font-weight: 750;
}

.price {
    margin-top: 20px;
    color: #075e68;
    font-size: 26px;
    font-weight: 800;
}

.price span {
    color: #71949a;
    font-size: 9px;
    font-weight: 600;
}

.duration {
    margin-top: 3px;
    color: #71949a;
    font-size: 10px;
}

.benefit-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: 18px;
    padding: 15px 0;
    border-top: 1px solid #edf6f7;
    border-bottom: 1px solid #edf6f7;
}

.benefit-list div {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #51777d;
    font-size: 10.5px;
}

.check {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 50%;
    background: #dff6f8;
    color: #0d7f8d;
    font-size: 10px;
    font-weight: 800;
}

.package-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 15px;
}

.package-footer span {
    display: block;
    color: #71949a;
    font-size: 9px;
}

.package-footer strong {
    display: block;
    margin-top: 2px;
    color: #11343a;
    font-size: 13px;
}

.status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 7px;
    border-radius: 999px;
    font-size: 8.5px;
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
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
}

.btn-edit {
    border: 1px solid #9ed9df;
    padding: 7px 10px;
    border-radius: 9px;
    background: white;
    color: #0d7f8d;
    font-size: 9.5px;
    font-weight: 700;
}

.btn-edit:hover {
    background: #dff6f8;
}

.empty-state {
    grid-column: 1 / -1;
    padding: 40px;
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
    width: 650px;
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
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0 11px;
    border: 1px solid #cfe8eb;
    border-radius: 10px;
    outline: none;
    color: #11343a;
    font-size: 11.5px;
}

.form-group input,
.form-group select {
    height: 42px;
}

.form-group textarea {
    padding-top: 10px;
    resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    border-color: #0d7f8d;
    box-shadow: 0 0 0 3px rgba(13, 127, 141, 0.08);
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 12px;
    border: 1px solid #d8eef1;
    border-radius: 11px;
    background: #fbfeff;
}

.checkbox-item {
    display: flex !important;
    align-items: center;
    gap: 8px;
    margin: 0 !important;
    color: #51777d !important;
    font-size: 10.5px !important;
    font-weight: 500 !important;
}

.checkbox-item input {
    width: 15px;
    height: 15px;
    accent-color: #0d7f8d;
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

@media (max-width: 1100px) {
    .package-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>