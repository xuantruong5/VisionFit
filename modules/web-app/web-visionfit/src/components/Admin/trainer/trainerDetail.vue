<template>
    <div>
        <div class="page-header">
            <div class="header-left">
                <router-link to="/admin/trainer" class="btn-back">‹</router-link>
                <div>
                    <h2>Chi tiết Huấn luyện viên</h2>
                    <p>Hồ sơ, học viên phụ trách và hiệu suất huấn luyện</p>
                </div>
            </div>

            <div class="header-actions">
                <button class="btn-outline" @click="openEditModal">Chỉnh sửa</button>
                <router-link to="/admin/phan-cong" class="btn-primary">Phân công học viên</router-link>
            </div>
        </div>

        <!-- HỒ SƠ -->
        <div class="profile-card">
            <div class="avatar">{{ trainer.initials }}</div>

            <div class="profile-info">
                <div class="name-row">
                    <h3>{{ trainer.name }}</h3>
                    <span
                        class="status-pill"
                        :class="trainer.trang_thai === 'active' ? 'active' : 'inactive'"
                        @click="doiTrangThai"
                        style="cursor: pointer;"
                        title="Nhấn để Khóa / Mở khóa tài khoản"
                    >
                        ● {{ trainer.trang_thai === 'active' ? 'Đang làm việc' : 'Đã nghỉ' }}
                    </span>
                    <span v-if="trainer.bi_khoa" class="status-pill inactive">🔒 Đã khóa tài khoản</span>
                </div>
                <p class="code">{{ trainer.code }} • {{ trainer.role }}</p>
                <p v-if="trainer.mo_ta" class="muted">{{ trainer.mo_ta }}</p>

                <div class="chip-row">
                    <span v-for="item in trainer.specialties" :key="item" class="tag">{{ item }}</span>
                </div>

                <div class="info-grid">
                    <div v-for="item in trainer.contact" :key="item.label" class="info-item">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>

                <!-- CHỨNG CHỈ DO TRAINER TỰ NHẬP, ADMIN XÁC MINH -->
                <div class="cert-list">
                    <span class="cert-title">Chứng chỉ (trainer tự cập nhật)</span>
                    <div v-for="cert in trainer.certificates" :key="cert.name" class="cert-item">
                        <div>
                            <strong>{{ cert.name }}</strong>
                            <small class="muted"> {{ cert.issuer }}</small>
                        </div>
                        <span class="status-pill" :class="cert.verified ? 'active' : 'inactive'">{{ cert.verified ? '✓ Đã xác minh' : 'Chưa xác minh' }}</span>
                        <button class="btn-outline small" @click="cert.verified = !cert.verified">{{ cert.verified ? 'Bỏ xác minh' : 'Xác minh' }}</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- THỐNG KÊ -->
        <div class="stat-row">
            <div v-for="item in stats" :key="item.label" class="mini-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.note }}</small>
            </div>
        </div>

        <div class="two-col">
            <!-- LỊCH DẠY TUẦN -->
            <div class="content-card">
                <h4>Lịch dạy tuần này</h4>
                <div v-for="item in schedule" :key="item.day" class="schedule-row">
                    <div class="day-box">
                        <strong>{{ item.date }}</strong>
                        <span>{{ item.day }}</span>
                    </div>
                    <div class="flex">
                        <strong>{{ item.sessions }} ca dạy</strong>
                        <p class="muted">{{ item.detail }}</p>
                    </div>
                </div>
            </div>

            <!-- ĐÁNH GIÁ -->
            <div class="content-card">
                <h4>Đánh giá từ học viên</h4>
                <div class="rating-box">
                    <strong>4.9</strong>
                    <div>
                        <div class="stars">★★★★★</div>
                        <p class="muted">128 lượt đánh giá</p>
                    </div>
                </div>
                <div v-for="item in reviews" :key="item.name" class="review-item">
                    <div class="review-head">
                        <strong>{{ item.name }}</strong>
                        <span class="stars small">{{ item.stars }}</span>
                    </div>
                    <p>{{ item.text }}</p>
                </div>
            </div>
        </div>

        <!-- HỌC VIÊN -->
        <div class="content-card">
            <h4>Học viên đang phụ trách</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Học viên</th>
                        <th>Gói tập</th>
                        <th>Tiến độ</th>
                        <th>Phiên AI</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in members" :key="item.code">
                        <td><strong>{{ item.name }}</strong><br><small class="muted">{{ item.code }}</small></td>
                        <td><span class="tag">{{ item.package }}</span></td>
                        <td>
                            <div class="mini-track"><div class="progress-fill" :style="{ width: item.progress + '%' }"></div></div>
                            <small class="muted">{{ item.progress }}%</small>
                        </td>
                        <td>{{ item.sessions }}</td>
                        <td><span class="status-pill" :class="item.active ? 'active' : 'inactive'">{{ item.active ? 'Đang tập' : 'Tạm nghỉ' }}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- MODAL CHỈNH SỬA (ADMIN CHỈ SỬA PHẦN QUẢN TRỊ) -->
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3>Chỉnh sửa thông tin quản trị</h3>
                        <p>{{ trainer.code }} • {{ trainer.name }}. Giới thiệu, chuyên môn, chứng chỉ do trainer tự cập nhật trên app.</p>
                    </div>
                    <button class="btn-close" @click="showEditModal = false">×</button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Họ và tên</label>
                        <input type="text" v-model="editForm.ho_ten" />
                    </div>

                    <div class="form-group">
                        <label>Số điện thoại</label>
                        <input type="text" v-model="editForm.so_dien_thoai" />
                    </div>

                    <div class="form-group">
                        <label>Chuyên môn</label>
                        <input type="text" v-model="editForm.chuyen_mon" />
                    </div>

                    <div class="form-group">
                        <label>Số năm kinh nghiệm</label>
                        <input type="number" min="0" v-model.number="editForm.so_nam_kinh_nghiem" />
                    </div>

                    <div class="form-group">
                        <label>Cơ sở làm việc</label>
                        <input type="text" v-model="editForm.coSo" />
                    </div>

                    <div class="form-group full">
                        <label>Giới thiệu ngắn</label>
                        <textarea v-model="editForm.mo_ta" rows="3" placeholder="Nhập tóm tắt kinh nghiệm..."></textarea>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="showEditModal = false">Hủy</button>
                    <button class="btn-save" :disabled="saving" @click="saveEdit">
                        {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
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
                    Bạn có chắc chắn muốn {{ confirmModal.isLock ? 'khóa' : 'mở khóa' }} tài khoản của HLV
                    <strong>{{ trainer.name }}</strong>?
                    <span v-if="confirmModal.isLock"><br>HLV sẽ tạm thời không thể đăng nhập hệ thống.</span>
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
    data() {
        return {
            loading: false,
            saving: false,
            rawTrainer: {},
            showEditModal: false,
            confirmModal: {
                show: false,
                loading: false,
                isLock: false,
            },
            editForm: {},
            trainer: {
                initials: 'HLV',
                name: 'Đang tải...',
                code: '',
                role: 'Huấn luyện viên',
                mo_ta: '',
                certificates: [],
                specialties: [],
                trang_thai: 'active',
                bi_khoa: false,
                contact: [
                    { label: 'Email', value: '—' },
                    { label: 'Số điện thoại', value: '—' },
                    { label: 'Cơ sở', value: 'VisionFit Quận 1' },
                    { label: 'Mã giới thiệu', value: '—' },
                ],
            },
            stats: [
                { label: 'Học viên phụ trách', value: '0', note: 'Đang tập' },
                { label: 'Buổi dạy tháng này', value: '0', note: 'Tổng ca dạy' },
                { label: 'Review AI đã duyệt', value: '0', note: 'Đánh giá' },
                { label: 'Thu nhập tháng', value: '0đ', note: 'Bảng lương' },
            ],
            schedule: [
                { date: '02', day: 'T2', sessions: 4, detail: '07:00 • 09:00 • 14:30 • 18:00' },
                { date: '03', day: 'T3', sessions: 3, detail: '06:30 • 10:00 • 17:30' },
                { date: '04', day: 'T4', sessions: 5, detail: '07:00 • 09:00 • 14:00 • 16:00 • 19:00' },
                { date: '05', day: 'T5', sessions: 2, detail: '08:00 • 18:30' },
            ],
            reviews: [
                { name: 'Nguyễn Minh Anh', stars: '★★★★★', text: 'HLV chỉnh form rất kỹ, kết hợp báo cáo AI dễ hiểu.' },
                { name: 'Võ Thanh Tùng', stars: '★★★★☆', text: 'Lịch tập hợp lý, mong có thêm buổi cuối tuần.' },
            ],
            members: [],
        };
    },

    methods: {
        async layChiTietTrainer() {
            const id = this.$route.params.id;
            if (!id) return;
            try {
                this.loading = true;
                const response = await baseRequestAdmin.get(`admin/trainers/${id}`);
                if (response.data.status && response.data.data) {
                    const tr = response.data.data.trainer;
                    this.rawTrainer = tr;
                    const members = response.data.data.members || [];

                    const initials = (tr.ho_ten || '')
                        .trim()
                        .split(' ')
                        .slice(-2)
                        .map(w => w.charAt(0))
                        .join('')
                        .toUpperCase() || 'HLV';

                    const isActive = (tr.tinh_trang == 1 && tr.is_block != 1);

                    this.trainer = {
                        initials: initials,
                        name: tr.ho_ten,
                        code: `#TR${String(tr.id).padStart(4, '0')}`,
                        role: `${tr.chuyen_mon || 'Personal Trainer'} • ${tr.so_nam_kinh_nghiem || 1} năm kinh nghiệm`,
                        mo_ta: tr.mo_ta || 'Huấn luyện viên thể hình chuyên nghiệp tại VisionFit.',
                        certificates: [
                            { name: 'Chứng chỉ HLV Chuyên nghiệp', issuer: 'VisionFit Certified', verified: true },
                        ],
                        specialties: (tr.chuyen_mon ? tr.chuyen_mon.split(',').map(s => s.trim()) : ['Fitness']),
                        trang_thai: isActive ? 'active' : 'inactive',
                        bi_khoa: tr.is_block == 1,
                        contact: [
                            { label: 'Email', value: tr.email },
                            { label: 'Số điện thoại', value: tr.so_dien_thoai || 'Chưa cập nhật' },
                            { label: 'Cơ sở', value: 'VisionFit Quận 1' },
                            { label: 'Mã giới thiệu', value: tr.ma_gioi_thieu || '—' },
                        ],
                    };

                    this.members = members;

                    this.stats[0] = {
                        label: 'Học viên phụ trách',
                        value: String(members.length),
                        note: `${members.filter(m => m.active).length} đang tập`,
                    };
                }
            } catch (error) {
                console.error('Lỗi tải chi tiết Trainer:', error);
            } finally {
                this.loading = false;
            }
        },

        openEditModal() {
            this.editForm = {
                ho_ten: this.rawTrainer.ho_ten || this.trainer.name,
                so_dien_thoai: this.rawTrainer.so_dien_thoai || '',
                chuyen_mon: this.rawTrainer.chuyen_mon || 'Fitness',
                so_nam_kinh_nghiem: this.rawTrainer.so_nam_kinh_nghiem || 1,
                mo_ta: this.rawTrainer.mo_ta || '',
                coSo: 'VisionFit Quận 1',
            };
            this.showEditModal = true;
        },

        async saveEdit() {
            if (!this.editForm.ho_ten?.trim()) {
                alert('Vui lòng nhập họ và tên Trainer!');
                return;
            }
            try {
                this.saving = true;
                const id = this.$route.params.id;
                const payload = {
                    ho_ten: this.editForm.ho_ten.trim(),
                    email: this.rawTrainer.email,
                    so_dien_thoai: this.editForm.so_dien_thoai,
                    chuyen_mon: this.editForm.chuyen_mon,
                    so_nam_kinh_nghiem: this.editForm.so_nam_kinh_nghiem,
                    mo_ta: this.editForm.mo_ta,
                };
                const res = await baseRequestAdmin.put(`admin/trainers/${id}`, payload);
                if (res.data.status || res.data.success) {
                    alert('Cập nhật thông tin Huấn luyện viên thành công!');
                    this.showEditModal = false;
                    this.layChiTietTrainer();
                }
            } catch (error) {
                alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
            } finally {
                this.saving = false;
            }
        },

        doiTrangThai() {
            this.confirmModal = {
                show: true,
                loading: false,
                isLock: this.trainer.trang_thai === 'active',
            };
        },

        async thucHienDoiTrangThai() {
            try {
                this.confirmModal.loading = true;
                const id = this.$route.params.id;
                const response = await baseRequestAdmin.post(`admin/trainers/${id}/trang-thai`);
                if (response.data.status || response.data.success) {
                    this.trainer.trang_thai = response.data.trang_thai;
                    this.trainer.bi_khoa = (response.data.trang_thai === 'inactive');
                    this.confirmModal.show = false;
                }
            } catch (error) {
                alert(error.response?.data?.message || 'Không thể cập nhật trạng thái!');
            } finally {
                this.confirmModal.loading = false;
            }
        },
    },

    mounted() {
        this.layChiTietTrainer();
    },
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

.header-left {
    display: flex;
    align-items: center;
    gap: 14px;
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

.btn-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border: 1px solid #d3e9ec;
    border-radius: 12px;
    background: white;
    color: #0d7f8d;
    font-size: 26px;
    font-weight: 700;
    text-decoration: none;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.btn-primary,
.btn-outline {
    padding: 10px 16px;
    border-radius: 11px;
    font-size: 15px;
    font-weight: 700;
}

.btn-primary {
    border: none;
    background: #0d7f8d;
    color: white;
}

.btn-outline {
    border: 1px solid #b9e5e9;
    background: white;
    color: #0d7f8d;
}

.btn-outline.small {
    padding: 7px 12px;
    font-size: 14px;
}

.profile-card,
.content-card,
.mini-card {
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.06);
}

.profile-card {
    display: flex;
    gap: 20px;
    padding: 22px;
    margin-bottom: 16px;
}

.avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 76px;
    border-radius: 22px;
    background: #e6f5f6;
    color: #0d7f8d;
    font-size: 26px;
    font-weight: 800;
}

