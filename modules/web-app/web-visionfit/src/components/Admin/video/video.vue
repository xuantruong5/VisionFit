<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Video tập luyện</h2>
                <p>Quản lý toàn bộ video Gymmer đã tải lên hệ thống</p>
            </div>

            <button class="btn-refresh" @click="refreshData">
                ↻ Làm mới
            </button>
        </div>

        <div class="stat-row">
            <div class="mini-card">
                <span>Tổng video</span>
                <strong>{{ list_video.length }}</strong>
            </div>

            <div class="mini-card">
                <span>Đã phân tích</span>
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
                        placeholder="Tìm Gymmer, bài tập hoặc mã video..."
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
                    <option value="completed">Đã phân tích</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="insufficient">Không đủ dữ liệu</option>
                    <option value="failed">Lỗi xử lý</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="video-table">
                    <thead>
                        <tr>
                            <th>Video</th>
                            <th>Gymmer</th>
                            <th>Bài tập</th>
                            <th>Thời lượng</th>
                            <th>Ngày tải lên</th>
                            <th>AI</th>
                            <th>Trainer Review</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="video in filteredVideos"
                            :key="video.id"
                        >
                            <td>
                                <div class="video-cell">
                                    <div
                                        class="video-thumb"
                                        @click="openPreview(video)"
                                    >
                                        <div class="play-button">
                                            ▶
                                        </div>
                                    </div>

                                    <div>
                                        <strong>#VD{{ video.id }}</strong>
                                        <span>{{ video.file_name }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <div class="gymmer-cell">
                                    <div class="avatar">
                                        {{ getInitial(video.gymmer) }}
                                    </div>

                                    <div>
                                        <strong>{{ video.gymmer }}</strong>
                                        <span>#GM{{ video.gymmer_id }}</span>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <span class="exercise-badge">
                                    {{ video.bai_tap }}
                                </span>
                            </td>

                            <td>{{ video.thoi_luong }}</td>

                            <td>
                                <div class="date-cell">
                                    <strong>{{ video.ngay_upload }}</strong>
                                    <span>{{ video.gio_upload }}</span>
                                </div>
                            </td>

                            <td>
                                <span
                                    class="status"
                                    :class="video.trang_thai_ai"
                                >
                                    <span class="status-dot"></span>
                                    {{ getAIStatus(video.trang_thai_ai) }}
                                </span>
                            </td>

                            <td>
                                <span
                                    class="review-status"
                                    :class="video.trainer_review"
                                >
                                    {{
                                        getReviewStatus(video.trainer_review)
                                    }}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="btn-detail"
                                    @click="openDetail(video)"
                                >
                                    Chi tiết
                                </button>
                            </td>
                        </tr>

                        <tr v-if="filteredVideos.length === 0">
                            <td colspan="8">
                                <div class="empty-state">
                                    Không tìm thấy video phù hợp
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div
            v-if="showPreview"
            class="modal-overlay"
            @click.self="closePreview"
        >
            <div class="preview-modal">
                <div class="modal-header">
                    <div>
                        <h3>Video tập luyện</h3>
                        <p>
                            {{ selectedVideo?.gymmer }} ·
                            {{ selectedVideo?.bai_tap }}
                        </p>
                    </div>

                    <button
                        class="btn-close"
                        @click="closePreview"
                    >
                        ×
                    </button>
                </div>

                <div class="video-player">
                    <div class="fake-video">
                        <div class="fake-icon">
                            ▶
                        </div>

                        <strong>
                            {{ selectedVideo?.file_name }}
                        </strong>

                        <span>
                            Video demo frontend
                        </span>
                    </div>
                </div>

                <div class="video-info-grid">
                    <div>
                        <span>Mã video</span>
                        <strong>#VD{{ selectedVideo?.id }}</strong>
                    </div>

                    <div>
                        <span>Bài tập</span>
                        <strong>{{ selectedVideo?.bai_tap }}</strong>
                    </div>

                    <div>
                        <span>Thời lượng</span>
                        <strong>{{ selectedVideo?.thoi_luong }}</strong>
                    </div>

                    <div>
                        <span>Độ phân giải</span>
                        <strong>{{ selectedVideo?.do_phan_giai }}</strong>
                    </div>
                </div>

                <div
                    v-if="selectedVideo?.trang_thai_ai === 'completed'"
                    class="ai-summary"
                >
                    <div class="ai-summary-head">
                        <div>
                            <span>AI ANALYSIS</span>
                            <h4>Kết quả phân tích</h4>
                        </div>

                        <strong>
                            {{ selectedVideo?.confidence }}%
                        </strong>
                    </div>

                    <div class="ai-data">
                        <div>
                            <span>Tổng repetitions</span>
                            <strong>{{ selectedVideo?.reps }}</strong>
                        </div>

                        <div>
                            <span>Đúng kỹ thuật</span>
                            <strong>{{ selectedVideo?.good_reps }}</strong>
                        </div>

                        <div>
                            <span>Cần chú ý</span>
                            <strong>{{ selectedVideo?.bad_reps }}</strong>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button
                        class="btn-cancel"
                        @click="closePreview"
                    >
                        Đóng
                    </button>

                    <button
                        class="btn-save"
                        @click="goToAI(selectedVideo)"
                    >
                        Xem phân tích AI
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminVideo",

    data() {
        return {
            search: '',
            exerciseFilter: '',
            statusFilter: '',
            showPreview: false,
            selectedVideo: null,

            list_video: [
                {
                    id: '01028',
                    gymmer_id: '00128',
                    gymmer: 'Nguyễn Minh Anh',
                    bai_tap: 'Squat',
                    file_name: 'squat_session_28.mp4',
                    thoi_luong: '00:42',
                    ngay_upload: '02/09/2026',
                    gio_upload: '10:25',
                    do_phan_giai: '1080p',
                    trang_thai_ai: 'completed',
                    trainer_review: 'reviewed',
                    confidence: 94,
                    reps: 12,
                    good_reps: 10,
                    bad_reps: 2
                },
                {
                    id: '01027',
                    gymmer_id: '00122',
                    gymmer: 'Võ Thanh Tùng',
                    bai_tap: 'Push-up',
                    file_name: 'pushup_training.mp4',
                    thoi_luong: '00:31',
                    ngay_upload: '02/09/2026',
                    gio_upload: '09:48',
                    do_phan_giai: '720p',
                    trang_thai_ai: 'processing',
                    trainer_review: 'waiting',
                    confidence: null,
                    reps: 0,
                    good_reps: 0,
                    bad_reps: 0
                },
                {
                    id: '01026',
                    gymmer_id: '00127',
                    gymmer: 'Phạm Gia Hân',
                    bai_tap: 'Deadlift',
                    file_name: 'deadlift_set_03.mp4',
                    thoi_luong: '00:55',
                    ngay_upload: '01/09/2026',
                    gio_upload: '20:10',
                    do_phan_giai: '1080p',
                    trang_thai_ai: 'completed',
                    trainer_review: 'waiting',
                    confidence: 89,
                    reps: 8,
                    good_reps: 6,
                    bad_reps: 2
                },
                {
                    id: '01025',
                    gymmer_id: '00119',
                    gymmer: 'Hoàng Ngọc Vy',
                    bai_tap: 'Squat',
                    file_name: 'squat_test.mp4',
                    thoi_luong: '00:18',
                    ngay_upload: '01/09/2026',
                    gio_upload: '17:42',
                    do_phan_giai: '480p',
                    trang_thai_ai: 'insufficient',
                    trainer_review: 'not_available',
                    confidence: null,
                    reps: 0,
                    good_reps: 0,
                    bad_reps: 0
                },
                {
                    id: '01024',
                    gymmer_id: '00121',
                    gymmer: 'Lê Gia Bảo',
                    bai_tap: 'Deadlift',
                    file_name: 'deadlift_camera_test.mp4',
                    thoi_luong: '00:29',
                    ngay_upload: '31/08/2026',
                    gio_upload: '18:22',
                    do_phan_giai: '720p',
                    trang_thai_ai: 'failed',
                    trainer_review: 'not_available',
                    confidence: null,
                    reps: 0,
                    good_reps: 0,
                    bad_reps: 0
                }
            ]
        }
    },

    computed: {
        filteredVideos() {
            return this.list_video.filter((video) => {
                const keyword = this.search.toLowerCase();

                const matchSearch =
                    video.gymmer.toLowerCase().includes(keyword) ||
                    video.bai_tap.toLowerCase().includes(keyword) ||
                    video.id.includes(keyword);

                const matchExercise =
                    !this.exerciseFilter ||
                    video.bai_tap === this.exerciseFilter;

                const matchStatus =
                    !this.statusFilter ||
                    video.trang_thai_ai === this.statusFilter;

                return (
                    matchSearch &&
                    matchExercise &&
                    matchStatus
                );
            });
        },

        countCompleted() {
            return this.list_video.filter(
                video => video.trang_thai_ai === 'completed'
            ).length;
        },

        countProcessing() {
            return this.list_video.filter(
                video => video.trang_thai_ai === 'processing'
            ).length;
        },

        countInsufficient() {
            return this.list_video.filter(
                video => video.trang_thai_ai === 'insufficient'
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

        getAIStatus(status) {
            if (status === 'completed') return 'Đã phân tích';
            if (status === 'processing') return 'Đang xử lý';
            if (status === 'insufficient') return 'Không đủ dữ liệu';
            if (status === 'failed') return 'Lỗi xử lý';

            return status;
        },

        getReviewStatus(status) {
            if (status === 'reviewed') return 'Đã review';
            if (status === 'waiting') return 'Chờ review';
            if (status === 'not_available') return 'Chưa khả dụng';

            return status;
        },

        openPreview(video) {
            this.selectedVideo = video;
            this.showPreview = true;
        },

        closePreview() {
            this.showPreview = false;
            this.selectedVideo = null;
        },

        openDetail(video) {
            this.openPreview(video);
        },

        refreshData() {
            console.log('Refresh video data');
        },

        goToAI(video) {
            if (!video) {
                return;
            }

            if (video.trang_thai_ai !== 'completed') {
                alert('Video này chưa có kết quả AI');
                return;
            }

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
    min-width: 170px;
    height: 42px;
    padding: 0 10px;
    border: 1px solid #d3e9ec;
    border-radius: 11px;
    outline: none;
    background: white;
    color: #51777d;
    font-size: 11px;
}

.video-table {
    width: 100%;
    border-collapse: collapse;
}

.video-table th {
    padding: 11px 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9.5px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.video-table td {
    padding: 13px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #34585d;
    font-size: 11.5px;
}

.video-table tbody tr {
    transition: 0.15s ease;
}

.video-table tbody tr:hover {
    background: #f5fcfd;
}

.video-cell,
.gymmer-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.video-thumb {
    width: 56px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    border-radius: 9px;
    background: linear-gradient(135deg, #075e68, #0d7f8d);
    transition: 0.15s ease;
}

.video-thumb:hover {
    transform: scale(1.04);
}

.play-button {
    width: 23px;
    height: 23px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 2px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    color: #0d7f8d;
    font-size: 8px;
}

.video-cell strong,
.gymmer-cell strong {
    display: block;
    color: #11343a;
    font-size: 10.5px;
}

.video-cell span,
.gymmer-cell span {
    display: block;
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8.5px;
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
    font-size: 10px;
    font-weight: 800;
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

.date-cell strong,
.date-cell span {
    display: block;
}

.date-cell strong {
    color: #34585d;
    font-size: 10px;
}

.date-cell span {
    margin-top: 2px;
    color: #8aa7ab;
    font-size: 8.5px;
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

.status.completed {
    background: #e4f7ef;
    color: #2c7c60;
}

.status.processing {
    background: #e3f8fb;
    color: #0b7481;
}

.status.insufficient {
    background: #fff4df;
    color: #a76b1d;
}

.status.failed {
    background: #feecec;
    color: #b94f4f;
}

.status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
}

.review-status {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 700;
    white-space: nowrap;
}

.review-status.reviewed {
    background: #e4f7ef;
    color: #2c7c60;
}

.review-status.waiting {
    background: #fff4df;
    color: #a76b1d;
}

.review-status.not_available {
    background: #f1f5f9;
    color: #64748b;
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
    background: rgba(8, 58, 64, 0.18);
    backdrop-filter: blur(4px);
}

.preview-modal {
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

.modal-header h3 {
    margin: 0;
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

.fake-video {
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 17px;
    background: linear-gradient(135deg, #0b343b, #0d7f8d);
    color: white;
}

.fake-icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 4px;
    margin-bottom: 14px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.94);
    color: #0d7f8d;
    font-size: 19px;
}

.fake-video strong {
    font-size: 13px;
}

.fake-video span {
    margin-top: 4px;
    color: #cfe8eb;
    font-size: 9.5px;
}

.video-info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 9px;
    margin-top: 14px;
}

.video-info-grid div {
    padding: 11px;
    border: 1px solid #e0f0f2;
    border-radius: 11px;
    background: #f8fdfe;
}

.video-info-grid span {
    display: block;
    color: #8aa7ab;
    font-size: 8.5px;
}

.video-info-grid strong {
    display: block;
    margin-top: 4px;
    color: #11343a;
    font-size: 10.5px;
}

.ai-summary {
    margin-top: 14px;
    padding: 16px;
    border: 1px solid #9ed9df;
    border-radius: 15px;
    background: #f0fbfc;
}

.ai-summary-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ai-summary-head span {
    color: #0d7f8d;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1px;
}

.ai-summary-head h4 {
    margin: 3px 0 0;
    color: #11343a;
    font-size: 13px;
}

.ai-summary-head > strong {
    color: #075e68;
    font-size: 24px;
}

.ai-data {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 13px;
}

.ai-data div {
    padding: 10px;
    border-radius: 10px;
    background: white;
}

.ai-data span {
    display: block;
    color: #71949a;
    font-size: 8.5px;
}

.ai-data strong {
    display: block;
    margin-top: 4px;
    color: #11343a;
    font-size: 14px;
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

@media (max-width: 1100px) {
    .stat-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .filter-bar {
        flex-wrap: wrap;
    }
}
</style>