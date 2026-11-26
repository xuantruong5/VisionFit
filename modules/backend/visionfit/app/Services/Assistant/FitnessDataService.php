<?php

namespace App\Services\Assistant;

use App\Services\NutritionService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Authoritative data-access & domain-calculation service for Assistant tools and /context.
 * Enforces strict identity, role, and gym boundaries on every query.
 * Reuses NutritionService and Asia/Ho_Chi_Minh timezone rules.
 */
class FitnessDataService
{
    public const TIMEZONE = 'Asia/Ho_Chi_Minh';

    public function nowVN(): CarbonImmutable
    {
        return CarbonImmutable::now(self::TIMEZONE);
    }

    public function normalizeVietnamese(string $str): string
    {
        $str = mb_strtolower($str, 'UTF-8');
        $map = [
            'à' => 'a', 'á' => 'a', 'ạ' => 'a', 'ả' => 'a', 'ã' => 'a',
            'â' => 'a', 'ầ' => 'a', 'ấ' => 'a', 'ậ' => 'a', 'ẩ' => 'a', 'ẫ' => 'a',
            'ă' => 'a', 'ằ' => 'a', 'ắ' => 'a', 'ặ' => 'a', 'ẳ' => 'a', 'ẵ' => 'a',
            'è' => 'e', 'é' => 'e', 'ẹ' => 'e', 'ẻ' => 'e', 'ẽ' => 'e',
            'ê' => 'e', 'ề' => 'e', 'ế' => 'e', 'ệ' => 'e', 'ể' => 'e', 'ễ' => 'e',
            'ì' => 'i', 'í' => 'i', 'ị' => 'i', 'ỉ' => 'i', 'ĩ' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ọ' => 'o', 'ỏ' => 'o', 'õ' => 'o',
            'ô' => 'o', 'ồ' => 'o', 'ố' => 'o', 'ộ' => 'o', 'ổ' => 'o', 'ỗ' => 'o',
            'ơ' => 'o', 'ờ' => 'o', 'ớ' => 'o', 'ợ' => 'o', 'ở' => 'o', 'ỡ' => 'o',
            'ù' => 'u', 'ú' => 'u', 'ụ' => 'u', 'ủ' => 'u', 'ũ' => 'u',
            'ư' => 'u', 'ừ' => 'u', 'ứ' => 'u', 'ự' => 'u', 'ử' => 'u', 'ữ' => 'u',
            'ỳ' => 'y', 'ý' => 'y', 'ỵ' => 'y', 'ỷ' => 'y', 'ỹ' => 'y',
            'đ' => 'd',
        ];
        return strtr($str, $map);
    }

    public function formatMealType(?string $code): string
    {
        $normalized = strtoupper(trim((string) $code));
        return match ($normalized) {
            'SANG', 'BUA_SANG', 'SÁNG' => 'Sáng',
            'PHU_SANG', 'PHỤ SÁNG' => 'Phụ sáng',
            'TRUA', 'BUA_TRUA', 'TRƯA' => 'Trưa',
            'PHU_TRUA', 'PHỤ TRƯA' => 'Phụ trưa',
            'PHU_CHIEU', 'PHU_XE', 'PHỤ CHIỀU' => 'Phụ chiều',
            'TOI', 'BUA_TOI', 'TỐI' => 'Tối',
            'PHU_TOI', 'PHỤ TỐI' => 'Phụ tối',
            default => $code ? trim($code) : 'Bữa chính',
        };
    }

    public function classifyBmi($bmi): string
    {
        if (!is_numeric($bmi) || (float) $bmi <= 0) {
            return 'Chưa đánh giá';
        }
        $val = (float) $bmi;
        if ($val < 18.5) {
            return 'Thiếu cân';
        }
        if ($val < 23.0) {
            return 'Bình thường';
        }
        if ($val < 25.0) {
            return 'Thừa cân';
        }
        return 'Béo phì';
    }

    public function expandAllergyKeywords($rawAllergy): array
    {
        if (empty($rawAllergy)) {
            return [];
        }
        $items = [];
        if (is_array($rawAllergy)) {
            $items = $rawAllergy;
        } else {
            $str = trim((string) $rawAllergy);
            if ($str !== '' && str_starts_with($str, '[')) {
                $decoded = json_decode($str, true);
                $items = is_array($decoded) ? $decoded : [$str];
            } elseif ($str !== '') {
                $items = [$str];
            }
        }

        $keywords = [];
        foreach ($items as $allergyItem) {
            $parts = preg_split('/[\/,;]+/', (string) $allergyItem) ?: [];
            foreach ($parts as $part) {
                $trimmed = trim($part);
                $lower = mb_strtolower($trimmed, 'UTF-8');
                if (!$trimmed || in_array($lower, ['không', 'khong', 'none'], true)) {
                    continue;
                }
                $keywords[] = $trimmed;
                if (str_contains($lower, 'hải sản') || str_contains($lower, 'hai san')) {
                    array_push($keywords, 'tôm', 'cua', 'mực', 'ghẹ', 'sò', 'nghêu', 'ốc');
                } elseif (str_contains($lower, 'trứng') || str_contains($lower, 'trung')) {
                    $keywords[] = 'trứng';
                } elseif (str_contains($lower, 'sữa') || str_contains($lower, 'sua') || str_contains($lower, 'lactose')) {
                    array_push($keywords, 'sữa', 'phô mai', 'bơ sữa', 'whey');
                } elseif (str_contains($lower, 'đậu phộng') || str_contains($lower, 'dau phong')) {
                    array_push($keywords, 'đậu phộng', 'lạc');
                }
            }
        }

        return array_values(array_unique($keywords));
    }

