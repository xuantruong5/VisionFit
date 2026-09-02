<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Giao dịch thanh toán</h2>
                <p>Theo dõi các khoản thanh toán thực tế đã ghi nhận trong hệ thống</p>
            </div>

            <button class="btn-refresh" @click="refreshData">
                ↻ Làm mới
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng giao dịch</span>
                <strong>{{ list_transaction.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Thành công</span>
                <strong>{{ countSuccess }}</strong>
            </div>

            <div class="mini-card">
                <span>Đang xử lý</span>
                <strong>{{ countPending }}</strong>
            </div>

            <div class="mini-card">
                <span>Tổng tiền đã nhận</span>
                <strong>{{ formatShortMoney(totalReceived) }}</strong>
            </div>
        </div>

        <div class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm mã giao dịch, hóa đơn hoặc Gymmer..."
                    >
                </div>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="success">Thành công</option>
                    <option value="pending">Đang xử lý</option>
                    <option value="failed">Thất bại</option>
                    <option value="refunded">Đã hoàn tiền</option>
                </select>

                <select v-model="methodFilter">
                    <option value="">Tất cả phương thức</option>
                    <option value="bank">Chuyển khoản</option>
                    <option value="cash">Tiền mặt</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="transaction-table">
                    <thead>
                        <tr>
                            <th>Giao dịch</th>
                            <th>Hóa đơn</th>
                            <th>Gymmer</th>
                            <th>Phương thức</th>
                            <th>Số tiền</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                            <th></th>
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
                                    <span>{{ item.bank_reference }}</span>
                                </div>
                            </td>

                            <td>
                                <span class="invoice-code">
                                    #{{ item.invoice_id }}
                                </span>
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
                                <span
                                    class="method-badge"
                                    :class="item.method"
                                >
                                    {{ getMethodName(item.method) }}
                                </span>
                            </td>

                            <td>
                                <strong class="amount">
                                    {{ formatMoney(item.amount) }}đ
                                </strong>
                            </td>

                            <td>
                                <div class="date-cell">
                                    <strong>{{ item.date }}</strong>
                                    <span>{{ item.time }}</span>
                                </div>
                            </td>

                            <td>
                                <span
                                    class="status"
                                    :class="item.status"
                                >
                                    <span class="status-dot"></span>
                                    {{ getStatusName(item.status) }}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="btn-detail"
                                    @click="openDetail(item)"
                                >
                                    Chi tiết
                                </button>
                            </td>
                        </tr>

                        <tr v-if="filteredTransactions.length === 0">
                            <td colspan="8">
                                <div class="empty-state">
                                    Không tìm thấy giao dịch phù hợp
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div
            v-if="showDetail"
            class="modal-overlay"
            @click.self="closeDetail"
        >
            <div class="detail-modal">
                <div class="modal-header">
                    <div>
                        <span>PAYMENT TRANSACTION</span>
                        <h3>#{{ selectedTransaction?.id }}</h3>
                        <p>{{ selectedTransaction?.date }} · {{ selectedTransaction?.time }}</p>
                    </div>

                    <button class="btn-close" @click="closeDetail">
                        ×
                    </button>
                </div>

                <div class="transaction-status">
                    <div>
                        <span>Trạng thái giao dịch</span>
                        <strong>
                            {{ getStatusName(selectedTransaction?.status) }}
                        </strong>
                    </div>

                    <span
                        class="status large"
                        :class="selectedTransaction?.status"
                    >
                        <span class="status-dot"></span>
                        {{ getStatusName(selectedTransaction?.status) }}
                    </span>
                </div>

                <div class="section">
                    <h4>Thông tin thanh toán</h4>

                    <div class="info-grid">
                        <div>
                            <span>Mã giao dịch</span>
                            <strong>#{{ selectedTransaction?.id }}</strong>
                        </div>

                        <div>
                            <span>Mã hóa đơn</span>
                            <strong>#{{ selectedTransaction?.invoice_id }}</strong>
                        </div>

                        <div>
                            <span>Số tiền</span>
                            <strong>{{ formatMoney(selectedTransaction?.amount) }}đ</strong>
                        </div>

                        <div>
                            <span>Phương thức</span>
                            <strong>
                                {{ getMethodName(selectedTransaction?.method) }}
                            </strong>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>Gymmer</h4>

                    <div class="customer-card">
                        <div class="avatar large-avatar">
                            {{ getInitial(selectedTransaction?.gymmer || '') }}
                        </div>

                        <div>
                            <strong>{{ selectedTransaction?.gymmer }}</strong>
                            <span>#GM{{ selectedTransaction?.gymmer_id }}</span>
                        </div>
                    </div>
                </div>

                <div
                    v-if="selectedTransaction?.method === 'bank'"
                    class="section"
                >
                    <h4>Thông tin ngân hàng</h4>

                    <div class="bank-info">
                        <div class="info-row">
                            <span>Ngân hàng</span>
                            <strong>{{ selectedTransaction?.bank }}</strong>
                        </div>

                        <div class="info-row">
                            <span>Mã tham chiếu</span>
                            <strong>{{ selectedTransaction?.bank_reference }}</strong>
                        </div>

                        <div class="info-row">
                            <span>Nội dung chuyển khoản</span>
                            <strong>{{ selectedTransaction?.transfer_code }}</strong>
                        </div>

                        <div class="info-row">
                            <span>Số tiền nhận</span>
                            <strong>{{ formatMoney(selectedTransaction?.amount) }}đ</strong>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>Lịch sử xử lý</h4>

                    <div class="timeline">
                        <div class="timeline-item done">
                            <div class="timeline-dot"></div>

                            <div>
                                <strong>Hóa đơn được tạo</strong>
                                <span>{{ selectedTransaction?.invoice_created }}</span>
                            </div>
                        </div>

                        <div class="timeline-item done">
                            <div class="timeline-dot"></div>

                            <div>
                                <strong>Nhận thông tin thanh toán</strong>
                                <span>{{ selectedTransaction?.date }} · {{ selectedTransaction?.time }}</span>
                            </div>
                        </div>

                        <div
                            class="timeline-item"
                            :class="{
                                done: selectedTransaction?.status === 'success',
                                error: selectedTransaction?.status === 'failed'
                            }"
                        >
                            <div class="timeline-dot"></div>

                            <div>
                                <strong>
                                    {{
                                        selectedTransaction?.status === 'success'
                                            ? 'Thanh toán thành công'
                                            : selectedTransaction?.status === 'failed'
                                                ? 'Thanh toán thất bại'
                                                : 'Đang xác minh'
                                    }}
                                </strong>

                                <span>
                                    Hệ thống cập nhật trạng thái giao dịch
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-if="selectedTransaction?.status === 'success'"
                    class="success-box"
                >
                    <span>✓</span>

                    <div>
                        <strong>Thanh toán đã được ghi nhận</strong>
                        <p>
                            Khoản tiền này được tính vào doanh thu của VisionFit.
                        </p>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeDetail">
                        Đóng
                    </button>

                    <button
                        class="btn-invoice"
                        @click="goInvoice"
                    >
                        Xem hóa đơn
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminGiaoDich",

    data() {
        return {
            search: '',
            statusFilter: '',
            methodFilter: '',
            showDetail: false,
            selectedTransaction: null,

            list_transaction: [
                {
                    id: 'PAY260902001',
                    invoice_id: 'INV102845',
                    gymmer_id: '00128',
                    gymmer: 'Nguyễn Minh Anh',
                    method: 'bank',
                    amount: 2200000,
                    date: '02/09/2026',
                    time: '10:48',
                    status: 'success',
                    bank: 'Vietcombank',
                    bank_reference: 'VCB260902102845',
                    transfer_code: 'VF102845',
                    invoice_created: '02/09/2026 · 10:45'
                },
                {
                    id: 'PAY260902002',
                    invoice_id: 'INV102844',
                    gymmer_id: '00122',
                    gymmer: 'Võ Thanh Tùng',
                    method: 'bank',
                    amount: 850000,
                    date: '02/09/2026',
                    time: '09:32',
                    status: 'pending',
                    bank: 'Vietcombank',
                    bank_reference: 'VCB260902093214',
                    transfer_code: 'VF102844',
                    invoice_created: '02/09/2026 · 09:30'
                },
                {
                    id: 'PAY260901014',
                    invoice_id: 'INV102840',
                    gymmer_id: '00127',
                    gymmer: 'Phạm Gia Hân',
                    method: 'bank',
                    amount: 3600000,
                    date: '01/09/2026',
                    time: '18:24',
                    status: 'success',
                    bank: 'Vietcombank',
                    bank_reference: 'VCB260901182042',
                    transfer_code: 'VF102840',
                    invoice_created: '01/09/2026 · 18:20'
                },
                {
                    id: 'PAY260901010',
                    invoice_id: 'INV102837',
                    gymmer_id: '00116',
                    gymmer: 'Đỗ Minh Thư',
                    method: 'cash',
                    amount: 500000,
                    date: '01/09/2026',
                    time: '15:15',
                    status: 'success',
                    bank: '',
                    bank_reference: 'CASH-260901-010',
                    transfer_code: '',
                    invoice_created: '01/09/2026 · 15:10'
                },
                {
                    id: 'PAY260831021',
                    invoice_id: 'INV102829',
                    gymmer_id: '00125',
                    gymmer: 'Nguyễn Gia Long',
                    method: 'bank',
                    amount: 850000,
                    date: '31/08/2026',
                    time: '20:35',
                    status: 'failed',
                    bank: 'Vietcombank',
                    bank_reference: 'VCB260831203522',
                    transfer_code: 'VF102829',
                    invoice_created: '31/08/2026 · 20:31'
                },
                {
                    id: 'PAY260826008',
                    invoice_id: 'INV102814',
                    gymmer_id: '00108',
                    gymmer: 'Trần Minh Khang',
                    method: 'bank',
                    amount: 500000,
                    date: '26/08/2026',
                    time: '16:48',
                    status: 'refunded',
                    bank: 'Vietcombank',
                    bank_reference: 'VCB260826164545',
                    transfer_code: 'VF102814',
                    invoice_created: '26/08/2026 · 16:45'
                }
            ]
        }
    },

    computed: {
        filteredTransactions() {
            return this.list_transaction.filter((item) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    item.id.toLowerCase().includes(keyword) ||
                    item.invoice_id.toLowerCase().includes(keyword) ||
                    item.gymmer.toLowerCase().includes(keyword);

                const matchStatus =
                    !this.statusFilter ||
                    item.status === this.statusFilter;

                const matchMethod =
                    !this.methodFilter ||
                    item.method === this.methodFilter;

                return matchSearch && matchStatus && matchMethod;
            });
        },

        countSuccess() {
            return this.list_transaction.filter(
                item => item.status === 'success'
            ).length;
        },

        countPending() {
            return this.list_transaction.filter(
                item => item.status === 'pending'
            ).length;
        },

        totalReceived() {
            return this.list_transaction
                .filter(item => item.status === 'success')
                .reduce((total, item) => total + item.amount, 0);
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

        getStatusName(status) {
            if (status === 'success') return 'Thành công';
            if (status === 'pending') return 'Đang xử lý';
            if (status === 'failed') return 'Thất bại';
            if (status === 'refunded') return 'Đã hoàn tiền';

            return status;
        },

        getMethodName(method) {
            if (method === 'bank') return 'Chuyển khoản';
            if (method === 'cash') return 'Tiền mặt';

            return method;
        },

        formatMoney(value) {
            return new Intl.NumberFormat('vi-VN').format(value || 0);
        },

        formatShortMoney(value) {
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
            }

            return this.formatMoney(value);
        },

        openDetail(item) {
            this.selectedTransaction = item;
            this.showDetail = true;
        },

        closeDetail() {
            this.showDetail = false;
            this.selectedTransaction = null;
        },

        refreshData() {
            console.log('Refresh payment transactions');
        },

        goInvoice() {
            this.closeDetail();
            this.$router.push('/admin/hoa-don');
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

.btn-refresh {
    padding: 9px 14px;
    border: 1px solid #9ed9df;
    border-radius: 11px;
    background: white;
    color: #0d7f8d;
    font-size: 10.5px;
    font-weight: 700;
}

.btn-refresh:hover {
    background: #dff6f8;
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
    font-size: 11px;
}

.filter-bar select {
    min-width: 165px;
    height: 42px;
    padding: 0 10px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 10.5px;
}

.transaction-table {
    width: 100%;
    border-collapse: collapse;
}

.transaction-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.transaction-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #456a70;
    font-size: 10.5px;
}

.transaction-table tbody tr {
    transition: 0.15s ease;
}

.transaction-table tbody tr:hover {
    background: #f5fcfd;
}

.transaction-code strong,
.transaction-code span {
    display: block;
}

.transaction-code strong {
    color: #11343a;
    font-size: 10px;
}

.transaction-code span {
    margin-top: 3px;
    color: #8aa7ab;
    font-size: 8px;
}

.invoice-code {
    color: #0d7f8d;
    font-size: 9.5px;
    font-weight: 700;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 9px;
}

.avatar {
    width: 36px;
    height: 36px;
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
    font-size: 10.5px;
}

.user-cell span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8px;
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

.amount {
    color: #075e68;
    font-size: 10.5px;
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

.status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 700;
    white-space: nowrap;
}

.status.success {
    background: #e4f7ef;
    color: #2c7c60;
}

.status.pending {
    background: #fff4df;
    color: #a76b1d;
}

.status.failed {
    background: #feecec;
    color: #b94f4f;
}

.status.refunded {
    background: #eeeefe;
    color: #6563a8;
}

.status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
}

