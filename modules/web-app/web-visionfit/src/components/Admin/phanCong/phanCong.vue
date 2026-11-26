<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Phân công Huấn luyện viên</h2>
                <p>Quản lý việc phân công Trainer phụ trách Gymmer</p>
            </div>
            <button class="btn-add" @click="openAssignModal">+ Phân công mới</button>
        </div>

        <!-- 4 THẺ CHỈ SỐ -->
        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng phân công</span>
                <strong>{{ stats.tong_phan_cong }}</strong>
            </div>
            <div class="mini-card">
                <span>Đang phụ trách</span>
                <strong>{{ stats.dang_phu_trach }}</strong>
            </div>
            <div class="mini-card">
                <span>Gymmer chưa có Trainer</span>
                <strong>{{ stats.chua_co_trainer }}</strong>
            </div>
            <div class="mini-card">
                <span>Trainer đang hoạt động</span>
                <strong>{{ stats.trainer_hoat_dong }}</strong>
            </div>
        </div>

        <div class="content-card">
            <!-- BỘ LỌC TÌM KIẾM -->
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>
                    <input v-model="search" type="text" placeholder="Tìm Gymmer hoặc Trainer..." @input="debouncedSearch">
                </div>
                <select v-model="statusFilter" @change="layDanhSachPhanCong">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang phụ trách</option>
                    <option value="ended">Đã kết thúc</option>
                </select>
            </div>

            <!-- BẢNG PHÂN CÔNG -->
            <div class="table-responsive">
                <table class="assignment-table">
                    <thead>
                        <tr>
                            <th>Gymmer</th>
                            <th>Trainer phụ trách</th>
                            <th>Gói tập</th>
                            <th>Ngày bắt đầu</th>
                            <th>Số buổi</th>
                            <th>Tiến độ</th>
                            <th>Trạng thái</th>
                            <th class="text-end">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in filteredAssignments" :key="item.id">
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar gymmer">{{ getInitial(item.gymmer) }}</div>
                                    <div>
                                        <strong>{{ item.gymmer }}</strong>
                                        <span>#GM{{ item.gymmer_id }} • {{ item.email }}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar trainer">{{ getInitial(item.trainer) }}</div>
                                    <div>
                                        <strong>{{ item.trainer }}</strong>
                                        <span v-if="item.trainer_id">#TR{{ item.trainer_id }}</span>
                                        <span v-else class="text-danger">Chưa phân công</span>
                                    </div>
                                </div>
                            </td>
                            <td><span class="badge-package">{{ item.ten_goi_tap }}</span></td>
                            <td>{{ item.ngay_bat_dau || '—' }}</td>
                            <td><strong>{{ item.da_hoc }}</strong> / {{ item.tong_buoi }} buổi</td>
                            <td>
                                <div class="progress-wrap">
                                    <div class="progress-bar">
                                        <div class="progress-value" :style="{ width: getProgress(item) + '%' }"></div>
                                    </div>
                                    <span>{{ getProgress(item) }}%</span>
                                </div>
                            </td>
                            <td>
                                <span class="status" :class="item.trang_thai">
                                    <span class="status-dot"></span>
                                    {{ item.trang_thai === 'active' ? 'Đang phụ trách' : 'Đã kết thúc' }}
                                </span>
                            </td>
                            <td class="text-end action-cell">
                                <button class="btn-action" @click="openEditModal(item)">Thay đổi</button>
                                <button class="btn-action-status" :class="item.trang_thai === 'active' ? 'btn-end' : 'btn-renew'" @click="openStatusConfirm(item)">
                                    {{ item.trang_thai === 'active' ? 'Kết thúc' : 'Kích hoạt' }}
                                </button>
                            </td>
                        </tr>
                        <tr v-if="filteredAssignments.length === 0">
                            <td colspan="8"><div class="empty-state">Không tìm thấy phân công phù hợp</div></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- MODAL PHÂN CÔNG / THAY ĐỔI -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3>{{ editingAssignment ? 'Thay đổi Huấn luyện viên' : 'Phân công Trainer mới' }}</h3>
                        <p>{{ editingAssignment ? 'Cập nhật HLV phụ trách hoặc số buổi tập' : 'Chọn Gymmer và Trainer phụ trách' }}</p>
                    </div>
                    <button class="btn-close" @click="closeModal">×</button>
                </div>

                <div class="assignment-flow">
                    <div class="flow-card">
                        <div class="flow-label">GYMMER (HỘI VIÊN)</div>
                        <div v-if="editingAssignment" class="readonly-user">
                            <strong>{{ editingAssignment.gymmer }}</strong>
                            <span>#GM{{ editingAssignment.gymmer_id }}</span>
                        </div>
                        <select v-else v-model="form.client_id">
                            <option value="">Chọn Gymmer</option>
                            <option v-for="g in list_gymmer" :key="g.id" :value="g.id">{{ g.ho_ten }} ({{ g.email }})</option>
                        </select>
                    </div>

                    <div class="flow-arrow">→</div>

                    <div class="flow-card">
                        <div class="flow-label">TRAINER PHỤ TRÁCH</div>
                        <select v-model="form.trainer_id">
                            <option value="">Chọn Trainer</option>
                            <option v-for="t in list_trainer" :key="t.id" :value="t.id">{{ t.ho_ten }} ({{ t.chuyen_mon || 'PT' }})</option>
                        </select>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label>Ngày bắt đầu</label>
                        <input v-model="form.ngay_bat_dau" type="date">
                    </div>
                    <div class="form-group">
                        <label>Số buổi học PT</label>
                        <select v-model.number="form.tong_buoi">
                            <option :value="4">4 buổi (Gói Tiêu Chuẩn)</option>
                            <option :value="8">8 buổi</option>
                            <option :value="12">12 buổi (Gói Nâng Cao)</option>
                            <option :value="16">16 buổi</option>
                            <option :value="24">24 buổi (Gói VIP)</option>
                        </select>
                    </div>
                    <div class="form-group full">
                        <label>Ghi chú phân công</label>
                        <textarea v-model="form.ghi_chu" rows="2" placeholder="Ghi chú mục tiêu tập luyện, thời gian biểu hoặc yêu cầu đặc biệt..."></textarea>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeModal">Hủy</button>
                    <button class="btn-save" :disabled="isSaving" @click="saveAssignment">
                        {{ isSaving ? 'Đang lưu...' : (editingAssignment ? 'Lưu thay đổi' : 'Xác nhận phân công') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- MODAL XÁC NHẬN ĐỔI TRẠNG THÁI -->
        <div v-if="confirmModal.show" class="modal-overlay" @click.self="confirmModal.show = false">
            <div class="confirm-box">
                <div class="confirm-icon" :class="confirmModal.item?.trang_thai === 'active' ? 'lock' : 'unlock'">
                    {{ confirmModal.item?.trang_thai === 'active' ? '⏸️' : '▶️' }}
                </div>
                <h3>{{ confirmModal.title }}</h3>
                <p>{{ confirmModal.message }}</p>
                <div class="confirm-actions">
                    <button class="btn-modal-cancel" @click="confirmModal.show = false">Hủy</button>
                    <button class="btn-modal-confirm" :class="confirmModal.item?.trang_thai === 'active' ? 'btn-warning-action' : 'btn-success-action'" @click="xacNhanDoiTrangThai">
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import baseRequestAdmin from '@/core/baseRequestAdmin';

export default {
    name: "AdminPhanCong",
    data() {
        return {
            search: '',
            statusFilter: '',
            showModal: false,
            isSaving: false,
            editingAssignment: null,
            searchTimer: null,

            stats: {
                tong_phan_cong: 0,
                dang_phu_trach: 0,
                chua_co_trainer: 0,
                trainer_hoat_dong: 0,
            },

            list_phan_cong: [],
            list_gymmer: [],
            list_trainer: [],

            form: {
                client_id: '',
                trainer_id: '',
                ngay_bat_dau: new Date().toISOString().substring(0, 10),
                tong_buoi: 12,
                ghi_chu: ''
            },

            confirmModal: {
                show: false,
                item: null,
                title: '',
                message: ''
            }
        };
    },
    computed: {
        filteredAssignments() {
            return this.list_phan_cong.filter((item) => {
                const keyword = this.search.toLowerCase();
                const matchSearch = (item.gymmer || '').toLowerCase().includes(keyword) || (item.trainer || '').toLowerCase().includes(keyword) || (item.email || '').toLowerCase().includes(keyword);
                const matchStatus = !this.statusFilter || item.trang_thai === this.statusFilter;
                return matchSearch && matchStatus;
            });
        }
    },
    mounted() {
        this.layDanhSachPhanCong();
    },
    methods: {
        async layDanhSachPhanCong() {
            try {
                const params = {};
                if (this.statusFilter) params.status = this.statusFilter;
                if (this.search) params.search = this.search;

                const res = await baseRequestAdmin.get('admin/phan-cong', { params });
                if (res && res.data && (res.data.status || res.data.success)) {
                    this.list_phan_cong = res.data.data.assignments || [];
                    this.list_trainer = res.data.data.trainers || [];
                    this.list_gymmer = res.data.data.clients || [];
                    this.stats = res.data.data.stats || this.stats;
                }
            } catch (err) {
                console.error("Lỗi lấy danh sách phân công:", err);
            }
        },
        debouncedSearch() {
            clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(() => {
                this.layDanhSachPhanCong();
            }, 300);
        },
        getInitial(name) {
            if (!name) return 'VF';
            const parts = name.trim().split(' ');
            if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        },
        getProgress(item) {
            if (!item.tong_buoi) return 0;
            return Math.min(100, Math.round((item.da_hoc / item.tong_buoi) * 100));
        },
        openAssignModal() {
            this.editingAssignment = null;
            this.form = {
                client_id: '',
                trainer_id: '',
                ngay_bat_dau: new Date().toISOString().substring(0, 10),
                tong_buoi: 12,
                ghi_chu: ''
            };
            this.showModal = true;
        },
        openEditModal(item) {
            this.editingAssignment = item;
            this.form = {
                client_id: item.client_id,
                trainer_id: item.raw_trainer_id || '',
                ngay_bat_dau: item.raw_ngay_bat_dau || new Date().toISOString().substring(0, 10),
                tong_buoi: item.tong_buoi || 12,
                ghi_chu: ''
            };
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.editingAssignment = null;
        },
        async saveAssignment() {
            if (!this.editingAssignment && !this.form.client_id) {
                if (this.$toast) this.$toast.error('Vui lòng chọn Gymmer cần phân công!');
                else alert('Vui lòng chọn Gymmer cần phân công!');
                return;
            }
            if (!this.form.trainer_id) {
                if (this.$toast) this.$toast.error('Vui lòng chọn Trainer phụ trách!');
                else alert('Vui lòng chọn Trainer phụ trách!');
                return;
            }

            this.isSaving = true;
            try {
                if (this.editingAssignment) {
                    const res = await baseRequestAdmin.put(`admin/phan-cong/${this.editingAssignment.id}`, {
                        trainer_id: this.form.trainer_id,
                        ngay_bat_dau: this.form.ngay_bat_dau,
                        tong_buoi: this.form.tong_buoi
                    });
                    if (res && res.data && (res.data.status || res.data.success)) {
                        if (this.$toast) this.$toast.success(res.data.message || 'Thay đổi HLV thành công!');
                        this.closeModal();
                        this.layDanhSachPhanCong();
                    } else {
                        if (this.$toast) this.$toast.error(res.data?.message || 'Có lỗi xảy ra');
                    }
                } else {
                    const res = await baseRequestAdmin.post('admin/phan-cong', this.form);
                    if (res && res.data && (res.data.status || res.data.success)) {
                        if (this.$toast) this.$toast.success(res.data.message || 'Phân công HLV thành công!');
                        this.closeModal();
                        this.layDanhSachPhanCong();
                    } else {
                        if (this.$toast) this.$toast.error(res.data?.message || 'Có lỗi xảy ra');
                    }
                }
            } catch (err) {
                const msg = err.response?.data?.message || 'Lỗi kết nối máy chủ';
                if (this.$toast) this.$toast.error(msg);
                else alert(msg);
            } finally {
                this.isSaving = false;
            }
        },
        openStatusConfirm(item) {
            const isEnding = item.trang_thai === 'active';
            this.confirmModal = {
                show: true,
                item: item,
                title: isEnding ? 'Kết thúc phân công?' : 'Kích hoạt lại phân công?',
                message: isEnding
                    ? `Bạn có chắc muốn kết thúc phân công giữa Gymmer ${item.gymmer} và HLV ${item.trainer}?`
                    : `Bạn có chắc muốn kích hoạt lại phân công cho Gymmer ${item.gymmer}?`
            };
        },
        async xacNhanDoiTrangThai() {
            if (!this.confirmModal.item) return;
            try {
                const res = await baseRequestAdmin.post(`admin/phan-cong/${this.confirmModal.item.id}/trang-thai`);
                if (res && res.data && (res.data.status || res.data.success)) {
                    if (this.$toast) this.$toast.success(res.data.message || 'Cập nhật trạng thái thành công!');
                    this.confirmModal.show = false;
                    this.layDanhSachPhanCong();
                }
            } catch (err) {
                console.error("Lỗi đổi trạng thái:", err);
            }
        }
    }
}
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
.page-header h2 { margin: 0; color: #11343a; font-size: 28px; font-weight: 700; }
.page-header p { margin: 5px 0 0; color: #71949a; font-size: 15px; }

.btn-add {
    border: none; padding: 10px 15px; border-radius: 11px;
    background: #0d7f8d; color: white; font-size: 15px; font-weight: 700;
    transition: 0.18s ease; cursor: pointer;
}
.btn-add:hover { background: #075e68; transform: translateY(-1px); }

.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.mini-card {
    padding: 16px; background: white; border: 1px solid #d8eef1;
    border-radius: 16px; box-shadow: 0 6px 16px rgba(13, 127, 141, 0.05);
    transition: 0.18s ease;
}
.mini-card:hover { transform: translateY(-2px); border-color: #9ed9df; }
.mini-card span { display: block; color: #71949a; font-size: 14px; }
.mini-card strong { display: block; margin-top: 6px; color: #11343a; font-size: 26px; }

.content-card {
    padding: 18px; background: white; border: 1px solid #d8eef1;
    border-radius: 18px; box-shadow: 0 7px 18px rgba(13, 127, 141, 0.06);
}
.filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.search-box {
    flex: 1; display: flex; align-items: center; gap: 8px; padding: 0 12px;
    border: 1px solid #d3e9ec; border-radius: 11px; background: #fbfeff;
}
.search-box span { color: #78a4aa; }
.search-box input {
    width: 100%; height: 40px; border: none; outline: none;
    background: transparent; color: #11343a; font-size: 15px;
}
.filter-bar select {
    min-width: 180px; height: 42px; padding: 0 10px; border: 1px solid #d3e9ec;
    border-radius: 11px; outline: none; background: white; color: #51777d; font-size: 14.5px;
}

.assignment-table { width: 100%; border-collapse: collapse; }
.assignment-table th {
    padding: 11px 10px; border-bottom: 1px solid #d8eef1; color: #84a5aa;
    font-size: 13px; font-weight: 700; text-align: left; text-transform: uppercase;
}
.assignment-table td { padding: 13px 10px; border-bottom: 1px solid #eef6f7; color: #34585d; font-size: 15px; }
.assignment-table tbody tr:hover { background: #f5fcfd; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar {
    width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
    border-radius: 11px; font-size: 14px; font-weight: 800; flex-shrink: 0;
}
.user-avatar.gymmer { background: #dff6f8; color: #075e68; }
.user-avatar.trainer { background: #eef3ff; color: #5663a8; }
.user-cell strong { display: block; color: #11343a; font-size: 14.5px; }
.user-cell span { display: block; margin-top: 2px; color: #94b2b6; font-size: 12.5px; }

.badge-package {
    display: inline-block; padding: 4px 8px; border-radius: 6px;
    background: #f0f7f8; color: #0d7f8d; font-size: 13px; font-weight: 600;
}

.progress-wrap { min-width: 105px; }
.progress-bar { width: 100%; height: 6px; overflow: hidden; border-radius: 999px; background: #e6f1f3; }
.progress-value { height: 100%; border-radius: 999px; background: #0d7f8d; }
.progress-wrap span { display: block; margin-top: 4px; color: #71949a; font-size: 12px; }

.status {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px;
    border-radius: 999px; font-size: 12.5px; font-weight: 700;
}
.status.active { background: #e4f7ef; color: #2c7c60; }
.status.ended { background: #f1f5f9; color: #64748b; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.action-cell { white-space: nowrap; }
.btn-action {
    border: 1px solid #9ed9df; padding: 6px 10px; border-radius: 8px;
    background: white; color: #0d7f8d; font-size: 13.5px; font-weight: 700;
    cursor: pointer; margin-right: 6px; transition: 0.15s ease;
}
.btn-action:hover { background: #dff6f8; }

.btn-action-status {
    border: none; padding: 6px 10px; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.15s ease;
}
.btn-end { background: #fff1f2; color: #e11d48; }
.btn-end:hover { background: #ffe4e6; }
.btn-renew { background: #f0fdf4; color: #16a34a; }
.btn-renew:hover { background: #dcfce7; }

.empty-state { padding: 35px; color: #71949a; text-align: center; }

/* MODAL BOX */
.modal-overlay {
    position: fixed; inset: 0; z-index: 100;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    background: rgba(8, 58, 64, 0.25); backdrop-filter: blur(5px);
}
.modal-box {
    width: 620px; max-width: 100%; padding: 22px; border: 1px solid #9ed9df;
    border-radius: 20px; background: white; box-shadow: 0 20px 50px rgba(13, 127, 141, 0.18);
    animation: showModal 0.2s ease;
}
.modal-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.modal-header h3 { margin: 0; color: #11343a; font-size: 20px; font-weight: 700; }
.modal-header p { margin: 4px 0 0; color: #71949a; font-size: 14px; }
.btn-close {
    width: 32px; height: 32px; border: none; border-radius: 9px;
    background: #edf8f9; color: #51777d; font-size: 20px; cursor: pointer;
}

.assignment-flow {
    display: grid; grid-template-columns: 1fr 40px 1fr; align-items: center;
    gap: 10px; margin-bottom: 16px;
}
.flow-card { padding: 14px; border: 1px solid #d8eef1; border-radius: 14px; background: #fbfeff; }
.flow-label { margin-bottom: 7px; color: #71949a; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; }
.flow-card select {
    width: 100%; height: 40px; padding: 0 10px; border: 1px solid #cfe8eb;
    border-radius: 9px; outline: none; color: #11343a; background: white; font-size: 14px;
}
.readonly-user strong { display: block; color: #11343a; font-size: 15px; }
.readonly-user span { color: #84a5aa; font-size: 13px; }
.flow-arrow { color: #0d7f8d; font-size: 22px; font-weight: 800; text-align: center; }

.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { display: block; margin-bottom: 6px; color: #51777d; font-size: 13.5px; font-weight: 700; }
.form-group input, .form-group select, .form-group textarea {
    width: 100%; padding: 0 11px; border: 1px solid #cfe8eb; border-radius: 10px;
    outline: none; color: #11343a; font-size: 14.5px;
}
.form-group input, .form-group select { height: 40px; }
.form-group textarea { padding-top: 8px; resize: vertical; }

.modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 18px; }
.btn-cancel, .btn-save { padding: 9px 16px; border-radius: 10px; font-size: 14.5px; font-weight: 700; cursor: pointer; }
.btn-cancel { border: 1px solid #9ed9df; background: white; color: #0d7f8d; }
.btn-save { border: 1px solid #0d7f8d; background: #0d7f8d; color: white; }
.btn-save:hover { background: #075e68; }

/* CONFIRM POPUP */
.confirm-box {
    width: 440px; max-width: 100%; padding: 26px 22px; border-radius: 20px;
    background: white; text-align: center; box-shadow: 0 20px 48px rgba(13, 127, 141, 0.22);
    animation: showModal 0.22s ease-out;
}
.confirm-icon {
    width: 58px; height: 58px; margin: 0 auto 14px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 26px;
}
.confirm-icon.lock { background: #ffe4e6; color: #e11d48; }
.confirm-icon.unlock { background: #dcfce7; color: #16a34a; }
.confirm-box h3 { margin: 0 0 8px; color: #11343a; font-size: 19px; font-weight: 700; }
.confirm-box p { margin: 0 0 20px; color: #61878d; font-size: 14.5px; line-height: 1.5; }
.confirm-actions { display: flex; gap: 10px; justify-content: center; }
.btn-modal-cancel, .btn-modal-confirm {
    padding: 10px 22px; border-radius: 10px; font-size: 14.5px; font-weight: 700;
    cursor: pointer; transition: 0.16s ease;
}
.btn-modal-cancel { border: 1px solid #cfe8eb; background: #f7fafb; color: #51777d; }
.btn-warning-action { border: 1px solid #f43f5e; background: #f43f5e; color: white; }
.btn-warning-action:hover { background: #e11d48; }
.btn-success-action { border: 1px solid #16a34a; background: #16a34a; color: white; }
.btn-success-action:hover { background: #15803d; }

@keyframes showModal {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
}
@media (max-width: 800px) {
    .stat-row { grid-template-columns: repeat(2, 1fr); }
    .assignment-flow { grid-template-columns: 1fr; }
    .flow-arrow { transform: rotate(90deg); }
}
</style>