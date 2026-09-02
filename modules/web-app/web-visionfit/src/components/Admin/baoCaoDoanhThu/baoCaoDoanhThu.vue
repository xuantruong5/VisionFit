<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Báo cáo doanh thu</h2>
                <p>Theo dõi doanh thu thực nhận từ bán gói tập và thanh toán tại VisionFit</p>
            </div>

            <div class="header-actions">
                <select v-model="period">
                    <option value="7">7 ngày gần đây</option>
                    <option value="30">30 ngày gần đây</option>
                    <option value="90">3 tháng gần đây</option>
                </select>

                <button class="btn-export" @click="exportReport">
                    ↓ Xuất báo cáo
                </button>
            </div>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Doanh thu hôm nay</span>
                <strong>{{ formatShortMoney(todayRevenue) }}</strong>
                <small class="up">↑ 8.4% so với hôm qua</small>
            </div>

            <div class="mini-card">
                <span>Doanh thu tháng này</span>
                <strong>{{ formatShortMoney(monthRevenue) }}</strong>
                <small class="up">↑ 12.7% so với tháng trước</small>
            </div>

            <div class="mini-card">
                <span>Giao dịch thành công</span>
                <strong>{{ successTransactions }}</strong>
                <small>Chỉ tính Payment SUCCESS</small>
            </div>

            <div class="mini-card">
                <span>Giá trị trung bình</span>
                <strong>{{ formatShortMoney(averageOrder) }}</strong>
                <small>Mỗi giao dịch thành công</small>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="chart-card large">
                <div class="card-header">
                    <div>
                        <h3>Doanh thu theo ngày</h3>
                        <p>Tiền thực tế đã nhận từ các giao dịch thành công</p>
                    </div>

                    <span class="chart-badge">
                        {{ period }} ngày
                    </span>
                </div>

                <div class="bar-chart">
                    <div
                        v-for="item in revenueChart"
                        :key="item.day"
                        class="bar-item"
                    >
                        <div class="bar-value">
                            {{ item.value }}M
                        </div>

                        <div class="bar-wrap">
                            <div
                                class="bar"
                                :style="{ height: item.height + '%' }"
                            ></div>
                        </div>

                        <span>{{ item.day }}</span>
                    </div>
                </div>
            </div>

            <div class="chart-card">
                <div class="card-header">
                    <div>
                        <h3>Phương thức thanh toán</h3>
                        <p>Tỷ trọng doanh thu</p>
                    </div>
                </div>

                <div class="donut-wrap">
                    <div class="donut">
                        <div class="donut-center">
                            <strong>87%</strong>
                            <span>Chuyển khoản</span>
                        </div>
                    </div>
                </div>

                <div class="legend-list">
                    <div>
                        <span class="legend-dot bank"></span>
                        <span>Chuyển khoản</span>
                        <strong>87%</strong>
                    </div>

                    <div>
                        <span class="legend-dot cash"></span>
                        <span>Tiền mặt</span>
                        <strong>13%</strong>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-grid second">
            <div class="chart-card">
                <div class="card-header">
                    <div>
                        <h3>Doanh thu theo gói</h3>
                        <p>Các gói tạo doanh thu nhiều nhất</p>
                    </div>
                </div>

                <div class="package-list">
                    <div
                        v-for="item in packageRevenue"
                        :key="item.name"
                        class="package-item"
                    >
                        <div class="package-head">
                            <div>
                                <span class="package-icon">
                                    {{ item.icon }}
                                </span>

                                <div>
                                    <strong>{{ item.name }}</strong>
                                    <small>{{ item.sold }} gói đã bán</small>
                                </div>
                            </div>

                            <span>
                                {{ formatShortMoney(item.revenue) }}
                            </span>
                        </div>

                        <div class="progress">
                            <div
                                class="progress-value"
                                :style="{ width: item.percent + '%' }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="chart-card">
                <div class="card-header">
                    <div>
                        <h3>Trạng thái dòng tiền</h3>
                        <p>Tổng hợp Payment hiện tại</p>
                    </div>
                </div>

                <div class="money-status">
                    <div class="money-row">
                        <div class="money-icon success">✓</div>

                        <div>
                            <span>Đã nhận</span>
                            <strong>86.350.000đ</strong>
                        </div>
                    </div>

                    <div class="money-row">
                        <div class="money-icon pending">…</div>

                        <div>
                            <span>Đang xử lý</span>
                            <strong>4.200.000đ</strong>
                        </div>
                    </div>

                    <div class="money-row">
                        <div class="money-icon refund">↩</div>

                        <div>
                            <span>Đã hoàn tiền</span>
                            <strong>2.350.000đ</strong>
                        </div>
                    </div>

                    <div class="money-row">
                        <div class="money-icon failed">×</div>

                        <div>
                            <span>Thất bại</span>
                            <strong>1.700.000đ</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="content-card">
            <div class="card-header">
                <div>
                    <h3>Giao dịch doanh thu gần đây</h3>
                    <p>Chỉ hiển thị giao dịch đã thanh toán thành công</p>
                </div>

                <div class="table-actions">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm Gymmer hoặc mã giao dịch..."
                    >

                    <select v-model="packageFilter">
                        <option value="">Tất cả loại gói</option>
                        <option value="GYM">GYM</option>
                        <option value="GYM + AI">GYM + AI</option>
                        <option value="PT">PT</option>
                    </select>
                </div>
            </div>

            <div class="table-responsive">
                <table class="revenue-table">
                    <thead>
                        <tr>
                            <th>Giao dịch</th>
                            <th>Gymmer</th>
                            <th>Gói tập</th>
                            <th>Phương thức</th>
                            <th>Thời gian</th>
                            <th>Doanh thu</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="item in filteredTransactions"
                            :key="item.id"
                        >
                            <td>
                                <div class="transaction-code">
                                    <strong>#{{ item.id }}</strong>
                                    <span>#{{ item.invoice_id }}</span>
                                </div>
                            </td>

                            <td>
                                <div class="user-cell">
                                    <div class="avatar">
                                        {{ getInitial(item.gymmer) }}
                                    </div>

                                    <div>
                                        <strong>{{ item.gymmer }}</strong>
                                        <span>#GM{{ item.gymmer_id }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <span class="package-badge">
                                    {{ item.package_type }}
                                </span>

                                <div class="package-name">
                                    {{ item.package_name }}
                                </div>
                            </td>

                            <td>
                                <span
                                    class="method-badge"
                                    :class="item.method"
                                >
                                    {{ item.method === 'bank' ? 'Chuyển khoản' : 'Tiền mặt' }}
                                </span>
                            </td>

                            <td>
                                <div class="date-cell">
                                    <strong>{{ item.date }}</strong>
                                    <span>{{ item.time }}</span>
                                </div>
                            </td>

                            <td>
                                <strong class="amount">
                                    +{{ formatMoney(item.amount) }}đ
                                </strong>
                            </td>
                        </tr>

                        <tr v-if="filteredTransactions.length === 0">
                            <td colspan="6">
                                <div class="empty-state">
                                    Không tìm thấy giao dịch phù hợp
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="bottom-grid">
            <div class="content-card">
                <div class="card-header">
                    <div>
                        <h3>Hiệu quả bán gói</h3>
                        <p>Tỷ lệ theo loại sản phẩm</p>
                    </div>
                </div>

                <div class="performance-list">
                    <div>
                        <span>Gym + AI</span>

                        <div>
                            <strong>52%</strong>
                            <small>doanh thu</small>
                        </div>
                    </div>

                    <div>
                        <span>Personal Trainer</span>

                        <div>
                            <strong>36%</strong>
                            <small>doanh thu</small>
                        </div>
                    </div>

                    <div>
                        <span>Gym cơ bản</span>

                        <div>
                            <strong>12%</strong>
                            <small>doanh thu</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content-card">
                <div class="card-header">
                    <div>
                        <h3>Tóm tắt tháng</h3>
                        <p>Tháng 09/2026</p>
                    </div>
                </div>

                <div class="summary-list">
                    <div>
                        <span>Gói đã bán</span>
                        <strong>78</strong>
                    </div>

                    <div>
                        <span>Khách hàng thanh toán</span>
                        <strong>64</strong>
                    </div>

                    <div>
                        <span>Doanh thu</span>
                        <strong>86.35M</strong>
                    </div>

                    <div>
                        <span>Hoàn tiền</span>
                        <strong>2.35M</strong>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminBaoCaoDoanhThu",

    data() {
        return {
            period: '7',
            search: '',
            packageFilter: '',

            revenueChart: [
                {
                    day: 'T2',
                    value: 8.2,
                    height: 52
                },
                {
                    day: 'T3',
                    value: 10.5,
                    height: 66
                },
                {
                    day: 'T4',
                    value: 9.4,
                    height: 59
                },
                {
                    day: 'T5',
                    value: 12.8,
                    height: 80
                },
                {
                    day: 'T6',
                    value: 11.2,
                    height: 70
                },
                {
                    day: 'T7',
                    value: 16,
                    height: 100
                },
                {
                    day: 'CN',
                    value: 14.3,
                    height: 89
                }
            ],

            packageRevenue: [
                {
                    name: 'Gym + AI',
                    icon: 'AI',
                    sold: 38,
                    revenue: 44900000,
                    percent: 100
                },
                {
                    name: 'Personal Trainer',
                    icon: 'PT',
                    sold: 17,
                    revenue: 31100000,
                    percent: 69
                },
                {
                    name: 'Gym cơ bản',
                    icon: 'G',
                    sold: 23,
                    revenue: 10350000,
                    percent: 23
                }
            ],

            list_transaction: [
                {
                    id: 'PAY260902001',
                    invoice_id: 'INV102845',
                    gymmer_id: '00128',
                    gymmer: 'Nguyễn Minh Anh',
                    package_name: 'Gym + AI 3 tháng',
                    package_type: 'GYM + AI',
                    method: 'bank',
                    amount: 2200000,
                    date: '02/09/2026',
                    time: '10:48',
                    status: 'success'
                },
                {
                    id: 'PAY260901014',
                    invoice_id: 'INV102840',
                    gymmer_id: '00127',
                    gymmer: 'Phạm Gia Hân',
                    package_name: 'Personal Trainer 12 buổi',
                    package_type: 'PT',
                    method: 'bank',
                    amount: 3600000,
                    date: '01/09/2026',
                    time: '18:24',
                    status: 'success'
                },
                {
                    id: 'PAY260901010',
                    invoice_id: 'INV102837',
                    gymmer_id: '00116',
                    gymmer: 'Đỗ Minh Thư',
                    package_name: 'Gym Cơ bản 1 tháng',
                    package_type: 'GYM',
                    method: 'cash',
                    amount: 500000,
                    date: '01/09/2026',
                    time: '15:15',
                    status: 'success'
                },
                {
                    id: 'PAY260831018',
                    invoice_id: 'INV102827',
                    gymmer_id: '00124',
                    gymmer: 'Lê Minh Khang',
                    package_name: 'Gym + AI 1 tháng',
                    package_type: 'GYM + AI',
                    method: 'bank',
                    amount: 850000,
                    date: '31/08/2026',
                    time: '16:40',
                    status: 'success'
                },
                {
                    id: 'PAY260831014',
                    invoice_id: 'INV102823',
                    gymmer_id: '00120',
                    gymmer: 'Nguyễn Gia Linh',
                    package_name: 'Personal Trainer 12 buổi',
                    package_type: 'PT',
                    method: 'bank',
                    amount: 3600000,
                    date: '31/08/2026',
                    time: '14:22',
                    status: 'success'
                }
            ]
        }
    },

    computed: {
        filteredTransactions() {
            return this.list_transaction.filter((item) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    item.gymmer.toLowerCase().includes(keyword) ||
                    item.id.toLowerCase().includes(keyword);

                const matchPackage =
                    !this.packageFilter ||
                    item.package_type === this.packageFilter;

                return (
                    item.status === 'success' &&
                    matchSearch &&
                    matchPackage
                );
            });
        },

        todayRevenue() {
            return 5800000;
        },

        monthRevenue() {
            return 86350000;
        },

        successTransactions() {
            return 64;
        },

        averageOrder() {
            return Math.round(
                this.monthRevenue / this.successTransactions
            );
        }
    },

    methods: {
        getInitial(name) {
            if (!name) {
                return '';
            }

            return name
                .trim()
                .split(' ')
                .slice(-2)
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();
        },

        formatMoney(value) {
            return new Intl.NumberFormat('vi-VN').format(value || 0);
        },

        formatShortMoney(value) {
            if (value >= 1000000) {
                const result = value / 1000000;

                return (
                    result.toFixed(result % 1 === 0 ? 0 : 2) +
                    'M'
                );
            }

            return this.formatMoney(value);
        },

        exportReport() {
            alert('Demo: Xuất báo cáo doanh thu');
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

.header-actions {
    display: flex;
    gap: 9px;
}

.header-actions select {
    height: 40px;
    padding: 0 11px;
    border: 1px solid #cfe8eb;
    border-radius: 10px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 10.5px;
}

.btn-export {
    height: 40px;
    padding: 0 14px;
    border: 1px solid #0d7f8d;
    border-radius: 10px;
    background: #0d7f8d;
    color: white;
    font-size: 10.5px;
    font-weight: 700;
}

.btn-export:hover {
    background: #075e68;
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
}

.mini-card > span {
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

.mini-card small {
    display: block;
    margin-top: 5px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.mini-card small.up {
    color: #2c7c60;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 1.5fr 0.7fr;
    gap: 14px;
    margin-bottom: 14px;
}

.dashboard-grid.second {
    grid-template-columns: repeat(2, 1fr);
}

.chart-card,
.content-card {
    padding: 18px;
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.05);
}

.card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.card-header h3 {
    margin: 0;
    color: #11343a;
    font-size: 13px;
}

.card-header p {
    margin: 3px 0 0;
    color: #71949a;
    font-size: 9.5px;
}

.chart-badge {
    padding: 5px 8px;
    border-radius: 999px;
    background: #dff6f8;
    color: #075e68;
    font-size: 8.5px;
    font-weight: 700;
}

.bar-chart {
    height: 250px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
    padding-top: 28px;
}

.bar-item {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.bar-value {
    margin-bottom: 6px;
    color: #51777d;
    font-size: 8.5px;
}

.bar-wrap {
    flex: 1;
    width: 29px;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
    border-radius: 9px;
    background: #edf8f9;
}

.bar {
    width: 100%;
    border-radius: 9px 9px 0 0;
    background: linear-gradient(180deg, #1ba9b6, #0d7f8d);
    transition: 0.18s ease;
}

.bar:hover {
    background: #075e68;
}

.bar-item > span {
    margin-top: 8px;
    color: #71949a;
    font-size: 9px;
}

.donut-wrap {
    display: flex;
    justify-content: center;
    padding: 23px 0 18px;
}

.donut {
    position: relative;
    width: 150px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: conic-gradient(
        #0d7f8d 0% 87%,
        #9f9ce7 87% 100%
    );
}

.donut::after {
    content: "";
    position: absolute;
    width: 106px;
    height: 106px;
    border-radius: 50%;
    background: white;
}

.donut-center {
    position: relative;
    z-index: 2;
    text-align: center;
}

.donut-center strong {
    display: block;
    color: #11343a;
    font-size: 22px;
}

.donut-center span {
    color: #71949a;
    font-size: 8px;
}

.legend-list {
    display: grid;
    gap: 9px;
}

.legend-list div {
    display: grid;
    grid-template-columns: 12px 1fr auto;
    align-items: center;
    gap: 6px;
    color: #597d82;
    font-size: 9.5px;
}

.legend-list strong {
    color: #11343a;
}

.legend-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
}

.legend-dot.bank {
    background: #0d7f8d;
}

.legend-dot.cash {
    background: #9f9ce7;
}

.package-list {
    display: grid;
    gap: 18px;
    margin-top: 19px;
}

.package-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.package-head > div {
    display: flex;
    align-items: center;
    gap: 9px;
}

.package-icon {
    width: 31px;
    height: 31px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 9px;
    background: #dff6f8;
    color: #075e68;
    font-size: 8.5px;
    font-weight: 800;
}

.package-head strong,
.package-head small {
    display: block;
}

.package-head strong {
    color: #11343a;
    font-size: 10.5px;
}

.package-head small {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8px;
}

.package-head > span {
    color: #075e68;
    font-size: 10.5px;
    font-weight: 750;
}

.progress {
    width: 100%;
    height: 7px;
    margin-top: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: #e7f3f4;
}

.progress-value {
    height: 100%;
    border-radius: 999px;
    background: #0d7f8d;
}

.money-status {
    display: grid;
    gap: 9px;
    margin-top: 16px;
}

.money-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px;
    border-radius: 11px;
    background: #f7fcfd;
}

.money-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 800;
}

.money-icon.success {
    background: #e4f7ef;
    color: #2c7c60;
}

.money-icon.pending {
    background: #fff4df;
    color: #a76b1d;
}

.money-icon.refund {
    background: #eeeefe;
    color: #6563a8;
}

.money-icon.failed {
    background: #feecec;
    color: #b94f4f;
}

.money-row span,
.money-row strong {
    display: block;
}

.money-row span {
    color: #71949a;
    font-size: 8.5px;
}

.money-row strong {
    margin-top: 3px;
    color: #11343a;
    font-size: 10.5px;
}

.content-card {
    margin-top: 14px;
}

.table-actions {
    display: flex;
    gap: 8px;
}

.table-actions input,
.table-actions select {
    height: 35px;
    padding: 0 9px;
    border: 1px solid #d3e9ec;
    border-radius: 9px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 9.5px;
}

.table-actions input {
    min-width: 220px;
}

.revenue-table {
    width: 100%;
    margin-top: 15px;
    border-collapse: collapse;
}

.revenue-table th {
    padding: 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.revenue-table td {
    padding: 12px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #456a70;
    font-size: 10.5px;
}

.revenue-table tbody tr:hover {
    background: #f5fcfd;
}

.transaction-code strong,
.transaction-code span {
    display: block;
}

.transaction-code strong {
    color: #11343a;
    font-size: 9.5px;
}

.transaction-code span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8px;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 9px;
}

.avatar {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 10px;
    background: #dff6f8;
    color: #075e68;
    font-size: 9px;
    font-weight: 800;
}

.user-cell strong,
.user-cell span {
    display: block;
}

.user-cell strong {
    color: #11343a;
    font-size: 10px;
}

.user-cell span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8px;
}

.package-badge {
    display: inline-flex;
    padding: 4px 7px;
    border-radius: 999px;
    background: #e3f8fb;
    color: #0b7481;
    font-size: 8px;
    font-weight: 750;
}

.package-name {
    margin-top: 4px;
    color: #597d82;
    font-size: 9px;
}

.method-badge {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 700;
}

.method-badge.bank {
    background: #e3f8fb;
    color: #0b7481;
}

.method-badge.cash {
    background: #eeeefe;
    color: #6563a8;
}

.date-cell strong,
.date-cell span {
    display: block;
}

.date-cell strong {
    color: #456a70;
    font-size: 9.5px;
}

.date-cell span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8px;
}

.amount {
    color: #2c7c60;
    font-size: 10.5px;
}

.empty-state {
    padding: 40px;
    color: #71949a;
    text-align: center;
}

.bottom-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
}

.performance-list,
.summary-list {
    display: grid;
    gap: 8px;
    margin-top: 14px;
}

.performance-list > div,
.summary-list > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px;
    border-radius: 10px;
    background: #f7fcfd;
}

.performance-list > div > span,
.summary-list span {
    color: #597d82;
    font-size: 9.5px;
}

.performance-list > div > div {
    text-align: right;
}

.performance-list strong,
.performance-list small {
    display: block;
}

.performance-list strong,
.summary-list strong {
    color: #075e68;
    font-size: 10.5px;
}

.performance-list small {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 7.5px;
}

@media (max-width: 1100px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-grid,
    .dashboard-grid.second,
    .bottom-grid {
        grid-template-columns: 1fr;
    }

    .card-header {
        flex-wrap: wrap;
    }
}
</style>