.btn-detail {
    padding: 6px 9px;
    border: 1px solid #9ed9df;
    border-radius: 8px;
    background: white;
    color: #0d7f8d;
    font-size: 9.5px;
    font-weight: 700;
}

.btn-detail:hover {
    background: #dff6f8;
}

.empty-state {
    padding: 40px;
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
    background: rgba(8, 58, 64, 0.20);
    backdrop-filter: blur(4px);
}

.detail-modal {
    width: 720px;
    max-width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 22px;
    border: 1px solid #9ed9df;
    border-radius: 22px;
    background: white;
    box-shadow: 0 20px 50px rgba(13, 127, 141, 0.18);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}

.modal-header > div > span {
    color: #0d7f8d;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1px;
}

.modal-header h3 {
    margin: 3px 0 0;
    color: #11343a;
    font-size: 18px;
}

.modal-header p {
    margin: 3px 0 0;
    color: #71949a;
    font-size: 9px;
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

.transaction-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px;
    border: 1px solid #d8eef1;
    border-radius: 13px;
    background: #f8fdfe;
}

.transaction-status > div span,
.transaction-status > div strong {
    display: block;
}

.transaction-status > div span {
    color: #71949a;
    font-size: 8.5px;
}

.transaction-status > div strong {
    margin-top: 4px;
    color: #11343a;
    font-size: 11px;
}

