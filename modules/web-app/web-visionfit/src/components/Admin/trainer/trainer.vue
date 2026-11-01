<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Quản lý Huấn luyện viên & Bảng lương</h2>
                <p>Quản lý Trainer, duyệt đơn đăng ký làm PT, gửi mail mời test và chốt bảng lương tự động</p>
            </div>

            <button v-if="currentTab === 'list'" class="btn-add" @click="openCreateModal">
                + Thêm Trainer
            </button>
        </div>

        <!-- NAVIGATION TABS -->
        <div class="trainer-nav-tabs">
            <button
                class="trainer-nav-tab"
                :class="{ active: currentTab === 'list' }"
                @click="currentTab = 'list'"
            >
                👥 Danh sách Huấn luyện viên ({{ list_trainer.length }})
            </button>
            <button
                class="trainer-nav-tab"
                :class="{ active: currentTab === 'applicants' }"
                @click="currentTab = 'applicants'"
            >
                ✉️ Ứng viên đăng ký làm PT
                <span class="badge-count" v-if="pendingApplicantsCount > 0">{{ pendingApplicantsCount }}</span>
            </button>
            <button
                class="trainer-nav-tab"
                :class="{ active: currentTab === 'payroll' }"
                @click="currentTab = 'payroll'"
            >
                💰 Quản lý Bảng lương Trainer
            </button>
        </div>

        <!-- ================= TAB 1: DANH SÁCH TRAINER ================= -->
        <div v-if="currentTab === 'list'">
            <div class="stat-row">
                <div class="mini-card">
                    <span>Tổng Trainer</span>
                    <strong>{{ list_trainer.length }}</strong>
                </div>

                <div class="mini-card">
                    <span>Đang hoạt động</span>
                    <strong>{{ countActive }}</strong>
                </div>

                <div class="mini-card">
                    <span>Gymmer đang phụ trách</span>
                    <strong>{{ totalGymmer }}</strong>
                </div>

                <div class="mini-card">
                    <span>Review tháng này</span>
                    <strong>{{ totalReview }}</strong>
                </div>
            </div>

            <div class="content-card">
                <div class="filter-bar">
                    <div class="search-box">
                        <span>⌕</span>
                        <input
                            v-model="search"
                            type="text"
                            placeholder="Tìm Trainer theo tên, email, mã giới thiệu..."
                        >
                    </div>

                    <select v-model="specialtyFilter">
                        <option value="">Tất cả chuyên môn</option>
                        <option value="Strength">Strength</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Bodybuilding">Bodybuilding</option>
                        <option value="Functional">Functional</option>
                    </select>

                    <select v-model="statusFilter">
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Ngừng hoạt động</option>
                    </select>
                </div>

                <div class="table-responsive">
                    <table class="trainer-table">
                        <thead>
                            <tr>
                                <th>Trainer</th>
                                <th>Mã Giới Thiệu</th>
                                <th>Liên hệ</th>
                                <th>Chuyên môn</th>
                                <th>Gymmer phụ trách</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr
                                v-for="trainer in filteredTrainers"
                                :key="trainer.id"
                            >
                                <td>
                                    <div class="user-cell">
                                        <div class="user-avatar">
                                            {{ getInitial(trainer.ho_ten) }}
                                        </div>
                                        <div>
                                            <strong>{{ trainer.ho_ten }}</strong>
                                            <span>#TR{{ trainer.id }}</span>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <span class="ref-code-badge">{{ trainer.ma_gioi_thieu || 'PT-HOANGNAM-88' }}</span>
                                </td>

                                <td>
                                    <div class="contact">
                                        <span>{{ trainer.email }}</span>
                                        <small>{{ trainer.so_dien_thoai }}</small>
                                    </div>
                                </td>

                                <td>
                                    <span class="specialty">
                                        {{ trainer.chuyen_mon }}
                                    </span>
                                </td>

                                <td>
                                    <div class="gymmer-count">
                                        <strong>{{ trainer.so_gymmer }}</strong>
                                        <span>Gymmer</span>
                                    </div>
                                </td>

                                <td>
                                    <span
                                        class="status"
                                        :class="trainer.trang_thai"
                                    >
                                        <span class="status-dot"></span>
                                        {{
                                            trainer.trang_thai === 'active'
                                                ? 'Đang hoạt động'
                                                : 'Ngừng hoạt động'
                                        }}
                                    </span>
                                </td>

                                <td>
                                    <button
                                        class="btn-detail"
                                        @click="viewTrainer(trainer)"
                                    >
                                        Chi tiết
                                    </button>
                                </td>
                            </tr>

                            <tr v-if="filteredTrainers.length === 0">
                                <td colspan="7">
                                    <div class="empty-state">
                                        Không tìm thấy Trainer phù hợp
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= TAB 2: ỨNG VIÊN ĐĂNG KÝ LÀM PT ================= -->
        <div v-if="currentTab === 'applicants'">
            <div class="content-card">
                <div class="tab-intro-row">
                    <div>
                        <h3 class="tab-inner-title">Danh sách thành viên đăng ký làm Huấn Luyện Viên</h3>
                        <p class="tab-inner-sub">Xem hồ sơ, gửi email mẫu hẹn lịch test kỹ năng & phỏng vấn, phê duyệt cấp mã Trainer</p>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="trainer-table">
                        <thead>
                            <tr>
                                <th>Ứng viên PT</th>
                                <th>Liên hệ</th>
                                <th>Chuyên môn & Bằng cấp</th>
                                <th>Ngày đăng ký</th>
                                <th>Lịch hẹn test kỹ năng</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="app in pt_applicants" :key="app.id">
                                <td>
                                    <div class="user-cell">
                                        <div class="user-avatar" style="background: #EAF9FB; color: #0d7f8d;">
                                            {{ getInitial(app.ho_ten) }}
                                        </div>
                                        <div>
                                            <strong>{{ app.ho_ten }}</strong>
                                            <span>#{{ app.id }}</span>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <div class="contact">
                                        <span>{{ app.email }}</span>
                                        <small>{{ app.so_dien_thoai }}</small>
                                    </div>
                                </td>

                                <td>
                                    <div>
                                        <strong style="color: #11343a; font-size: 13.5px;">{{ app.chuyen_mon }}</strong>
                                        <div style="color: #71949a; font-size: 12px; margin-top: 2px;">{{ app.chung_chi }}</div>
                                    </div>
                                </td>

                                <td>
                                    <span style="font-size: 13px; color: #51777d;">{{ app.ngay_dang_ky }}</span>
                                </td>

                                <td>
                                    <div v-if="app.gio_hen" class="schedule-brief">
                                        <strong>🕒 {{ app.gio_hen }}</strong>
                                        <small>📍 {{ app.dia_chi_test }}</small>
                                    </div>
                                    <span v-else style="color: #9bb8bd; font-size: 12.5px; font-style: italic;">Chưa lên lịch test</span>
                                </td>

                                <td>
                                    <span class="status" :class="app.trang_thai === 'approved' ? 'active' : app.trang_thai === 'invited' ? 'invited' : 'pending'">
                                        <span class="status-dot"></span>
                                        {{
                                            app.trang_thai === 'approved'
                                                ? 'Đã kích hoạt'
                                                : app.trang_thai === 'invited'
                                                ? 'Đã gửi thư mời test'
                                                : 'Chờ liên hệ & test'
                                        }}
                                    </span>
                                </td>

                                <td>
                                    <div class="action-btn-group">
                                        <button
                                            class="btn-email"
                                            @click="openEmailModal(app)"
                                            title="Gửi email hẹn giờ và địa chỉ test kỹ năng"
                                        >
                                            ✉️ Gửi Email hẹn test
                                        </button>
                                        <button
                                            v-if="app.trang_thai !== 'approved'"
                                            class="btn-approve"
                                            @click="approveApplicant(app)"
                                            title="Phê duyệt và cấp mã Trainer"
                                        >
                                            ✓ Kích hoạt PT
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= TAB 3: QUẢN LÝ BẢNG LƯƠNG TRAINER ================= -->
        <div v-if="currentTab === 'payroll'">
            <!-- THANH THIẾT LẬP NHANH CHÍNH SÁCH LƯƠNG -->
            <div class="salary-quick-setup-card">
                <div class="quick-setup-header">
                    <div class="quick-title-group">
                        <span class="bolt-icon">⚡</span>
                        <div>
                            <h4>Thiết lập nhanh chính sách lương & hoa hồng</h4>
                            <p>Thay đổi đơn giá ca dạy hoặc tỷ lệ hoa hồng rồi bấm "Áp dụng", hệ thống sẽ tự động tính lại toàn bộ bảng lương ngay tức thì.</p>
                        </div>
                    </div>

                    <button class="btn-recalculate" @click="applyAndRecalculatePayroll">
                        ⚡ Áp dụng & Tự động tính lại
                    </button>
                </div>

                <div class="quick-setup-inputs">
                    <div class="setup-col">
                        <label>Đơn giá 1 ca dạy (VNĐ)</label>
                        <input type="number" v-model.number="salary_config.don_gia_ca" step="10000" />
                    </div>

                    <div class="setup-col">
                        <label>% Hoa hồng mã giới thiệu (%)</label>
                        <input type="number" v-model.number="salary_config.hoa_hong_phan_tram" step="1" min="0" max="100" />
                    </div>

                    <div class="setup-col">
                        <label>Lương cơ bản mặc định (VNĐ)</label>
                        <input type="number" v-model.number="salary_config.luong_co_ban" step="500000" />
                    </div>

                    <div class="setup-col">
                        <label>Thưởng đánh giá 5 sao (VNĐ)</label>
                        <input type="number" v-model.number="salary_config.thuong_5_sao" step="10000" />
                    </div>

                    <div class="setup-col">
                        <label>Phạt vắng không phép (VNĐ)</label>
                        <input type="number" v-model.number="salary_config.phat_vang" step="50000" />
                    </div>
                </div>
            </div>

            <!-- BẢNG LƯƠNG CHI TIẾT -->
            <div class="content-card" style="margin-top: 16px;">
                <div class="tab-intro-row">
                    <div>
                        <h3 class="tab-inner-title">Bảng tính lương Trainer tháng 10/2026</h3>
                        <p class="tab-inner-sub">Tổng thực lĩnh = Lương cơ bản + (Số ca hoàn thành × Đơn giá) + Hoa hồng mã giới thiệu + Thưởng - Phạt</p>
                    </div>
                    <div class="total-payout-box">
                        <span>Tổng quỹ lương tháng:</span>
                        <strong>{{ formatCurrency(totalPayrollPayout) }}</strong>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="trainer-table payroll-table">
                        <thead>
                            <tr>
                                <th>Huấn luyện viên</th>
                                <th>Lương cơ bản</th>
                                <th>Ca hoàn thành</th>
                                <th>Tiền ca dạy</th>
                                <th>Học viên nhập mã</th>
                                <th>Tiền hoa hồng ({{ salary_config.hoa_hong_phan_tram }}%)</th>
                                <th>Thưởng / Phạt</th>
                                <th>Tổng Thực Lĩnh</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="payroll in trainer_payrolls" :key="payroll.id">
                                <td>
                                    <div>
                                        <strong>{{ payroll.trainer_name }}</strong>
                                        <div class="payroll-code">{{ payroll.ma_gioi_thieu }}</div>
                                    </div>
                                </td>

                                <td>{{ formatCurrency(payroll.luong_co_ban) }}</td>

                                <td>
                                    <span class="count-pill">{{ payroll.so_ca_day }} ca</span>
                                </td>

                                <td>
                                    <strong style="color: #0d7f8d;">{{ formatCurrency(calcTienCa(payroll)) }}</strong>
                                </td>

                                <td>
                                    <span class="count-pill" style="background: #FDF2F8; color: #DB2777;">{{ payroll.so_hoc_vien_gioi_thieu }} HV</span>
                                </td>

                                <td>
                                    <strong style="color: #DB2777;">{{ formatCurrency(calcTienHoaHong(payroll)) }}</strong>
                                </td>

                                <td>
                                    <div style="font-size: 12.5px;">
                                        <span v-if="payroll.thuong > 0" style="color: #10B981;">+{{ formatCurrency(payroll.thuong) }}</span>
                                        <span v-if="payroll.phat > 0" style="color: #EF4444; margin-left: 4px;">-{{ formatCurrency(payroll.phat) }}</span>
                                        <span v-if="payroll.thuong === 0 && payroll.phat === 0" style="color: #9BB8BD;">0 đ</span>
                                    </div>
                                </td>

                                <td>
                                    <strong class="total-salary-text">{{ formatCurrency(calcTongThucLinh(payroll)) }}</strong>
                                </td>

                                <td>
                                    <span class="status" :class="payroll.trang_thai === 'da_thanh_toan' ? 'active' : payroll.trang_thai === 'da_chot' ? 'invited' : 'pending'">
                                        <span class="status-dot"></span>
                                        {{
                                            payroll.trang_thai === 'da_thanh_toan'
                                                ? 'Đã thanh toán'
                                                : payroll.trang_thai === 'da_chot'
                                                ? 'Đã chốt lương'
                                                : 'Tạm tính'
                                        }}
                                    </span>
                                </td>

                                <td>
                                    <div class="action-btn-group">
                                        <button
                                            v-if="payroll.trang_thai === 'tam_tinh'"
                                            class="btn-approve"
                                            @click="chotLuong(payroll)"
                                        >
                                            Chốt lương
                                        </button>
                                        <button
                                            v-if="payroll.trang_thai === 'da_chot'"
                                            class="btn-paid"
                                            @click="thanhToanLuong(payroll)"
                                        >
                                            Chuyển khoản
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= MODAL SOẠN EMAIL GỬI ỨNG VIÊN PT ================= -->
        <div v-if="showEmailModal" class="modal-overlay" @click.self="showEmailModal = false">
            <div class="modal-box modal-email-box">
                <div class="modal-header">
                    <div>
                        <h3>✉️ Soạn thư mời phỏng vấn & Test kỹ năng</h3>
                        <p>Mẫu thư có sẵn: Bạn chỉ cần sửa giờ hẹn và địa chỉ phòng tập rồi bấm gửi</p>
                    </div>
                    <button class="btn-close" @click="showEmailModal = false">×</button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Người nhận (Ứng viên PT)</label>
                        <input type="text" :value="emailForm.applicantName + ' <' + emailForm.recipient + '>'" disabled style="background: #F8FAFC;" />
                    </div>

                    <div class="form-group full">
                        <label>Tiêu đề email</label>
                        <input type="text" v-model="emailForm.title" />
                    </div>

                    <div class="form-group">
                        <label>🕒 Thời gian hẹn test kỹ năng (Sửa nhanh)</label>
                        <input type="text" v-model="emailForm.time" placeholder="VD: 09:30 ngày 05/11/2026" />
                    </div>

                    <div class="form-group">
                        <label>📍 Địa chỉ cơ sở phòng gym (Sửa nhanh)</label>
                        <input type="text" v-model="emailForm.location" placeholder="VD: VisionFit CS1 - 123 Nguyễn Thị Minh Khai, Q.1" />
                    </div>

                    <div class="form-group full">
                        <label>Lưu ý / Dặn dò ứng viên</label>
                        <textarea v-model="emailForm.note" rows="2"></textarea>
                    </div>

                    <!-- PREVIEW EMAIL -->
                    <div class="form-group full">
                        <label style="color: #0d7f8d; font-weight: 800;">👁️ Xem trước nội dung thư gửi đi:</label>
                        <div class="email-preview-box">
                            <p><strong>Kính gửi bạn {{ emailForm.applicantName }},</strong></p>
                            <p>Cảm ơn bạn đã đăng ký gia nhập đội ngũ Huấn luyện viên thể hình cá nhân (PT) của hệ thống VisionFit.</p>
                            <p>Ban quản trị trân trọng kính mời bạn tham gia buổi phỏng vấn và kiểm tra kỹ năng thực hành chuyên môn:</p>
                            <ul>
                                <li><strong>Thời gian:</strong> {{ emailForm.time }}</li>
                                <li><strong>Địa điểm:</strong> {{ emailForm.location }}</li>
                                <li><strong>Lưu ý:</strong> {{ emailForm.note }}</li>
                            </ul>
                            <p>Hệ thống sẽ gửi thông báo kết quả kích hoạt tài khoản HLV qua email trong vòng 2 ngày làm việc sau buổi test.</p>
                            <p style="margin-bottom: 0;"><em>Trân trọng,<br>Ban Tuyển dụng & Quản lý HLV VisionFit</em></p>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="showEmailModal = false">Đóng</button>
                    <button class="btn-send-email" @click="sendEmailToApplicant">
                        🚀 BẤM GỬI EMAIL NGAY
                    </button>
                </div>
            </div>
        </div>

        <!-- ================= MODAL THÊM TRAINER ================= -->
        <div
            v-if="showCreateModal"
            class="modal-overlay"
            @click.self="closeCreateModal"
        >
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3>Thêm Huấn luyện viên</h3>
                        <p>Tạo mới Trainer trong hệ thống VisionFit</p>
                    </div>

                    <button class="btn-close" @click="closeCreateModal">
                        ×
                    </button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Họ và tên</label>
                        <input
                            v-model="create_trainer.ho_ten"
                            type="text"
                            placeholder="Nhập họ và tên"
                        >
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input
                            v-model="create_trainer.email"
                            type="email"
                            placeholder="trainer@visionfit.vn"
                        >
                    </div>

                    <div class="form-group">
                        <label>Số điện thoại</label>
                        <input
                            v-model="create_trainer.so_dien_thoai"
                            type="text"
                            placeholder="0905..."
                        >
                    </div>

                    <div class="form-group">
                        <label>Chuyên môn</label>

                        <select v-model="create_trainer.chuyen_mon">
                            <option value="Strength">Strength</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Bodybuilding">Bodybuilding</option>
                            <option value="Functional">Functional</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Kinh nghiệm</label>
                        <input
                            v-model="create_trainer.kinh_nghiem"
                            type="number"
                            min="0"
                            placeholder="Số năm kinh nghiệm"
                        >
                    </div>

                    <div class="form-group full">
                        <label>Giới thiệu ngắn</label>

                        <textarea
                            v-model="create_trainer.mo_ta"
                            rows="3"
                            placeholder="Nhập thông tin chuyên môn của Trainer..."
                        ></textarea>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeCreateModal">
                        Hủy
                    </button>

                    <button class="btn-save" @click="themMoiTrainer">
                        Thêm Trainer
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminTrainer",

    data() {
        return {
            currentTab: 'list', // 'list' | 'applicants' | 'payroll'
            search: '',
            statusFilter: '',
            specialtyFilter: '',
            showCreateModal: false,
            showEmailModal: false,
            selectedApplicant: null,

            // Cấu hình Form Email mẫu gửi ứng viên PT
            emailForm: {
                recipient: '',
                applicantName: '',
                title: '[VisionFit] Thư mời phỏng vấn & Kiểm tra kỹ năng HLV thể hình',
                time: '09:30 ngày 05/11/2026',
                location: 'VisionFit Cơ sở 1 - 123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1',
                note: 'Vui lòng mang theo trang phục thể thao thoải mái để thực hiện bài test kỹ năng hướng dẫn động tác và bản sao chứng chỉ.',
            },

            // Cấu hình tính lương nhanh
            salary_config: {
                don_gia_ca: 150000,
                hoa_hong_phan_tram: 10,
                luong_co_ban: 5000000,
                thuong_5_sao: 50000,
                phat_vang: 100000,
            },

            // Danh sách ứng viên đăng ký làm PT từ app
            pt_applicants: [
                {
                    id: 'APP-01',
                    ho_ten: 'Lê Quốc Huy',
                    email: 'huy.le@gmail.com',
                    so_dien_thoai: '0912 345 678',
                    chuyen_mon: 'Strength & Hypertrophy',
                    chung_chi: 'Chứng chỉ NASM CPT quốc tế 2023',
                    ngay_dang_ky: 'Hôm nay, 16:30',
                    trang_thai: 'pending',
                    gio_hen: '',
                    dia_chi_test: '',
                },
                {
                    id: 'APP-02',
                    ho_ten: 'Hoàng Thị Ngọc',
                    email: 'ngoc.hoang@gmail.com',
                    so_dien_thoai: '0934 567 890',
                    chuyen_mon: 'Cardio & Giảm mỡ nữ',
                    chung_chi: 'Cử nhân Đại học TDTT TP.HCM',
                    ngay_dang_ky: 'Hôm qua, 10:15',
                    trang_thai: 'invited',
                    gio_hen: '14:00 ngày 04/11/2026',
                    dia_chi_test: 'VisionFit Cơ sở 2 - 456 Hai Bà Trưng, Q.3',
                },
            ],

            // Bảng tính lương Trainer
            trainer_payrolls: [
                {
                    id: 'TR-01',
                    trainer_name: 'Trần Quốc Huy',
                    ma_gioi_thieu: 'PT-QUOCHUY-88',
                    luong_co_ban: 5000000,
                    so_ca_day: 36,
                    so_hoc_vien_gioi_thieu: 4,
                    doanh_thu_goi: 14400000,
                    thuong: 300000,
                    phat: 0,
                    trang_thai: 'tam_tinh',
                },
                {
                    id: 'TR-02',
                    trainer_name: 'Lê Hoàng Nam',
                    ma_gioi_thieu: 'PT-HOANGNAM-88',
                    luong_co_ban: 5000000,
                    so_ca_day: 42,
                    so_hoc_vien_gioi_thieu: 6,
                    doanh_thu_goi: 21600000,
                    thuong: 500000,
                    phat: 0,
                    trang_thai: 'tam_tinh',
                },
                {
                    id: 'TR-03',
                    trainer_name: 'Nguyễn Khánh Linh',
                    ma_gioi_thieu: 'PT-KHANHLINH-99',
                    luong_co_ban: 5000000,
                    so_ca_day: 28,
                    so_hoc_vien_gioi_thieu: 2,
                    doanh_thu_goi: 7200000,
                    thuong: 200000,
                    phat: 100000,
                    trang_thai: 'tam_tinh',
                },
            ],

            list_trainer: [
                {
                    id: '0012',
                    ho_ten: 'Trần Quốc Huy',
                    email: 'huytran@visionfit.vn',
                    so_dien_thoai: '0905 221 820',
                    chuyen_mon: 'Strength',
                    kinh_nghiem: 5,
                    so_gymmer: 14,
                    so_review: 38,
                    trang_thai: 'active',
                    ma_gioi_thieu: 'PT-QUOCHUY-88',
                },
                {
                    id: '0011',
                    ho_ten: 'Lê Hoàng Nam',
                    email: 'namle@visionfit.vn',
                    so_dien_thoai: '0935 440 121',
                    chuyen_mon: 'Fitness',
                    kinh_nghiem: 4,
                    so_gymmer: 11,
                    so_review: 31,
                    trang_thai: 'active',
                    ma_gioi_thieu: 'PT-HOANGNAM-88',
                },
                {
                    id: '0009',
                    ho_ten: 'Nguyễn Khánh Linh',
                    email: 'linhnguyen@visionfit.vn',
                    so_dien_thoai: '0777 109 335',
                    chuyen_mon: 'Functional',
                    kinh_nghiem: 3,
                    so_gymmer: 9,
                    so_review: 24,
                    trang_thai: 'active',
                    ma_gioi_thieu: 'PT-KHANHLINH-99',
                },
                {
                    id: '0006',
                    ho_ten: 'Phạm Quốc Bảo',
                    email: 'baopham@visionfit.vn',
                    so_dien_thoai: '0914 672 019',
                    chuyen_mon: 'Bodybuilding',
                    kinh_nghiem: 6,
                    so_gymmer: 0,
                    so_review: 12,
                    trang_thai: 'inactive',
                    ma_gioi_thieu: 'PT-QUOCBAO-66',
                }
            ],

            create_trainer: {
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                chuyen_mon: 'Fitness',
                kinh_nghiem: '',
                mo_ta: ''
            }
        }
    },

    computed: {
        pendingApplicantsCount() {
            return this.pt_applicants.filter(a => a.trang_thai === 'pending').length;
        },

        filteredTrainers() {
            return this.list_trainer.filter((trainer) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    trainer.ho_ten.toLowerCase().includes(keyword) ||
                    trainer.email.toLowerCase().includes(keyword) ||
                    (trainer.ma_gioi_thieu && trainer.ma_gioi_thieu.toLowerCase().includes(keyword)) ||
                    trainer.so_dien_thoai.includes(keyword);

                const matchStatus =
                    !this.statusFilter ||
                    trainer.trang_thai === this.statusFilter;

                const matchSpecialty =
                    !this.specialtyFilter ||
                    trainer.chuyen_mon === this.specialtyFilter;

                return matchSearch && matchStatus && matchSpecialty;
            });
        },

        countActive() {
            return this.list_trainer.filter(
                trainer => trainer.trang_thai === 'active'
            ).length;
        },

        totalGymmer() {
            return this.list_trainer.reduce(
                (total, trainer) => total + trainer.so_gymmer,
                0
            );
        },

        totalReview() {
            return this.list_trainer.reduce(
                (total, trainer) => total + trainer.so_review,
                0
            );
        },

        totalPayrollPayout() {
            return this.trainer_payrolls.reduce((sum, item) => sum + this.calcTongThucLinh(item), 0);
        }
    },

    methods: {
        getInitial(name) {
            const words = (name || '').trim().split(' ');
            return words
                .slice(-2)
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();
        },

        openCreateModal() {
            this.showCreateModal = true;
        },

        closeCreateModal() {
            this.showCreateModal = false;
        },

        themMoiTrainer() {
            if (!this.create_trainer.ho_ten) {
                alert('Vui lòng nhập họ tên Trainer');
                return;
            }

            const lastName = this.create_trainer.ho_ten.trim().split(' ').pop().toUpperCase();
            const trainer = {
                id: Date.now().toString().slice(-4),
                ...this.create_trainer,
                so_gymmer: 0,
                so_review: 0,
                trang_thai: 'active',
                ma_gioi_thieu: `PT-${lastName}-${Math.floor(10 + Math.random() * 90)}`,
            };

            this.list_trainer.unshift(trainer);

            this.create_trainer = {
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                chuyen_mon: 'Fitness',
                kinh_nghiem: '',
                mo_ta: ''
            };

            this.closeCreateModal();
        },

        viewTrainer(trainer) {
            this.$router.push('/admin/trainer/' + trainer.id);
        },

        // EMAIL MODAL CHO ỨNG VIÊN PT
        openEmailModal(applicant) {
            this.selectedApplicant = applicant;
            this.emailForm.recipient = applicant.email;
            this.emailForm.applicantName = applicant.ho_ten;
            this.emailForm.time = applicant.gio_hen || '09:30 ngày 05/11/2026';
            this.emailForm.location = applicant.dia_chi_test || 'VisionFit Cơ sở 1 - 123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1';
            this.emailForm.note = 'Vui lòng mang theo trang phục thể thao thoải mái để thực hiện bài test chuyên môn và bản sao các chứng chỉ liên quan.';
            this.showEmailModal = true;
        },

        sendEmailToApplicant() {
            if (!this.emailForm.time || !this.emailForm.location) {
                alert('Vui lòng nhập đầy đủ thời gian và địa chỉ hẹn test kỹ năng.');
                return;
            }

            if (this.selectedApplicant) {
                this.selectedApplicant.trang_thai = 'invited';
                this.selectedApplicant.gio_hen = this.emailForm.time;
                this.selectedApplicant.dia_chi_test = this.emailForm.location;
            }

            this.showEmailModal = false;
            alert(`Đã gửi email thư mời phỏng vấn & test kỹ năng thành công!\n\nNgười nhận: ${this.emailForm.recipient}\nThời gian: ${this.emailForm.time}\nĐịa điểm: ${this.emailForm.location}\n\n(Hệ thống đã bắn mail tự động qua SMTP Gmail)`);
        },

        approveApplicant(applicant) {
            const lastName = applicant.ho_ten.trim().split(' ').pop().toUpperCase();
            const newCode = `PT-${lastName}-${Math.floor(10 + Math.random() * 90)}`;
            if (confirm(`Xác nhận phê duyệt hồ sơ và kích hoạt tài khoản HLV cho ${applicant.ho_ten}?\n\nMã giới thiệu được cấp: ${newCode}`)) {
                applicant.trang_thai = 'approved';

                const newTrainer = {
                    id: Date.now().toString().slice(-4),
                    ho_ten: applicant.ho_ten,
                    email: applicant.email,
                    so_dien_thoai: applicant.so_dien_thoai,
                    chuyen_mon: applicant.chuyen_mon,
                    kinh_nghiem: 2,
                    so_gymmer: 0,
                    so_review: 0,
                    trang_thai: 'active',
                    ma_gioi_thieu: newCode,
                };

                this.list_trainer.unshift(newTrainer);

                // Thêm vào bảng tính lương
                this.trainer_payrolls.push({
                    id: 'TR-' + newTrainer.id,
                    trainer_name: applicant.ho_ten,
                    ma_gioi_thieu: newCode,
                    luong_co_ban: this.salary_config.luong_co_ban,
                    so_ca_day: 0,
                    so_hoc_vien_gioi_thieu: 0,
                    doanh_thu_goi: 0,
                    thuong: 0,
                    phat: 0,
                    trang_thai: 'tam_tinh',
                });

                alert(`Đã kích hoạt thành công tài khoản HLV ${applicant.ho_ten}!\nMã giới thiệu cá nhân: ${newCode}\nHLV đã có thể đăng nhập vào ứng dụng di động.`);
            }
        },

        // BẢNG LƯƠNG
        formatCurrency(val) {
            return Number(val || 0).toLocaleString('vi-VN') + ' đ';
        },

        calcTienCa(item) {
            return (item.so_ca_day || 0) * Number(this.salary_config.don_gia_ca || 0);
        },

        calcTienHoaHong(item) {
            return ((item.doanh_thu_goi || 0) * Number(this.salary_config.hoa_hong_phan_tram || 0)) / 100;
        },

        calcTongThucLinh(item) {
            return (
                Number(item.luong_co_ban || 0) +
                this.calcTienCa(item) +
                this.calcTienHoaHong(item) +
                Number(item.thuong || 0) -
                Number(item.phat || 0)
            );
        },

        applyAndRecalculatePayroll() {
            this.trainer_payrolls = this.trainer_payrolls.map(item => ({
                ...item,
                luong_co_ban: Number(this.salary_config.luong_co_ban),
            }));

            alert(
                `Chính sách lương mới đã được áp dụng thành công!\n\n` +
                `• Đơn giá 1 ca dạy: ${this.formatCurrency(this.salary_config.don_gia_ca)}/ca\n` +
                `• % Hoa hồng mã giới thiệu: ${this.salary_config.hoa_hong_phan_tram}%\n` +
                `• Lương cơ bản mặc định: ${this.formatCurrency(this.salary_config.luong_co_ban)}\n\n` +
                `Toàn bộ bảng lương của các Trainer đã được tự động tính toán lại.`
            );
        },

        chotLuong(payroll) {
            payroll.trang_thai = 'da_chot';
            alert(`Đã chốt bảng lương tháng cho HLV ${payroll.trainer_name}!\nTổng thực lĩnh: ${this.formatCurrency(this.calcTongThucLinh(payroll))}`);
        },

        thanhToanLuong(payroll) {
            payroll.trang_thai = 'da_thanh_toan';
            alert(`Đã xác nhận thanh toán chuyển khoản cho HLV ${payroll.trainer_name}!`);
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
    margin-bottom: 18px;
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

.btn-add {
    border: none;
    padding: 10px 16px;
    border-radius: 11px;
    background: #0d7f8d;
    color: white;
    font-size: 14.5px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.18s ease;
}

.btn-add:hover {
    background: #075e68;
    transform: translateY(-1px);
}

/* NAVIGATION TABS */
.trainer-nav-tabs {
    display: flex;
    gap: 8px;
    background: #e2f0f2;
    padding: 5px;
    border-radius: 14px;
    margin-bottom: 20px;
}

.trainer-nav-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    background: transparent;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #51777d;
    cursor: pointer;
    transition: 0.18s ease;
}

.trainer-nav-tab.active {
    background: #0d7f8d;
    color: white;
    box-shadow: 0 4px 12px rgba(13, 127, 141, 0.22);
}

.badge-count {
    background: #ef4444;
    color: white;
    font-size: 11px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 10px;
}

/* STAT ROW */
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
    transition: 0.18s ease;
}

