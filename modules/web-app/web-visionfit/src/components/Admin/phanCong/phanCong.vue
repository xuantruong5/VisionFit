<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Phân công Huấn luyện viên</h2>
                <p>Quản lý việc phân công Trainer phụ trách Gymmer</p>
            </div>

            <button class="btn-add" @click="openAssignModal">
                + Phân công mới
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng phân công</span>
                <strong>{{ list_phan_cong.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Đang phụ trách</span>
                <strong>{{ countActive }}</strong>
            </div>

            <div class="mini-card">
                <span>Gymmer chưa có Trainer</span>
                <strong>6</strong>
            </div>

            <div class="mini-card">
                <span>Trainer đang hoạt động</span>
                <strong>10</strong>
            </div>
        </div>

        <div class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm Gymmer hoặc Trainer..."
                    >
                </div>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang phụ trách</option>
                    <option value="ended">Đã kết thúc</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="assignment-table">
                    <thead>
                        <tr>
                            <th>Gymmer</th>
                            <th>Trainer phụ trách</th>
                            <th>Ngày bắt đầu</th>
                            <th>Số buổi</th>
                            <th>Tiến độ</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="item in filteredAssignments"
                            :key="item.id"
                        >
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar gymmer">
                                        {{ getInitial(item.gymmer) }}
                                    </div>

                                    <div>
                                        <strong>{{ item.gymmer }}</strong>
                                        <span>#GM{{ item.gymmer_id }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar trainer">
                                        {{ getInitial(item.trainer) }}
                                    </div>

                                    <div>
                                        <strong>{{ item.trainer }}</strong>
                                        <span>#TR{{ item.trainer_id }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>{{ item.ngay_bat_dau }}</td>

                            <td>
                                <strong>{{ item.da_hoc }}</strong>
                                / {{ item.tong_buoi }} buổi
                            </td>

                            <td>
                                <div class="progress-wrap">
                                    <div class="progress-bar">
                                        <div
                                            class="progress-value"
                                            :style="{ width: getProgress(item) + '%' }"
                                        ></div>
                                    </div>

                                    <span>{{ getProgress(item) }}%</span>
                                </div>
                            </td>

                            <td>
                                <span
                                    class="status"
                                    :class="item.trang_thai"
                                >
                                    <span class="status-dot"></span>

                                    {{
                                        item.trang_thai === 'active'
                                            ? 'Đang phụ trách'
                                            : 'Đã kết thúc'
                                    }}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="btn-action"
                                    @click="openEditModal(item)"
                                >
                                    Thay đổi
                                </button>
                            </td>
                        </tr>

                        <tr v-if="filteredAssignments.length === 0">
                            <td colspan="7">
                                <div class="empty-state">
                                    Không tìm thấy phân công phù hợp
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
                        <h3>
                            {{ editingAssignment ? 'Thay đổi phân công' : 'Phân công Trainer' }}
                        </h3>

                        <p>
                            Chọn Gymmer và Trainer phụ trách
                        </p>
                    </div>

                    <button class="btn-close" @click="closeModal">
                        ×
                    </button>
                </div>

                <div class="assignment-flow">
                    <div class="flow-card">
                        <div class="flow-label">GYMMER</div>

                        <select v-model="form.gymmer">
                            <option value="">Chọn Gymmer</option>
                            <option
                                v-for="gymmer in list_gymmer"
                                :key="gymmer.id"
                                :value="gymmer.ho_ten"
                            >
                                {{ gymmer.ho_ten }}
                            </option>
                        </select>
                    </div>

                    <div class="flow-arrow">
                        →
                    </div>

                    <div class="flow-card">
                        <div class="flow-label">TRAINER</div>

                        <select v-model="form.trainer">
                            <option value="">Chọn Trainer</option>
                            <option
                                v-for="trainer in list_trainer"
                                :key="trainer.id"
                                :value="trainer.ho_ten"
                            >
                                {{ trainer.ho_ten }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label>Ngày bắt đầu</label>

                        <input
                            v-model="form.ngay_bat_dau"
                            type="date"
                        >
                    </div>

                    <div class="form-group">
                        <label>Số buổi</label>

                        <select v-model="form.tong_buoi">
                            <option :value="8">8 buổi</option>
                            <option :value="12">12 buổi</option>
                            <option :value="16">16 buổi</option>
                            <option :value="24">24 buổi</option>
                        </select>
                    </div>

                    <div class="form-group full">
                        <label>Ghi chú</label>

                        <textarea
                            v-model="form.ghi_chu"
                            rows="3"
                            placeholder="Ghi chú cho lần phân công..."
                        ></textarea>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeModal">
                        Hủy
                    </button>

                    <button class="btn-save" @click="saveAssignment">
                        {{ editingAssignment ? 'Lưu thay đổi' : 'Xác nhận phân công' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminPhanCong",

    data() {
        return {
            search: '',
            statusFilter: '',
            showModal: false,
            editingAssignment: null,

            list_phan_cong: [
                {
                    id: 1,
                    gymmer_id: '00128',
                    gymmer: 'Nguyễn Minh Anh',
                    trainer_id: '0012',
                    trainer: 'Trần Quốc Huy',
                    ngay_bat_dau: '25/08/2026',
                    tong_buoi: 12,
                    da_hoc: 7,
                    trang_thai: 'active'
                },
                {
                    id: 2,
                    gymmer_id: '00127',
                    gymmer: 'Phạm Gia Hân',
                    trainer_id: '0011',
                    trainer: 'Lê Hoàng Nam',
                    ngay_bat_dau: '12/08/2026',
                    tong_buoi: 16,
                    da_hoc: 12,
                    trang_thai: 'active'
                },
                {
                    id: 3,
                    gymmer_id: '00119',
                    gymmer: 'Hoàng Ngọc Vy',
                    trainer_id: '0009',
                    trainer: 'Nguyễn Khánh Linh',
                    ngay_bat_dau: '01/07/2026',
                    tong_buoi: 12,
                    da_hoc: 12,
                    trang_thai: 'ended'
                }
            ],

            list_gymmer: [
                {
                    id: '00128',
                    ho_ten: 'Nguyễn Minh Anh'
                },
                {
                    id: '00127',
                    ho_ten: 'Phạm Gia Hân'
                },
                {
                    id: '00122',
                    ho_ten: 'Võ Thanh Tùng'
                },
                {
                    id: '00119',
                    ho_ten: 'Hoàng Ngọc Vy'
                }
            ],

            list_trainer: [
                {
                    id: '0012',
                    ho_ten: 'Trần Quốc Huy'
                },
                {
                    id: '0011',
                    ho_ten: 'Lê Hoàng Nam'
                },
                {
                    id: '0009',
                    ho_ten: 'Nguyễn Khánh Linh'
                }
            ],

            form: {
                gymmer: '',
                trainer: '',
                ngay_bat_dau: '',
                tong_buoi: 12,
                ghi_chu: ''
            }
        }
    },

    computed: {
        filteredAssignments() {
            return this.list_phan_cong.filter((item) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    item.gymmer.toLowerCase().includes(keyword) ||
                    item.trainer.toLowerCase().includes(keyword);

                const matchStatus =
                    !this.statusFilter ||
                    item.trang_thai === this.statusFilter;

                return matchSearch && matchStatus;
            });
        },

        countActive() {
            return this.list_phan_cong.filter(
                item => item.trang_thai === 'active'
            ).length;
        }
    },

    methods: {
        getInitial(name) {
            return name
                .trim()
                .split(' ')
                .slice(-2)
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();
        },

        getProgress(item) {
            if (!item.tong_buoi) {
                return 0;
            }

            return Math.round(
                (item.da_hoc / item.tong_buoi) * 100
            );
        },

        openAssignModal() {
            this.editingAssignment = null;

            this.form = {
                gymmer: '',
                trainer: '',
                ngay_bat_dau: '',
                tong_buoi: 12,
                ghi_chu: ''
            };

            this.showModal = true;
        },

        openEditModal(item) {
            this.editingAssignment = item;

            this.form = {
                gymmer: item.gymmer,
                trainer: item.trainer,
                ngay_bat_dau: '',
                tong_buoi: item.tong_buoi,
                ghi_chu: ''
            };

            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.editingAssignment = null;
        },

        saveAssignment() {
            if (!this.form.gymmer || !this.form.trainer) {
                alert('Vui lòng chọn Gymmer và Trainer');
                return;
            }

            if (this.editingAssignment) {
                this.editingAssignment.gymmer = this.form.gymmer;
                this.editingAssignment.trainer = this.form.trainer;
                this.editingAssignment.tong_buoi = this.form.tong_buoi;
            } else {
                const gymmer = this.list_gymmer.find(
                    item => item.ho_ten === this.form.gymmer
                );

                const trainer = this.list_trainer.find(
                    item => item.ho_ten === this.form.trainer
                );

                this.list_phan_cong.unshift({
                    id: Date.now(),
                    gymmer_id: gymmer?.id || '',
                    gymmer: this.form.gymmer,
                    trainer_id: trainer?.id || '',
                    trainer: this.form.trainer,
                    ngay_bat_dau: this.form.ngay_bat_dau || '02/09/2026',
                    tong_buoi: this.form.tong_buoi,
                    da_hoc: 0,
                    trang_thai: 'active'
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

.assignment-table {
    width: 100%;
    border-collapse: collapse;
}

.assignment-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9.5px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.assignment-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #34585d;
    font-size: 11.5px;
}

.assignment-table tbody tr {
    transition: 0.15s ease;
}

.assignment-table tbody tr:hover {
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
    font-size: 10.5px;
    font-weight: 800;
}

.user-avatar.gymmer {
    background: #dff6f8;
    color: #075e68;
}

.user-avatar.trainer {
    background: #eef3ff;
    color: #5663a8;
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

.progress-wrap {
    min-width: 105px;
}

.progress-bar {
    width: 100%;
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: #e6f1f3;
}

.progress-value {
    height: 100%;
    border-radius: 999px;
    background: #0d7f8d;
}

.progress-wrap span {
    display: block;
    margin-top: 4px;
    color: #71949a;
    font-size: 9px;
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

.status.ended {
    background: #f1f5f9;
    color: #64748b;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.btn-action {
    border: 1px solid #9ed9df;
    padding: 6px 9px;
    border-radius: 8px;
    background: white;
    color: #0d7f8d;
    font-size: 10px;
    font-weight: 700;
}

.btn-action:hover {
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
    width: 650px;
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

.assignment-flow {
    display: grid;
    grid-template-columns: 1fr 40px 1fr;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
}

.flow-card {
    padding: 14px;
    border: 1px solid #d8eef1;
    border-radius: 14px;
    background: #fbfeff;
}

.flow-label {
    margin-bottom: 7px;
    color: #71949a;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1px;
}

.flow-card select {
    width: 100%;
    height: 40px;
    padding: 0 10px;
    border: 1px solid #cfe8eb;
    border-radius: 9px;
    outline: none;
    color: #11343a;
    background: white;
    font-size: 11px;
}

.flow-arrow {
    color: #0d7f8d;
    font-size: 22px;
    font-weight: 800;
    text-align: center;
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

@media (max-width: 1000px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .assignment-flow {
        grid-template-columns: 1fr;
    }

    .flow-arrow {
        transform: rotate(90deg);
    }
}
</style>