<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Trainer Review</h2>
                <p>Theo dõi lịch sử Trainer kiểm tra và phản hồi kết quả AI</p>
            </div>

            <button class="btn-refresh" @click="refreshData">
                ↻ Làm mới
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng review</span>
                <strong>{{ list_review.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Đã xác nhận</span>
                <strong>{{ countConfirmed }}</strong>
            </div>

            <div class="mini-card">
                <span>Đã điều chỉnh</span>
                <strong>{{ countAdjusted }}</strong>
            </div>

            <div class="mini-card">
                <span>Đã từ chối</span>
                <strong>{{ countRejected }}</strong>
            </div>
        </div>

        <div class="content-card">
            <div class="filter-bar">
                <div class="search-box">
                    <span>⌕</span>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm Gymmer, Trainer hoặc mã session..."
                    >
                </div>

                <select v-model="actionFilter">
                    <option value="">Tất cả review</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="adjusted">Adjusted</option>
                    <option value="rejected">Rejected</option>
                </select>

                <select v-model="exerciseFilter">
                    <option value="">Tất cả bài tập</option>
                    <option value="Squat">Squat</option>
                    <option value="Deadlift">Deadlift</option>
                    <option value="Push-up">Push-up</option>
                </select>
            </div>

            <div class="review-list">
                <div
                    v-for="review in filteredReviews"
                    :key="review.id"
                    class="review-card"
                >
                    <div class="review-main">
                        <div class="review-left">
                            <div class="trainer-avatar">
                                {{ getInitial(review.trainer) }}
                            </div>

                            <div>
                                <div class="review-top">
                                    <strong>{{ review.trainer }}</strong>

                                    <span
                                        class="action-badge"
                                        :class="review.action"
                                    >
                                        {{ getActionName(review.action) }}
                                    </span>
                                </div>

                                <p>
                                    Review kết quả AI của
                                    <b>{{ review.gymmer }}</b>
                                    · {{ review.bai_tap }}
                                </p>

                                <div class="meta">
                                    <span>#AI{{ review.session_id }}</span>
                                    <span>•</span>
                                    <span>{{ review.thoi_gian }}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            class="btn-detail"
                            @click="openDetail(review)"
                        >
                            Chi tiết
                        </button>
                    </div>

                    <div class="feedback-box">
                        <span>FEEDBACK CỦA TRAINER</span>
                        <p>{{ review.feedback }}</p>
                    </div>

                    <div
                        v-if="review.action === 'adjusted'"
                        class="adjust-box"
                    >
                        <div>
                            <span>AI ban đầu</span>
                            <strong>{{ review.ai_result }}</strong>
                        </div>

                        <div class="arrow">
                            →
                        </div>

                        <div>
                            <span>Trainer điều chỉnh</span>
                            <strong>{{ review.trainer_result }}</strong>
                        </div>
                    </div>
                </div>

                <div
                    v-if="filteredReviews.length === 0"
                    class="empty-state"
                >
                    Không tìm thấy Trainer Review phù hợp
                </div>
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
                        <span class="label">TRAINER REVIEW</span>

                        <h3>#RV{{ selectedReview?.id }}</h3>

                        <p>
                            Session #AI{{ selectedReview?.session_id }}
                        </p>
                    </div>

                    <button
                        class="btn-close"
                        @click="closeDetail"
                    >
                        ×
                    </button>
                </div>

                <div class="people-grid">
                    <div class="person-card">
                        <span>GYMMER</span>

                        <div class="person">
                            <div class="person-avatar">
                                {{ getInitial(selectedReview?.gymmer || '') }}
                            </div>

                            <div>
                                <strong>{{ selectedReview?.gymmer }}</strong>
                                <p>{{ selectedReview?.bai_tap }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="person-card">
                        <span>TRAINER</span>

                        <div class="person">
                            <div class="person-avatar trainer">
                                {{ getInitial(selectedReview?.trainer || '') }}
                            </div>

                            <div>
                                <strong>{{ selectedReview?.trainer }}</strong>
                                <p>Huấn luyện viên phụ trách</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>Kết quả AI</h4>

                    <div class="result-grid">
                        <div>
                            <span>Confidence</span>
                            <strong>{{ selectedReview?.confidence }}%</strong>
                        </div>

                        <div>
                            <span>Tổng reps</span>
                            <strong>{{ selectedReview?.tong_rep }}</strong>
                        </div>

                        <div>
                            <span>AI Result</span>
                            <strong>{{ selectedReview?.ai_result }}</strong>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>Quyết định của Trainer</h4>

                    <div
                        class="decision"
                        :class="selectedReview?.action"
                    >
                        <span
                            class="decision-badge"
                            :class="selectedReview?.action"
                        >
                            {{ getActionName(selectedReview?.action) }}
                        </span>

                        <p>
                            {{ selectedReview?.feedback }}
                        </p>
                    </div>
                </div>

                <div
                    v-if="selectedReview?.action === 'adjusted'"
                    class="section"
                >
                    <h4>Thông tin điều chỉnh</h4>

                    <div class="adjust-detail">
                        <div>
                            <span>AI đánh giá</span>
                            <strong>{{ selectedReview?.ai_result }}</strong>
                        </div>

                        <div class="big-arrow">
                            →
                        </div>

                        <div>
                            <span>Trainer đánh giá</span>
                            <strong>{{ selectedReview?.trainer_result }}</strong>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>Thông tin Review</h4>

                    <div class="info-list">
                        <div>
                            <span>Thời gian</span>
                            <strong>{{ selectedReview?.thoi_gian }}</strong>
                        </div>

                        <div>
                            <span>Session AI</span>
                            <strong>#AI{{ selectedReview?.session_id }}</strong>
                        </div>

                        <div>
                            <span>Bài tập</span>
                            <strong>{{ selectedReview?.bai_tap }}</strong>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button
                        class="btn-cancel"
                        @click="closeDetail"
                    >
                        Đóng
                    </button>

                    <button
                        class="btn-save"
                        @click="goToAI"
                    >
                        Xem phiên AI
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminTrainerReview",

    data() {
        return {
            search: '',
            actionFilter: '',
            exerciseFilter: '',
            showDetail: false,
            selectedReview: null,

            list_review: [
                {
                    id: '03018',
                    session_id: '02046',
                    gymmer: 'Nguyễn Minh Anh',
                    trainer: 'Trần Quốc Huy',
                    bai_tap: 'Squat',
                    thoi_gian: '02/09/2026 · 10:42',
                    action: 'confirmed',
                    confidence: 94,
                    tong_rep: 12,
                    ai_result: '10 tốt · 2 cần chú ý',
                    trainer_result: '10 tốt · 2 cần chú ý',
                    feedback: 'Kết quả AI phù hợp. Cần giữ đầu gối ổn định hơn ở hai repetitions cuối.'
                },
                {
                    id: '03017',
                    session_id: '02041',
                    gymmer: 'Lê Minh Khang',
                    trainer: 'Lê Hoàng Nam',
                    bai_tap: 'Deadlift',
                    thoi_gian: '01/09/2026 · 21:10',
                    action: 'adjusted',
                    confidence: 87,
                    tong_rep: 10,
                    ai_result: '8 tốt · 2 cần chú ý',
                    trainer_result: '7 tốt · 3 cần chú ý',
                    feedback: 'Trainer xác định thêm rep 6 có tư thế lưng chưa ổn định nên đã điều chỉnh kết quả.'
                },
                {
                    id: '03016',
                    session_id: '02038',
                    gymmer: 'Trần Gia Bảo',
                    trainer: 'Nguyễn Khánh Linh',
                    bai_tap: 'Push-up',
                    thoi_gian: '01/09/2026 · 17:35',
                    action: 'confirmed',
                    confidence: 91,
                    tong_rep: 15,
                    ai_result: '13 tốt · 2 cần chú ý',
                    trainer_result: '13 tốt · 2 cần chú ý',
                    feedback: 'Kết quả AI chính xác. Gymmer nên duy trì thân người thẳng trong toàn bộ chuyển động.'
                },
                {
                    id: '03015',
                    session_id: '02035',
                    gymmer: 'Hoàng Ngọc Vy',
                    trainer: 'Nguyễn Khánh Linh',
                    bai_tap: 'Squat',
                    thoi_gian: '31/08/2026 · 19:40',
                    action: 'rejected',
                    confidence: 68,
                    tong_rep: 7,
                    ai_result: '5 tốt · 2 cần chú ý',
                    trainer_result: 'Không sử dụng',
                    feedback: 'Góc quay bị che khuất phần chân nên kết quả AI không đủ tin cậy để gửi feedback.'
                }
            ]
        }
    },

    computed: {
        filteredReviews() {
            return this.list_review.filter((review) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    review.gymmer.toLowerCase().includes(keyword) ||
                    review.trainer.toLowerCase().includes(keyword) ||
                    review.session_id.includes(keyword);

                const matchAction =
                    !this.actionFilter ||
                    review.action === this.actionFilter;

                const matchExercise =
                    !this.exerciseFilter ||
                    review.bai_tap === this.exerciseFilter;

                return matchSearch && matchAction && matchExercise;
            });
        },

        countConfirmed() {
            return this.list_review.filter(
                item => item.action === 'confirmed'
            ).length;
        },

        countAdjusted() {
            return this.list_review.filter(
                item => item.action === 'adjusted'
            ).length;
        },

        countRejected() {
            return this.list_review.filter(
                item => item.action === 'rejected'
            ).length;
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

        getActionName(action) {
            if (action === 'confirmed') return 'Confirmed';
            if (action === 'adjusted') return 'Adjusted';
            if (action === 'rejected') return 'Rejected';

            return action;
        },

        openDetail(review) {
            this.selectedReview = review;
            this.showDetail = true;
        },

        closeDetail() {
            this.showDetail = false;
            this.selectedReview = null;
        },

        refreshData() {
            console.log('Refresh Trainer Reviews');
        },

        goToAI() {
            this.closeDetail();
            this.$router.push('/admin/phan-tich-ai');
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
    min-width: 160px;
    height: 42px;
    padding: 0 10px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 11px;
}

.review-list {
    display: grid;
    gap: 12px;
}

.review-card {
    padding: 16px;
    border: 1px solid #d8eef1;
    border-radius: 16px;
    background: #ffffff;
    transition: 0.18s ease;
}

.review-card:hover {
    transform: translateY(-2px);
    border-color: #9ed9df;
    box-shadow: 0 9px 20px rgba(13, 127, 141, 0.07);
}

.review-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
}

.review-left {
    display: flex;
    align-items: flex-start;
    gap: 11px;
}

.trainer-avatar {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 12px;
    background: #dff6f8;
    color: #075e68;
    font-size: 10px;
    font-weight: 800;
}

.review-top {
    display: flex;
    align-items: center;
    gap: 8px;
}

.review-top strong {
    color: #11343a;
    font-size: 11.5px;
}

.review-left p {
    margin: 4px 0;
    color: #597d82;
    font-size: 10px;
}

.review-left p b {
    color: #11343a;
}

.meta {
    display: flex;
    gap: 5px;
    color: #94afb3;
    font-size: 8.5px;
}

.action-badge,
.decision-badge {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 750;
}

.action-badge.confirmed,
.decision-badge.confirmed {
    background: #e4f7ef;
    color: #2c7c60;
}

.action-badge.adjusted,
.decision-badge.adjusted {
    background: #e3f8fb;
    color: #0b7481;
}

.action-badge.rejected,
.decision-badge.rejected {
    background: #feecec;
    color: #b94f4f;
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

.feedback-box {
    margin-top: 13px;
    padding: 12px;
    border-radius: 11px;
    background: #f7fcfd;
}

.feedback-box span {
    color: #71949a;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.8px;
}

.feedback-box p {
    margin: 5px 0 0;
    color: #456a70;
    font-size: 9.5px;
    line-height: 1.6;
}

.adjust-box {
    display: grid;
    grid-template-columns: 1fr 35px 1fr;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 11px;
    border: 1px solid #cfe8eb;
    border-radius: 11px;
    background: #effbfc;
}

.adjust-box span {
    display: block;
    color: #71949a;
    font-size: 8px;
}

.adjust-box strong {
    display: block;
    margin-top: 3px;
    color: #11343a;
    font-size: 10px;
}

.arrow {
    color: #0d7f8d;
    font-size: 16px;
    font-weight: 800;
    text-align: center;
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
    width: 720px;
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

.label {
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
    font-size: 10px;
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

.people-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.person-card {
    padding: 13px;
    border: 1px solid #d8eef1;
    border-radius: 13px;
    background: #fbfeff;
}

.person-card > span {
    color: #71949a;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.8px;
}

.person {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 9px;
}

.person-avatar {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: #dff6f8;
    color: #075e68;
    font-size: 9px;
    font-weight: 800;
}

.person-avatar.trainer {
    background: #e8f5ff;
    color: #356b8e;
}

.person strong {
    color: #11343a;
    font-size: 10.5px;
}

.person p {
    margin: 2px 0 0;
    color: #8aa7ab;
    font-size: 8.5px;
}

.section {
    margin-top: 17px;
    padding-top: 16px;
    border-top: 1px solid #e6f1f3;
}

.section h4 {
    margin: 0 0 10px;
    color: #11343a;
    font-size: 13px;
}

.result-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
}

.result-grid div {
    padding: 11px;
    border-radius: 11px;
    background: #f7fcfd;
}

.result-grid span,
.info-list span {
    display: block;
    color: #71949a;
    font-size: 8.5px;
}

.result-grid strong,
.info-list strong {
    display: block;
    margin-top: 4px;
    color: #11343a;
    font-size: 10.5px;
}

.decision {
    padding: 13px;
    border-radius: 12px;
}

.decision.confirmed {
    background: #f3fbf8;
}

.decision.adjusted {
    background: #effbfc;
}

.decision.rejected {
    background: #fff6f6;
}

.decision p {
    margin: 8px 0 0;
    color: #456a70;
    font-size: 9.5px;
    line-height: 1.6;
}

.adjust-detail {
    display: grid;
    grid-template-columns: 1fr 50px 1fr;
    align-items: center;
    gap: 10px;
}

.adjust-detail div:not(.big-arrow) {
    padding: 12px;
    border: 1px solid #d8eef1;
    border-radius: 11px;
    background: #fbfeff;
}

.adjust-detail span {
    display: block;
    color: #71949a;
    font-size: 8px;
}

.adjust-detail strong {
    display: block;
    margin-top: 4px;
    color: #11343a;
    font-size: 10px;
}

.big-arrow {
    color: #0d7f8d;
    font-size: 20px;
    font-weight: 800;
    text-align: center;
}

.info-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
}

.info-list div {
    padding: 10px;
    border-radius: 10px;
    background: #f7fcfd;
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

@media (max-width: 1000px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .filter-bar {
        flex-wrap: wrap;
    }
}
</style>