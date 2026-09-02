<template>
    <div>
        <div class="page-header">
            <div>
                <h2>Báo cáo AI</h2>
                <p>Tổng hợp hiệu suất phân tích kỹ thuật tập luyện của VisionFit AI</p>
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
                <span>Tổng phiên AI</span>
                <strong>1.284</strong>
                <small class="up">↑ 12.6% so với kỳ trước</small>
            </div>

            <div class="mini-card">
                <span>Tỷ lệ hoàn tất</span>
                <strong>96.2%</strong>
                <small class="up">↑ 1.8%</small>
            </div>

            <div class="mini-card">
                <span>Confidence trung bình</span>
                <strong>91.4%</strong>
                <small class="up">↑ 2.1%</small>
            </div>

            <div class="mini-card">
                <span>Insufficient Data</span>
                <strong>7.8%</strong>
                <small class="down">↓ 1.2%</small>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="chart-card large">
                <div class="card-header">
                    <div>
                        <h3>Phiên phân tích AI</h3>
                        <p>Số lượng session theo ngày</p>
                    </div>

                    <span class="chart-badge">
                        {{ period }} ngày
                    </span>
                </div>

                <div class="bar-chart">
                    <div
                        v-for="item in sessionChart"
                        :key="item.day"
                        class="bar-item"
                    >
                        <div class="bar-value">
                            {{ item.value }}
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
                        <h3>Trạng thái phân tích</h3>
                        <p>Tỷ lệ theo session</p>
                    </div>
                </div>

                <div class="donut-wrap">
                    <div class="donut">
                        <div class="donut-center">
                            <strong>1.284</strong>
                            <span>Sessions</span>
                        </div>
                    </div>
                </div>

                <div class="legend-list">
                    <div>
                        <span class="legend-dot completed"></span>
                        <span>Hoàn tất</span>
                        <strong>96.2%</strong>
                    </div>

                    <div>
                        <span class="legend-dot processing"></span>
                        <span>Đang xử lý</span>
                        <strong>2.1%</strong>
                    </div>

                    <div>
                        <span class="legend-dot insufficient"></span>
                        <span>Không đủ dữ liệu</span>
                        <strong>1.2%</strong>
                    </div>

                    <div>
                        <span class="legend-dot failed"></span>
                        <span>Lỗi</span>
                        <strong>0.5%</strong>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-grid second">
            <div class="chart-card">
                <div class="card-header">
                    <div>
                        <h3>Phân bố bài tập</h3>
                        <p>Session theo từng exercise</p>
                    </div>
                </div>

                <div class="exercise-list">
                    <div
                        v-for="item in exerciseData"
                        :key="item.name"
                        class="exercise-item"
                    >
                        <div class="exercise-head">
                            <div>
                                <span class="exercise-icon">
                                    {{ item.icon }}
                                </span>

                                <strong>{{ item.name }}</strong>
                            </div>

                            <span>{{ item.count }} sessions</span>
                        </div>

                        <div class="progress">
                            <div
                                class="progress-value"
                                :style="{ width: item.percent + '%' }"
                            ></div>
                        </div>

                        <small>{{ item.percent }}%</small>
                    </div>
                </div>
            </div>

            <div class="chart-card">
                <div class="card-header">
                    <div>
                        <h3>Chất lượng phân tích</h3>
                        <p>Confidence trung bình theo bài tập</p>
                    </div>
                </div>

                <div class="quality-list">
                    <div
                        v-for="item in qualityData"
                        :key="item.name"
                        class="quality-item"
                    >
                        <div>
                            <span>{{ item.name }}</span>
                            <strong>{{ item.value }}%</strong>
                        </div>

                        <div class="quality-bar">
                            <div
                                class="quality-value"
                                :style="{ width: item.value + '%' }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="content-card">
            <div class="card-header">
                <div>
                    <h3>Vấn đề kỹ thuật thường gặp</h3>
                    <p>Các lỗi AI phát hiện nhiều nhất</p>
                </div>

                <select v-model="exerciseFilter">
                    <option value="">Tất cả bài tập</option>
                    <option value="Squat">Squat</option>
                    <option value="Deadlift">Deadlift</option>
                    <option value="Push-up">Push-up</option>
                </select>
            </div>

            <div class="table-responsive">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Vấn đề</th>
                            <th>Bài tập</th>
                            <th>Số lần phát hiện</th>
                            <th>Tỷ lệ</th>
                            <th>Mức độ</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="item in filteredIssues"
                            :key="item.id"
                        >
                            <td>
                                <strong>{{ item.issue }}</strong>
                            </td>

                            <td>
                                <span class="exercise-badge">
                                    {{ item.exercise }}
                                </span>
                            </td>

                            <td>{{ item.count }}</td>

                            <td>
                                <div class="issue-percent">
                                    <div class="issue-bar">
                                        <div
                                            class="issue-value"
                                            :style="{ width: item.percent + '%' }"
                                        ></div>
                                    </div>

                                    <span>{{ item.percent }}%</span>
                                </div>
                            </td>

                            <td>
                                <span
                                    class="level"
                                    :class="item.level"
                                >
                                    {{ getLevelName(item.level) }}
                                </span>
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
                        <h3>Trainer Review</h3>
                        <p>Độ đồng thuận giữa Trainer và AI</p>
                    </div>
                </div>

                <div class="review-summary">
                    <div class="big-percent">
                        88.4%
                    </div>

                    <span>
                        kết quả AI được Trainer xác nhận
                    </span>
                </div>

                <div class="review-row">
                    <div>
                        <span>Confirmed</span>
                        <strong>88.4%</strong>
                    </div>

                    <div>
                        <span>Adjusted</span>
                        <strong>8.9%</strong>
                    </div>

                    <div>
                        <span>Rejected</span>
                        <strong>2.7%</strong>
                    </div>
                </div>
            </div>

            <div class="content-card">
                <div class="card-header">
                    <div>
                        <h3>Input Quality</h3>
                        <p>Nguyên nhân video không đủ dữ liệu</p>
                    </div>
                </div>

                <div class="reason-list">
                    <div>
                        <span>Góc quay không phù hợp</span>
                        <strong>42%</strong>
                    </div>

                    <div>
                        <span>Bị che khuất cơ thể</span>
                        <strong>27%</strong>
                    </div>

                    <div>
                        <span>Ánh sáng yếu</span>
                        <strong>18%</strong>
                    </div>

                    <div>
                        <span>Video quá ngắn</span>
                        <strong>13%</strong>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AdminBaoCaoAI",

    data() {
        return {
            period: '7',
            exerciseFilter: '',

            sessionChart: [
                {
                    day: 'T2',
                    value: 132,
                    height: 58
                },
                {
                    day: 'T3',
                    value: 168,
                    height: 72
                },
                {
                    day: 'T4',
                    value: 156,
                    height: 67
                },
                {
                    day: 'T5',
                    value: 205,
                    height: 88
                },
                {
                    day: 'T6',
                    value: 188,
                    height: 81
                },
                {
                    day: 'T7',
                    value: 230,
                    height: 100
                },
                {
                    day: 'CN',
                    value: 205,
                    height: 88
                }
            ],

            exerciseData: [
                {
                    name: 'Squat',
                    icon: 'S',
                    count: 524,
                    percent: 41
                },
                {
                    name: 'Deadlift',
                    icon: 'D',
                    count: 418,
                    percent: 33
                },
                {
                    name: 'Push-up',
                    icon: 'P',
                    count: 342,
                    percent: 26
                }
            ],

            qualityData: [
                {
                    name: 'Squat',
                    value: 93
                },
                {
                    name: 'Deadlift',
                    value: 90
                },
                {
                    name: 'Push-up',
                    value: 91
                }
            ],

            list_issues: [
                {
                    id: 1,
                    issue: 'Độ sâu squat chưa đạt',
                    exercise: 'Squat',
                    count: 148,
                    percent: 28,
                    level: 'medium'
                },
                {
                    id: 2,
                    issue: 'Đầu gối lệch vào trong',
                    exercise: 'Squat',
                    count: 112,
                    percent: 21,
                    level: 'high'
                },
                {
                    id: 3,
                    issue: 'Góc lưng chưa ổn định',
                    exercise: 'Deadlift',
                    count: 96,
                    percent: 23,
                    level: 'high'
                },
                {
                    id: 4,
                    issue: 'Hông nâng quá sớm',
                    exercise: 'Deadlift',
                    count: 68,
                    percent: 16,
                    level: 'medium'
                },
                {
                    id: 5,
                    issue: 'Thân người không thẳng',
                    exercise: 'Push-up',
                    count: 84,
                    percent: 25,
                    level: 'medium'
                },
                {
                    id: 6,
                    issue: 'Biên độ xuống chưa đủ',
                    exercise: 'Push-up',
                    count: 61,
                    percent: 18,
                    level: 'low'
                }
            ]
        }
    },

    computed: {
        filteredIssues() {
            return this.list_issues.filter((item) => {
                if (!this.exerciseFilter) {
                    return true;
                }

                return item.exercise === this.exerciseFilter;
            });
        }
    },

    methods: {
        getLevelName(level) {
            if (level === 'high') return 'Cao';
            if (level === 'medium') return 'Trung bình';
            if (level === 'low') return 'Thấp';

            return level;
        },

        exportReport() {
            alert('Demo: Xuất báo cáo AI');
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
    font-size: 8.5px;
}

.up {
    color: #2c7c60;
}

.down {
    color: #0d7f8d;
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
    gap: 10px;
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

.card-header select {
    height: 34px;
    padding: 0 9px;
    border: 1px solid #cfe8eb;
    border-radius: 9px;
    outline: none;
    background: white;
    color: #51777d;
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
    width: 28px;
    display: flex;
    align-items: flex-end;
    border-radius: 9px;
    background: #edf8f9;
    overflow: hidden;
}

.bar {
    width: 100%;
    border-radius: 9px 9px 0 0;
    background: linear-gradient(180deg, #19a9b6, #0d7f8d);
    transition: 0.2s ease;
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
    padding: 20px 0 15px;
}

.donut {
    width: 150px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background:
        conic-gradient(
            #0d7f8d 0% 96.2%,
            #5dc4cd 96.2% 98.3%,
            #e2a447 98.3% 99.5%,
            #d76565 99.5% 100%
        );
    position: relative;
}

.donut::after {
    content: "";
    position: absolute;
    width: 105px;
    height: 105px;
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
    font-size: 21px;
}

.donut-center span {
    color: #71949a;
    font-size: 8.5px;
}

.legend-list {
    display: grid;
    gap: 8px;
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

.legend-dot.completed {
    background: #0d7f8d;
}

.legend-dot.processing {
    background: #5dc4cd;
}

.legend-dot.insufficient {
    background: #e2a447;
}

.legend-dot.failed {
    background: #d76565;
}

.exercise-list {
    display: grid;
    gap: 18px;
    margin-top: 19px;
}

.exercise-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.exercise-head > div {
    display: flex;
    align-items: center;
    gap: 8px;
}

.exercise-icon {
    width: 29px;
    height: 29px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: #dff6f8;
    color: #075e68;
    font-size: 9px;
    font-weight: 800;
}

.exercise-head strong {
    color: #11343a;
    font-size: 10.5px;
}

.exercise-head > span {
    color: #71949a;
    font-size: 9px;
}

.progress,
.quality-bar,
.issue-bar {
    width: 100%;
    overflow: hidden;
    border-radius: 999px;
    background: #e7f3f4;
}

.progress {
    height: 7px;
    margin-top: 8px;
}

.progress-value,
.quality-value,
.issue-value {
    height: 100%;
    border-radius: 999px;
    background: #0d7f8d;
}

.exercise-item small {
    display: block;
    margin-top: 4px;
    color: #8aa7ab;
    font-size: 8px;
    text-align: right;
}

.quality-list {
    display: grid;
    gap: 18px;
    margin-top: 21px;
}

.quality-item > div:first-child {
    display: flex;
    justify-content: space-between;
}

.quality-item span {
    color: #597d82;
    font-size: 10px;
}

.quality-item strong {
    color: #075e68;
    font-size: 11px;
}

.quality-bar {
    height: 8px;
    margin-top: 7px;
}

.content-card {
    margin-top: 14px;
}

.report-table {
    width: 100%;
    margin-top: 15px;
    border-collapse: collapse;
}

.report-table th {
    padding: 10px;
    border-bottom: 1px solid #d8eef1;
    color: #84a5aa;
    font-size: 9px;
    font-weight: 750;
    text-align: left;
    text-transform: uppercase;
}

.report-table td {
    padding: 12px 10px;
    border-bottom: 1px solid #eef6f7;
    color: #456a70;
    font-size: 10.5px;
}

.report-table td strong {
    color: #11343a;
    font-size: 10.5px;
}

.exercise-badge {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    background: #e3f8fb;
    color: #0b7481;
    font-size: 8.5px;
    font-weight: 700;
}

.issue-percent {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 130px;
}

.issue-bar {
    width: 90px;
    height: 6px;
}

.issue-percent span {
    color: #71949a;
    font-size: 8.5px;
}

.level {
    display: inline-flex;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 700;
}

.level.high {
    background: #feecec;
    color: #b94f4f;
}

.level.medium {
    background: #fff4df;
    color: #a76b1d;
}

.level.low {
    background: #e4f7ef;
    color: #2c7c60;
}

.bottom-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
}

.review-summary {
    padding: 20px 0;
    text-align: center;
}

.big-percent {
    color: #075e68;
    font-size: 35px;
    font-weight: 800;
}

.review-summary span {
    display: block;
    margin-top: 4px;
    color: #71949a;
    font-size: 9.5px;
}

.review-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.review-row div {
    padding: 10px;
    border-radius: 10px;
    background: #f7fcfd;
    text-align: center;
}

.review-row span {
    display: block;
    color: #71949a;
    font-size: 8px;
}

.review-row strong {
    display: block;
    margin-top: 4px;
    color: #11343a;
    font-size: 11px;
}

.reason-list {
    display: grid;
    gap: 7px;
    margin-top: 14px;
}

.reason-list div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px;
    border-radius: 10px;
    background: #f7fcfd;
}

.reason-list span {
    color: #597d82;
    font-size: 9.5px;
}

.reason-list strong {
    color: #075e68;
    font-size: 10.5px;
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
}
</style>