    public function detectAllergenMatches(string $dishName, string $ingredients, $rawAllergy): array
    {
        $expanded = $this->expandAllergyKeywords($rawAllergy);
        if (empty($expanded)) {
            return [];
        }
        $haystack = $this->normalizeVietnamese($dishName . ' ' . $ingredients);
        $matched = [];
        foreach ($expanded as $kw) {
            $norm = trim($this->normalizeVietnamese($kw));
            if ($norm !== '' && preg_match('/(?:^|[^a-z0-9])' . preg_quote($norm, '/') . '(?=$|[^a-z0-9])/', $haystack)) {
                $matched[] = $kw;
            }
        }
        return array_values(array_unique($matched));
    }

    public function getActiveProgram(AssistantAuthContext $actor): ?array
    {
        if (!$actor->authenticated || $actor->role !== 'member') {
            return null;
        }
        if (!Schema::hasTable('dang_ky_chuong_trinh') || !Schema::hasTable('chuong_trinh_tap')) {
            return null;
        }

        $activeReg = DB::table('dang_ky_chuong_trinh as dk')
            ->join('chuong_trinh_tap as c', 'c.id', '=', 'dk.id_chuong_trinh')
            ->where('dk.id_hoi_vien', $actor->userId)
            ->where('dk.tinh_trang', 1)
            ->orderByDesc('dk.id')
            ->first([
                'dk.id as registration_id',
                'c.ten_chuong_trinh',
                'c.so_ngay',
                'c.so_buoi_moi_tuan',
                'dk.ngay_bat_dau',
                'dk.ngay_du_kien_ket_thuc',
                'dk.phan_tram_hoan_thanh',
            ]);

        if (!$activeReg) {
            return null;
        }

        return [
            'registration_id' => (int) $activeReg->registration_id,
            'name' => $activeReg->ten_chuong_trinh,
            'total_days' => $activeReg->so_ngay ? (int) $activeReg->so_ngay : null,
            'sessions_per_week' => $activeReg->so_buoi_moi_tuan ? (int) $activeReg->so_buoi_moi_tuan : null,
            'starts_at' => $activeReg->ngay_bat_dau,
            'ends_at' => $activeReg->ngay_du_kien_ket_thuc,
            'completion_percent' => $activeReg->phan_tram_hoan_thanh !== null
                ? round((float) $activeReg->phan_tram_hoan_thanh, 2)
                : null,
        ];
    }

