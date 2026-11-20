<template>
    <div>
        <div class="page-header">
            <div class="header-left">
                <router-link to="/admin/gymmer" class="btn-back">‹</router-link>
                <div>
                    <h2>Chi tiết Gymmer</h2>
                    <p>Thông tin, gói tập và lịch sử tập luyện của người tập</p>
                </div>
            </div>

            <div class="header-actions">
                <button class="btn-outline" @click="openEditModal">Chỉnh sửa</button>
                <button class="btn-primary">Gia hạn gói</button>
            </div>
        </div>

        <!-- HỒ SƠ -->
        <div class="profile-card">
            <div class="avatar">{{ gymmer.initials }}</div>

            <div class="profile-info">
                <div class="name-row">
                    <h3>{{ gymmer.name }}</h3>
                    <span
                        class="status-pill"
                        :class="isClientActive ? 'active' : 'inactive'"
                        @click="doiTrangThai"
                        style="cursor: pointer;"
                        title="Nhấn để Khóa / Mở khóa tài khoản"
                    >
                        ● {{ isClientActive ? 'Đang hoạt động' : 'Ngừng hoạt động' }}
                    </span>
                </div>
                <p class="code">{{ gymmer.code }} • Tham gia {{ gymmer.joined }}</p>

                <div class="info-grid">
                    <div v-for="item in gymmer.contact" :key="item.label" class="info-item">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
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
            <!-- GÓI TẬP -->
            <div class="content-card">
                <h4>Gói tập hiện tại</h4>
                <div v-if="subscription && subscription.ten_goi_tap" class="package-box">
                    <div>
                        <span class="package-type">GÓI TẬP</span>
                        <h5>{{ subscription.ten_goi_tap }}</h5>
                        <p>{{ subscription.ngay_bat_dau || '—' }} → {{ subscription.ngay_ket_thuc || '—' }}</p>
                    </div>
                    <div class="package-days" v-if="subscription.ngay_ket_thuc">
                        <strong>{{ tinhSoNgayConLai(subscription.ngay_ket_thuc) }}</strong>
                        <span>ngày còn lại</span>
                    </div>
                </div>
                <div v-else class="package-box" style="background: #f8fafc; border: 1px dashed #cbd5e1; justify-content: center; padding: 18px;">
                    <p class="muted" style="margin: 0;">Chưa đăng ký gói tập nào.</p>
                </div>

                <h4 class="mt">Huấn luyện viên phụ trách</h4>
                <div v-if="subscription && subscription.trainer_name" class="trainer-row">
                    <div class="avatar small">{{ getInitial(subscription.trainer_name) }}</div>
                    <div class="flex">
                        <strong>{{ subscription.trainer_name }}</strong>
                        <p class="muted">Huấn luyện viên cá nhân</p>
                    </div>
                </div>
                <div v-else class="trainer-row" style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 14px;">
                    <p class="muted" style="margin: 0;">Chưa được phân công Huấn luyện viên.</p>
                </div>
            </div>

            <!-- CHỈ SỐ CƠ THỂ -->
            <div class="content-card">
                <h4>Chỉ số cơ thể</h4>
                <div class="body-grid">
                    <div v-for="item in body" :key="item.label" class="body-item">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>

                <h4 class="mt">Mục tiêu</h4>
                <div class="goal-box">
                    <strong>Tăng cơ</strong>
                    <p>68kg → 72kg • Tập 4 buổi/tuần</p>
                </div>
            </div>
        </div>

        <!-- PHIÊN AI -->
        <div class="content-card">
            <h4>Phiên phân tích AI gần đây</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Session</th>
                        <th>Bài tập</th>
                        <th>Reps</th>
                        <th>Độ chính xác</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in sessions" :key="item.id">
                        <td><strong>{{ item.id }}</strong><br><small class="muted">{{ item.time }}</small></td>
                        <td><span class="tag">{{ item.exercise }}</span></td>
                        <td>{{ item.reps }}</td>
                        <td>{{ item.score }}</td>
                        <td><span class="status-pill" :class="item.statusClass">{{ item.status }}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- HÓA ĐƠN -->
        <div class="content-card">
            <h4>Lịch sử thanh toán</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Mã hóa đơn</th>
                        <th>Gói</th>
                        <th>Ngày</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in invoices" :key="item.id">
                        <td><strong>{{ item.id }}</strong></td>
                        <td>{{ item.package }}</td>
                        <td>{{ item.date }}</td>
                        <td><strong>{{ item.amount }}</strong></td>
                        <td><span class="status-pill" :class="item.statusClass">{{ item.status }}</span></td>
                    </tr>
                    <tr v-if="invoices.length === 0">
                        <td colspan="5" style="text-align: center; color: #71949a; padding: 20px;">
                            Chưa có lịch sử thanh toán hóa đơn.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- MODAL CHỈNH SỬA GYMMER -->
        <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3>Chỉnh sửa Gymmer</h3>
                        <p>Cập nhật hồ sơ và chỉ số cơ thể hội viên</p>
                    </div>
                    <button class="btn-close" @click="closeEditModal">×</button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Họ và tên</label>
                        <input v-model="edit_form.ho_ten" type="text" placeholder="Họ và tên">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input v-model="edit_form.email" type="email" placeholder="example@gmail.com">
                    </div>
                    <div class="form-group">
                        <label>Số điện thoại</label>
                        <input v-model="edit_form.so_dien_thoai" type="text" placeholder="0905...">
                    </div>
                    <div class="form-group">
                        <label>Ngày sinh</label>
                        <input v-model="edit_form.ngay_sinh" type="date">
                    </div>
                    <div class="form-group">
                        <label>Giới tính</label>
                        <select v-model="edit_form.gioi_tinh">
                            <option :value="0">Nam</option>
                            <option :value="1">Nữ</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Chiều cao (cm)</label>
                        <input v-model.number="edit_form.chieu_cao_cm" type="number" placeholder="170">
                    </div>
                    <div class="form-group">
                        <label>Cân nặng (kg)</label>
                        <input v-model.number="edit_form.can_nang_kg" type="number" placeholder="65">
                    </div>
                    <div class="form-group full">
                        <label>Mục tiêu tập luyện</label>
                        <input v-model="edit_form.muc_tieu_hien_tai" type="text" placeholder="Ví dụ: Tăng cơ giảm mỡ, Siết cơ...">
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeEditModal">Hủy</button>
                    <button class="btn-save" :disabled="saving" @click="capNhatGymmer">
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
                    Bạn có chắc chắn muốn {{ confirmModal.isLock ? 'khóa' : 'mở khóa' }} tài khoản của
                    <strong>{{ gymmer.name }}</strong>?
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
    data() {
        return {
            loading: false,
            showEditModal: false,
            saving: false,
            confirmModal: {
                show: false,
                loading: false,
                isLock: false,
            },
            rawClient: {},
            edit_form: {
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                ngay_sinh: '',
                gioi_tinh: 0,
                chieu_cao_cm: null,
                can_nang_kg: null,
                muc_tieu_hien_tai: '',
            },
            subscription: null,
            gymmer: {
                initials: 'GM',
                name: 'Đang tải...',
                code: '',
                joined: '',
                contact: [
                    { label: 'Email', value: '—' },
                    { label: 'Số điện thoại', value: '—' },
                    { label: 'Giới tính', value: '—' },
                    { label: 'Cơ sở', value: 'VisionFit Quận 1' },
                ],
            },
            stats: [
                { label: 'Buổi đã tập', value: '0', note: 'Tổng số buổi' },
                { label: 'Phiên AI', value: '0', note: 'Hoàn tất' },
                { label: 'Độ chính xác TB', value: '90%', note: 'Chuẩn form' },
                { label: 'Tổng chi tiêu', value: '0đ', note: 'Gói tập' },
            ],
            body: [
                { label: 'Chiều cao', value: '—' },
                { label: 'Cân nặng', value: '—' },
                { label: 'BMI', value: '—' },
                { label: 'Mỡ cơ thể', value: '—' },
            ],
            sessions: [
                { id: '#AI02045', time: '02/09/2026 09:52', exercise: 'Deadlift', reps: '8', score: '89%', status: 'Hoàn tất', statusClass: 'active' },
            ],
            invoices: [],
        };
    },

    computed: {
        isClientActive() {
            return this.rawClient && this.rawClient.is_block != 1 && this.rawClient.tinh_trang != 0;
        },
    },

    methods: {
        async layChiTietGymmer() {
            const id = this.$route.params.id;
            if (!id) return;
            try {
                this.loading = true;
                const response = await baseRequestAdmin.get(`admin/gymmers/${id}`);
                if (response.data.status && response.data.data) {
                    const client = response.data.data.client;
                    this.rawClient = client;
                    const sub = response.data.data.subscription;
                    const invoices = response.data.data.invoices || [];

                    const initials = (client.ho_ten || '')
                        .trim()
                        .split(' ')
                        .slice(-2)
                        .map(w => w.charAt(0))
                        .join('')
                        .toUpperCase();

                    const joinDate = client.created_at ? new Date(client.created_at).toLocaleDateString('vi-VN') : '—';
                    const genderStr = client.gioi_tinh == 1 ? 'Nữ' : 'Nam';

                    this.gymmer = {
                        initials: initials || 'GM',
                        name: client.ho_ten,
                        code: `#GM${String(client.id).padStart(5, '0')}`,
                        joined: joinDate,
                        contact: [
                            { label: 'Email', value: client.email },
                            { label: 'Số điện thoại', value: client.so_dien_thoai || 'Chưa cập nhật' },
                            { label: 'Giới tính', value: genderStr },
                            { label: 'Cơ sở', value: 'VisionFit Quận 1' },
                        ],
                    };

                    const height = Number(client.chieu_cao_cm || 0);
                    const weight = Number(client.can_nang_kg || 0);
                    const bmi = (height > 0 && weight > 0) ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '—';

                    this.body = [
                        { label: 'Chiều cao', value: height > 0 ? `${height} cm` : '—' },
                        { label: 'Cân nặng', value: weight > 0 ? `${weight} kg` : '—' },
                        { label: 'BMI', value: bmi },
                        { label: 'Mục tiêu', value: client.muc_tieu_hien_tai || 'Tập duy trì' },
                    ];

                    this.subscription = sub;

                    if (invoices.length > 0) {
                        this.invoices = invoices.map(inv => ({
                            id: `#HD${inv.id}`,
                            package: inv.ten_goi_tap || 'Gói tập',
                            date: inv.ngay_dang_ky || '—',
                            amount: Number(inv.tong_tien || 0).toLocaleString('vi-VN') + 'đ',
                            status: inv.is_thanh_toan == 1 ? 'Đã thanh toán' : 'Chờ thanh toán',
                            statusClass: inv.is_thanh_toan == 1 ? 'active' : 'pending',
                        }));
                    }
                }
            } catch (error) {
                console.error('Lỗi tải chi tiết gymmer:', error);
            } finally {
                this.loading = false;
            }
        },

        openEditModal() {
            this.edit_form = {
                ho_ten: this.rawClient.ho_ten || '',
                email: this.rawClient.email || '',
                so_dien_thoai: (this.rawClient.so_dien_thoai && this.rawClient.so_dien_thoai !== 'Chưa cập nhật') ? this.rawClient.so_dien_thoai : '',
                ngay_sinh: this.rawClient.ngay_sinh ? this.rawClient.ngay_sinh.substring(0, 10) : '',
                gioi_tinh: this.rawClient.gioi_tinh ?? 0,
                chieu_cao_cm: this.rawClient.chieu_cao_cm || null,
                can_nang_kg: this.rawClient.can_nang_kg || null,
                muc_tieu_hien_tai: this.rawClient.muc_tieu_hien_tai || '',
            };
            this.showEditModal = true;
        },

        closeEditModal() {
            this.showEditModal = false;
        },

        async capNhatGymmer() {
            if (!this.edit_form.ho_ten.trim()) return alert('Vui lòng nhập họ và tên!');
            if (!this.edit_form.email.trim()) return alert('Vui lòng nhập email!');

            try {
                this.saving = true;
                const id = this.$route.params.id;
                const res = await baseRequestAdmin.put(`admin/gymmers/${id}`, this.edit_form);
                if (res.data.status || res.data.success) {
                    alert('Cập nhật thông tin Gymmer thành công!');
                    this.closeEditModal();
                    this.layChiTietGymmer();
                }
            } catch (err) {
                alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
            } finally {
                this.saving = false;
            }
        },

        doiTrangThai() {
            this.confirmModal = {
                show: true,
                loading: false,
                isLock: this.isClientActive,
            };
        },

        async thucHienDoiTrangThai() {
            try {
                this.confirmModal.loading = true;
                const id = this.$route.params.id;
                const response = await baseRequestAdmin.post(`admin/gymmers/${id}/trang-thai`);
                if (response.data.status || response.data.success) {
                    this.rawClient.is_block = response.data.trang_thai === 'inactive' ? 1 : 0;
                    this.rawClient.tinh_trang = response.data.trang_thai === 'inactive' ? 0 : 1;
                    this.confirmModal.show = false;
                }
            } catch (error) {
                alert(error.response?.data?.message || 'Không thể cập nhật trạng thái!');
            } finally {
                this.confirmModal.loading = false;
            }
        },

        getInitial(name) {
            const words = (name || '').trim().split(' ');
            return words.slice(-2).map(w => w.charAt(0)).join('').toUpperCase() || 'HLV';
        },

        tinhSoNgayConLai(endDateStr) {
            if (!endDateStr) return 0;
            const diff = new Date(endDateStr) - new Date();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            return days > 0 ? days : 0;
        },
    },

    mounted() {
        this.layChiTietGymmer();
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

.status-pill.inactive {
    background: #fee2e2;
    color: #b91c1c;
}

/* MODAL CHỈNH SỬA */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(17, 52, 58, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-box {
    width: 90%;
    max-width: 520px;
    padding: 22px;
    border-radius: 20px;
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
    cursor: pointer;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
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
    height: 40px;
    padding: 0 11px;
    border: 1px solid #cfe8eb;
    border-radius: 10px;
    outline: none;
    color: #11343a;
    font-size: 14.5px;
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
    margin-top: 18px;
}

.btn-cancel,
.btn-save {
    padding: 9px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
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
</style>
