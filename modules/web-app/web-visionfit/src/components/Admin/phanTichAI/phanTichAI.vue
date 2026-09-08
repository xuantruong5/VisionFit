<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Phân tích AI</h2>
                <p>Theo dõi kết quả phân tích kỹ thuật tập luyện bằng Computer Vision</p>
            </div>

            <button class="btn-refresh" @click="refreshData">
                ↻ Làm mới
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng phiên AI</span>
                <strong>{{ list_session.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Phân tích thành công</span>
                <strong>{{ countCompleted }}</strong>
            </div>

            <div class="mini-card">
                <span>Đang xử lý</span>
                <strong>{{ countProcessing }}</strong>
            </div>

            <div class="mini-card">
                <span>Không đủ dữ liệu</span>
                <strong>{{ countInsufficient }}</strong>
            </div>
        </div>

        <div class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm Gymmer hoặc mã session..."
                    >
                </div>

                <select v-model="exerciseFilter">
                    <option value="">Tất cả bài tập</option>
                    <option value="Squat">Squat</option>
                    <option value="Deadlift">Deadlift</option>
                    <option value="Push-up">Push-up</option>
                </select>

                <select v-model="statusFilter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="insufficient">Không đủ dữ liệu</option>
                    <option value="failed">Lỗi</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="ai-table">
                    <thead>
                        <tr>
                            <th>Session</th>
                            <th>Gymmer</th>
                            <th>Bài tập</th>
                            <th>Reps</th>
                            <th>Confidence</th>
                            <th>AI Result</th>
                            <th>Trainer Review</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="session in filteredSessions" :key="session.id">
                            <td>
                                <div class="session-cell">
                                    <strong>#AI{{ session.id }}</strong>
                                    <span>{{ session.thoi_gian }}</span>
                                </div>
                            </td>

                            <td>
                                <div class="user-cell">
                                    <div class="avatar">
                                        {{ getInitial(session.gymmer) }}
                                    </div>

                                    <div>
                                        <strong>{{ session.gymmer }}</strong>
                                        <span>#GM{{ session.gymmer_id }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <span class="exercise-badge">
                                    {{ session.bai_tap }}
                                </span>
                            </td>

                            <td>
                                <div v-if="session.trang_thai === 'completed'" class="rep-info">
                                    <strong>{{ session.tong_rep }}</strong>
                                    <span>
                                        {{ session.rep_tot }} tốt ·
                                        {{ session.rep_loi }} lỗi
                                    </span>
                                </div>

                                <span v-else class="muted">
                                    —
                                </span>
                            </td>

                            <td>
                                <div
                                    v-if="session.confidence !== null"
                                    class="confidence"
                                >
                                    <div class="confidence-value">
                                        {{ session.confidence }}%
                                    </div>

                                    <div class="confidence-bar">
                                        <div
                                            class="confidence-progress"
                                            :style="{ width: session.confidence + '%' }"
                                        ></div>
                                    </div>
                                </div>

                                <span v-else class="muted">
                                    —
                                </span>
                            </td>

                            <td>
                                <span
                                    class="status"
                                    :class="session.trang_thai"
                                >
                                    <span class="status-dot"></span>
                                    {{ getStatusName(session.trang_thai) }}
                                </span>
                            </td>

                            <td>
                                <span
                                    class="review-status"
                                    :class="session.trainer_review"
                                >
                                    {{ getReviewName(session.trainer_review) }}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="btn-detail"
                                    @click="openDetail(session)"
                                >
                                    Chi tiết
                                </button>
                            </td>
                        </tr>

                        <tr v-if="filteredSessions.length === 0">
                            <td colspan="8">
                                <div class="empty-state">
                                    Không tìm thấy phiên AI phù hợp
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
                        <span class="ai-label">AI ANALYSIS SESSION</span>
                        <h3>#AI{{ selectedSession?.id }}</h3>
                        <p>
                            {{ selectedSession?.gymmer }} ·
                            {{ selectedSession?.bai_tap }}
                        </p>
                    </div>

                    <button class="btn-close" @click="closeDetail">
                        ×
                    </button>
                </div>

                <div
                    v-if="selectedSession?.trang_thai === 'completed'"
                    class="detail-content"
                >
                    <div class="summary-grid">
                        <div class="summary-box">
                            <span>Confidence</span>
                            <strong>{{ selectedSession?.confidence }}%</strong>
                        </div>

                        <div class="summary-box">
                            <span>Tổng reps</span>
                            <strong>{{ selectedSession?.tong_rep }}</strong>
                        </div>

                        <div class="summary-box good">
                            <span>Đúng kỹ thuật</span>
                            <strong>{{ selectedSession?.rep_tot }}</strong>
                        </div>

                        <div class="summary-box warning">
                            <span>Cần chú ý</span>
                            <strong>{{ selectedSession?.rep_loi }}</strong>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">
                            <div>
                                <h4>Phân tích từng repetition</h4>
                                <p>Kết quả AI theo từng lần thực hiện động tác</p>
                            </div>
                        </div>

                        <div class="rep-list">
                            <div
                                v-for="rep in selectedSession.repetitions"
                                :key="rep.rep"
                                class="rep-card"
                                :class="rep.result"
                            >
                                <div class="rep-number">
                                    {{ rep.rep }}
                                </div>

                                <div class="rep-main">
                                    <div class="rep-head">
                                        <strong>
                                            Rep {{ rep.rep }}
                                        </strong>

                                        <span
                                            class="rep-result"
                                            :class="rep.result"
                                        >
                                            {{
                                                rep.result === 'good'
                                                    ? 'Đúng kỹ thuật'
                                                    : 'Cần chỉnh'
                                            }}
                                        </span>
                                    </div>

                                    <p>{{ rep.feedback }}</p>

                                    <div class="rep-confidence">
                                        Confidence {{ rep.confidence }}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h4>AI Summary</h4>

                        <div class="ai-summary">
                            <div class="summary-icon">✦</div>

                            <div>
                                <strong>
                                    {{ selectedSession.ai_summary }}
                                </strong>

                                <p>
                                    Kết quả này cần được Trainer xác nhận trước
                                    khi dùng làm feedback chính thức cho Gymmer.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h4>Trainer Review</h4>

                        <div
                            v-if="selectedSession.trainer_review === 'reviewed'"
                            class="trainer-review"
                        >
                            <div class="trainer-avatar">
                                TH
                            </div>

                            <div>
                                <strong>Trần Quốc Huy</strong>
                                <span>Đã xác nhận kết quả AI</span>

                                <p>
                                    {{ selectedSession.trainer_feedback }}
                                </p>
                            </div>
                        </div>

                        <div v-else class="waiting-review">
                            Phiên này đang chờ Trainer kiểm tra và xác nhận.
                        </div>
                    </div>
                </div>

                <div
                    v-else-if="selectedSession?.trang_thai === 'processing'"
                    class="state-box"
                >
                    <div class="loader"></div>
                    <h4>AI đang phân tích video</h4>
                    <p>Pose estimation và repetition analysis đang được xử lý.</p>
                </div>

                <div
                    v-else-if="selectedSession?.trang_thai === 'insufficient'"
                    class="state-box warning-state"
                >
                    <div class="state-icon">!</div>
                    <h4>Không đủ dữ liệu để phân tích</h4>
                    <p>
                        Video có thể bị che khuất, góc quay không phù hợp
                        hoặc keypoints không đủ độ tin cậy.
                    </p>
                </div>

                <div v-else class="state-box error-state">
                    <div class="state-icon">×</div>
                    <h4>Phân tích thất bại</h4>
                    <p>Phiên AI gặp lỗi trong quá trình xử lý.</p>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeDetail">
                        Đóng
                    </button>

                    <button
                        v-if="selectedSession?.trainer_review === 'reviewed'"
                        class="btn-save"
                        @click="goTrainerReview"
                    >
                        Xem Trainer Review
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminPhanTichAI",

    data() {
        return {
            search: '',
            exerciseFilter: '',
            statusFilter: '',
            showDetail: false,
            selectedSession: null,

            list_session: [
                {
                    id: '02046',
                    gymmer_id: '00128',
                    gymmer: 'Nguyễn Minh Anh',
                    bai_tap: 'Squat',
                    thoi_gian: '02/09/2026 · 10:27',
                    trang_thai: 'completed',
                    trainer_review: 'reviewed',
                    confidence: 94,
                    tong_rep: 12,
                    rep_tot: 10,
                    rep_loi: 2,
                    ai_summary: 'Phần lớn repetitions đạt yêu cầu, 2 reps có độ sâu squat chưa ổn định.',
                    trainer_feedback: 'Giữ đầu gối ổn định hơn và hạ hông sâu thêm ở những reps cuối.',
                    repetitions: [
                        {
                            rep: 1,
                            result: 'good',
                            confidence: 96,
                            feedback: 'Góc gối và độ sâu squat đạt yêu cầu.'
                        },
                        {
                            rep: 2,
                            result: 'good',
                            confidence: 95,
                            feedback: 'Chuyển động ổn định.'
                        },
                        {
                            rep: 3,
                            result: 'bad',
                            confidence: 89,
                            feedback: 'Độ sâu chưa đạt mức khuyến nghị.'
                        },
                        {
                            rep: 4,
                            result: 'good',
                            confidence: 94,
                            feedback: 'Tư thế ổn định.'
                        },
                        {
                            rep: 5,
                            result: 'bad',
                            confidence: 88,
                            feedback: 'Đầu gối có xu hướng lệch vào trong.'
                        }
                    ]
                },
                {
                    id: '02045',
                    gymmer_id: '00127',
                    gymmer: 'Phạm Gia Hân',
                    bai_tap: 'Deadlift',
                    thoi_gian: '02/09/2026 · 09:52',
                    trang_thai: 'completed',
                    trainer_review: 'waiting',
                    confidence: 89,
                    tong_rep: 8,
                    rep_tot: 6,
                    rep_loi: 2,
                    ai_summary: 'Phát hiện 2 repetitions có góc thân người cần chú ý.',
                    trainer_feedback: '',
                    repetitions: [
                        {
                            rep: 1,
                            result: 'good',
                            confidence: 92,
                            feedback: 'Tư thế deadlift ổn định.'
                        },
                        {
                            rep: 2,
                            result: 'bad',
                            confidence: 86,
                            feedback: 'Góc lưng thay đổi nhiều khi kéo lên.'
                        },
                        {
                            rep: 3,
                            result: 'good',
                            confidence: 90,
                            feedback: 'Chuyển động đạt yêu cầu.'
                        }
                    ]
                },
                {
                    id: '02044',
                    gymmer_id: '00122',
                    gymmer: 'Võ Thanh Tùng',
                    bai_tap: 'Push-up',
                    thoi_gian: '02/09/2026 · 09:48',
                    trang_thai: 'processing',
                    trainer_review: 'unavailable',
                    confidence: null,
                    tong_rep: 0,
                    rep_tot: 0,
                    rep_loi: 0,
                    repetitions: []
                },
                {
                    id: '02043',
                    gymmer_id: '00119',
                    gymmer: 'Hoàng Ngọc Vy',
                    bai_tap: 'Squat',
                    thoi_gian: '01/09/2026 · 17:43',
                    trang_thai: 'insufficient',
                    trainer_review: 'unavailable',
                    confidence: null,
                    tong_rep: 0,
                    rep_tot: 0,
                    rep_loi: 0,
                    repetitions: []
                },
                {
                    id: '02042',
                    gymmer_id: '00121',
                    gymmer: 'Lê Gia Bảo',
                    bai_tap: 'Deadlift',
                    thoi_gian: '31/08/2026 · 18:23',
                    trang_thai: 'failed',
                    trainer_review: 'unavailable',
                    confidence: null,
                    tong_rep: 0,
                    rep_tot: 0,
                    rep_loi: 0,
                    repetitions: []
                }
            ]
        }
    },

    computed: {
        filteredSessions() {
            return this.list_session.filter((session) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    session.gymmer.toLowerCase().includes(keyword) ||
                    session.id.includes(keyword);

                const matchExercise =
                    !this.exerciseFilter ||
                    session.bai_tap === this.exerciseFilter;

                const matchStatus =
                    !this.statusFilter ||
                    session.trang_thai === this.statusFilter;

                return matchSearch && matchExercise && matchStatus;
            });
        },

        countCompleted() {
            return this.list_session.filter(
                item => item.trang_thai === 'completed'
            ).length;
        },

        countProcessing() {
            return this.list_session.filter(
                item => item.trang_thai === 'processing'
            ).length;
        },

        countInsufficient() {
            return this.list_session.filter(
                item => item.trang_thai === 'insufficient'
            ).length;
        }
    },

    methods: {
        getInitial(name) {
            return name
                .trim()
                .split(' ')
                .slice(-2)
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();
        },

        getStatusName(status) {
            if (status === 'completed') return 'Hoàn tất';
            if (status === 'processing') return 'Đang xử lý';
            if (status === 'insufficient') return 'Không đủ dữ liệu';
            if (status === 'failed') return 'Lỗi';

            return status;
        },

        getReviewName(status) {
            if (status === 'reviewed') return 'Đã review';
            if (status === 'waiting') return 'Chờ review';
            if (status === 'unavailable') return 'Chưa khả dụng';

            return status;
        },

        openDetail(session) {
            this.selectedSession = session;
            this.showDetail = true;
        },

        closeDetail() {
            this.showDetail = false;
            this.selectedSession = null;
        },

        refreshData() {
            console.log('Refresh AI sessions');
        },

        goTrainerReview() {
            this.closeDetail();
            this.$router.push('/admin/trainer-review');
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
    font-size: 11px;
    font-weight: 700;
    transition: 0.15s ease;
}

.btn-refresh:hover {
    background: #dff6f8;
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
    font-size: 11.5px;
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
    font-size: 11px;
}

.ai-table {
    width: 100%;
    border-collapse: collapse;
}

.ai-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9.5px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.ai-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #34585d;
    font-size: 11px;
}

.ai-table tbody tr {
    transition: 0.15s ease;
}

.ai-table tbody tr:hover {
    background: #f5fcfd;
}

.session-cell strong,
.session-cell span {
    display: block;
}

.session-cell strong {
    color: #11343a;
    font-size: 10.5px;
}

.session-cell span {
    margin-top: 3px;
    color: #8aa7ab;
    font-size: 8.5px;
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
    border-radius: 10px;
    background: #dff6f8;
    color: #075e68;
    font-size: 10px;
    font-weight: 800;
}

.user-cell strong {
    display: block;
    color: #11343a;
    font-size: 10.5px;
}

.user-cell span {
    display: block;
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.exercise-badge {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    background: #e3f8fb;
    color: #0b7481;
    font-size: 9px;
    font-weight: 700;
}

.rep-info strong,
.rep-info span {
    display: block;
}

.rep-info strong {
    color: #11343a;
    font-size: 13px;
}

.rep-info span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8.5px;
}

.confidence {
    width: 80px;
}

.confidence-value {
    margin-bottom: 5px;
    color: #075e68;
    font-size: 10px;
    font-weight: 750;
}

.confidence-bar {
    width: 100%;
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: #e2f1f3;
}

.confidence-progress {
    height: 100%;
    border-radius: 999px;
    background: #0d7f8d;
}

.status,
.review-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 700;
    white-space: nowrap;
}