.avatar.small {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    font-size: 16px;
}

.profile-info {
    flex: 1;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.name-row h3 {
    margin: 0;
    color: #11343a;
    font-size: 24px;
    font-weight: 700;
}

.code {
    margin: 4px 0 16px;
    color: #71949a;
    font-size: 14.5px;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.info-item span,
.body-item span {
    display: block;
    color: #71949a;
    font-size: 13.5px;
}

.info-item strong,
.body-item strong {
    display: block;
    margin-top: 3px;
    color: #11343a;
    font-size: 15.5px;
    font-weight: 700;
}

.stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 16px;
}

.mini-card {
    padding: 16px;
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
    font-weight: 700;
}

.mini-card small {
    color: #0d7f8d;
    font-size: 13px;
    font-weight: 600;
}

.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
}

.content-card {
    padding: 20px;
    margin-bottom: 16px;
}

.two-col .content-card {
    margin-bottom: 0;
}

.content-card h4 {
    margin: 0 0 14px;
    color: #11343a;
    font-size: 18px;
    font-weight: 700;
}

.content-card h4.mt {
    margin-top: 22px;
}

.package-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-radius: 14px;
    background: #eaf9fb;
}

.package-type {
    color: #0d7f8d;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1px;
}

.package-box h5 {
    margin: 4px 0;
    color: #11343a;
    font-size: 18px;
    font-weight: 700;
}