    /**
     * Tool: get_my_schedule
     */
    public function getMySchedule(
        AssistantAuthContext $actor,
        ?string $datePreset = 'upcoming',
        ?string $dateFrom = null,
        ?string $dateTo = null,
        int $limit = 10
    ): array {
        if (!$actor->authenticated) {
            return [
                'status' => 'unauthenticated',
                'message' => 'Người dùng chưa đăng nhập nên không thể truy xuất lịch tập cá nhân.',
                'sessions' => [],
            ];
        }

        $now = $this->nowVN();
        $todayIso = $now->toDateString();
        $tomorrowIso = $now->addDay()->toDateString();
        $weekEndIso = $now->endOfWeek()->toDateString();

        $preset = $datePreset ?: 'upcoming';
        $rangeStart = $todayIso;
        $rangeEnd = null;

        if ($dateFrom !== null && $dateFrom !== '') {
            $rangeStart = $dateFrom;
            $rangeEnd = ($dateTo !== null && $dateTo !== '') ? $dateTo : $dateFrom;
            $preset = 'custom';
        } elseif ($preset === 'today') {
            $rangeStart = $todayIso;
            $rangeEnd = $todayIso;
        } elseif ($preset === 'tomorrow') {
            $rangeStart = $tomorrowIso;
            $rangeEnd = $tomorrowIso;
        } elseif ($preset === 'this_week') {
            $rangeStart = $todayIso;
            $rangeEnd = $weekEndIso;
        }

        $limit = max(1, min(20, $limit));

        if ($actor->role === 'trainer') {
            $q = DB::table('lich_tap as l')
                ->join('chuong_trinh_tap as c', 'c.id', '=', 'l.id_chuong_trinh')
                ->join('clients as hv', 'hv.id', '=', 'l.id_hoi_vien')
                ->where('l.id_trainner', $actor->userId)
                ->where('hv.id_phong_tap', $actor->gymId)
                ->where('l.tinh_trang', '!=', '3')
                ->whereDate('l.ngay_tap', '>=', $rangeStart);
            if ($rangeEnd !== null) {
                $q->whereDate('l.ngay_tap', '<=', $rangeEnd);
            }
            $rows = $q->orderBy('l.ngay_tap')->orderBy('l.gio_bat_dau')->limit($limit)
                ->get(['c.ten_chuong_trinh', 'l.ngay_tap', 'l.gio_bat_dau', 'l.tinh_trang']);

            return [
                'status' => $rows->isNotEmpty() ? 'ok' : 'empty',
                'role' => 'trainer',
                'timezone' => self::TIMEZONE,
                'today' => $todayIso,
                'query_range' => ['preset' => $preset, 'from' => $rangeStart, 'to' => $rangeEnd],
                'sessions' => $rows->map(fn ($s) => [
                    'name' => $s->ten_chuong_trinh,
                    'scheduled_date' => $s->ngay_tap,
                    'starts_at' => $s->gio_bat_dau
                        ? CarbonImmutable::parse($s->ngay_tap . ' ' . $s->gio_bat_dau, self::TIMEZONE)->toIso8601String()
                        : null,
                    'status' => (string) ($s->tinh_trang ?? '0'),
                ])->values()->all(),
            ];
        }

        if ($actor->role === 'admin') {
            return $this->getRoleSummary($actor);
        }

        $activeProgram = $this->getActiveProgram($actor);
        $hasRegisteredProgram = $activeProgram !== null;

        if (!$hasRegisteredProgram) {
            return [
                'status' => 'no_registered_program',
                'timezone' => self::TIMEZONE,
                'today' => $todayIso,
                'has_registered_program' => false,
                'active_program' => null,
                'sessions' => [],
                'suggested_navigation' => 'NAVIGATE_REGISTER_PROGRAM',
                'message' => 'Hội viên chưa đăng ký chương trình tập nào trên hệ thống.',
            ];
        }

        $baseQuery = DB::table('lich_tap as l')
            ->join('dang_ky_chuong_trinh as dk', function ($join) {
                $join->on('dk.id', '=', 'l.id_dang_ky_chuong_trinh')
                    ->on('dk.id_hoi_vien', '=', 'l.id_hoi_vien')
                    ->on('dk.id_chuong_trinh', '=', 'l.id_chuong_trinh');
            })
            ->join('chuong_trinh_tap as c', 'c.id', '=', 'l.id_chuong_trinh')
            ->leftJoin('trainers as t', function ($join) use ($actor) {
                $join->on('t.id', '=', 'l.id_trainner')->where('t.id_phong_tap', '=', $actor->gymId);
            })
            ->where('l.id_hoi_vien', $actor->userId)
            ->where('dk.tinh_trang', 1)
            ->whereIn('l.tinh_trang', ['0', '1', '2']);

        $rangeQuery = (clone $baseQuery)->whereDate('l.ngay_tap', '>=', $rangeStart);
        if ($rangeEnd !== null) {
            $rangeQuery->whereDate('l.ngay_tap', '<=', $rangeEnd);
        }

        $mapRow = function ($s) use ($now, $todayIso) {
            $isPastToday = ($s->ngay_tap === $todayIso)
                && !empty($s->gio_bat_dau)
                && ((string) $s->gio_bat_dau < $now->format('H:i:s'));
            return [
                'name' => $s->ten_chuong_trinh,
                'scheduled_date' => $s->ngay_tap,
                'starts_at' => $s->gio_bat_dau
                    ? CarbonImmutable::parse($s->ngay_tap . ' ' . $s->gio_bat_dau, self::TIMEZONE)->toIso8601String()
                    : null,
                'time_vn' => $s->gio_bat_dau
                    ? CarbonImmutable::parse($s->ngay_tap . ' ' . $s->gio_bat_dau, self::TIMEZONE)->format('H:i d/m/Y')
                    : CarbonImmutable::parse($s->ngay_tap, self::TIMEZONE)->format('d/m/Y'),
                'trainer' => $s->ho_ten,
                'has_pt' => !empty($s->ho_ten),
                'status' => (string) ($s->tinh_trang ?? '0'),
                'is_past_today' => $isPastToday,
            ];
        };

        $sessions = $rangeQuery
            ->orderBy('l.ngay_tap')->orderBy('l.gio_bat_dau')
            ->limit($limit)
            ->get(['c.ten_chuong_trinh', 'l.ngay_tap', 'l.gio_bat_dau', 'l.tinh_trang', 't.ho_ten'])
            ->map($mapRow)
            ->values()
            ->all();

        $nextUpcoming = null;
        if (empty($sessions)) {
            $nextRow = (clone $baseQuery)
                ->whereDate('l.ngay_tap', '>=', $todayIso)
                ->where(function ($q) use ($now, $todayIso) {
                    $q->whereDate('l.ngay_tap', '>', $todayIso)
                        ->orWhereNull('l.gio_bat_dau')
                        ->orWhere('l.gio_bat_dau', '>=', $now->format('H:i:s'));
                })
                ->orderBy('l.ngay_tap')->orderBy('l.gio_bat_dau')
                ->first(['c.ten_chuong_trinh', 'l.ngay_tap', 'l.gio_bat_dau', 'l.tinh_trang', 't.ho_ten']);
            if ($nextRow) {
                $nextUpcoming = $mapRow($nextRow);
            }
        }

        return [
            'status' => !empty($sessions) ? 'ok' : 'no_session_in_range',
            'timezone' => self::TIMEZONE,
            'today' => $todayIso,
            'query_range' => ['preset' => $preset, 'from' => $rangeStart, 'to' => $rangeEnd],
            'has_registered_program' => true,
            'active_program' => $activeProgram['name'],
            'sessions' => $sessions,
            'next_upcoming_session' => $nextUpcoming,
        ];
    }

