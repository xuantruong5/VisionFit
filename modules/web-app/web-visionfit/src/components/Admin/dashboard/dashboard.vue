<template>
    <div>
        <div class="dashboard-header">
            <div>
                <h2>Bảng điều khiển</h2>
                <p>Tổng quan hoạt động của VisionFit Gym</p>
            </div>
            <div class="actions">
                <button class="btn-refresh" :class="{ loading: isLoading }" @click="refreshData">
                    <span>↻</span> Làm mới
                </button>
                <div class="date-picker">
                    <button class="btn-primary" @click="showRange = !showRange">📅 {{ selectedRange }}</button>
                    <div v-if="showRange" class="range-menu">
                        <button v-for="item in ranges" :key="item" class="range-item" :class="{ active: item === selectedRange }" @click="chonKhoangNgay(item)">{{ item }}</button>
                        <div class="range-custom">
                            <span>Tùy chọn ngày</span>
                            <div class="range-inputs">
                                <input v-model="tu_ngay" type="date">
                                <span>→</span>
                                <input v-model="den_ngay" type="date">
                            </div>
                            <button class="btn-apply" @click="apDungTuyChonNgay">Áp dụng</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4 THẺ CHỈ SỐ TỔNG QUAN -->
        <div class="row g-4">
            <div class="col-xl-3 col-md-6">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-label">Gymmer (Hội viên)</div>
                    <div class="stat-number">{{ stats.total_gymmers }}</div>
                    <div class="stat-footer">↑ {{ stats.new_gymmers_this_month }} người mới tháng này</div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="stat-card">
                    <div class="stat-icon">🥋</div>
                    <div class="stat-label">Huấn luyện viên</div>
                    <div class="stat-number">{{ stats.total_trainers }}</div>
                    <div class="stat-footer">{{ stats.active_trainers }} đang hoạt động</div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="stat-card">
                    <div class="stat-icon money">💰</div>
                    <div class="stat-label">Tổng doanh thu gói tập</div>
                    <div class="stat-number">{{ formatCurrency(stats.total_revenue) }}</div>
                    <div class="stat-footer">{{ stats.total_subscriptions }} lượt đăng ký thành công</div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="stat-card">
                    <div class="stat-icon ai">⚡</div>
                    <div class="stat-label">Gói tập & Bài tập</div>
                    <div class="stat-number">{{ stats.total_packages }} gói tập</div>
                    <div class="stat-footer">{{ stats.total_exercises }} bài tập trong hệ thống</div>
                </div>
            </div>
        </div>

        <!-- HÀNG CHI TIẾT HOẠT ĐỘNG & CHỈ SỐ -->
        <div class="row g-4 mt-1">
            <div class="col-lg-8">
                <div class="content-card">
                    <div class="card-header-flex">
                        <div class="card-title mb-0">Đăng ký gói & Hoạt động gần đây</div>
                        <span class="badge-total">{{ recent_subscriptions.length }} giao dịch mới nhất</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr>
                                    <th>Gymmer</th>
                                    <th>Gói tập</th>
                                    <th>HLV phụ trách</th>
                                    <th>Số tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in recent_subscriptions" :key="item.id">
                                    <td>
                                        <div class="user-cell">
                                            <div class="user-avatar">{{ getInitial(item.gymmer_name) }}</div>
                                            <div class="user-info">
                                                <strong>{{ item.gymmer_name }}</strong>
                                                <span>{{ item.email }}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><strong class="package-name">{{ item.ten_goi_tap || 'Gói tập' }}</strong></td>
                                    <td>
                                        <span v-if="item.trainer_name" class="trainer-tag">PT {{ item.trainer_name }}</span>
                                        <span v-else class="text-muted">Chưa phân công</span>
                                    </td>
                                    <td><strong class="price-text">{{ formatCurrency(item.tong_tien) }}</strong></td>
                                    <td>
                                        <span :class="item.is_thanh_toan ? 'badge-success' : 'badge-warning'">
                                            {{ item.is_thanh_toan ? 'Đã thanh toán' : 'Chờ thanh toán' }}
                                        </span>
                                    </td>
                                </tr>
                                <tr v-if="recent_subscriptions.length === 0">
                                    <td colspan="5" class="text-center py-4 text-muted">Chưa có giao dịch đăng ký gói nào</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="content-card">
                    <div class="card-title">Chỉ số vận hành hệ thống</div>
                    <div class="metric"><span>Tỷ lệ Gymmer hoạt động</span><b>{{ stats.active_gymmers_ratio }}%</b></div>
                    <div class="metric"><span>HLV sẵn sàng nhận việc</span><b>{{ stats.active_trainers_ratio }}%</b></div>
                    <div class="metric"><span>Thanh toán thành công</span><b>{{ stats.payment_success_ratio }}%</b></div>
                    <div class="metric"><span>Độ phủ gói tập hỗ trợ AI</span><b>100%</b></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import baseRequestAdmin from '@/core/baseRequestAdmin';

