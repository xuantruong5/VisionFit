<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Quản lý Lịch Tập & Duyệt Đổi Ca</h2>
                <p>Quản lý lịch tập, duyệt yêu cầu dời ca của Trainer và gửi mail xác nhận cho hội viên</p>
            </div>

            <button v-if="currentTab === 'classes'" class="btn-add" @click="openCreateModal">
                + Tạo lớp tập
            </button>
        </div>

        <!-- NAVIGATION TABS -->
        <div class="schedule-nav-tabs">
            <button
                class="schedule-nav-tab"
                :class="{ active: currentTab === 'classes' }"
                @click="currentTab = 'classes'"
            >
                📅 Lớp tập & Thời khóa biểu
            </button>
            <button
                class="schedule-nav-tab"
                :class="{ active: currentTab === 'change_requests' }"
                @click="currentTab = 'change_requests'"
            >
                🟠 Duyệt yêu cầu đổi lịch của Trainer
                <span class="badge-count" v-if="pendingRequestsCount > 0">{{ pendingRequestsCount }}</span>
            </button>
        </div>

        <div v-if="currentTab === 'classes'">
            <div class="stat-row">
                <div class="mini-card">
                    <span>Lớp hôm nay</span>
                    <strong>{{ todayClasses }}</strong>
                </div>

                <div class="mini-card">
                    <span>Lớp đang mở</span>
                    <strong>{{ countActive }}</strong>
                </div>

                <div class="mini-card">
                    <span>Gymmer đăng ký</span>
                    <strong>{{ totalMembers }}</strong>
                </div>

                <div class="mini-card">
                    <span>Trainer phụ trách</span>
                    <strong>{{ totalTrainer }}</strong>
                </div>
            </div>

        <div class="content-card">
            <div class="toolbar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm lớp hoặc Trainer..."
                    >
                </div>

                <select v-model="dayFilter">
                    <option value="">Tất cả ngày</option>
                    <option value="Thứ 2">Thứ 2</option>
                    <option value="Thứ 3">Thứ 3</option>
                    <option value="Thứ 4">Thứ 4</option>
                    <option value="Thứ 5">Thứ 5</option>
                    <option value="Thứ 6">Thứ 6</option>
                    <option value="Thứ 7">Thứ 7</option>
                    <option value="Chủ nhật">Chủ nhật</option>
                </select>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang mở</option>
                    <option value="full">Đã đầy</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
            </div>

            <div class="week-tabs">
                <button
                    v-for="day in days"
                    :key="day"
                    class="day-tab"
                    :class="{ active: selectedDay === day }"
                    @click="selectedDay = day"
                >
                    {{ day }}
                </button>
            </div>

            <div class="class-grid">
                <div
                    v-for="item in displayedClasses"
                    :key="item.id"
                    class="class-card"
                >
                    <div class="class-time">
                        <strong>{{ item.gio_bat_dau }}</strong>
                        <span>{{ item.gio_ket_thuc }}</span>
                    </div>

                    <div class="class-info">
                        <div class="class-top">
                            <div>
                                <span class="class-type">
                                    {{ item.loai }}
                                </span>

                                <h3>{{ item.ten_lop }}</h3>
                            </div>

                            <span
                                class="status"
                                :class="item.trang_thai"
                            >
                                {{
                                    getStatusName(item.trang_thai)
                                }}
                            </span>
                        </div>

                        <div class="class-meta">
                            <div>
                                <span>Trainer</span>
                                <strong>{{ item.trainer }}</strong>
                            </div>

                            <div>
                                <span>Phòng</span>
                                <strong>{{ item.phong }}</strong>
                            </div>

                            <div>
                                <span>Ngày</span>
                                <strong>{{ item.thu }}</strong>
                            </div>
                        </div>

                        <div class="capacity">
                            <div class="capacity-head">
                                <span>Số lượng đăng ký</span>

                                <strong>
                                    {{ item.da_dang_ky }}/{{ item.suc_chua }}
                                </strong>
                            </div>

                            <div class="progress">
                                <div
                                    class="progress-value"
                                    :style="{ width: getCapacity(item) + '%' }"
                                ></div>
                            </div>
                        </div>

                        <div class="class-actions">
                            <button
                                class="btn-detail"
                                @click="viewClass(item)"
                            >
                                Danh sách Gymmer
                            </button>

                            <button
                                class="btn-edit"
                                @click="openEditModal(item)"
                            >
                                Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    v-if="displayedClasses.length === 0"
                    class="empty-state"
                >
                    Không có lớp tập phù hợp
                </div>
            </div>
        </div>
        </div>
        <!-- KẾT THÚC TAB CLASSES -->

        <!-- ================= TAB 2: DUYỆT YÊU CẦU ĐỔI LỊCH CỦA TRAINER ================= -->
        <div v-if="currentTab === 'change_requests'">
            <div class="content-card">
                <div class="tab-intro-row">
                    <div>
                        <h3 class="tab-inner-title">Danh sách yêu cầu dời lịch / đổi ca của Trainer</h3>
                        <p class="tab-inner-sub">Xem xét lý do dời ca của HLV, bấm Duyệt để hệ thống tự động cập nhật thời khóa biểu và gửi mail cho học viên</p>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="trainer-table request-table">
                        <thead>
                            <tr>
                                <th>Huấn luyện viên</th>
                                <th>Học viên & Gói tập</th>
                                <th>Lịch cũ</th>
                                <th>Lịch mới đề xuất</th>
                                <th>Lý do dời ca của HLV</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="req in change_requests" :key="req.id">
                                <td>
                                    <div>
                                        <strong style="color: #11343a;">{{ req.trainer_name }}</strong>
                                        <div class="ref-code-badge" style="display: inline-block; margin-top: 3px;">{{ req.trainer_code }}</div>
                                    </div>
                                </td>

                                <td>
                                    <div>
                                        <strong style="color: #11343a;">{{ req.member_name }}</strong>
                                        <div style="font-size: 12px; color: #71949a; margin-top: 2px;">{{ req.package_name }}</div>
                                    </div>
                                </td>

                                <td>
                                    <div class="schedule-old-box">
                                        <strong>{{ req.old_schedule }}</strong>
                                        <small>{{ req.old_place }}</small>
                                    </div>
                                </td>

                                <td>
                                    <div class="schedule-new-box">
                                        <strong>🕒 {{ req.new_schedule }}</strong>
                                        <small>📍 {{ req.new_place }}</small>
                                    </div>
                                </td>

                                <td>
                                    <div class="reason-box">
                                        "{{ req.reason }}"
                                    </div>
                                </td>

                                <td>
                                    <span class="status" :class="req.status === 'approved' ? 'active' : req.status === 'rejected' ? 'inactive' : 'pending'">
                                        <span class="status-dot"></span>
                                        {{
                                            req.status === 'approved'
                                                ? 'Đã duyệt'
                                                : req.status === 'rejected'
                                                ? 'Đã từ chối'
                                                : 'Chờ duyệt'
                                        }}
                                    </span>
                                </td>

                                <td>
                                    <div class="action-btn-group">
                                        <button
                                            v-if="req.status === 'pending'"
                                            class="btn-approve"
                                            @click="approveScheduleChange(req)"
                                            title="Phê duyệt đổi lịch"
                                        >
                                            ✓ Duyệt
                                        </button>
                                        <button
                                            v-if="req.status === 'pending'"
                                            class="btn-reject"
                                            @click="rejectScheduleChange(req)"
                                            title="Từ chối yêu cầu"
                                        >
                                            ✗ Từ chối
                                        </button>
                                        <button
                                            class="btn-email"
                                            @click="openSendEmailScheduleModal(req)"
                                            title="Gửi email thông báo cho học viên và HLV"
                                        >
                                            ✉️ Gửi mail
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= MODAL GỬI EMAIL XÁC NHẬN LỊCH TẬP ================= -->
        <div v-if="showEmailScheduleModal" class="modal-overlay" @click.self="showEmailScheduleModal = false">
            <div class="modal-box modal-email-box">
                <div class="modal-header">
                    <div>
                        <h3>✉️ Gửi email xác nhận lịch tập cho Học viên & HLV</h3>
                        <p>Mẫu thư có sẵn: Bạn có thể sửa nhanh giờ tập và địa chỉ trước khi gửi</p>
                    </div>
                    <button class="btn-close" @click="showEmailScheduleModal = false">×</button>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label>Email Học viên (Người nhận chính)</label>
                        <input type="text" :value="emailScheduleForm.studentName + ' <' + emailScheduleForm.recipient + '>'" disabled style="background: #F8FAFC;" />
                    </div>

                    <div class="form-group">
                        <label>Email Huấn luyện viên (Đồng gửi)</label>
                        <input type="text" :value="emailScheduleForm.trainerName + ' <' + emailScheduleForm.trainerEmail + '>'" disabled style="background: #F8FAFC;" />
                    </div>

                    <div class="form-group full">
                        <label>Tiêu đề email</label>
                        <input type="text" v-model="emailScheduleForm.title" />
                    </div>

                    <div class="form-group">
                        <label>🕒 Thời gian buổi tập mới (Sửa nhanh)</label>
                        <input type="text" v-model="emailScheduleForm.time" />
                    </div>

                    <div class="form-group">
                        <label>📍 Địa chỉ phòng tập / Cơ sở (Sửa nhanh)</label>
                        <input type="text" v-model="emailScheduleForm.location" />
                    </div>

                    <div class="form-group full">
                        <label>Ghi chú dặn dò</label>
                        <textarea v-model="emailScheduleForm.note" rows="2"></textarea>
                    </div>

                    <!-- PREVIEW EMAIL -->
                    <div class="form-group full">
                        <label style="color: #0d7f8d; font-weight: 800;">👁️ Xem trước nội dung thư gửi đi:</label>
                        <div class="email-preview-box">
                            <p><strong>Kính gửi bạn {{ emailScheduleForm.studentName }} và HLV {{ emailScheduleForm.trainerName }},</strong></p>
                            <p>Yêu cầu điều chỉnh ca tập luyện cá nhân tại VisionFit đã được Ban quản trị phê duyệt và cập nhật thành công:</p>
                            <ul>
                                <li><strong>Thời gian tập mới:</strong> {{ emailScheduleForm.time }}</li>
                                <li><strong>Địa điểm:</strong> {{ emailScheduleForm.location }}</li>
                                <li><strong>Dặn dò:</strong> {{ emailScheduleForm.note }}</li>
                            </ul>
                            <p style="margin-bottom: 0;"><em>Chúc bạn có buổi tập luyện hiệu quả và an toàn!<br>Hệ thống Quản lý Đào tạo VisionFit</em></p>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="showEmailScheduleModal = false">Đóng</button>
                    <button class="btn-send-email" @click="sendEmailScheduleConfirmation">
                        🚀 BẤM GỬI EMAIL NGAY
                    </button>
                </div>
            </div>
        </div>

        <div
            v-if="showModal"
            class="modal-overlay"
            @click.self="closeModal"
        >
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3>
                            {{ editingClass ? 'Chỉnh sửa lớp tập' : 'Tạo lớp tập' }}
                        </h3>

                        <p>
                            Thiết lập lịch và Trainer phụ trách lớp
                        </p>
                    </div>

                    <button class="btn-close" @click="closeModal">
                        ×
                    </button>
                </div>

                <div class="form-grid">
                    <div class="form-group full">
                        <label>Tên lớp</label>

                        <input
                            v-model="form.ten_lop"
                            type="text"
                            placeholder="Ví dụ: Strength Foundation"
                        >
                    </div>

                    <div class="form-group">
                        <label>Loại lớp</label>

                        <select v-model="form.loai">
                            <option value="Strength">Strength</option>
                            <option value="Functional">Functional</option>
                            <option value="Mobility">Mobility</option>
                            <option value="HIIT">HIIT</option>
                            <option value="Beginner">Beginner</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Trainer</label>

                        <select v-model="form.trainer">
                            <option value="">Chọn Trainer</option>
                            <option>Trần Quốc Huy</option>
                            <option>Lê Hoàng Nam</option>
                            <option>Nguyễn Khánh Linh</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Ngày trong tuần</label>

                        <select v-model="form.thu">
                            <option>Thứ 2</option>
                            <option>Thứ 3</option>
                            <option>Thứ 4</option>
                            <option>Thứ 5</option>
                            <option>Thứ 6</option>
                            <option>Thứ 7</option>
                            <option>Chủ nhật</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Phòng tập</label>

                        <select v-model="form.phong">
                            <option>Studio A</option>
                            <option>Studio B</option>
                            <option>Strength Zone</option>
                            <option>Functional Zone</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Giờ bắt đầu</label>

                        <input
                            v-model="form.gio_bat_dau"
                            type="time"
                        >
                    </div>

                    <div class="form-group">
                        <label>Giờ kết thúc</label>

                        <input
                            v-model="form.gio_ket_thuc"
                            type="time"
                        >
                    </div>

                    <div class="form-group">
                        <label>Sức chứa</label>

                        <input
                            v-model.number="form.suc_chua"
                            type="number"
                            min="1"
                        >
                    </div>

                    <div class="form-group">
                        <label>Trạng thái</label>

                        <select v-model="form.trang_thai">
                            <option value="active">Đang mở</option>
                            <option value="full">Đã đầy</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    <div class="form-group full">
                        <label>Ghi chú</label>

                        <textarea
                            v-model="form.ghi_chu"
                            rows="3"
                            placeholder="Ghi chú về lớp tập..."
                        ></textarea>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeModal">
                        Hủy
                    </button>

                    <button class="btn-save" @click="saveClass">
                        {{ editingClass ? 'Lưu thay đổi' : 'Tạo lớp tập' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminLichLop",

    data() {
        return {
            currentTab: 'classes',
            search: '',
            dayFilter: '',
            statusFilter: '',
            selectedDay: 'Tất cả',
            showModal: false,
            showEmailScheduleModal: false,
            editingClass: null,
            selectedRequest: null,

            emailScheduleForm: {
                recipient: '',
                trainerEmail: '',
                studentName: '',
                trainerName: '',
                title: '[VisionFit] Thông báo lịch tập luyện đã được cập nhật',
                time: '',
                location: '',
                note: 'Vui lòng có mặt đúng giờ trước 10 phút, mang theo trang phục tập và bình nước cá nhân.',
            },

            change_requests: [
                {
                    id: 'REQ-01',
                    trainer_name: 'Lê Hoàng Nam',
                    trainer_code: 'PT-HOANGNAM-88',
                    trainer_email: 'namle@visionfit.vn',
                    member_name: 'Lê Hoàng Nam',
                    member_email: 'nam.le@visionfit.vn',
                    package_name: 'Full Body Kháng lực (Gói PT 12 buổi)',
                    old_schedule: '18:00 - 19:00, Thứ Bảy 31/10/2026',
                    old_place: 'Phòng Gym B (Cơ sở 1)',
                    new_schedule: '18:00 - 19:00, Thứ Hai 02/11/2026',
                    new_place: 'Phòng Gym B - 123 Nguyễn Thị Minh Khai, Q.1',
                    reason: 'Học viên có việc gia đình đột xuất, xin dời sang thứ Hai.',
                    created_at: 'Hôm nay, 17:15',
                    status: 'pending',
                },
                {
                    id: 'REQ-02',
                    trainer_name: 'Trần Quốc Huy',
                    trainer_code: 'PT-QUOCHUY-88',
                    trainer_email: 'huytran@visionfit.vn',
                    member_name: 'Trần Minh Anh',
                    member_email: 'minhanh.tran@gmail.com',
                    package_name: 'Cardio & Giảm mỡ cấp tốc (Gói PT 24 buổi)',
                    old_schedule: '14:30 - 15:15, Chủ Nhật 01/11/2026',
                    old_place: 'Khu Cardio (Cơ sở 1)',
                    new_schedule: '16:00 - 16:45, Chủ Nhật 01/11/2026',
                    new_place: 'Khu Cardio - 123 Nguyễn Thị Minh Khai, Q.1',
                    reason: 'Học viên kẹt lịch thi buổi chiều, xin lùi 1 tiếng rưỡi.',
                    created_at: 'Hôm nay, 14:00',
                    status: 'pending',
                },
                {
                    id: 'REQ-03',
                    trainer_name: 'Nguyễn Khánh Linh',
                    trainer_code: 'PT-KHANHLINH-99',
                    trainer_email: 'linhnguyen@visionfit.vn',
                    member_name: 'Phạm Thu Hà',
                    member_email: 'thuha.pham@gmail.com',
                    package_name: 'Functional & Dẻo dai',
                    old_schedule: '10:00 - 11:00, Thứ Sáu 30/10/2026',
                    old_place: 'Phòng Gym A',
                    new_schedule: '10:00 - 11:00, Thứ Bảy 31/10/2026',
                    new_place: 'Phòng Gym A - 123 Nguyễn Thị Minh Khai, Q.1',
                    reason: 'HLV bận họp chuyên môn định kỳ tại trụ sở.',
                    created_at: '29/10/2026',
                    status: 'approved',
                }
            ],

            days: [
                'Tất cả',
                'Thứ 2',
                'Thứ 3',
                'Thứ 4',
                'Thứ 5',
                'Thứ 6',
                'Thứ 7',
                'Chủ nhật'
            ],

            list_lop: [
                {
                    id: 1,
                    ten_lop: 'Strength Foundation',
                    loai: 'Strength',
                    trainer: 'Trần Quốc Huy',
                    thu: 'Thứ 2',
                    gio_bat_dau: '07:00',
                    gio_ket_thuc: '08:00',
                    phong: 'Strength Zone',
                    suc_chua: 12,
                    da_dang_ky: 9,
                    trang_thai: 'active'
                },
                {
                    id: 2,
                    ten_lop: 'Functional Training',
                    loai: 'Functional',
                    trainer: 'Nguyễn Khánh Linh',
                    thu: 'Thứ 2',
                    gio_bat_dau: '17:30',
                    gio_ket_thuc: '18:30',
                    phong: 'Functional Zone',
                    suc_chua: 10,
                    da_dang_ky: 10,
                    trang_thai: 'full'
                },
                {
                    id: 3,
                    ten_lop: 'Beginner Workout',
                    loai: 'Beginner',
                    trainer: 'Lê Hoàng Nam',
                    thu: 'Thứ 3',
                    gio_bat_dau: '09:00',
                    gio_ket_thuc: '10:00',
                    phong: 'Studio A',
                    suc_chua: 15,
                    da_dang_ky: 7,
                    trang_thai: 'active'
                },
                {
                    id: 4,
                    ten_lop: 'HIIT Evening',
                    loai: 'HIIT',
                    trainer: 'Trần Quốc Huy',
                    thu: 'Thứ 4',
                    gio_bat_dau: '18:30',
                    gio_ket_thuc: '19:30',
                    phong: 'Studio B',
                    suc_chua: 12,
                    da_dang_ky: 8,
                    trang_thai: 'active'
                },
                {
                    id: 5,
                    ten_lop: 'Mobility Recovery',
                    loai: 'Mobility',
                    trainer: 'Nguyễn Khánh Linh',
                    thu: 'Thứ 6',
                    gio_bat_dau: '16:00',
                    gio_ket_thuc: '17:00',
                    phong: 'Studio A',
                    suc_chua: 10,
                    da_dang_ky: 4,
                    trang_thai: 'cancelled'
                }
            ],

            form: {
                ten_lop: '',
                loai: 'Strength',
                trainer: '',
                thu: 'Thứ 2',
                phong: 'Studio A',
                gio_bat_dau: '',
                gio_ket_thuc: '',
                suc_chua: 10,
                trang_thai: 'active',
                ghi_chu: ''
            }
        }
    },

    computed: {
        displayedClasses() {
            return this.list_lop.filter((item) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    item.ten_lop.toLowerCase().includes(keyword) ||
                    item.trainer.toLowerCase().includes(keyword);

                const matchDayFilter =
                    !this.dayFilter ||
                    item.thu === this.dayFilter;

                const matchSelectedDay =
                    this.selectedDay === 'Tất cả' ||
                    item.thu === this.selectedDay;

                const matchStatus =
                    !this.statusFilter ||
                    item.trang_thai === this.statusFilter;

                return (
                    matchSearch &&
                    matchDayFilter &&
                    matchSelectedDay &&
                    matchStatus
                );
            });
        },

        countActive() {
            return this.list_lop.filter(
                item => item.trang_thai === 'active'
            ).length;
        },

        totalMembers() {
            return this.list_lop.reduce(
                (total, item) => total + item.da_dang_ky,
                0
            );
        },

        totalTrainer() {
            return new Set(
                this.list_lop.map(item => item.trainer)
            ).size;
        },

        todayClasses() {
            return this.list_lop.filter(
                item => item.thu === 'Thứ 4'
            ).length;
        },

        pendingRequestsCount() {
            return this.change_requests.filter(r => r.status === 'pending').length;
        }
    },

    methods: {
        approveScheduleChange(req) {
            req.status = 'approved';
            alert(`Đã duyệt yêu cầu đổi lịch ca dạy của HLV ${req.trainer_name} và Học viên ${req.member_name}!\n\nLịch mới: ${req.new_schedule}\nĐịa điểm: ${req.new_place}\n\nThời khóa biểu của cả hai bên đã được tự động cập nhật.`);
        },

        rejectScheduleChange(req) {
            const reason = prompt('Nhập lý do từ chối yêu cầu đổi lịch:', 'Khung giờ mới phòng tập bị quá tải');
            if (reason) {
                req.status = 'rejected';
                req.rejectReason = reason;
                alert(`Đã từ chối yêu cầu đổi lịch. Lý do: "${reason}".`);
            }
        },

        openSendEmailScheduleModal(req) {
            this.selectedRequest = req;
            this.emailScheduleForm.recipient = req.member_email;
            this.emailScheduleForm.trainerEmail = req.trainer_email;
            this.emailScheduleForm.studentName = req.member_name;
            this.emailScheduleForm.trainerName = req.trainer_name;
            this.emailScheduleForm.time = req.new_schedule;
            this.emailScheduleForm.location = req.new_place;
            this.emailScheduleForm.note = 'Vui lòng có mặt đúng giờ trước 10 phút, mang theo trang phục tập và bình nước cá nhân.';
            this.showEmailScheduleModal = true;
        },

        sendEmailScheduleConfirmation() {
            if (!this.emailScheduleForm.time || !this.emailScheduleForm.location) {
                alert('Vui lòng nhập đầy đủ thời gian và địa điểm tập.');
                return;
            }
            this.showEmailScheduleModal = false;
            alert(`Đã gửi email thông báo cập nhật lịch tập thành công qua SMTP!\n\n• Học viên: ${this.emailScheduleForm.recipient}\n• Huấn luyện viên: ${this.emailScheduleForm.trainerEmail}\n• Thời gian: ${this.emailScheduleForm.time}\n• Địa điểm: ${this.emailScheduleForm.location}`);
        },

        getCapacity(item) {
            if (!item.suc_chua) {
                return 0;
            }

            return Math.min(
                100,
                Math.round(
                    (item.da_dang_ky / item.suc_chua) * 100
                )
            );
        },

        getStatusName(status) {
            if (status === 'active') return 'Đang mở';
            if (status === 'full') return 'Đã đầy';
            if (status === 'cancelled') return 'Đã hủy';

            return status;
        },

        openCreateModal() {
            this.editingClass = null;

            this.form = {
                ten_lop: '',
                loai: 'Strength',
                trainer: '',
                thu: 'Thứ 2',
                phong: 'Studio A',
                gio_bat_dau: '',
                gio_ket_thuc: '',
                suc_chua: 10,
                trang_thai: 'active',
                ghi_chu: ''
            };

            this.showModal = true;
        },

        openEditModal(item) {
            this.editingClass = item;

            this.form = {
                ten_lop: item.ten_lop,
                loai: item.loai,
                trainer: item.trainer,
                thu: item.thu,
                phong: item.phong,
                gio_bat_dau: item.gio_bat_dau,
                gio_ket_thuc: item.gio_ket_thuc,
                suc_chua: item.suc_chua,
                trang_thai: item.trang_thai,
                ghi_chu: item.ghi_chu || ''
            };

            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.editingClass = null;
        },

        saveClass() {
            if (
                !this.form.ten_lop ||
                !this.form.trainer ||
                !this.form.gio_bat_dau ||
                !this.form.gio_ket_thuc
            ) {
                alert('Vui lòng nhập đầy đủ thông tin lớp');
                return;
            }

            if (this.editingClass) {
                Object.assign(
                    this.editingClass,
                    this.form
                );
            } else {
                this.list_lop.unshift({
                    id: Date.now(),
                    ...this.form,
                    da_dang_ky: 0
                });
            }

            this.closeModal();
        },

        viewClass(item) {
            console.log('Danh sách Gymmer:', item);
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
    padding: 10px 15px;
    border-radius: 11px;
    background: #0d7f8d;
    color: white;
    font-size: 15px;
    font-weight: 700;
    transition: 0.18s ease;
}

.btn-add:hover {
    background: #075e68;
    transform: translateY(-1px);
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

.content-card {
    padding: 18px;
    background: white;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    box-shadow: 0 7px 18px rgba(13, 127, 141, 0.06);
}

.toolbar {
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
    font-size: 15px;
}

.toolbar select {
    min-width: 150px;
    height: 42px;
    padding: 0 10px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 14.5px;
}

.week-tabs {
    display: flex;
    gap: 7px;
    margin-bottom: 18px;
    overflow-x: auto;
}

.day-tab {
    flex-shrink: 0;
    border: 1px solid #cfe8eb;
    padding: 8px 12px;
    border-radius: 10px;
    background: white;
    color: #64888d;
    font-size: 14px;
    font-weight: 700;
    transition: 0.15s ease;
}

.day-tab:hover {
    background: #dff6f8;
    color: #075e68;
}

.day-tab.active {
    border-color: #0d7f8d;
    background: #0d7f8d;
    color: white;
}

.class-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
}

.class-card {
    display: grid;
    grid-template-columns: 85px 1fr;
    overflow: hidden;
    border: 1px solid #d8eef1;
    border-radius: 18px;
    background: white;
    transition: 0.18s ease;
}

.class-card:hover {
    transform: translateY(-2px);
    border-color: #9ed9df;
    box-shadow: 0 10px 22px rgba(13, 127, 141, 0.08);
}

.class-time {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #e6f8fa;
    border-right: 1px solid #d8eef1;
}

.class-time strong {
    color: #075e68;
    font-size: 19px;
}

.class-time span {
    margin-top: 4px;
    color: #71949a;
    font-size: 12.5px;
}

.class-info {
    padding: 16px;
}

.class-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.class-type {
    color: #0d7f8d;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.class-top h3 {
    margin: 4px 0 0;
    color: #11343a;
    font-size: 16.5px;
    font-weight: 700;
}

.class-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 14px;
}

.class-meta div {
    padding: 9px;
    border-radius: 10px;
    background: #f7fcfd;
}

.class-meta span {
    display: block;
    color: #8aa7ab;
    font-size: 11.5px;
}

.class-meta strong {
    display: block;
    margin-top: 3px;
    color: #34585d;
    font-size: 13px;
}

.capacity {
    margin-top: 14px;
}

.capacity-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
}

