<template>
    <div>
        <div class="dashboard-header">
            <div>
                <h2>Bảng điều khiển</h2>
                <p>Tổng quan hoạt động của VisionFit Gym</p>
            </div>

            <div class="actions">
                <button
                    class="btn-refresh"
                    :class="{ loading: isLoading }"
                    @click="refreshData"
                >
                    <span>↻</span>
                    Làm mới
                </button>

                <div class="date-picker">
                    <button class="btn-primary" @click="showRange = !showRange">
                        📅 {{ selectedRange }}
                    </button>

                    <!-- Bảng chọn khoảng ngày (chỉ giao diện, lọc dữ liệu sẽ nối API sau) -->
                    <div v-if="showRange" class="range-menu">
                        <button
                            v-for="item in ranges"
                            :key="item"
                            class="range-item"
                            :class="{ active: item === selectedRange }"
                            @click="selectedRange = item; showRange = false"
                        >
                            {{ item }}
                        </button>

                        <div class="range-custom">
                            <span>Tùy chọn</span>
                            <div class="range-inputs">
                                <input type="date">
                                <span>→</span>
                                <input type="date">
                            </div>
                            <button class="btn-apply" @click="selectedRange = 'Tùy chọn'; showRange = false">
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-xl-3 col-md-6">
                <div class="stat-card">
                    <div class="stat-icon">◉</div>

                    <div class="stat-label">Gymmer</div>
                    <div class="stat-number">128</div>

                    <div class="stat-footer">
                        ↑ 9 người mới tháng này
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card">
                    <div class="stat-icon">◆</div>

                    <div class="stat-label">Huấn luyện viên</div>
                    <div class="stat-number">12</div>

                    <div class="stat-footer">
                        10 đang hoạt động
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card">
                    <div class="stat-icon">▶</div>

                    <div class="stat-label">Video tháng này</div>
                    <div class="stat-number">1.284</div>

                    <div class="stat-footer">
                        96.2% xử lý thành công
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card">
                    <div class="stat-icon ai">✦</div>

                    <div class="stat-label">Phiên AI hôm nay</div>
                    <div class="stat-number">46</div>

                    <div class="stat-footer">
                        7 phiên đang xử lý
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mt-1">
            <div class="col-lg-8">
                <div class="content-card">
                    <div class="card-title">
                        Phiên phân tích gần đây
                    </div>

                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr>
                                    <th>Gymmer</th>
                                    <th>Bài tập</th>
                                    <th>AI</th>
                                    <th>Trainer</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    <td>Nguyễn Minh Anh</td>
                                    <td>Squat</td>
                                    <td>2 rep cần chú ý</td>
                                    <td>Trần Quốc Huy</td>

                                    <td>
                                        <span class="badge-success">
                                            Đã review
                                        </span>
                                    </td>
                                </tr>

                                <tr>
                                    <td>Võ Thanh Tùng</td>
                                    <td>Push-up</td>
                                    <td>1 rep cần chú ý</td>
                                    <td>Trần Quốc Huy</td>

                                    <td>
                                        <span class="badge-warning">
                                            Chờ review
                                        </span>
                                    </td>
                                </tr>

                                <tr>
                                    <td>Phạm Gia Hân</td>
                                    <td>Deadlift</td>
                                    <td>Đang phân tích</td>
                                    <td>Lê Hoàng Nam</td>

                                    <td>
                                        <span class="badge-ai">
                                            AI xử lý
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="content-card">
                    <div class="card-title">
                        Chỉ số hệ thống
                    </div>

                    <div class="metric">
                        <span>Video hợp lệ</span>
                        <b>94%</b>
                    </div>

                    <div class="metric">
                        <span>AI hoàn tất</span>
                        <b>96%</b>
                    </div>

                    <div class="metric">
                        <span>Trainer Review</span>
                        <b>88%</b>
                    </div>

                    <div class="metric">
                        <span>Insufficient Data</span>
                        <b>8%</b>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminDashboard",

    data() {
        return {
            isLoading: false,
            showRange: false,
            selectedRange: '7 ngày gần đây',
            ranges: ['Hôm nay', '7 ngày gần đây', '30 ngày gần đây', 'Tháng này']
        }
    },

    methods: {
        refreshData() {
            this.isLoading = true;

            setTimeout(() => {
                this.isLoading = false;
                this.$toast?.success("Đã cập nhật dữ liệu");
            }, 700);
        }
    }
}
</script>