    /**
     * Tool: get_my_packages
     */
    public function getMyPackages(AssistantAuthContext $actor, bool $includeExpired = true): array
    {
        if (!$actor->authenticated) {
            return [
                'status' => 'unauthenticated',
                'message' => 'Người dùng chưa đăng nhập nên không thể tra cứu gói tập.',
                'packages' => [],
            ];
        }

        if ($actor->role !== 'member') {
            return $this->getRoleSummary($actor);
        }

        $todayIso = $this->nowVN()->toDateString();

        $rows = DB::table('dang_ky_goi as d')
            ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
            ->join('goi_tap as g', 'g.id', '=', 'ct.id_goi_tap')
            ->where('d.id_hoi_vien', $actor->userId)
            ->where('g.id_phong_tap', $actor->gymId)
            ->where('d.tinh_trang', 1)
            ->whereIn('ct.tinh_trang', [0, 1])
            ->orderByDesc('ct.id')
            ->limit(20)
            ->get(['g.ten_goi_tap', 'ct.ngay_ket_thuc', 'ct.so_buoi'])
            ->map(function ($p) use ($todayIso) {
                $expClean = $p->ngay_ket_thuc ? explode('T', (string) $p->ngay_ket_thuc)[0] : null;
                $isExpired = $expClean !== null && $expClean !== '' && $expClean < $todayIso;
                return [
                    'name' => $p->ten_goi_tap,
                    'expires_at' => $p->ngay_ket_thuc,
                    'expires_at_vn' => $expClean ? CarbonImmutable::parse($expClean, self::TIMEZONE)->format('d/m/Y') : null,
                    'is_expired' => $isExpired,
                    'total_sessions' => $p->so_buoi !== null ? (int) $p->so_buoi : null,
                    // Schema hiện chỉ lưu tổng số buổi đã mua, chưa có sổ cái trừ buổi xác thực.
                    'remaining_sessions' => null,
                ];
            })
            ->values();

        if (!$includeExpired) {
            $rows = $rows->filter(fn ($p) => !$p['is_expired'])->values();
        }

        $activeCount = $rows->filter(fn ($p) => !$p['is_expired'])->count();
        $status = $rows->isEmpty()
            ? 'no_package'
            : ($activeCount > 0 ? 'ok' : 'all_expired');

        return [
            'status' => $status,
            'today' => $todayIso,
            'has_active_package' => $activeCount > 0,
            'packages' => $rows->all(),
            'note' => 'total_sessions là tổng số buổi đăng ký của gói; remaining_sessions = null nghĩa là hệ thống chưa có dữ liệu số buổi còn lại xác thực (không tự suy đoán hay biến thành 0).',
            'suggested_navigation' => $activeCount === 0 ? 'NAVIGATE_REGISTER_PACKAGE' : null,
        ];
    }

    /**
     * Tool: get_my_progress
     */
    public function getMyProgress(AssistantAuthContext $actor, string $period = 'all'): array
    {
        if (!$actor->authenticated) {
            return [
                'status' => 'unauthenticated',
                'message' => 'Người dùng chưa đăng nhập nên không thể kiểm tra tiến độ.',
            ];
        }

        if ($actor->role !== 'member') {
            return $this->getRoleSummary($actor);
        }

        $activeProgram = $this->getActiveProgram($actor);
        if (!$activeProgram) {
            return [
                'status' => 'no_registered_program',
                'has_registered_program' => false,
                'active_program' => null,
                'progress' => null,
                'suggested_navigation' => 'NAVIGATE_REGISTER_PROGRAM',
                'message' => 'Hội viên chưa đăng ký chương trình tập nào nên chưa có dữ liệu tiến độ.',
            ];
        }

        $now = $this->nowVN();
        $week = DB::table('buoi_tap')
            ->where('id_hoi_vien', $actor->userId)
            ->whereIn('tinh_trang', ['2', '3'])
            ->whereBetween('thoi_gian_bat_dau', [$now->startOfWeek()->toDateTimeString(), $now->toDateTimeString()]);

        $sessionsThisWeek = (clone $week)->count();
        $average = (clone $week)->avg('phan_tram_hoan_thanh');

        return [
            'status' => 'ok',
            'timezone' => self::TIMEZONE,
            'period' => $period,
            'has_registered_program' => true,
            'active_program' => $activeProgram,
            'progress' => [
                'sessions_this_week' => $sessionsThisWeek,
                'avg_completion_percent_this_week' => $average === null ? null : round((float) $average, 2),
                'week_start' => $now->startOfWeek()->toDateString(),
            ],
        ];
    }

