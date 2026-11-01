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
                <button class="btn-outline">Chỉnh sửa</button>
                <button class="btn-primary">Gia hạn gói</button>
            </div>
        </div>

        <!-- HỒ SƠ -->
        <div class="profile-card">
            <div class="avatar">{{ gymmer.initials }}</div>

            <div class="profile-info">
                <div class="name-row">
                    <h3>{{ gymmer.name }}</h3>
                    <span class="status-pill active">● Đang hoạt động</span>
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
                <div class="package-box">
                    <div>
                        <span class="package-type">GYM + AI</span>
                        <h5>Gym + AI 3 tháng</h5>
                        <p>01/09/2026 → 30/11/2026</p>
                    </div>
                    <div class="package-days">
                        <strong>29</strong>
                        <span>ngày còn lại</span>
                    </div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: 68%"></div>
                </div>
                <p class="muted">Đã dùng 61/90 ngày</p>

                <h4 class="mt">Huấn luyện viên phụ trách</h4>
                <div class="trainer-row">
                    <div class="avatar small">LN</div>
                    <div class="flex">
                        <strong>Lê Hoàng Nam</strong>
                        <p class="muted">Strength Training • 4.9 ★</p>
                    </div>
                    <button class="btn-outline small">Đổi HLV</button>
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
                        <td><span class="status-pill active">Đã thanh toán</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
export default {
    data() {
        return {
            gymmer: {
                initials: 'GH',
                name: 'Phạm Gia Hân',
                code: '#GM00127',
                joined: '01/09/2026',
                contact: [
                    { label: 'Email', value: 'hanpham@gmail.com' },
                    { label: 'Số điện thoại', value: '0935 440 120' },
                    { label: 'Giới tính / Tuổi', value: 'Nữ • 24 tuổi' },
                    { label: 'Cơ sở', value: 'VisionFit Quận 1' },
                ],
            },
            stats: [
                { label: 'Buổi đã tập', value: '22', note: 'Tháng này: 9 buổi' },
                { label: 'Phiên AI', value: '22', note: '18 hoàn tất' },
                { label: 'Độ chính xác TB', value: '89%', note: '↑ 4% so với tháng trước' },
                { label: 'Tổng chi tiêu', value: '3.050.000đ', note: '2 hóa đơn' },
            ],
            body: [
                { label: 'Chiều cao', value: '162 cm' },
                { label: 'Cân nặng', value: '68 kg' },
                { label: 'BMI', value: '25.9' },
                { label: 'Mỡ cơ thể', value: '24%' },
            ],
            sessions: [
                { id: '#AI02045', time: '02/09/2026 09:52', exercise: 'Deadlift', reps: '8', score: '89%', status: 'Hoàn tất', statusClass: 'active' },
                { id: '#AI02031', time: '30/08/2026 18:20', exercise: 'Squat', reps: '12', score: '92%', status: 'Hoàn tất', statusClass: 'active' },
                { id: '#AI02017', time: '28/08/2026 07:45', exercise: 'Push-up', reps: '—', score: '—', status: 'Đang xử lý', statusClass: 'pending' },
            ],
            invoices: [
                { id: '#HD10231', package: 'Gym + AI 3 tháng', date: '01/09/2026', amount: '2.200.000đ' },
                { id: '#HD10087', package: 'Gym + AI 1 tháng', date: '01/08/2026', amount: '850.000đ' },
            ],
        };
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
</style>