.status.large {
    padding: 7px 10px;
    font-size: 9px;
}

.section {
    margin-top: 17px;
    padding-top: 15px;
    border-top: 1px solid #e6f1f3;
}

.section h4 {
    margin: 0 0 10px;
    color: #11343a;
    font-size: 12px;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 9px;
}

.info-grid div {
    padding: 11px;
    border-radius: 11px;
    background: #f7fcfd;
}

.info-grid span {
    display: block;
    color: #71949a;
    font-size: 8.5px;
}

.info-grid strong {
    display: block;
    margin-top: 4px;
    color: #11343a;
    font-size: 10px;
}

.customer-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 12px;
    background: #f7fcfd;
}

.large-avatar {
    width: 42px;
    height: 42px;
}

.customer-card strong,
.customer-card span {
    display: block;
}

.customer-card strong {
    color: #11343a;
    font-size: 10.5px;
}

.customer-card span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.bank-info {
    border: 1px solid #e2eff1;
    border-radius: 12px;
    overflow: hidden;
}

.info-row {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 10px 12px;
    border-bottom: 1px solid #eef6f7;
}

.info-row:last-child {
    border-bottom: none;
}

.info-row span {
    color: #71949a;
    font-size: 9px;
}

.info-row strong {
    color: #11343a;
    font-size: 9.5px;
    text-align: right;
}