    /**
     * Tool: get_my_body_metrics
     */
    public function getMyBodyMetrics(AssistantAuthContext $actor): array
    {
        if (!$actor->authenticated) {
            return [
                'status' => 'unauthenticated',
                'message' => 'Người dùng chưa đăng nhập nên không thể truy xuất chỉ số cơ thể.',
                'metrics' => null,
            ];
        }

        if ($actor->role !== 'member' || !$actor->user) {
            return [
                'status' => 'not_applicable',
                'message' => 'Chỉ số cơ thể cá nhân chỉ áp dụng cho tài khoản hội viên.',
                'metrics' => null,
            ];
        }

        $user = $actor->user;
        $now = $this->nowVN();

        $latestNutrition = null;
        if (Schema::hasTable('lich_su_chi_so_dinh_duong')) {
            $latestNutrition = DB::table('lich_su_chi_so_dinh_duong')
                ->where('id_user', $actor->userId)
                ->orderByDesc('id')
                ->first();
        }

        $weight = is_numeric($user->can_nang_kg ?? null) ? (float) $user->can_nang_kg : 0.0;
        $height = is_numeric($user->chieu_cao_cm ?? null) ? (float) $user->chieu_cao_cm : 0.0;
        $hasSubmittedMetrics = !empty($user->ngay_cap_nhat_chi_so);

        if (!$latestNutrition && $hasSubmittedMetrics && $weight > 0 && $height > 0) {
            $age = 25;
            if (!empty($user->ngay_sinh)) {
                try {
                    $parsedAge = CarbonImmutable::parse($user->ngay_sinh, self::TIMEZONE)->age;
                    if ($parsedAge >= 10 && $parsedAge <= 100) {
                        $age = $parsedAge;
                    }
                } catch (\Throwable $e) {
                    $age = 25;
                }
            }
            $activityFactors = [1 => 1.2, 2 => 1.375, 3 => 1.55, 4 => 1.725];
            $multiplier = $activityFactors[(int) ($user->muc_tieu_hoat_dong ?? 2)] ?? 1.375;
            $calc = NutritionService::calculateAll(
                $weight,
                $height,
                $age,
                $user->gioi_tinh ?? 0,
                $multiplier,
                $user->muc_tieu_hien_tai ?? 'maintain'
            );
            $latestNutrition = (object) array_merge($calc, ['created_at' => $now->toDateTimeString()]);
        }

        $allergyText = is_array($user->di_ung ?? null)
            ? implode(', ', array_filter($user->di_ung, fn ($v) => trim((string) $v) !== ''))
            : trim((string) ($user->di_ung ?? ''));

        if (!$latestNutrition) {
            return [
                'status' => 'missing_body_metrics',
                'has_body_metrics' => false,
                'metrics' => null,
                'profile' => [
                    'goal' => null,
                    'allergy' => $allergyText !== '' ? $allergyText : 'Không',
                ],
                'suggested_navigation' => 'NAVIGATE_BODY_METRICS',
                'message' => 'Hội viên chưa cập nhật chỉ số cơ thể (chiều cao, cân nặng, ngày sinh) nên chưa có dữ liệu BMI, BMR, TDEE và nhu cầu calo.',
            ];
        }

        $weightVal = (float) $latestNutrition->can_nang;
        return [
            'status' => 'ok',
            'has_body_metrics' => true,
            'metrics' => [
                'weight_kg' => $weightVal,
                'height_cm' => $height > 0 ? $height : null,
                'bmi' => (float) $latestNutrition->bmi,
                'bmi_status' => $this->classifyBmi((float) $latestNutrition->bmi),
                'bmr_kcal' => (float) $latestNutrition->bmr,
                'tdee_kcal' => (float) $latestNutrition->tdee,
                'target_calories_kcal' => (float) $latestNutrition->kcal_muc_tieu,
                'protein_g' => (float) $latestNutrition->protein,
                'carb_g' => (float) $latestNutrition->carb,
                'fat_g' => (float) $latestNutrition->fat,
                'recommended_water_liters' => $weightVal > 0 ? round(($weightVal * 35) / 1000, 2) : null,
            ],
            'profile' => [
                'goal' => $user->muc_tieu_hien_tai ?: null,
                'level' => $user->cap_do_hien_tai ?: null,
                'allergy' => $allergyText !== '' ? $allergyText : 'Không',
            ],
        ];
    }