.status.completed,
.review-status.reviewed {
    background: #e4f7ef;
    color: #2c7c60;
}

.status.processing {
    background: #e3f8fb;
    color: #0b7481;
}

.status.insufficient,
.review-status.waiting {
    background: #fff4df;
    color: #a76b1d;
}

.status.failed {
    background: #feecec;
    color: #b94f4f;
}

.review-status.unavailable {
    background: #f1f5f9;
    color: #64748b;
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

.muted {
    color: #a8babc;
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
    background: rgba(8, 58, 64, 0.18);
    backdrop-filter: blur(4px);
}

.detail-modal {
    width: 780px;
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

.ai-label {
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
    color: #71949a;
    font-size: 10.5px;
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

.summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 9px;
}

.summary-box {
    padding: 13px;
    border: 1px solid #d8eef1;
    border-radius: 12px;
    background: #f8fdfe;
}

.summary-box span {
    display: block;
    color: #71949a;
    font-size: 8.5px;
}

.summary-box strong {
    display: block;
    margin-top: 5px;
    color: #075e68;
    font-size: 20px;
}

.summary-box.good strong {
    color: #2c7c60;
}

.summary-box.warning strong {
    color: #a76b1d;
}

.section {
    margin-top: 18px;
    padding-top: 17px;
    border-top: 1px solid #e6f1f3;
}

.section h4 {
    margin: 0;
    color: #11343a;
    font-size: 13px;
}

.section-title p {
    margin: 3px 0 0;
    color: #71949a;
    font-size: 9.5px;
}

.rep-list {
    display: grid;
    gap: 8px;
    margin-top: 12px;
}

.rep-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    border: 1px solid #d8eef1;
    border-radius: 12px;
}

.rep-card.good {
    background: #f8fdfb;
}

.rep-card.bad {
    background: #fffaf3;
}

.rep-number {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 10px;
    background: #dff6f8;
    color: #075e68;
    font-size: 11px;
    font-weight: 800;
}

.rep-main {
    flex: 1;
}

.rep-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.rep-head strong {
    color: #11343a;
    font-size: 10.5px;
}

.rep-result {
    padding: 4px 7px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 700;
}

.rep-result.good {
    background: #e4f7ef;
    color: #2c7c60;
}

.rep-result.bad {
    background: #fff4df;
    color: #a76b1d;
}

.rep-main p {
    margin: 6px 0;
    color: #597d82;
    font-size: 9.5px;
}

.rep-confidence {
    color: #8aa7ab;
    font-size: 8.5px;
}

.ai-summary {
    display: flex;
    gap: 12px;
    margin-top: 11px;
    padding: 14px;
    border: 1px solid #9ed9df;
    border-radius: 13px;
    background: #effbfc;
}

.summary-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 11px;
    background: #0d7f8d;
    color: white;
}

