<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Bán gói tại quầy</h2>
                <p>Tạo hóa đơn và thanh toán gói tập cho Gymmer</p>
            </div>

            <button class="btn-history" @click="$router.push('/admin/hoa-don')">
                Xem hóa đơn
            </button>
        </div>

        <div class="sale-layout">
            <div class="sale-main">
                <div class="section-card">
                    <div class="section-title">
                        <div class="step">1</div>
                        <div>
                            <h3>Chọn Gymmer</h3>
                            <p>Tìm người mua gói tập</p>
                        </div>
                    </div>

                    <div class="search-box">
                        <span>⌕</span>
                        <input
                            v-model="gymmerSearch"
                            type="text"
                            placeholder="Tìm theo tên hoặc số điện thoại..."
                        >
                    </div>

                    <div class="gymmer-list">
                        <button
                            v-for="gymmer in filteredGymmers"
                            :key="gymmer.id"
                            class="gymmer-item"
                            :class="{ active: selectedGymmer?.id === gymmer.id }"
                            @click="selectedGymmer = gymmer"
                        >
                            <div class="avatar">
                                {{ getInitial(gymmer.ho_ten) }}
                            </div>

                            <div class="gymmer-info">
                                <strong>{{ gymmer.ho_ten }}</strong>
                                <span>{{ gymmer.so_dien_thoai }}</span>
                            </div>

                            <span class="gymmer-code">
                                #GM{{ gymmer.id }}
                            </span>
                        </button>
                    </div>
                </div>

                <div class="section-card">
                    <div class="section-title">
                        <div class="step">2</div>
                        <div>
                            <h3>Chọn gói tập</h3>
                            <p>Chọn gói muốn đăng ký cho Gymmer</p>
                        </div>
                    </div>

                    <div class="package-grid">
                        <button
                            v-for="goi in list_goi_tap"
                            :key="goi.id"
                            class="package-item"
                            :class="{ active: selectedPackage?.id === goi.id }"
                            @click="selectedPackage = goi"
                        >
                            <div class="package-head">
                                <span>{{ goi.loai }}</span>

                                <div
                                    v-if="selectedPackage?.id === goi.id"
                                    class="selected-check"
                                >
                                    ✓
                                </div>
                            </div>

                            <h4>{{ goi.ten_goi }}</h4>

                            <div class="package-price">
                                {{ formatMoney(goi.gia) }}
                                <span>VNĐ</span>
                            </div>

                            <p>{{ goi.thoi_han }} ngày sử dụng</p>

                            <div class="benefits">
                                <span>✓ Tập tại phòng Gym</span>
                                <span v-if="goi.co_ai">✓ Phân tích AI</span>
                                <span v-if="goi.so_buoi_pt">
                                    ✓ {{ goi.so_buoi_pt }} buổi PT
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div class="checkout-card">
                <div class="checkout-header">
                    <span>ĐƠN HÀNG</span>
                    <h3>Thông tin thanh toán</h3>
                </div>

                <div class="checkout-section">
                    <span class="label">Gymmer</span>

                    <div v-if="selectedGymmer" class="selected-user">
                        <div class="avatar">
                            {{ getInitial(selectedGymmer.ho_ten) }}
                        </div>

                        <div>
                            <strong>{{ selectedGymmer.ho_ten }}</strong>
                            <span>{{ selectedGymmer.so_dien_thoai }}</span>
                        </div>
                    </div>

                    <div v-else class="empty-select">
                        Chưa chọn Gymmer
                    </div>
                </div>

                <div class="checkout-section">
                    <span class="label">Gói tập</span>

                    <div v-if="selectedPackage" class="selected-package">
                        <div>
                            <strong>{{ selectedPackage.ten_goi }}</strong>
                            <span>{{ selectedPackage.thoi_han }} ngày</span>
                        </div>

                        <b>{{ formatMoney(selectedPackage.gia) }}đ</b>
                    </div>

                    <div v-else class="empty-select">
                        Chưa chọn gói tập
                    </div>
                </div>

                <div class="divider"></div>

                <div class="price-row">
                    <span>Tạm tính</span>
                    <strong>{{ formatMoney(subtotal) }}đ</strong>
                </div>

                <div class="price-row">
                    <span>Giảm giá</span>
                    <strong>{{ formatMoney(discount) }}đ</strong>
                </div>

                <div class="discount-box">
                    <input
                        v-model.number="discount"
                        type="number"
                        min="0"
                        :max="subtotal"
                        placeholder="Nhập số tiền giảm"
                    >
                </div>

                <div class="total-row">
                    <span>Tổng thanh toán</span>
                    <strong>{{ formatMoney(total) }}đ</strong>
                </div>

                <button
                    class="btn-create"
                    :disabled="!canCreateInvoice"
                    @click="createInvoice"
                >
                    Tạo hóa đơn & QR
                </button>
            </div>
        </div>

        <div
            v-if="showInvoice"
            class="modal-overlay"
            @click.self="closeInvoice"
        >
            <div class="invoice-modal">
                <div class="modal-header">
                    <div>
                        <span>VISIONFIT PAYMENT</span>
                        <h3>Hóa đơn #{{ invoice.id }}</h3>
                        <p>Đang chờ thanh toán</p>
                    </div>

                    <button class="btn-close" @click="closeInvoice">
                        ×
                    </button>
                </div>

                <div class="invoice-layout">
                    <div class="qr-section">
                        <div class="qr-box">
                            <div class="qr-pattern">
                                <span v-for="n in 81" :key="n"></span>
                            </div>
                        </div>

                        <strong>Quét QR để thanh toán</strong>
                        <p>Nội dung chuyển khoản</p>

                        <div class="transfer-code">
                            {{ invoice.transfer_code }}
                        </div>
                    </div>

                    <div class="invoice-info">
                        <div class="info-row">
                            <span>Khách hàng</span>
                            <strong>{{ selectedGymmer?.ho_ten }}</strong>
                        </div>

                        <div class="info-row">
                            <span>Gói tập</span>
                            <strong>{{ selectedPackage?.ten_goi }}</strong>
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

                        <div class="invoice-total">
                            <span>Số tiền cần thanh toán</span>
                            <strong>{{ formatMoney(invoice.amount) }}đ</strong>
                        </div>

                        <div
                            class="payment-status"
                            :class="invoice.status"
                        >
                            <span class="status-dot"></span>
                            {{ invoice.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán' }}
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="printInvoice">
                        🖨 In phiếu
                    </button>

                    <button
                        v-if="invoice.status === 'pending'"
                        class="btn-payment"
                        @click="simulatePayment"
                    >
                        Demo: Xác nhận đã thanh toán
                    </button>

                    <button
                        v-else
                        class="btn-paid"
                        @click="closeInvoice"
                    >
                        Hoàn tất
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminBanGoi",

    data() {
        return {
            gymmerSearch: '',
            selectedGymmer: null,
            selectedPackage: null,
            discount: 0,
            showInvoice: false,

            invoice: {
                id: '',
                amount: 0,
                transfer_code: '',
                status: 'pending'
            },

            list_gymmer: [
                {
                    id: '00128',
                    ho_ten: 'Nguyễn Minh Anh',
                    so_dien_thoai: '0905 221 889'
                },
                {
                    id: '00127',
                    ho_ten: 'Phạm Gia Hân',
                    so_dien_thoai: '0935 440 120'
                },
                {
                    id: '00122',
                    ho_ten: 'Võ Thanh Tùng',
                    so_dien_thoai: '0777 109 333'
                },
                {
                    id: '00119',
                    ho_ten: 'Hoàng Ngọc Vy',
                    so_dien_thoai: '0914 672 018'
                }
            ],

            list_goi_tap: [
                {
                    id: 1,
                    ten_goi: 'Gym Cơ bản 1 tháng',
                    loai: 'GYM',
                    gia: 500000,
                    thoi_han: 30,
                    co_ai: false,
                    so_buoi_pt: 0
                },
                {
                    id: 2,
                    ten_goi: 'Gym + AI 1 tháng',
                    loai: 'GYM + AI',
                    gia: 850000,
                    thoi_han: 30,
                    co_ai: true,
                    so_buoi_pt: 0
                },
                {
                    id: 3,
                    ten_goi: 'Gym + AI 3 tháng',
                    loai: 'GYM + AI',
                    gia: 2200000,
                    thoi_han: 90,
                    co_ai: true,
                    so_buoi_pt: 0
                },
                {
                    id: 4,
                    ten_goi: 'Personal Trainer 12 buổi',
                    loai: 'PT',
                    gia: 3600000,
                    thoi_han: 60,
                    co_ai: true,
                    so_buoi_pt: 12
                }
            ]
        }
    },

    computed: {
        filteredGymmers() {
            const keyword = this.gymmerSearch.toLowerCase();

            return this.list_gymmer.filter((gymmer) => {
                return (
                    gymmer.ho_ten.toLowerCase().includes(keyword) ||
                    gymmer.so_dien_thoai.includes(keyword)
                );
            });
        },

        subtotal() {
            return this.selectedPackage?.gia || 0;
        },

        total() {
            return Math.max(
                0,
                this.subtotal - Number(this.discount || 0)
            );
        },

        canCreateInvoice() {
            return this.selectedGymmer && this.selectedPackage;
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

        createInvoice() {
            if (!this.canCreateInvoice) {
                return;
            }

            const id = Date.now().toString().slice(-6);

            this.invoice = {
                id: `INV${id}`,
                amount: this.total,
                transfer_code: `VF${id}`,
                status: 'pending'
            };

            this.showInvoice = true;
        },

        simulatePayment() {
            this.invoice.status = 'paid';
        },

        closeInvoice() {
            this.showInvoice = false;
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

.btn-history {
    padding: 9px 14px;
    border: 1px solid #9ed9df;
    border-radius: 10px;
    background: white;
    color: #0d7f8d;
    font-size: 10.5px;
    font-weight: 700;
}

.btn-history:hover {
    background: #dff6f8;
}

.sale-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 16px;
    align-items: start;
}

.sale-main {
    display: grid;
    gap: 16px;
}

.section-card,
.checkout-card {
    padding: 18px;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    background: white;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.05);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.step {
    width: 31px;
    height: 31px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #0d7f8d;
    color: white;
    font-size: 11px;
    font-weight: 800;
}

.section-title h3,
.checkout-header h3 {
    margin: 0;
    color: #11343a;
    font-size: 13px;
}

.section-title p {
    margin: 3px 0 0;
    color: #71949a;
    font-size: 9.5px;
}

.search-box {
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

.gymmer-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 9px;
    margin-top: 12px;
}

.gymmer-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px;
    border: 1px solid #d8eef1;
    border-radius: 12px;
    background: white;
    text-align: left;
    transition: 0.15s ease;
}

.gymmer-item:hover {
    background: #f5fcfd;
    border-color: #9ed9df;
}

.gymmer-item.active {
    border-color: #0d7f8d;
    background: #effbfc;
    box-shadow: 0 0 0 2px rgba(13, 127, 141, 0.08);
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

.gymmer-info {
    flex: 1;
}

.gymmer-info strong,
.gymmer-info span {
    display: block;
}

.gymmer-info strong {
    color: #11343a;
    font-size: 10.5px;
}

.gymmer-info span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.gymmer-code {
    color: #94afb3;
    font-size: 8px;
}

.package-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.package-item {
    position: relative;
    padding: 15px;
    border: 1px solid #d8eef1;
    border-radius: 14px;
    background: white;
    text-align: left;
    transition: 0.16s ease;
}

.package-item:hover {
    border-color: #9ed9df;
    transform: translateY(-1px);
}

.package-item.active {
    border-color: #0d7f8d;
    background: #f0fbfc;
    box-shadow: 0 0 0 2px rgba(13, 127, 141, 0.08);
}

.package-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.package-head > span {
    color: #0d7f8d;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.7px;
}

.selected-check {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #0d7f8d;
    color: white;
    font-size: 9px;
}

.package-item h4 {
    margin: 8px 0 0;
    color: #11343a;
    font-size: 12px;
}

.package-price {
    margin-top: 12px;
    color: #075e68;
    font-size: 18px;
    font-weight: 800;
}

.package-price span {
    color: #71949a;
    font-size: 7.5px;
    font-weight: 600;
}

.package-item > p {
    margin: 3px 0 0;
    color: #8aa7ab;
    font-size: 8.5px;
}

.benefits {
    display: grid;
    gap: 5px;
    margin-top: 11px;
    padding-top: 10px;
    border-top: 1px solid #edf6f7;
}

.benefits span {
    color: #597d82;
    font-size: 8.5px;
}

.checkout-card {
    position: sticky;
    top: 95px;
}

.checkout-header {
    padding-bottom: 13px;
    border-bottom: 1px solid #e6f1f3;
}

.checkout-header > span {
    color: #0d7f8d;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1px;
}

.checkout-header h3 {
    margin-top: 3px;
    font-size: 15px;
}

.checkout-section {
    padding: 14px 0;
    border-bottom: 1px solid #eef6f7;
}

.label {
    display: block;
    margin-bottom: 8px;
    color: #71949a;
    font-size: 8.5px;
    font-weight: 700;
}

.selected-user {
    display: flex;
    align-items: center;
    gap: 9px;
}

.selected-user strong,
.selected-user span {
    display: block;
}

.selected-user strong {
    color: #11343a;
    font-size: 10.5px;
}

.selected-user span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.selected-package {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.selected-package strong,
.selected-package span {
    display: block;
}

.selected-package strong {
    color: #11343a;
    font-size: 10px;
}

.selected-package span {
    margin-top: 3px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.selected-package b {
    color: #075e68;
    font-size: 10px;
}

.empty-select {
    padding: 10px;
    border-radius: 9px;
    background: #f7fcfd;
    color: #94afb3;
    font-size: 9px;
    text-align: center;
}

.price-row,
.total-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.price-row {
    margin-top: 11px;
    color: #71949a;
    font-size: 9.5px;
}

.price-row strong {
    color: #456a70;
}

.discount-box {
    margin-top: 8px;
}

.discount-box input {
    width: 100%;
    height: 36px;
    padding: 0 10px;
    border: 1px solid #d3e9ec;
    border-radius: 9px;
    outline: none;
    color: #11343a;
    font-size: 10px;
}

.discount-box input:focus {
    border-color: #0d7f8d;
}

.total-row {
    align-items: center;
    margin-top: 17px;
    padding-top: 14px;
    border-top: 1px solid #d8eef1;
}

.total-row span {
    color: #11343a;
    font-size: 11px;
    font-weight: 700;
}

.total-row strong {
    color: #075e68;
    font-size: 20px;
}

.btn-create {
    width: 100%;
    height: 43px;
    margin-top: 15px;
    border: none;
    border-radius: 11px;
    background: #0d7f8d;
    color: white;
    font-size: 10.5px;
    font-weight: 750;
}

.btn-create:hover:not(:disabled) {
    background: #075e68;
}

.btn-create:disabled {
    cursor: not-allowed;
    background: #b9d4d7;
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
    width: 700px;
    max-width: 100%;
    padding: 22px;
    border: 1px solid #9ed9df;
    border-radius: 22px;
    background: white;
    box-shadow: 0 20px 50px rgba(13, 127, 141, 0.18);
    animation: showModal 0.2s ease;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 18px;
}

.modal-header span {
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
    margin: 4px 0 0;
    color: #a76b1d;
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

.invoice-layout {
    display: grid;
    grid-template-columns: 230px 1fr;
    gap: 18px;
}

.qr-section {
    padding: 15px;
    border: 1px solid #d8eef1;
    border-radius: 15px;
    background: #f9fdfe;
    text-align: center;
}

.qr-box {
    width: 160px;
    height: 160px;
    margin: 0 auto 10px;
    padding: 9px;
    border-radius: 10px;
    background: white;
    border: 1px solid #d8eef1;
}

.qr-pattern {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 2px;
}

.qr-pattern span {
    background: #11343a;
}

.qr-pattern span:nth-child(3n),
.qr-pattern span:nth-child(5n) {
    background: white;
}

.qr-section > strong {
    color: #11343a;
    font-size: 10.5px;
}

.qr-section > p {
    margin: 7px 0 4px;
    color: #71949a;
    font-size: 8px;
}

.transfer-code {
    padding: 7px;
    border-radius: 8px;
    background: #dff6f8;
    color: #075e68;
    font-size: 12px;
    font-weight: 800;
}

.invoice-info {
    padding: 4px 0;
}

.info-row {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 9px 0;
    border-bottom: 1px solid #eef6f7;
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

.invoice-total {
    margin-top: 13px;
    padding: 12px;
    border-radius: 11px;
    background: #effbfc;
}

.invoice-total span,
.invoice-total strong {
    display: block;
}

.invoice-total span {
    color: #71949a;
    font-size: 8.5px;
}

.invoice-total strong {
    margin-top: 4px;
    color: #075e68;
    font-size: 21px;
}

.payment-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 700;
}

.payment-status.pending {
    background: #fff4df;
    color: #a76b1d;
}

.payment-status.paid {
    background: #e4f7ef;
    color: #2c7c60;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    margin-top: 18px;
}

.btn-cancel,
.btn-payment,
.btn-paid {
    padding: 9px 14px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
}

.btn-cancel {
    border: 1px solid #9ed9df;
    background: white;
    color: #0d7f8d;
}

.btn-payment {
    border: 1px solid #0d7f8d;
    background: #0d7f8d;
    color: white;
}

.btn-paid {
    border: 1px solid #2c7c60;
    background: #2c7c60;
    color: white;
}

@keyframes showModal {
    from {
        opacity: 0;
        transform: scale(0.97);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@media (max-width: 1050px) {
    .sale-layout {
        grid-template-columns: 1fr;
    }

    .checkout-card {
        position: static;
    }
}
</style>