<style scoped>
.dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
}

.dashboard-header h2 {
    margin: 0;
    color: #11343a;
    font-size: 28px;
    font-weight: 700;
}

.dashboard-header p {
    margin: 5px 0 0;
    color: #71949a;
    font-size: 15px;
}

.actions {
    display: flex;
    gap: 9px;
}

.btn-refresh,
.btn-primary {
    padding: 9px 14px;
    border-radius: 11px;
    font-size: 15px;
    font-weight: 700;
    transition: 0.16s ease;
}

.btn-refresh {
    border: 1.5px solid #0d7f8d;
    background: white;
    color: #0d7f8d;
}

.btn-refresh:hover {
    background: #dff6f8;
    transform: translateY(-1px);
}

.btn-refresh span {
    display: inline-block;
}

.btn-refresh.loading span {
    animation: spin 0.7s linear infinite;
}

.btn-primary {
    border: 1.5px solid #0d7f8d;
    background: #0d7f8d;
    color: white;
}

.btn-primary:hover {
    background: #075e68;
    transform: translateY(-1px);
}

.date-picker {
    position: relative;
}

.range-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    width: 300px;
    padding: 10px;
    border: 1px solid #d8eef1;
    border-radius: 16px;
    background: white;
    box-shadow: 0 16px 36px rgba(13, 127, 141, 0.16);
}

.range-item {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #24484e;
    font-size: 15px;
    font-weight: 600;
    text-align: left;
}

.range-item:hover {
    background: #f4fafb;
}

.range-item.active {
    background: #e6f5f6;
    color: #0d7f8d;
    font-weight: 700;
}

.range-custom {
    margin-top: 8px;
    padding: 12px;
    border-top: 1px solid #eef5f6;
}

.range-custom > span {
    color: #71949a;
    font-size: 13px;
    font-weight: 700;
}

.range-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
}

.range-inputs input {
    flex: 1;
    min-width: 0;
    height: 38px;
    padding: 0 8px;
    border: 1px solid #d3e9ec;
    border-radius: 10px;
    color: #11343a;
    font-size: 13.5px;
}

.range-inputs span {
    color: #71949a;
}

.btn-apply {
    width: 100%;
    height: 40px;
    margin-top: 10px;
    border: none;
    border-radius: 10px;
    background: #0d7f8d;
    color: white;
    font-size: 14.5px;
    font-weight: 700;
}

.stat-card {
    height: 100%;
    padding: 18px;
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.06);
    transition: 0.18s ease;
}

.stat-card:hover {
    transform: translateY(-3px);
    border-color: #9ed9df;
    box-shadow: 0 12px 22px rgba(13, 127, 141, 0.10);
}

.stat-icon {
    float: right;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #dff6f8;
    color: #075e68;
    font-weight: 800;
}

.stat-icon.ai {
    color: #0d7f8d;
}

.stat-label {
    color: #71949a;
    font-size: 14.5px;
    font-weight: 600;
}

.stat-number {
    margin-top: 8px;
    color: #11343a;
    font-size: 27px;
    font-weight: 800;
}

.stat-footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid #edf6f7;
    color: #4f7f84;
    font-size: 14px;
}

.content-card {
    height: 100%;
    padding: 19px;
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.06);
}

.card-title {
    margin-bottom: 14px;
    color: #11343a;
    font-size: 16.5px;
    font-weight: 700;
}

.table {
    margin: 0;
}

.table th {
    color: #84a5aa;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
}

.table td {
    padding: 12px 8px;
    border-color: #eef6f7;
    color: #34585d;
    font-size: 15px;
}

.badge-success,
.badge-warning,
.badge-ai {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
}

.badge-success {
    background: #e4f7ef;
    color: #2c7c60;
}

.badge-warning {
    background: #fff4df;
    color: #a76b1d;
}

.badge-ai {
    background: #e3f8fb;
    color: #0b7481;
}

.metric {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #eef6f7;
    color: #71949a;
    font-size: 15px;
}

.metric:last-child {
    border-bottom: none;
}

.metric b {
    color: #11343a;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>