.package-box p {
    margin: 0;
    color: #51777d;
    font-size: 14px;
}

.package-days {
    text-align: right;
}

.package-days strong {
    display: block;
    color: #0d7f8d;
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
}

.package-days span {
    color: #71949a;
    font-size: 13px;
}

.progress-track {
    height: 8px;
    margin-top: 14px;
    overflow: hidden;
    border-radius: 99px;
    background: #e6f2f3;
}

.progress-fill {
    height: 100%;
    border-radius: 99px;
    background: #0d7f8d;
}

.muted {
    margin: 6px 0 0;
    color: #71949a;
    font-size: 14px;
}

.trainer-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.trainer-row strong {
    color: #11343a;
    font-size: 15.5px;
}

.trainer-row .muted {
    margin: 2px 0 0;
}

.flex {
    flex: 1;
}

.body-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.body-item {
    padding: 14px;
    border-radius: 14px;
    background: #f6fbfc;
}

.goal-box {
    padding: 16px;
    border-radius: 14px;
    background: #ecfdf5;
}

.goal-box strong {
    color: #047857;
    font-size: 17px;
}

.goal-box p {
    margin: 4px 0 0;
    color: #2e5057;
    font-size: 14.5px;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    padding: 10px;
    border-bottom: 1px solid #e3eff1;
    color: #71949a;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    text-transform: uppercase;
}

