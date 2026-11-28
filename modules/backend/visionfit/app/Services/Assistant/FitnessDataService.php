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

    /** Mã bữa ăn thật trong DB (khau_phan_an.bua_an, mon_an.loai_bua) + ALL. */
    public const MEAL_TYPE_FILTERS = ['SANG', 'PHU_SANG', 'TRUA', 'PHU_TRUA', 'TOI', 'PHU_TOI', 'ALL'];

    /**
     * Chuẩn hóa mã bữa ăn về đúng mã trong DB. PHU_CHIEU (tên cũ trong khai báo tool) = PHU_TRUA (bữa phụ 15:00).
     * Trả null nếu mã không hợp lệ.
     */
    public static function canonicalMealType(?string $code): ?string
    {
        $normalized = strtoupper(trim((string) $code));
        $normalized = match ($normalized) {
            '' => 'ALL',
            'PHU_CHIEU', 'PHU_XE' => 'PHU_TRUA',
            'BUA_SANG' => 'SANG',
            'BUA_TRUA' => 'TRUA',
            'BUA_TOI' => 'TOI',
            default => $normalized,
        };
        return in_array($normalized, self::MEAL_TYPE_FILTERS, true) ? $normalized : null;
    }

    /** So khớp chính xác: hỏi "TRUA" không được lẫn "PHU_TRUA". */
    private function mealTypeMatches(?string $code, string $filter): bool
    {
        return $filter === 'ALL' || self::canonicalMealType($code) === $filter;
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
                    array_push(
                        $keywords,
                        'tôm', 'cua', 'mực', 'ghẹ', 'sò', 'nghêu', 'ốc', 'hàu', 'sò điệp', 'bạch tuộc', 'tôm hùm',
                        // Cá biển (cá nước ngọt như cá rô, cá lóc không thuộc nhóm hải sản)
                        'cá hồi', 'cá ngừ', 'cá thu', 'cá biển', 'cá trích', 'cá mòi', 'cá cơm', 'salmon', 'tuna'
                    );
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

    /**
     * Đọc dị ứng của hội viên một cách an toàn.
     * Client cast `di_ung` => 'array', nhưng dữ liệu thật thường lưu chữ thường ("Hải sản", "Sữa bò / Lactose")
     * -> json_decode thất bại và Eloquent trả NULL, làm chatbot tưởng hội viên không dị ứng gì.
     * Khi cast rỗng thì lấy giá trị gốc trong DB (expandAllergyKeywords xử lý được cả chuỗi lẫn JSON).
     */
    public function rawAllergyOf($user)
    {
        if (!$user) {
            return null;
        }
        $cast = $user->di_ung ?? null;
        if (!empty($cast)) {
            return $cast;
        }
        if (is_object($user) && method_exists($user, 'getRawOriginal')) {
            $raw = $user->getRawOriginal('di_ung');
            return is_string($raw) && trim($raw) !== '' ? $raw : null;
        }
        return null;
    }

    /** Chuỗi dị ứng để hiển thị (vd: "Hải sản, Sữa bò / Lactose"); rỗng nếu không có. */
    public function allergyTextOf($user): string
    {
        $raw = $this->rawAllergyOf($user);
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : $raw;
        }
        $text = is_array($raw)
            ? implode(', ', array_filter(array_map(fn ($v) => trim((string) $v), $raw), fn ($v) => $v !== ''))
            : trim((string) $raw);
        return in_array(mb_strtolower($text, 'UTF-8'), ['không', 'khong', 'none'], true) ? '' : $text;
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
                'today_weekday_vn' => VietnameseDateVerifier::weekdayVn($now),
                'tomorrow' => $tomorrowIso,
                'tomorrow_weekday_vn' => VietnameseDateVerifier::weekdayVn($now->addDay()),
                'query_range' => ['preset' => $preset, 'from' => $rangeStart, 'to' => $rangeEnd],
                'sessions' => $rows->map(function ($s) {
                    $dt = $s->gio_bat_dau
                        ? CarbonImmutable::parse($s->ngay_tap . ' ' . $s->gio_bat_dau, self::TIMEZONE)
                        : CarbonImmutable::parse($s->ngay_tap, self::TIMEZONE);
                    return [
                        'name' => $s->ten_chuong_trinh,
                        'scheduled_date' => $dt->toDateString(),
                        'weekday_vn' => VietnameseDateVerifier::weekdayVn($dt),
                        'date_vn_with_weekday' => VietnameseDateVerifier::formatDateWithWeekday($dt),
                        'starts_at' => $s->gio_bat_dau ? $dt->toIso8601String() : null,
                        'time_vn' => $s->gio_bat_dau ? $dt->format('H:i d/m/Y') : $dt->format('d/m/Y'),
                        'status' => (string) ($s->tinh_trang ?? '0'),
                    ];
                })->values()->all(),
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
            $dt = $s->gio_bat_dau
                ? CarbonImmutable::parse($s->ngay_tap . ' ' . $s->gio_bat_dau, self::TIMEZONE)
                : CarbonImmutable::parse($s->ngay_tap, self::TIMEZONE);
            $isPastToday = ($dt->toDateString() === $todayIso)
                && !empty($s->gio_bat_dau)
                && ((string) $s->gio_bat_dau < $now->format('H:i:s'));
            return [
                'name' => $s->ten_chuong_trinh,
                'scheduled_date' => $dt->toDateString(),
                'weekday_vn' => VietnameseDateVerifier::weekdayVn($dt),
                'date_vn_with_weekday' => VietnameseDateVerifier::formatDateWithWeekday($dt),
                'starts_at' => $s->gio_bat_dau ? $dt->toIso8601String() : null,
                'time_vn' => $s->gio_bat_dau ? $dt->format('H:i d/m/Y') : $dt->format('d/m/Y'),
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
            'today_weekday_vn' => VietnameseDateVerifier::weekdayVn($now),
            'tomorrow' => $tomorrowIso,
            'tomorrow_weekday_vn' => VietnameseDateVerifier::weekdayVn($now->addDay()),
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

        $rawRows = DB::table('dang_ky_goi as d')
            ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
            ->join('goi_tap as g', 'g.id', '=', 'ct.id_goi_tap')
            ->where('d.id_hoi_vien', $actor->userId)
            ->where('g.id_phong_tap', $actor->gymId)
            ->where('d.tinh_trang', 1)
            ->whereIn('ct.tinh_trang', [0, 1])
            ->orderByDesc('ct.id')
            ->limit(20)
            ->get(['ct.id as ct_id', 'g.ten_goi_tap', 'ct.ngay_ket_thuc', 'ct.so_buoi', 'ct.so_buoi_pt']);

        // Tái sử dụng đúng quy tắc nghiệp vụ của TrainerController::taoLichPT trên bảng buoi_tap_pt:
        // số buổi PT đã đặt/sử dụng = COUNT(buoi_tap_pt WHERE id_chi_tiet_dang_ky_goi = ct.id AND tinh_trang != 4).
        $hasPtLedger = Schema::hasTable('buoi_tap_pt');
        $ptStatsByDetailId = [];
        if ($hasPtLedger && $rawRows->isNotEmpty()) {
            $detailIds = $rawRows->pluck('ct_id')->map(fn ($id) => (int) $id)->all();
            $stats = DB::table('buoi_tap_pt')
                ->whereIn('id_chi_tiet_dang_ky_goi', $detailIds)
                ->where('tinh_trang', '!=', 4)
                ->groupBy('id_chi_tiet_dang_ky_goi')
                ->selectRaw('id_chi_tiet_dang_ky_goi, COUNT(*) as used_count, SUM(CASE WHEN tinh_trang = 3 THEN 1 ELSE 0 END) as completed_count')
                ->get();
            foreach ($stats as $st) {
                $ptStatsByDetailId[(int) $st->id_chi_tiet_dang_ky_goi] = [
                    'used' => (int) $st->used_count,
                    'completed' => (int) ($st->completed_count ?? 0),
                ];
            }
        }

        $rows = $rawRows
            ->map(function ($p) use ($todayIso, $hasPtLedger, $ptStatsByDetailId) {
                $expClean = $p->ngay_ket_thuc ? explode('T', (string) $p->ngay_ket_thuc)[0] : null;
                $isExpired = $expClean !== null && $expClean !== '' && $expClean < $todayIso;
                $regularTotal = $p->so_buoi !== null ? (int) $p->so_buoi : null;
                $ptTotal = $p->so_buoi_pt !== null ? (int) $p->so_buoi_pt : 0;
                $ctId = (int) $p->ct_id;

                $base = [
                    'name' => $p->ten_goi_tap,
                    'expires_at' => $p->ngay_ket_thuc,
                    'expires_at_vn' => $expClean ? CarbonImmutable::parse($expClean, self::TIMEZONE)->format('d/m/Y') : null,
                    'is_expired' => $isExpired,
                ];

                // Trường hợp 1: Gói PT thuần (có so_buoi_pt > 0 và có bảng sổ cái buoi_tap_pt xác thực)
                if ($hasPtLedger && $ptTotal > 0 && ($regularTotal === null || $regularTotal === 0 || $regularTotal === $ptTotal)) {
                    $ptUsed = $ptStatsByDetailId[$ctId]['used'] ?? 0;
                    $ptCompleted = $ptStatsByDetailId[$ctId]['completed'] ?? 0;
                    return array_merge($base, [
                        'package_type' => 'pt_package',
                        'total_sessions' => $ptTotal,
                        'used_sessions' => $ptUsed,
                        'completed_sessions' => $ptCompleted,
                        'remaining_sessions' => max(0, $ptTotal - $ptUsed),
                        'remaining_sessions_source' => 'buoi_tap_pt (không tính buổi đã hủy tinh_trang=4, theo quy tắc TrainerController::taoLichPT)',
                        'remaining_sessions_unavailable_reason' => null,
                    ]);
                }

                // Trường hợp 2: Gói kết hợp (có cả buổi thường so_buoi và buổi PT so_buoi_pt khác nhau)
                if ($hasPtLedger && $ptTotal > 0 && $regularTotal !== null && $regularTotal > 0) {
                    $ptUsed = $ptStatsByDetailId[$ctId]['used'] ?? 0;
                    $ptCompleted = $ptStatsByDetailId[$ctId]['completed'] ?? 0;
                    return array_merge($base, [
                        'package_type' => 'combined_package',
                        'total_sessions' => $regularTotal,
                        'used_sessions' => null,
                        'remaining_sessions' => null,
                        'remaining_sessions_source' => null,
                        'remaining_sessions_unavailable_reason' => 'Phần buổi tập thường (so_buoi) chỉ lưu tổng buổi đăng ký, chưa có sổ cái trừ buổi xác thực; phần buổi PT được tính riêng ở trường pt_sessions.',
                        'pt_sessions' => [
                            'total_sessions' => $ptTotal,
                            'used_sessions' => $ptUsed,
                            'completed_sessions' => $ptCompleted,
                            'remaining_sessions' => max(0, $ptTotal - $ptUsed),
                            'source' => 'buoi_tap_pt (không tính buổi đã hủy tinh_trang=4)',
                        ],
                    ]);
                }

                // Trường hợp 3: Gói thường không có buổi PT -> chưa có sổ cái trừ buổi xác thực, tuyệt đối trả null
                return array_merge($base, [
                    'package_type' => 'regular_package',
                    'total_sessions' => $regularTotal,
                    'used_sessions' => null,
                    'remaining_sessions' => null,
                    'remaining_sessions_source' => null,
                    'remaining_sessions_unavailable_reason' => 'Hệ thống chỉ lưu tổng số buổi đăng ký (so_buoi) và ngày hết hạn cho gói tập thường; chưa có sổ cái trừ buổi tập thường xác thực nên không thể tính số buổi đã dùng và còn lại.',
                ]);
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
            'note' => 'Phân biệt rõ total_sessions (tổng số buổi đăng ký), used_sessions (số buổi đã dùng/đã đặt), và remaining_sessions (số buổi còn lại). Chỉ gói PT có nguồn xác thực từ bảng buoi_tap_pt mới có remaining_sessions; nếu remaining_sessions=null thì phải nêu rõ lý do thiếu dữ liệu và không bao giờ lấy total_sessions thay cho remaining_sessions.',
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

        $allergyText = $this->allergyTextOf($user);

        if (!$latestNutrition) {
            if ($hasSubmittedMetrics && ($weight > 0 || $height > 0)) {
                $missingFields = [];
                if ($weight <= 0) {
                    $missingFields[] = 'weight_kg';
                }
                if ($height <= 0) {
                    $missingFields[] = 'height_cm';
                }
                array_push($missingFields, 'bmi', 'bmr_kcal', 'tdee_kcal', 'target_calories_kcal');

                return [
                    'status' => 'partial_body_metrics',
                    'has_body_metrics' => false,
                    'metrics' => [
                        'weight_kg' => $weight > 0 ? $weight : null,
                        'height_cm' => $height > 0 ? $height : null,
                        'bmi' => null,
                        'bmi_status' => null,
                        'bmr_kcal' => null,
                        'tdee_kcal' => null,
                        'target_calories_kcal' => null,
                        'protein_g' => null,
                        'carb_g' => null,
                        'fat_g' => null,
                        'recommended_water_liters' => $weight > 0 ? round(($weight * 35) / 1000, 2) : null,
                    ],
                    'missing_fields' => $missingFields,
                    'profile' => [
                        'goal' => $user->muc_tieu_hien_tai ?: null,
                        'level' => $user->cap_do_hien_tai ?: null,
                        'allergy' => $allergyText !== '' ? $allergyText : 'Không',
                    ],
                    'suggested_navigation' => 'NAVIGATE_BODY_METRICS',
                    'message' => 'Hội viên mới có một phần chỉ số cơ thể; còn thiếu dữ liệu để tính BMI, BMR và TDEE (không tự suy đoán hay biến thành 0).',
                ];
            }

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
                ->get(['kpa.ngay_an', 'kpa.gio_an', 'kpa.bua_an', 'ma.ten_mon_an', 'ma.nguyen_lieu', 'ma.calo', 'ma.protein', 'ma.carb', 'ma.fat', 'ma.loai_bua']);

            $mealFilter = self::canonicalMealType($mealType) ?? 'ALL';
            $rawAllergy = $this->rawAllergyOf($actor->user);
            foreach ($rows as $mp) {
                $code = strtoupper(trim((string) ($mp->bua_an ?: $mp->loai_bua)));
                if (!$this->mealTypeMatches($code, $mealFilter)) {
                    continue;
                }
                // Món trong kế hoạch cá nhân vẫn phải được kiểm tra dị ứng theo hồ sơ hội viên
                $allergens = $this->detectAllergenMatches((string) $mp->ten_mon_an, (string) ($mp->nguyen_lieu ?? ''), $rawAllergy);
                $meal = [
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
                if (!empty($allergens)) {
                    $meal['allergy_warning'] = 'Món ăn chứa thành phần nằm trong danh sách dị ứng của hội viên: ' . implode(', ', $allergens);
                    $meal['matched_allergens'] = $allergens;
                }
                $registeredMeals[] = $meal;
            }
        }

        if (!empty($registeredMeals)) {
            $reqDt = $targetDate ? CarbonImmutable::parse($targetDate, self::TIMEZONE) : null;
            return [
                'status' => 'ok',
                'timezone' => self::TIMEZONE,
                'today' => $todayIso,
                'today_weekday_vn' => VietnameseDateVerifier::weekdayVn($now),
                'requested_date' => $targetDate,
                'requested_date_weekday_vn' => $reqDt ? VietnameseDateVerifier::weekdayVn($reqDt) : null,
                'has_registered_program' => true,
                'has_meal_plan' => true,
                'active_program' => $activeProgram['name'],
                'allergy' => $metrics['profile']['allergy'] ?? 'Không',
                'allergy_warnings_count' => count(array_filter($registeredMeals, fn (array $m) => isset($m['allergy_warning']))),
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
        $rawAllergy = $this->rawAllergyOf($user);
        if (!empty($rawAllergy)) {
            foreach ($this->expandAllergyKeywords($rawAllergy) as $kw) {
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

        $mealFilter = self::canonicalMealType($mealType) ?? 'ALL';
        if ($mealFilter !== 'ALL') {
            $bySlot = $candidates->filter(fn ($m) => $this->mealTypeMatches($m->loai_bua ?? null, $mealFilter))->values();
            if ($bySlot->isNotEmpty()) {
                $candidates = $bySlot;
            }
        }

        $preferredOrder = ['SANG', 'TRUA', 'PHU_TRUA', 'TOI', 'PHU_SANG', 'PHU_TOI'];
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

        $allergyText = $this->allergyTextOf($user);

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