    /**
     * Tool: get_my_meal_plan
     */
    public function getMyMealPlan(
        AssistantAuthContext $actor,
        ?string $datePreset = 'today',
        ?string $date = null,
        ?string $mealType = 'ALL',
        ?string $dietPreference = null
    ): array {
        if (!$actor->authenticated) {
            return [
                'status' => 'unauthenticated',
                'message' => 'Người dùng chưa đăng nhập nên không thể xem kế hoạch bữa ăn.',
                'meals' => [],
            ];
        }

        if ($actor->role !== 'member' || !$actor->user) {
            return [
                'status' => 'not_applicable',
                'message' => 'Kế hoạch bữa ăn cá nhân chỉ áp dụng cho tài khoản hội viên.',
                'meals' => [],
            ];
        }

        $now = $this->nowVN();
        $todayIso = $now->toDateString();
        $tomorrowIso = $now->addDay()->toDateString();
        $targetDate = $todayIso;
        if ($date !== null && $date !== '') {
            $targetDate = $date;
        } elseif ($datePreset === 'tomorrow') {
            $targetDate = $tomorrowIso;
        } elseif ($datePreset === 'upcoming') {
            $targetDate = null;
        }

        $activeProgram = $this->getActiveProgram($actor);
        $metrics = $this->getMyBodyMetrics($actor);
        $hasRegisteredProgram = $activeProgram !== null;
        $hasBodyMetrics = (bool) ($metrics['has_body_metrics'] ?? false);

        $registeredMeals = [];
        if (
            $hasRegisteredProgram
            && Schema::hasTable('ke_hoach_an')
            && Schema::hasTable('khau_phan_an')
            && Schema::hasTable('mon_an')
        ) {
            $q = DB::table('ke_hoach_an as kha')
                ->join('khau_phan_an as kpa', 'kha.id', '=', 'kpa.id_ke_hoach_an')
                ->join('mon_an as ma', 'kpa.id_mon_an', '=', 'ma.id')
                ->where('kha.id_dang_ky_chuong_trinh', $activeProgram['registration_id'])
                ->where('kha.tinh_trang', 1);

            if ($targetDate !== null) {
                $q->where(function ($w) use ($targetDate) {
                    $w->whereDate('kpa.ngay_an', '=', $targetDate)
                        ->orWhereNull('kpa.ngay_an');
                });
            } else {
                $q->where(function ($w) use ($todayIso) {
                    $w->whereNull('kpa.ngay_an')->orWhereDate('kpa.ngay_an', '>=', $todayIso);
                });
            }

            $rows = $q->orderBy('kpa.ngay_an')->orderBy('kpa.gio_an')->limit(24)
                ->get(['kpa.ngay_an', 'kpa.gio_an', 'kpa.bua_an', 'ma.ten_mon_an', 'ma.calo', 'ma.protein', 'ma.carb', 'ma.fat', 'ma.loai_bua']);

            $normalizedMealType = strtoupper(trim((string) $mealType));
            foreach ($rows as $mp) {
                $code = strtoupper(trim((string) ($mp->bua_an ?: $mp->loai_bua)));
                if ($normalizedMealType !== '' && $normalizedMealType !== 'ALL' && !str_contains($code, $normalizedMealType)) {
                    continue;
                }
                $registeredMeals[] = [
                    'date' => $mp->ngay_an,
                    'time' => $mp->gio_an ? substr((string) $mp->gio_an, 0, 5) : null,
                    'meal_type_code' => $code,
                    'meal_type' => $this->formatMealType($code),
                    'name' => $mp->ten_mon_an,
                    'calories' => (float) ($mp->calo ?? 0),
                    'protein_g' => (float) ($mp->protein ?? 0),
                    'carb_g' => (float) ($mp->carb ?? 0),
                    'fat_g' => (float) ($mp->fat ?? 0),
                ];
            }
        }

        if (!empty($registeredMeals)) {
            return [
                'status' => 'ok',
                'timezone' => self::TIMEZONE,
                'today' => $todayIso,
                'requested_date' => $targetDate,
                'has_registered_program' => true,
                'has_meal_plan' => true,
                'active_program' => $activeProgram['name'],
                'allergy' => $metrics['profile']['allergy'] ?? 'Không',
                'meals' => $registeredMeals,
            ];
        }

        if (!$hasRegisteredProgram && !$hasBodyMetrics) {
            return [
                'status' => 'no_registered_program_and_metrics',
                'has_registered_program' => false,
                'has_body_metrics' => false,
                'has_meal_plan' => false,
                'meals' => [],
                'suggested_navigation' => 'NAVIGATE_REGISTER_PROGRAM',
                'message' => 'Hội viên chưa đăng ký chương trình tập và chưa cập nhật chỉ số cơ thể nên chưa có kế hoạch bữa ăn cá nhân.',
            ];
        }

        // Đã có chỉ số hoặc đã đăng ký chương trình nhưng chưa có khẩu phần ngày cụ thể -> cung cấp gợi ý món an toàn theo dị ứng
        $suggestions = Schema::hasTable('mon_an')
            ? $this->selectSafeMealSuggestions($actor->user, 6, $dietPreference, $mealType)
            : [];

        return [
            'status' => $hasRegisteredProgram ? 'no_scheduled_meal_for_date' : 'no_registered_program',
            'timezone' => self::TIMEZONE,
            'today' => $todayIso,
            'requested_date' => $targetDate,
            'has_registered_program' => $hasRegisteredProgram,
            'has_body_metrics' => $hasBodyMetrics,
            'has_meal_plan' => false,
            'allergy' => $metrics['profile']['allergy'] ?? 'Không',
            'meals' => [],
            'safe_suggestions' => $suggestions,
            'suggested_navigation' => !$hasRegisteredProgram ? 'NAVIGATE_REGISTER_PROGRAM' : null,
            'message' => $hasRegisteredProgram
                ? 'Không có khẩu phần ăn riêng trong kế hoạch cho ngày/bữa được hỏi; có kèm danh sách món ăn an toàn theo hồ sơ.'
                : 'Hội viên chưa đăng ký chương trình tập nên chưa có kế hoạch bữa ăn chính thức.',
        ];
    }

