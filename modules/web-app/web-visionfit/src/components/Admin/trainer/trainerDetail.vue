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
                <button class="btn-outline">Chỉnh sửa</button>
                <router-link to="/admin/phan-cong" class="btn-primary">Phân công học viên</router-link>
            </div>
        </div>

        <!-- HỒ SƠ -->
        <div class="profile-card">
            <div class="avatar">{{ trainer.initials }}</div>

            <div class="profile-info">
                <div class="name-row">
                    <h3>{{ trainer.name }}</h3>
                    <span class="status-pill active">● Đang làm việc</span>
                </div>
                <p class="code">{{ trainer.code }} • {{ trainer.role }}</p>

                <div class="chip-row">
                    <span v-for="item in trainer.specialties" :key="item" class="tag">{{ item }}</span>
                </div>

                <div class="info-grid">
                    <div v-for="item in trainer.contact" :key="item.label" class="info-item">
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
    </div>
</template>

<script>
// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
export default {
    data() {
        return {
            trainer: {
                initials: 'TH',
                name: 'Trần Quốc Huy',
                code: '#HLV0012',
                role: 'Personal Trainer • 5 năm kinh nghiệm',
                specialties: ['Strength Training', 'Cardio', 'Giảm mỡ'],
                contact: [
                    { label: 'Email', value: 'huy.tran@visionfit.vn' },
                    { label: 'Số điện thoại', value: '0908 123 456' },
                    { label: 'Chứng chỉ', value: 'NASM-CPT, CPR' },
                    { label: 'Cơ sở', value: 'VisionFit Quận 1' },
                ],
            },
            stats: [
                { label: 'Học viên phụ trách', value: '18', note: '15 đang tập' },
                { label: 'Buổi dạy tháng này', value: '64', note: '↑ 12% so với tháng trước' },
                { label: 'Review AI đã duyệt', value: '142', note: '6 đang chờ duyệt' },
                { label: 'Thu nhập tháng', value: '28.5tr', note: 'Đã thanh toán 24tr' },
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
            members: [
                { name: 'Nguyễn Minh Anh', code: '#GM00128', package: 'Personal 12 buổi', progress: 75, sessions: 16, active: true },
                { name: 'Võ Thanh Tùng', code: '#GM00122', package: 'Gym + AI 1 tháng', progress: 40, sessions: 8, active: true },
                { name: 'Đỗ Minh Khoa', code: '#GM00110', package: 'Gym + AI 3 tháng', progress: 20, sessions: 5, active: false },
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
</style>
