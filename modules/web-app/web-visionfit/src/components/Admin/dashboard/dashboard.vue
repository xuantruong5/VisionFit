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

                <button class="btn-primary">
                    Chọn ngày
                </button>
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
            isLoading: false
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
    font-size: 25px;
    font-weight: 750;
}

.dashboard-header p {
    margin: 5px 0 0;
    color: #71949a;
    font-size: 12px;
}

.actions {
    display: flex;
    gap: 9px;
}

.btn-refresh,
.btn-primary {
    padding: 9px 14px;
    border-radius: 11px;
    font-size: 12px;
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
    font-size: 11px;
    font-weight: 650;
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
    font-size: 10.5px;
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
    font-size: 14px;
    font-weight: 750;
}

.table {
    margin: 0;
}

.table th {
    color: #84a5aa;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
}

.table td {
    padding: 12px 8px;
    border-color: #eef6f7;
    color: #34585d;
    font-size: 11.5px;
}

.badge-success,
.badge-warning,
.badge-ai {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 9.5px;
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
    font-size: 11.5px;
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