    public function selectSafeMealSuggestions($user, int $limit = 6, ?string $dietFilter = null, ?string $mealType = 'ALL'): array
    {
        if (!Schema::hasTable('mon_an')) {
            return [];
        }

        $baseQuery = DB::table('mon_an')->where('tinh_trang', 1);
        $normalizedAllergyTokens = [];
        if ($user && !empty($user->di_ung)) {
            foreach ($this->expandAllergyKeywords($user->di_ung) as $kw) {
                $norm = trim($this->normalizeVietnamese($kw));
                if ($norm !== '') {
                    $normalizedAllergyTokens[] = $norm;
                }
            }
            $normalizedAllergyTokens = array_values(array_unique($normalizedAllergyTokens));
        }

        $filterSafe = function ($rows) use ($normalizedAllergyTokens) {
            if (empty($normalizedAllergyTokens)) {
                return $rows;
            }
            return $rows->filter(function ($m) use ($normalizedAllergyTokens) {
                $haystack = $this->normalizeVietnamese((string) ($m->ten_mon_an ?? '') . ' ' . (string) ($m->nguyen_lieu ?? ''));
                foreach ($normalizedAllergyTokens as $tok) {
                    if (preg_match('/(?:^|[^a-z0-9])' . preg_quote($tok, '/') . '(?=$|[^a-z0-9])/', $haystack)) {
                        return false;
                    }
                }
                return true;
            })->values();
        };

        $preferredDietText = '';
        if ($user && !empty($user->che_do_an_ua_thich)) {
            $preferredDietText = is_array($user->che_do_an_ua_thich)
                ? implode(' ', $user->che_do_an_ua_thich)
                : (string) $user->che_do_an_ua_thich;
        }

        $filteredQuery = clone $baseQuery;
        $goalLower = mb_strtolower($dietFilter ?: ($preferredDietText !== '' ? $preferredDietText : ($user->muc_tieu_hien_tai ?? '')), 'UTF-8');

        if (str_contains($goalLower, 'chay') || str_contains($goalLower, 'vegan')) {
            $filteredQuery->where(function ($q) {
                $q->whereIn('the_loai', ['Thuần chay (Vegan)', 'Ăn chay (Vegetarian)'])
                    ->orWhere('the_loai', 'like', '%chay%')
                    ->orWhere('the_loai', 'like', '%vegan%');
            });
        } elseif (str_contains($goalLower, 'keto') || str_contains($goalLower, 'low-carb') || str_contains($goalLower, 'low carb')) {
            $filteredQuery->where(function ($q) {
                $q->whereIn('the_loai', ['Keto', 'Giảm tinh bột (Low-carb/Keto)'])
                    ->orWhere('the_loai', 'like', '%keto%')
                    ->orWhere('the_loai', 'like', '%low-carb%');
            });
        } elseif (str_contains($goalLower, 'eat clean') || str_contains($goalLower, 'giảm') || str_contains($goalLower, 'mỡ')) {
            $filteredQuery->whereIn('the_loai', ['Eat Clean', 'Giảm tinh bột (Low-carb/Keto)']);
        } elseif (str_contains($goalLower, 'tăng') || str_contains($goalLower, 'cơ')) {
            $filteredQuery->whereIn('the_loai', ['Eat Clean', 'Bình thường (Ăn đa dạng)']);
        }

        $cols = ['ten_mon_an', 'loai_bua', 'the_loai', 'calo', 'protein', 'nguyen_lieu'];
        $candidates = $filterSafe($filteredQuery->get($cols));
        $isStrictDiet = ($dietFilter !== null || $preferredDietText !== '')
            && (str_contains($goalLower, 'chay') || str_contains($goalLower, 'vegan') || str_contains($goalLower, 'keto'));

        if ($candidates->isEmpty() || (!$isStrictDiet && $candidates->count() < 3)) {
            $fallback = $filterSafe($baseQuery->get($cols));
            $candidates = $candidates->concat($fallback)->unique('ten_mon_an')->values();
        }

        $normalizedMealType = strtoupper(trim((string) $mealType));
        if ($normalizedMealType !== '' && $normalizedMealType !== 'ALL') {
            $bySlot = $candidates->filter(fn ($m) => str_contains(strtoupper((string) ($m->loai_bua ?? '')), $normalizedMealType))->values();
            if ($bySlot->isNotEmpty()) {
                $candidates = $bySlot;
            }
        }

        $preferredOrder = ['SANG', 'TRUA', 'PHU_CHIEU', 'TOI', 'PHU_SANG'];
        $picked = collect();
        $used = [];
        foreach ($preferredOrder as $slot) {
            if ($picked->count() >= $limit) {
                break;
            }
            $match = $candidates->first(fn ($m) => strtoupper(trim((string) ($m->loai_bua ?? ''))) === $slot && !in_array($m->ten_mon_an, $used, true));
            if ($match) {
                $picked->push($match);
                $used[] = $match->ten_mon_an;
            }
        }
        foreach ($candidates as $m) {
            if ($picked->count() >= $limit) {
                break;
            }
            if (!in_array($m->ten_mon_an, $used, true)) {
                $picked->push($m);
                $used[] = $m->ten_mon_an;
            }
        }

        return $picked->map(fn ($m) => [
            'name' => $m->ten_mon_an,
            'meal_type' => $this->formatMealType($m->loai_bua),
            'meal_type_code' => $m->loai_bua,
            'diet_type' => $m->the_loai,
            'calories' => (float) $m->calo,
            'protein' => (float) $m->protein,
        ])->values()->all();
    }

    /**
     * Tool: get_gym_summary (Trainer & Admin scoped aggregation — never returns personal member lists)
     */
    public function getRoleSummary(AssistantAuthContext $actor): array
    {
        if (!$actor->authenticated || !in_array($actor->role, ['trainer', 'admin'], true)) {
            return [
                'status' => 'forbidden',
                'message' => 'Chỉ Huấn luyện viên hoặc Quản trị viên mới có quyền xem thống kê phòng tập.',
            ];
        }

        if (!$actor->gymId || (int) $actor->gymId <= 0) {
            return [
                'status' => 'forbidden',
                'message' => 'Tài khoản chưa được gán phạm vi phòng tập hợp lệ.',
            ];
        }

        $now = $this->nowVN();
        $members = DB::table('clients')->where('id_phong_tap', $actor->gymId);
        if ($actor->role === 'trainer') {
            $members->whereIn('id', DB::table('lich_tap')
                ->select('id_hoi_vien')
                ->where('id_trainner', $actor->userId)
                ->where('tinh_trang', '!=', '3'));
        }

        $assignedCount = (clone $members)->count();
        $expiringCount = null;

        if ($actor->role === 'admin') {
            $expiringCount = DB::table('clients as c')
                ->join('dang_ky_goi as d', 'd.id_hoi_vien', '=', 'c.id')
                ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
                ->join('goi_tap as g', 'g.id', '=', 'ct.id_goi_tap')
                ->where('c.id_phong_tap', $actor->gymId)
                ->where('g.id_phong_tap', $actor->gymId)
                ->where('d.tinh_trang', 1)
                ->whereIn('ct.tinh_trang', [0, 1])
                ->whereBetween('ct.ngay_ket_thuc', [$now->toDateString(), $now->addDays(7)->toDateString()])
                ->distinct()
                ->count('c.id');
        }

        return [
            'status' => 'ok',
            'role' => $actor->role,
            'gym_id' => $actor->gymId,
            'summary' => [
                'assigned_members' => $assignedCount,
                'expiring_members' => $expiringCount,
            ],
        ];
    }