export default {
    name: "AdminDashboard",
    data() {
        return {
            isLoading: false,
            showRange: false,
            selectedRange: 'Tháng này',
            ranges: ['Hôm nay', '7 ngày gần đây', '30 ngày gần đây', 'Tháng này'],
            tu_ngay: '',
            den_ngay: '',
            stats: {
                total_gymmers: 0,
                active_gymmers: 0,
                new_gymmers_this_month: 0,
                total_trainers: 0,
                active_trainers: 0,
                total_revenue: 0,
                revenue_this_month: 0,
                total_subscriptions: 0,
                total_packages: 0,
                total_exercises: 0,
                active_gymmers_ratio: 0,
                active_trainers_ratio: 0,
                payment_success_ratio: 100,
            },
            recent_subscriptions: []
        };
    },
    mounted() {
        this.layThongKeDashboard();
    },
    methods: {
        async layThongKeDashboard(range = null) {
            this.isLoading = true;
            try {
                const params = {};
                if (range) params.range = range;
                else if (this.selectedRange) params.range = this.selectedRange;
                if (this.tu_ngay && this.den_ngay) {
                    params.tu_ngay = this.tu_ngay;
                    params.den_ngay = this.den_ngay;
                }
                const res = await baseRequestAdmin.get('admin/dashboard-stats', { params });
                if (res && res.data && (res.data.status || res.data.success)) {
                    this.stats = res.data.data.stats || this.stats;
                    this.recent_subscriptions = res.data.data.recent_subscriptions || [];
                }
            } catch (err) {
                console.error("Lỗi tải thống kê dashboard:", err);
            } finally {
                this.isLoading = false;
            }
        },
        refreshData() {
            this.layThongKeDashboard(this.selectedRange);
            if (this.$toast) this.$toast.success("Đã cập nhật dữ liệu mới nhất!");
        },
        chonKhoangNgay(item) {
            this.selectedRange = item;
            this.showRange = false;
            this.tu_ngay = '';
            this.den_ngay = '';
            this.layThongKeDashboard(item);
        },
        apDungTuyChonNgay() {
            if (!this.tu_ngay || !this.den_ngay) {
                alert("Vui lòng chọn đầy đủ từ ngày và đến ngày");
                return;
            }
            this.selectedRange = `${this.tu_ngay} → ${this.den_ngay}`;
            this.showRange = false;
            this.layThongKeDashboard();
        },
        formatCurrency(num) {
            if (!num || isNaN(num)) return '0 đ';
            return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' đ';
        },
        getInitial(name) {
            if (!name) return 'VF';
            const parts = name.trim().split(' ');
            if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
    }
}
</script>

<style scoped>
.dashboard-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
.dashboard-header h2 { margin: 0; color: #11343a; font-size: 28px; font-weight: 700; }
.dashboard-header p { margin: 5px 0 0; color: #71949a; font-size: 15px; }
.actions { display: flex; gap: 9px; }

.btn-refresh, .btn-primary {
    padding: 9px 14px;
    border-radius: 11px;
    font-size: 15px;
    font-weight: 700;
    transition: 0.16s ease;
    cursor: pointer;
}
.btn-refresh { border: 1.5px solid #0d7f8d; background: white; color: #0d7f8d; }
.btn-refresh:hover { background: #dff6f8; transform: translateY(-1px); }
.btn-refresh span { display: inline-block; }
.btn-refresh.loading span { animation: spin 0.7s linear infinite; }
.btn-primary { border: 1.5px solid #0d7f8d; background: #0d7f8d; color: white; }
.btn-primary:hover { background: #075e68; transform: translateY(-1px); }

.date-picker { position: relative; }
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
    cursor: pointer;
}
.range-item:hover { background: #f4fafb; }
.range-item.active { background: #e6f5f6; color: #0d7f8d; font-weight: 700; }
.range-custom { margin-top: 8px; padding: 12px; border-top: 1px solid #eef5f6; }
.range-custom > span { color: #71949a; font-size: 13px; font-weight: 700; }
.range-inputs { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
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
.range-inputs span { color: #71949a; }
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
    cursor: pointer;
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
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #dff6f8;
    color: #075e68;
    font-size: 20px;
}
.stat-icon.money { background: #e8f7f0; color: #1a8754; }
.stat-icon.ai { background: #eef2ff; color: #4f46e5; }
.stat-label { color: #71949a; font-size: 14.5px; font-weight: 600; }
.stat-number { margin-top: 8px; color: #11343a; font-size: 26px; font-weight: 800; }
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
.card-header-flex { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { margin-bottom: 14px; color: #11343a; font-size: 16.5px; font-weight: 700; }
.badge-total {
    font-size: 12.5px;
    color: #0d7f8d;
    background: #e6f5f6;
    padding: 4px 10px;
    border-radius: 99px;
    font-weight: 600;
}

.table { margin: 0; }
.table th { color: #84a5aa; font-size: 13px; font-weight: 700; text-transform: uppercase; }
.table td { padding: 12px 8px; border-color: #eef6f7; color: #34585d; font-size: 15px; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e6f5f6;
    color: #0d7f8d;
    font-weight: 700;
    font-size: 13.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.user-info strong { display: block; color: #11343a; font-size: 14.5px; }
.user-info span { font-size: 12px; color: #84a5aa; }
.package-name { color: #11343a; font-size: 14.5px; }
.trainer-tag {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    background: #f0f7f8;
    color: #0d7f8d;
    font-size: 13px;
    font-weight: 600;
}
.price-text { color: #0d7f8d; font-size: 14.5px; }

.badge-success, .badge-warning, .badge-ai {
    display: inline-flex;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 700;
}
.badge-success { background: #e4f7ef; color: #2c7c60; }
.badge-warning { background: #fff4df; color: #a76b1d; }
.badge-ai { background: #e3f8fb; color: #0b7481; }

.metric {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 0;
    border-bottom: 1px solid #eef6f7;
    color: #71949a;
    font-size: 15px;
}
.metric:last-child { border-bottom: none; }
.metric b { color: #11343a; font-size: 16px; }

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>