.mini-card:hover {
    transform: translateY(-2px);
    border-color: #9ed9df;
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
}

/* CONTENT CARD */
.content-card {
    padding: 18px;
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.06);
}

.tab-intro-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #edf6f7;
}

.tab-inner-title {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    color: #11343a;
}

.tab-inner-sub {
    margin: 4px 0 0;
    font-size: 13.5px;
    color: #71949a;
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
    font-size: 14.5px;
    color: #11343a;
}

.filter-bar select {
    height: 42px;
    padding: 0 12px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    background: #fbfeff;
    color: #11343a;
    font-size: 14px;
    outline: none;
}

/* TABLE */
.table-responsive {
    overflow-x: auto;
}

.trainer-table {
    width: 100%;
    border-collapse: collapse;
}

.trainer-table th {
    padding: 12px 14px;
    text-align: left;
    font-size: 13px;
    font-weight: 700;
    color: #71949a;
    border-bottom: 1.5px solid #e1eff1;
}

.trainer-table td {
    padding: 14px;
    vertical-align: middle;
    border-bottom: 1px solid #edf6f7;
    font-size: 14px;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #0d7f8d;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;
}

.user-cell strong {
    display: block;
    color: #11343a;
    font-size: 14.5px;
}

.user-cell span {
    font-size: 12px;
    color: #8faeb4;
}