.data-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef5f6;
    color: #24484e;
    font-size: 15px;
}

/* MODAL CHỈNH SỬA */
.modal-overlay { position: fixed; inset: 0; background: rgba(17, 52, 58, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(3px); }
.modal-box { width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; background: white; border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #11343a; font-size: 20px; font-weight: 800; }
.modal-header p { margin: 4px 0 0; color: #71949a; font-size: 13.5px; }
.btn-close { border: none; background: none; font-size: 22px; color: #8faeb4; cursor: pointer; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.form-group.full { grid-column: span 2; }
.form-group label { display: block; margin-bottom: 5px; color: #51777d; font-size: 13px; font-weight: 700; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0 11px; border: 1px solid #cfe8eb; border-radius: 10px; outline: none; color: #11343a; font-size: 14px; box-sizing: border-box; }
.form-group input, .form-group select { height: 40px; }
.form-group select { width: 100%; padding: 0 11px; border: 1px solid #cfe8eb; border-radius: 10px; color: #11343a; font-size: 14px; background: white; }
.check-line { display: flex !important; align-items: center; gap: 8px; }
.check-line input { width: auto; height: auto; }
.cert-list { margin-top: 14px; padding-top: 12px; border-top: 1px solid #eef5f6; }
.cert-title { display: block; margin-bottom: 8px; color: #51777d; font-size: 13px; font-weight: 700; }
.cert-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.cert-item > div { flex: 1; }
.form-group textarea { padding-top: 8px; resize: vertical; }
.form-group input:focus, .form-group textarea:focus { border-color: #0d7f8d; box-shadow: 0 0 0 3px rgba(13, 127, 141, 0.08); }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-cancel { padding: 9px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; border: 1px solid #9ed9df; background: white; color: #0d7f8d; cursor: pointer; }
.btn-save { padding: 9px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; border: 1px solid #0d7f8d; background: #0d7f8d; color: white; cursor: pointer; }

.tag {
    padding: 4px 10px;
    border-radius: 99px;
    background: #e6f5f6;
    color: #0d7f8d;
    font-size: 13.5px;
    font-weight: 700;
}

.status-pill {
    padding: 5px 11px;
    border-radius: 99px;
    font-size: 13.5px;
    font-weight: 700;
}

.status-pill.active {
    background: #e8f8f0;
    color: #0f8a5f;
}

.status-pill.pending {
    background: #e6f5f6;
    color: #0d7f8d;
}

.btn-primary {
    text-decoration: none;
}

.chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: -6px 0 16px;
}

.schedule-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid #eef5f6;
}

.schedule-row strong {
    color: #11343a;
    font-size: 15.5px;
}

.schedule-row .muted {
    margin: 2px 0 0;
}

.day-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: #eaf9fb;
}

.day-box strong {
    color: #0d7f8d;
    font-size: 18px;
    line-height: 1;
}

.day-box span {
    margin-top: 2px;
    color: #71949a;
    font-size: 12px;
    font-weight: 700;
}

.rating-box {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 14px;
    background: #fff7ed;
}

.rating-box > strong {
    color: #11343a;
    font-size: 38px;
    font-weight: 800;
    line-height: 1;
}

.stars {
    color: #e6a94a;
    font-size: 18px;
    letter-spacing: 2px;
}

.stars.small {
    font-size: 14px;
}

.review-item {
    padding: 12px 0;
    border-bottom: 1px solid #eef5f6;
}

.review-head {
    display: flex;
    justify-content: space-between;
}

.review-head strong {
    color: #11343a;
    font-size: 15px;
}

.review-item p {
    margin: 4px 0 0;
    color: #2e5057;
    font-size: 14.5px;
}

.mini-track {
    width: 120px;
    height: 6px;
    overflow: hidden;
    border-radius: 99px;
    background: #e6f2f3;
}

.status-pill.inactive {
    background: #fff7ed;
    color: #b7791f;
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
</style>