.capacity-head span {
    color: #71949a;
    font-size: 13px;
}

.capacity-head strong {
    color: #11343a;
    font-size: 13px;
}

.progress {
    width: 100%;
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: #e6f1f3;
}

.progress-value {
    height: 100%;
    border-radius: 999px;
    background: #0d7f8d;
}

.class-actions {
    display: flex;
    justify-content: flex-end;
    gap: 7px;
    margin-top: 14px;
}

.btn-detail,
.btn-edit {
    padding: 6px 9px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
}

.btn-detail {
    border: 1px solid #cfe8eb;
    background: white;
    color: #51777d;
}

.btn-edit {
    border: 1px solid #9ed9df;
    background: #dff6f8;
    color: #075e68;
}

.status {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
}

.status.active {
    background: #e4f7ef;
    color: #2c7c60;
}

.status.full {
    background: #fff4df;
    color: #a76b1d;
}

.status.cancelled {
    background: #feecec;
    color: #b94f4f;
}

.empty-state {
    grid-column: 1 / -1;
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
    background: rgba(8, 58, 64, 0.18);
    backdrop-filter: blur(4px);
}

.modal-box {
    width: 650px;
    max-width: 100%;
    max-height: 90vh;
    overflow-y: auto;
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

.modal-header h3 {
    margin: 0;
    color: #11343a;
    font-size: 20px;
}

.modal-header p {
    margin: 4px 0 0;
    color: #71949a;
    font-size: 14px;
}

.btn-close {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 9px;
    background: #edf8f9;
    color: #51777d;
    font-size: 20px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 13px;
}

.form-group.full {
    grid-column: 1 / -1;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    color: #51777d;
    font-size: 13.5px;
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
    font-size: 15px;
}

.form-group input,
.form-group select {
    height: 42px;
}

.form-group textarea {
    padding-top: 10px;
    resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    border-color: #0d7f8d;
    box-shadow: 0 0 0 3px rgba(13, 127, 141, 0.08);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    margin-top: 20px;
}

.btn-cancel,
.btn-save {
    padding: 9px 15px;
    border-radius: 10px;
    font-size: 14.5px;
    font-weight: 700;
}

.btn-cancel {
    border: 1px solid #9ed9df;
    background: white;
    color: #0d7f8d;
}

.btn-save {
    border: 1px solid #0d7f8d;
    background: #0d7f8d;
    color: white;
}

.btn-save:hover {
    background: #075e68;
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

@media (max-width: 1100px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .class-grid {
        grid-template-columns: 1fr;
    }
}

/* NAVIGATION TABS */
.schedule-nav-tabs {
    display: flex;
    gap: 8px;
    background: #e2f0f2;
    padding: 5px;
    border-radius: 14px;
    margin-bottom: 20px;
}

.schedule-nav-tab {
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

.schedule-nav-tab.active {
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

/* REQUEST TABLE */
.request-table {
    width: 100%;
    border-collapse: collapse;
}

.request-table th {
    padding: 12px 14px;
    text-align: left;
    font-size: 13px;
    font-weight: 700;
    color: #71949a;
    border-bottom: 1.5px solid #e1eff1;
}

.request-table td {
    padding: 14px;
    vertical-align: middle;
    border-bottom: 1px solid #edf6f7;
    font-size: 13.5px;
}

.ref-code-badge {
    background: #eaf9fb;
    color: #0d7f8d;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 12px;
    border: 1px solid #bcecf0;
}

.schedule-old-box strong {
    display: block;
    color: #64748b;
    font-size: 12.5px;
    text-decoration: line-through;
}
.schedule-old-box small {
    color: #94a3b8;
    font-size: 11.5px;
}

.schedule-new-box strong {
    display: block;
    color: #0d7f8d;
    font-size: 13.5px;
}
.schedule-new-box small {
    color: #51777d;
    font-size: 12px;
}

.reason-box {
    background: #f8fafc;
    border-left: 3px solid #f59e0b;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12.5px;
    color: #334155;
    font-style: italic;
    max-width: 250px;
}

.action-btn-group {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.btn-approve {
    padding: 6px 12px;
    border: 1px solid #10b981;
    background: #ecfdf5;
    color: #059669;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}
.btn-approve:hover { background: #d1fae5; }

.btn-reject {
    padding: 6px 12px;
    border: 1px solid #ef4444;
    background: #fef2f2;
    color: #dc2626;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}
.btn-reject:hover { background: #fee2e2; }

.btn-email {
    padding: 6px 12px;
    border: 1px solid #0d7f8d;
    background: #eaf9fb;
    color: #0d7f8d;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}
.btn-email:hover { background: #d3f3f6; }

.modal-email-box {
    max-width: 680px;
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

.tab-intro-row {
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
</style>