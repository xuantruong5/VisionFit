<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Quản lý Huấn luyện viên</h2>
                <p>Quản lý thông tin, chuyên môn và Gymmer được phân công</p>
            </div>

            <button class="btn-add" @click="openCreateModal">
                + Thêm Trainer
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng Trainer</span>
                <strong>{{ list_trainer.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Đang hoạt động</span>
                <strong>{{ countActive }}</strong>
            </div>

            <div class="mini-card">
                <span>Gymmer đang phụ trách</span>
                <strong>{{ totalGymmer }}</strong>
            </div>

            <div class="mini-card">
                <span>Review tháng này</span>
                <strong>{{ totalReview }}</strong>
            </div>
        </div>

        <div class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm Trainer theo tên, email hoặc số điện thoại..."
                    >
                </div>

                <select v-model="specialtyFilter">
                    <option value="">Tất cả chuyên môn</option>
                    <option value="Strength">Strength</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Bodybuilding">Bodybuilding</option>
                    <option value="Functional">Functional</option>
                </select>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="trainer-table">
                    <thead>
                        <tr>
                            <th>Trainer</th>
                            <th>Liên hệ</th>
                            <th>Chuyên môn</th>
                            <th>Gymmer phụ trách</th>
                            <th>Review AI</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="trainer in filteredTrainers"
                            :key="trainer.id"
                        >
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">
                                        {{ getInitial(trainer.ho_ten) }}
                                    </div>

                                    <div>
                                        <strong>{{ trainer.ho_ten }}</strong>
                                        <span>#TR{{ trainer.id }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <div class="contact">
                                    <span>{{ trainer.email }}</span>
                                    <small>{{ trainer.so_dien_thoai }}</small>
                                </div>
                            </td>

                            <td>
                                <span class="specialty">
                                    {{ trainer.chuyen_mon }}
                                </span>
                            </td>

                            <td>
                                <div class="gymmer-count">
                                    <strong>{{ trainer.so_gymmer }}</strong>
                                    <span>Gymmer</span>
                                </div>
                            </td>

                            <td>
                                <div class="review-count">
                                    <strong>{{ trainer.so_review }}</strong>
                                    <span>review</span>
                                </div>
                            </td>

                            <td>
                                <span
                                    class="status"
                                    :class="trainer.trang_thai"
                                >
                                    <span class="status-dot"></span>

                                    {{
                                        trainer.trang_thai === 'active'
                                            ? 'Đang hoạt động'
                                            : 'Ngừng hoạt động'
                                    }}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="btn-detail"
                                    @click="viewTrainer(trainer)"
                                >
                                    Chi tiết
                                </button>
                            </td>
                        </tr>

                        <tr v-if="filteredTrainers.length === 0">
                            <td colspan="7">
                                <div class="empty-state">
                                    Không tìm thấy Trainer phù hợp
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
                        <h3>Thêm Huấn luyện viên</h3>
                        <p>Tạo mới Trainer trong hệ thống VisionFit</p>
                    </div>

                    <button class="btn-close" @click="closeCreateModal">
                        ×
                    </button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Họ và tên</label>
                        <input
                            v-model="create_trainer.ho_ten"
                            type="text"
                            placeholder="Nhập họ và tên"
                        >
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input
                            v-model="create_trainer.email"
                            type="email"
                            placeholder="trainer@visionfit.vn"
                        >
                    </div>

                    <div class="form-group">
                        <label>Số điện thoại</label>
                        <input
                            v-model="create_trainer.so_dien_thoai"
                            type="text"
                            placeholder="0905..."
                        >
                    </div>

                    <div class="form-group">
                        <label>Chuyên môn</label>

                        <select v-model="create_trainer.chuyen_mon">
                            <option value="Strength">Strength</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Bodybuilding">Bodybuilding</option>
                            <option value="Functional">Functional</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Kinh nghiệm</label>
                        <input
                            v-model="create_trainer.kinh_nghiem"
                            type="number"
                            min="0"
                            placeholder="Số năm kinh nghiệm"
                        >
                    </div>

                    <div class="form-group full">
                        <label>Giới thiệu ngắn</label>

                        <textarea
                            v-model="create_trainer.mo_ta"
                            rows="3"
                            placeholder="Nhập thông tin chuyên môn của Trainer..."
                        ></textarea>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeCreateModal">
                        Hủy
                    </button>

                    <button class="btn-save" @click="themMoiTrainer">
                        Thêm Trainer
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminTrainer",

    data() {
        return {
            search: '',
            statusFilter: '',
            specialtyFilter: '',
            showCreateModal: false,

            list_trainer: [
                {
                    id: '0012',
                    ho_ten: 'Trần Quốc Huy',
                    email: 'huytran@visionfit.vn',
                    so_dien_thoai: '0905 221 820',
                    chuyen_mon: 'Strength',
                    kinh_nghiem: 5,
                    so_gymmer: 14,
                    so_review: 38,
                    trang_thai: 'active'
                },
                {
                    id: '0011',
                    ho_ten: 'Lê Hoàng Nam',
                    email: 'namle@visionfit.vn',
                    so_dien_thoai: '0935 440 121',
                    chuyen_mon: 'Fitness',
                    kinh_nghiem: 4,
                    so_gymmer: 11,
                    so_review: 31,
                    trang_thai: 'active'
                },
                {
                    id: '0009',
                    ho_ten: 'Nguyễn Khánh Linh',
                    email: 'linhnguyen@visionfit.vn',
                    so_dien_thoai: '0777 109 335',
                    chuyen_mon: 'Functional',
                    kinh_nghiem: 3,
                    so_gymmer: 9,
                    so_review: 24,
                    trang_thai: 'active'
                },
                {
                    id: '0006',
                    ho_ten: 'Phạm Quốc Bảo',
                    email: 'baopham@visionfit.vn',
                    so_dien_thoai: '0914 672 019',
                    chuyen_mon: 'Bodybuilding',
                    kinh_nghiem: 6,
                    so_gymmer: 0,
                    so_review: 12,
                    trang_thai: 'inactive'
                }
            ],

            create_trainer: {
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                chuyen_mon: 'Fitness',
                kinh_nghiem: '',
                mo_ta: ''
            }
        }
    },

    computed: {
        filteredTrainers() {
            return this.list_trainer.filter((trainer) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    trainer.ho_ten.toLowerCase().includes(keyword) ||
                    trainer.email.toLowerCase().includes(keyword) ||
                    trainer.so_dien_thoai.includes(keyword);

                const matchStatus =
                    !this.statusFilter ||
                    trainer.trang_thai === this.statusFilter;

                const matchSpecialty =
                    !this.specialtyFilter ||
                    trainer.chuyen_mon === this.specialtyFilter;

                return matchSearch && matchStatus && matchSpecialty;
            });
        },

        countActive() {
            return this.list_trainer.filter(
                trainer => trainer.trang_thai === 'active'
            ).length;
        },

        totalGymmer() {
            return this.list_trainer.reduce(
                (total, trainer) => total + trainer.so_gymmer,
                0
            );
        },

        totalReview() {
            return this.list_trainer.reduce(
                (total, trainer) => total + trainer.so_review,
                0
            );
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

        themMoiTrainer() {
            if (!this.create_trainer.ho_ten) {
                alert('Vui lòng nhập họ tên Trainer');
                return;
            }

            const trainer = {
                id: Date.now().toString().slice(-4),
                ...this.create_trainer,
                so_gymmer: 0,
                so_review: 0,
                trang_thai: 'active'
            };

            this.list_trainer.unshift(trainer);

            this.create_trainer = {
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                chuyen_mon: 'Fitness',
                kinh_nghiem: '',
                mo_ta: ''
            };

            this.closeCreateModal();
        },

        viewTrainer(trainer) {
            console.log('Trainer:', trainer);
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

.trainer-table {
    width: 100%;
    border-collapse: collapse;
}

.trainer-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9.5px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.trainer-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #34585d;
    font-size: 11.5px;
}

.trainer-table tbody tr {
    transition: 0.15s ease;
}

.trainer-table tbody tr:hover {
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

.specialty {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    background: #e3f8fb;
    color: #0b7481;
    font-size: 9.5px;
    font-weight: 700;
}

.gymmer-count,
.review-count {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.gymmer-count strong,
.review-count strong {
    color: #11343a;
    font-size: 13px;
}

.gymmer-count span,
.review-count span {
    color: #8aa7ab;
    font-size: 9.5px;
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

.btn-detail {
    border: 1px solid #9ed9df;
    padding: 6px 9px;
    border-radius: 8px;
    background: white;
    color: #0d7f8d;
    font-size: 10px;
    font-weight: 700;
    transition: 0.15s ease;
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
    width: 580px;
    max-width: 100%;
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
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .filter-bar {
        flex-wrap: wrap;
    }
}
</style>