.ai-summary strong {
    color: #11343a;
    font-size: 10.5px;
}

.ai-summary p {
    margin: 5px 0 0;
    color: #71949a;
    font-size: 9px;
}

.trainer-review {
    display: flex;
    gap: 11px;
    margin-top: 11px;
    padding: 13px;
    border: 1px solid #d8eef1;
    border-radius: 13px;
    background: #fbfeff;
}

.trainer-avatar {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 11px;
    background: #dff6f8;
    color: #075e68;
    font-size: 10px;
    font-weight: 800;
}

.trainer-review strong,
.trainer-review span {
    display: block;
}

.trainer-review strong {
    color: #11343a;
    font-size: 10.5px;
}

.trainer-review span {
    margin-top: 2px;
    color: #2c7c60;
    font-size: 8.5px;
}

.trainer-review p {
    margin: 7px 0 0;
    color: #597d82;
    font-size: 9.5px;
}

.waiting-review {
    margin-top: 10px;
    padding: 12px;
    border-radius: 11px;
    background: #fff8e9;
    color: #9d701f;
    font-size: 9.5px;
}

.state-box {
    padding: 50px 20px;
    text-align: center;
}

.loader {
    width: 42px;
    height: 42px;
    margin: 0 auto 14px;
    border: 4px solid #dff6f8;
    border-top-color: #0d7f8d;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.state-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 13px;
    border-radius: 50%;
    background: #fff4df;
    color: #a76b1d;
    font-size: 19px;
    font-weight: 800;
}

.error-state .state-icon {
    background: #feecec;
    color: #b94f4f;
}

.state-box h4 {
    margin: 0;
    color: #11343a;
    font-size: 14px;
}

.state-box p {
    max-width: 430px;
    margin: 7px auto 0;
    color: #71949a;
    font-size: 10px;
    line-height: 1.6;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    margin-top: 18px;
}

.btn-cancel,
.btn-save {
    padding: 9px 15px;
    border-radius: 10px;
    font-size: 10.5px;
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

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 1100px) {
    .stat-row,
    .summary-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .filter-bar {
        flex-wrap: wrap;
    }
}
</style>