    /**
     * Backward-compatible snapshot for GET /api/assistant/context (consumed by AssistantApiTest & Chatbox_AI).
     */
    public function buildContextSnapshot(AssistantAuthContext $actor): array
    {
        if (!$actor->authenticated) {
            return [
                'authenticated' => false,
                'subject' => null,
                'profile' => null,
                'nutrition' => null,
                'active_program' => null,
                'meal_plan' => [],
                'suggestions' => ['programs' => [], 'exercises' => [], 'meals' => []],
                'packages' => [],
                'schedule' => [],
                'progress' => ['sessions_this_week' => null, 'completion_percent' => null],
                'summary' => null,
                'account_status' => [
                    'authenticated' => false,
                    'has_body_metrics' => false,
                    'has_goal' => false,
                    'has_registered_program' => false,
                    'has_meal_plan' => false,
                    'has_active_package' => false,
                    'has_schedule' => false,
                ],
            ];
        }

        $identity = $actor->toIdentityArray();
        if ($actor->role !== 'member') {
            $summaryRes = $this->getRoleSummary($actor);
            return [
                'authenticated' => true,
                'subject' => $identity,
                'profile' => ['goal' => null, 'level' => null, 'activity_level' => null, 'allergy' => null, 'note' => null],
                'nutrition' => null,
                'active_program' => null,
                'meal_plan' => [],
                'suggestions' => null,
                'packages' => [],
                'schedule' => [],
                'progress' => ['sessions_this_week' => null, 'completion_percent' => null],
                'summary' => $summaryRes['summary'] ?? null,
                'account_status' => [
                    'authenticated' => true,
                    'has_body_metrics' => false,
                    'has_goal' => false,
                    'has_registered_program' => false,
                    'has_meal_plan' => false,
                    'has_active_package' => false,
                    'has_schedule' => false,
                ],
            ];
        }

        $user = $actor->user;
        $metricsRes = $this->getMyBodyMetrics($actor);
        $packagesRes = $this->getMyPackages($actor, true);
        $scheduleRes = $this->getMySchedule($actor, 'upcoming', null, null, 20);
        $activeProgram = $this->getActiveProgram($actor);
        $mealPlanRes = $this->getMyMealPlan($actor, 'upcoming', null, 'ALL', null);
        $now = $this->nowVN();

        $week = DB::table('buoi_tap')
            ->where('id_hoi_vien', $actor->userId)
            ->whereIn('tinh_trang', ['2', '3'])
            ->whereBetween('thoi_gian_bat_dau', [$now->startOfWeek()->toDateTimeString(), $now->toDateTimeString()]);
        $avg = (clone $week)->avg('phan_tram_hoan_thanh');

        $nutrition = null;
        if (!empty($metricsRes['metrics'])) {
            $m = $metricsRes['metrics'];
            $nutrition = [
                'can_nang' => $m['weight_kg'],
                'chieu_cao_cm' => $m['height_cm'],
                'bmi' => $m['bmi'],
                'bmi_status' => $m['bmi_status'],
                'bmr' => $m['bmr_kcal'],
                'tdee' => $m['tdee_kcal'],
                'kcal_muc_tieu' => $m['target_calories_kcal'],
                'protein' => $m['protein_g'],
                'carb' => $m['carb_g'],
                'fat' => $m['fat_g'],
            ];
        }

        $allergyText = is_array($user->di_ung ?? null)
            ? implode(', ', array_filter($user->di_ung, fn ($v) => trim((string) $v) !== ''))
            : trim((string) ($user->di_ung ?? ''));

        $hasBodyMetrics = $nutrition !== null;
        $hasRegisteredProgram = $activeProgram !== null;
        $hasPersonalization = $hasBodyMetrics || $hasRegisteredProgram;
        $mealsSuggestions = $hasPersonalization ? $this->selectSafeMealSuggestions($user, 6) : [];

        return [
            'authenticated' => true,
            'subject' => $identity,
            'profile' => [
                'goal' => $user->muc_tieu_hien_tai ?: null,
                'level' => $user->cap_do_hien_tai ?: null,
                'activity_level' => !empty($user->muc_tieu_hoat_dong) ? (string) $user->muc_tieu_hoat_dong : null,
                'allergy' => $allergyText !== '' ? $allergyText : 'Không',
                'note' => is_array($user->note ?? null) ? implode(', ', $user->note) : (string) ($user->note ?? ''),
            ],
            'nutrition' => $nutrition,
            'active_program' => $activeProgram,
            'meal_plan' => $mealPlanRes['meals'] ?? [],
            'suggestions' => [
                'programs' => [],
                'exercises' => [],
                'meals' => $mealsSuggestions,
            ],
            'packages' => $packagesRes['packages'] ?? [],
            'schedule' => $scheduleRes['sessions'] ?? [],
            'progress' => [
                'sessions_this_week' => (clone $week)->count(),
                'completion_percent' => $avg === null ? null : round((float) $avg, 2),
            ],
            'summary' => null,
            'account_status' => [
                'authenticated' => true,
                'has_body_metrics' => $hasBodyMetrics,
                'has_goal' => !empty($user->muc_tieu_hien_tai) && ($hasBodyMetrics || !empty($user->ngay_cap_nhat_chi_so)),
                'has_registered_program' => $hasRegisteredProgram,
                'has_meal_plan' => !empty($mealPlanRes['meals']),
                'has_active_package' => (bool) ($packagesRes['has_active_package'] ?? false),
                'has_schedule' => !empty($scheduleRes['sessions']),
            ],
        ];
    }
}