.timeline {
    position: relative;
    display: grid;
    gap: 15px;
    padding-left: 4px;
}

.timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.timeline-dot {
    width: 10px;
    height: 10px;
    margin-top: 3px;
    flex-shrink: 0;
    border: 2px solid #b8d5d8;
    border-radius: 50%;
    background: white;
}

.timeline-item.done .timeline-dot {
    border-color: #2c7c60;
    background: #2c7c60;
}

.timeline-item.error .timeline-dot {
    border-color: #b94f4f;
    background: #b94f4f;
}

.timeline-item strong,
.timeline-item span {
    display: block;
}

.timeline-item strong {
    color: #11343a;
    font-size: 9.5px;
}

.timeline-item span {
    margin-top: 3px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.success-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 17px;
    padding: 13px;
    border: 1px solid #bde5d5;
    border-radius: 12px;
    background: #f1fbf7;
}

.success-box > span {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 50%;
    background: #2c7c60;
    color: white;
    font-size: 11px;
    font-weight: 800;
}

.success-box strong {
    color: #235f4c;
    font-size: 10px;
}

.success-box p {
    margin: 4px 0 0;
    color: #5d8175;
    font-size: 8.5px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
}

.btn-cancel,
.btn-invoice {
    padding: 9px 14px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
}

.btn-cancel {
    border: 1px solid #d3e9ec;
    background: white;
    color: #51777d;
}

.btn-invoice {
    border: 1px solid #0d7f8d;
    background: #0d7f8d;
    color: white;
}

.btn-invoice:hover {
    background: #075e68;
}

@media (max-width: 1050px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .filter-bar {
        flex-wrap: wrap;
    }
}
</style>