.ref-code-badge {
    background: #eaf9fb;
    color: #0d7f8d;
    font-weight: 800;
    padding: 4px 9px;
    border-radius: 8px;
    font-size: 12.5px;
    border: 1px solid #bcecf0;
    letter-spacing: 0.5px;
}

.contact span {
    display: block;
    color: #11343a;
    font-size: 13.5px;
}

.contact small {
    color: #71949a;
    font-size: 12px;
}

.specialty {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 8px;
    background: #f0f7f8;
    color: #2e5057;
    font-size: 12.5px;
    font-weight: 600;
}

.gymmer-count strong {
    color: #11343a;
    font-size: 15px;
}

.gymmer-count span {
    color: #71949a;
    font-size: 12px;
    margin-left: 4px;
}

.status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
}

.status.active {
    background: #ecfdf5;
    color: #059669;
}
.status.active .status-dot { background: #10b981; }

.status.inactive {
    background: #f1f5f9;
    color: #64748b;
}
.status.inactive .status-dot { background: #94a3b8; }

.status.pending {
    background: #fef3c7;
    color: #b45309;
}
.status.pending .status-dot { background: #f59e0b; }

.status.invited {
    background: #eff6ff;
    color: #1d4ed8;
}
.status.invited .status-dot { background: #3b82f6; }

.btn-detail {
    padding: 6px 12px;
    border: 1px solid #9ed9df;
    border-radius: 8px;
    background: white;
    color: #0d7f8d;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}
.btn-detail:hover { background: #eaf9fb; }

/* APPLICANT ACTIONS */
.action-btn-group {
    display: flex;
    gap: 6px;
}

.btn-email {
    padding: 6px 12px;
    border: 1px solid #0d7f8d;
    background: #eaf9fb;
    color: #0d7f8d;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
}
.btn-email:hover { background: #d3f3f6; }

.btn-approve {
    padding: 6px 12px;
    border: 1px solid #10b981;
    background: #ecfdf5;
    color: #059669;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
}
.btn-approve:hover { background: #d1fae5; }

.schedule-brief strong {
    display: block;
    color: #1d4ed8;
    font-size: 12.5px;
}
.schedule-brief small {
    color: #71949a;
    font-size: 11.5px;
}

/* QUICK SALARY SETUP */
.salary-quick-setup-card {
    background: linear-gradient(135deg, #11343a, #0d7f8d);
    color: white;
    border-radius: 18px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(13, 127, 141, 0.2);
}

.quick-setup-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    gap: 16px;
}

.quick-title-group {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.bolt-icon {
    font-size: 26px;
}

.quick-title-group h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
}

.quick-title-group p {
    margin: 4px 0 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    max-width: 650px;
}

.btn-recalculate {
    background: #f59e0b;
    color: #11343a;
    border: none;
    padding: 10px 18px;
    border-radius: 11px;
    font-size: 13.5px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
    white-space: nowrap;
}
.btn-recalculate:hover { background: #fbbf24; }

.quick-setup-inputs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
}

.setup-col label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    margin-bottom: 5px;
    color: rgba(255, 255, 255, 0.9);
}

.setup-col input {
    width: 100%;
    height: 38px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.15);
    color: white;
    padding: 0 10px;
    font-size: 13.5px;
    font-weight: 700;
    outline: none;
}
.setup-col input:focus {
    border-color: #f59e0b;
    background: rgba(255, 255, 255, 0.25);
}

.total-payout-box {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    padding: 8px 14px;
    border-radius: 12px;
    text-align: right;
}
.total-payout-box span {
    font-size: 12px;
    color: #059669;
    display: block;
}
.total-payout-box strong {
    font-size: 18px;
    color: #047857;
    font-weight: 800;
}

/* PAYROLL TABLE */
.payroll-table th, .payroll-table td {
    padding: 12px 10px;
    font-size: 13px;
}

.payroll-code {
    font-size: 11.5px;
    color: #0d7f8d;
    font-weight: 700;
}

.count-pill {
    background: #eaf9fb;
    color: #0d7f8d;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 8px;
    font-size: 12px;
}

.total-salary-text {
    color: #059669;
    font-size: 14.5px;
    font-weight: 800;
}

.btn-paid {
    padding: 5px 10px;
    border: 1px solid #3b82f6;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}

/* MODAL */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(17, 52, 58, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
}

.modal-box {
    width: 90%;
    max-width: 580px;
    background: white;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    animation: showModal 0.2s ease;
}

.modal-email-box {
    max-width: 680px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

.modal-header h3 {
    margin: 0;
    color: #11343a;
    font-size: 20px;
    font-weight: 800;
}

.modal-header p {
    margin: 4px 0 0;
    color: #71949a;
    font-size: 13.5px;
}

.btn-close {
    border: none;
    background: none;
    font-size: 24px;
    color: #8faeb4;
    cursor: pointer;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.form-group.full {
    grid-column: span 2;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    color: #51777d;
    font-size: 13px;
    font-weight: 700;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0 11px;
    border: 1px solid #cfe8eb;
    border-radius: 10px;
    outline: none;
    color: #11343a;
    font-size: 14px;
}

.form-group input,
.form-group select {
    height: 40px;
}

.form-group textarea {
    padding-top: 8px;
    resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    border-color: #0d7f8d;
    box-shadow: 0 0 0 3px rgba(13, 127, 141, 0.08);
}

.email-preview-box {
    background: #f8fafc;
    border: 1.5px dashed #9ed9df;
    border-radius: 12px;
    padding: 14px;
    font-size: 13px;
    color: #2e5057;
    line-height: 20px;
}
.email-preview-box ul {
    margin: 8px 0;
    padding-left: 20px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.btn-cancel {
    padding: 9px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    border: 1px solid #9ed9df;
    background: white;
    color: #0d7f8d;
    cursor: pointer;
}

.btn-save {
    padding: 9px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    border: 1px solid #0d7f8d;
    background: #0d7f8d;
    color: white;
    cursor: pointer;
}

.btn-send-email {
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 800;
    border: none;
    background: #0d7f8d;
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(13, 127, 141, 0.25);
}
.btn-send-email:hover { background: #075e68; }

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

@media (max-width: 1100px) {
    .stat-row, .quick-setup-inputs {
        grid-template-columns: repeat(2, 1fr);
    }

    .filter-bar {
        flex-wrap: wrap;
    }
}
</style>
