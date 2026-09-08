<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Quản lý Hóa đơn</h2>
                <p>Theo dõi trạng thái thanh toán và lịch sử mua gói của Gymmer</p>
            </div>

            <button class="btn-create" @click="$router.push('/admin/ban-goi')">
                + Tạo hóa đơn
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng hóa đơn</span>
                <strong>{{ list_invoice.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Đã thanh toán</span>
                <strong>{{ countPaid }}</strong>
            </div>

            <div class="mini-card">
                <span>Chờ thanh toán</span>
                <strong>{{ countPending }}</strong>
            </div>

            <div class="mini-card">
                <span>Doanh thu đã nhận</span>
                <strong>{{ formatShortMoney(totalRevenue) }}</strong>
            </div>
        </div>

        <div class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm mã hóa đơn, Gymmer hoặc số điện thoại..."
                    >
                </div>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ thanh toán</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="overdue">Quá hạn</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="refunded">Đã hoàn tiền</option>
                </select>

                <select v-model="packageFilter">
                    <option value="">Tất cả loại gói</option>
                    <option value="GYM">GYM</option>
                    <option value="GYM + AI">GYM + AI</option>
                    <option value="PT">PT</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Hóa đơn</th>
                            <th>Gymmer</th>
                            <th>Gói tập</th>
                            <th>Số tiền</th>
                            <th>Ngày tạo</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="invoice in filteredInvoices"
                            :key="invoice.id"
                        >
                            <td>
                                <div class="invoice-code">
                                    <strong>#{{ invoice.id }}</strong>
                                    <span>{{ invoice.transfer_code }}</span>
                                </div>
                            </td>

                            <td>
                                <div class="user-cell">
                                    <div class="avatar">
                                        {{ getInitial(invoice.gymmer) }}
                                    </div>

                                    <div>
                                        <strong>{{ invoice.gymmer }}</strong>
                                        <span>{{ invoice.phone }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <div>
                                    <span class="package-type">
                                        {{ invoice.package_type }}
                                    </span>

                                    <div class="package-name">
                                        {{ invoice.package_name }}
                                    </div>
                                </div>
                            </td>

                            <td>
                                <strong class="amount">
                                    {{ formatMoney(invoice.amount) }}đ
                                </strong>
                            </td>

                            <td>
                                <div class="date-cell">
                                    <strong>{{ invoice.created_date }}</strong>
                                    <span>{{ invoice.created_time }}</span>
                                </div>
                            </td>

                            <td>
                                <span
                                    class="status"
                                    :class="invoice.status"
                                >
                                    <span class="status-dot"></span>
                                    {{ getStatusName(invoice.status) }}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="btn-detail"
                                    @click="openDetail(invoice)"
                                >
                                    Chi tiết
                                </button>
                            </td>
                        </tr>

                        <tr v-if="filteredInvoices.length === 0">
                            <td colspan="7">
                                <div class="empty-state">
                                    Không tìm thấy hóa đơn phù hợp
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
            <div class="invoice-modal">
                <div class="modal-header">
                    <div>
                        <span>VISIONFIT INVOICE</span>
                        <h3>#{{ selectedInvoice?.id }}</h3>
                        <p>{{ selectedInvoice?.created_date }} · {{ selectedInvoice?.created_time }}</p>
                    </div>

                    <button class="btn-close" @click="closeDetail">
                        ×
                    </button>
                </div>

                <div class="invoice-status-box">
                    <div>
                        <span>Trạng thái hóa đơn</span>

                        <strong>
                            {{ getStatusName(selectedInvoice?.status) }}
                        </strong>
                    </div>

                    <span
                        class="status large"
                        :class="selectedInvoice?.status"
                    >
                        <span class="status-dot"></span>
                        {{ getStatusName(selectedInvoice?.status) }}
                    </span>
                </div>

                <div class="section">
                    <h4>Thông tin khách hàng</h4>

                    <div class="customer-card">
                        <div class="avatar large-avatar">
                            {{ getInitial(selectedInvoice?.gymmer || '') }}
                        </div>

                        <div>
                            <strong>{{ selectedInvoice?.gymmer }}</strong>
                            <span>{{ selectedInvoice?.phone }}</span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>Chi tiết gói tập</h4>

                    <div class="info-grid">
                        <div>
                            <span>Gói tập</span>
                            <strong>{{ selectedInvoice?.package_name }}</strong>
                        </div>

                        <div>
                            <span>Loại</span>
                            <strong>{{ selectedInvoice?.package_type }}</strong>
                        </div>

                        <div>
                            <span>Thời hạn</span>
                            <strong>{{ selectedInvoice?.duration }} ngày</strong>
                        </div>

                        <div>
                            <span>Số tiền</span>
                            <strong>{{ formatMoney(selectedInvoice?.amount) }}đ</strong>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>Thông tin thanh toán</h4>

                    <div class="payment-info">
                        <div class="info-row">
                            <span>Nội dung chuyển khoản</span>
                            <strong>{{ selectedInvoice?.transfer_code }}</strong>
                        </div>

                        <div class="info-row">
                            <span>Ngân hàng</span>
                            <strong>Vietcombank</strong>
                        </div>

                        <div class="info-row">
                            <span>Số tài khoản</span>
                            <strong>1234567890</strong>
                        </div>

                        <div class="info-row">
                            <span>Chủ tài khoản</span>
                            <strong>VISIONFIT GYM</strong>
                        </div>

                        <div
                            v-if="selectedInvoice?.status === 'paid'"
                            class="info-row"
                        >
                            <span>Mã giao dịch</span>
                            <strong>{{ selectedInvoice?.transaction_id }}</strong>
                        </div>

                        <div
                            v-if="selectedInvoice?.status === 'paid'"
                            class="info-row"
                        >
                            <span>Thanh toán lúc</span>
                            <strong>{{ selectedInvoice?.paid_at }}</strong>
                        </div>
                    </div>
                </div>

                <div class="total-box">
                    <span>Tổng thanh toán</span>
                    <strong>{{ formatMoney(selectedInvoice?.amount) }}đ</strong>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeDetail">
                        Đóng
                    </button>

                    <button class="btn-print" @click="printInvoice">
                        🖨 In hóa đơn
                    </button>

                    <button
                        v-if="selectedInvoice?.status === 'pending'"
                        class="btn-paid"
                        @click="markPaid"
                    >
                        Demo: Xác nhận đã thanh toán
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminHoaDon",

    data() {
        return {
            search: '',
            statusFilter: '',
            packageFilter: '',
            showDetail: false,
            selectedInvoice: null,

            list_invoice: [
                {
                    id: 'INV102845',
                    gymmer: 'Nguyễn Minh Anh',
                    phone: '0905 221 889',
                    package_name: 'Gym + AI 3 tháng',
                    package_type: 'GYM + AI',
                    duration: 90,
                    amount: 2200000,
                    created_date: '02/09/2026',
                    created_time: '10:45',
                    transfer_code: 'VF102845',
                    status: 'paid',
                    transaction_id: 'VCB260902102845',
                    paid_at: '02/09/2026 · 10:48'
                },
                {
                    id: 'INV102844',
                    gymmer: 'Võ Thanh Tùng',
                    phone: '0777 109 333',
                    package_name: 'Gym + AI 1 tháng',
                    package_type: 'GYM + AI',
                    duration: 30,
                    amount: 850000,
                    created_date: '02/09/2026',
                    created_time: '09:30',
                    transfer_code: 'VF102844',
                    status: 'pending',
                    transaction_id: '',
                    paid_at: ''
                },
                {
                    id: 'INV102840',
                    gymmer: 'Phạm Gia Hân',
                    phone: '0935 440 120',
                    package_name: 'Personal Trainer 12 buổi',
                    package_type: 'PT',
                    duration: 60,
                    amount: 3600000,
                    created_date: '01/09/2026',
                    created_time: '18:20',
                    transfer_code: 'VF102840',
                    status: 'paid',
                    transaction_id: 'VCB260901182042',
                    paid_at: '01/09/2026 · 18:24'
                },
                {
                    id: 'INV102831',
                    gymmer: 'Hoàng Ngọc Vy',
                    phone: '0914 672 018',
                    package_name: 'Gym Cơ bản 1 tháng',
                    package_type: 'GYM',
                    duration: 30,
                    amount: 500000,
                    created_date: '30/08/2026',
                    created_time: '14:10',
                    transfer_code: 'VF102831',
                    status: 'overdue',
                    transaction_id: '',
                    paid_at: ''
                },
                {
                    id: 'INV102826',
                    gymmer: 'Lê Gia Bảo',
                    phone: '0901 826 221',
                    package_name: 'Gym + AI 1 tháng',
                    package_type: 'GYM + AI',
                    duration: 30,
                    amount: 850000,
                    created_date: '29/08/2026',
                    created_time: '11:15',
                    transfer_code: 'VF102826',
                    status: 'cancelled',
                    transaction_id: '',
                    paid_at: ''
                },
                {
                    id: 'INV102814',
                    gymmer: 'Trần Minh Khang',
                    phone: '0934 991 220',
                    package_name: 'Gym Cơ bản 1 tháng',
                    package_type: 'GYM',
                    duration: 30,
                    amount: 500000,
                    created_date: '26/08/2026',
                    created_time: '16:45',
                    transfer_code: 'VF102814',
                    status: 'refunded',
                    transaction_id: 'VCB260826164545',
                    paid_at: '26/08/2026 · 16:48'
                }
            ]
        }
    },

    computed: {
        filteredInvoices() {
            return this.list_invoice.filter((invoice) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    invoice.id.toLowerCase().includes(keyword) ||
                    invoice.gymmer.toLowerCase().includes(keyword) ||
                    invoice.phone.includes(keyword);

                const matchStatus =
                    !this.statusFilter ||
                    invoice.status === this.statusFilter;

                const matchPackage =
                    !this.packageFilter ||
                    invoice.package_type === this.packageFilter;

                return matchSearch && matchStatus && matchPackage;
            });
        },

        countPaid() {
            return this.list_invoice.filter(
                item => item.status === 'paid'
            ).length;
        },

        countPending() {
            return this.list_invoice.filter(
                item => item.status === 'pending'
            ).length;
        },

        totalRevenue() {
            return this.list_invoice
                .filter(item => item.status === 'paid')
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
            if (status === 'pending') return 'Chờ thanh toán';
            if (status === 'paid') return 'Đã thanh toán';
            if (status === 'overdue') return 'Quá hạn';
            if (status === 'cancelled') return 'Đã hủy';
            if (status === 'refunded') return 'Đã hoàn tiền';

            return status;
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

        openDetail(invoice) {
            this.selectedInvoice = invoice;
            this.showDetail = true;
        },

        closeDetail() {
            this.showDetail = false;
            this.selectedInvoice = null;
        },

        markPaid() {
            if (!this.selectedInvoice) {
                return;
            }

            this.selectedInvoice.status = 'paid';
            this.selectedInvoice.transaction_id =
                'VCB' + Date.now().toString().slice(-12);

            this.selectedInvoice.paid_at =
                '02/09/2026 · 11:50';
        },

        printInvoice() {
            window.print();
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

.btn-create {
    padding: 10px 15px;
    border: none;
    border-radius: 11px;
    background: #0d7f8d;
    color: white;
    font-size: 11px;
    font-weight: 700;
}

.btn-create:hover {
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

.invoice-table {
    width: 100%;
    border-collapse: collapse;
}

.invoice-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.invoice-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #456a70;
    font-size: 10.5px;
}

.invoice-table tbody tr {
    transition: 0.15s ease;
}

.invoice-table tbody tr:hover {
    background: #f5fcfd;
}

.invoice-code strong,
.invoice-code span {
    display: block;
}

.invoice-code strong {
    color: #11343a;
    font-size: 10.5px;
}

.invoice-code span {
    margin-top: 3px;
    color: #8aa7ab;
    font-size: 8px;
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
    font-size: 8.5px;
}

.package-type {
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
    color: #456a70;
    font-size: 9.5px;
}

.amount {
    color: #075e68;
    font-size: 11px;
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

.status.pending {
    background: #fff4df;
    color: #a76b1d;
}

.status.paid {
    background: #e4f7ef;
    color: #2c7c60;
}

.status.overdue {
    background: #feecec;
    color: #b94f4f;
}

.status.cancelled {
    background: #f1f5f9;
    color: #64748b;
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
    background: rgba(8, 58, 64, 0.2);
    backdrop-filter: blur(4px);
}

.invoice-modal {
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

.invoice-status-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px;
    border: 1px solid #d8eef1;
    border-radius: 13px;
    background: #f8fdfe;
}

.invoice-status-box > div > span,
.invoice-status-box > div > strong {
    display: block;
}

.invoice-status-box > div > span {
    color: #71949a;
    font-size: 8.5px;
}

.invoice-status-box > div > strong {
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

.payment-info {
    border: 1px solid #e2eff1;
    border-radius: 12px;
    overflow: hidden;
}

.info-row {
    display: flex;
    justify-content: space-between;
    gap: 15px;
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

.total-box {
    margin-top: 17px;
    padding: 14px;
    border-radius: 13px;
    background: #effbfc;
}

.total-box span,
.total-box strong {
    display: block;
}

.total-box span {
    color: #71949a;
    font-size: 8.5px;
}

.total-box strong {
    margin-top: 4px;
    color: #075e68;
    font-size: 22px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
}

.btn-cancel,
.btn-print,
.btn-paid {
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

.btn-print {
    border: 1px solid #9ed9df;
    background: white;
    color: #0d7f8d;
}

.btn-paid {
    border: 1px solid #0d7f8d;
    background: #0d7f8d;
    color: white;
}

.btn-paid:hover {
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