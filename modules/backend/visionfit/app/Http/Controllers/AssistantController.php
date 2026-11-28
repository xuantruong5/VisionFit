<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Trainer;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\PersonalAccessToken;

class AssistantController extends Controller
{
    public function me(Request $request)
    {
        return response()->json(['data' => $request->attributes->get('assistant_identity')]);
    }

    public function context(Request $request)
    {
        $identity = $request->attributes->get('assistant_identity');
        $user = $request->attributes->get('assistant_user');

        // Không bao giờ fallback sang hội viên đầu tiên trong DB khi chưa đăng nhập / token không hợp lệ.
        if (!$identity || !$user) {
            return response()->json([
                'data' => [
                    'authenticated' => false,
                    'subject' => null,
                    'profile' => null,
                    'nutrition' => null,
                    'active_program' => null,
                    'meal_plan' => [],
                    'suggestions' => [
                        'programs' => [],
                        'exercises' => [],
                        'meals' => [],
                    ],
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
                ],
            ]);
        }

        $role = $identity['role'];
        $gym = $identity['gym_id'];
        $now = CarbonImmutable::now(config('app.timezone'));
        $data = [
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
            'summary' => null,
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

        if ($role !== 'member') {
            // Only aggregate assigned members; never return personal member records.
            $members = DB::table('clients')->where('id_phong_tap', $gym);
            if ($role === 'trainer') {
                $members->whereIn('id', DB::table('lich_tap')->select('id_hoi_vien')
                    ->where('id_trainner', $user->getKey())->where('tinh_trang', '!=', '3'));
            }
            $data['summary'] = [
                'assigned_members' => (clone $members)->count(),
                'expiring_members' => null,
            ];
            if ($role === 'admin') {
                $data['summary']['expiring_members'] = DB::table('clients as c')
                    ->join('dang_ky_goi as d', 'd.id_hoi_vien', '=', 'c.id')
                    ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
                    ->join('goi_tap as g', 'g.id', '=', 'ct.id_goi_tap')
                    ->where('c.id_phong_tap', $gym)->where('g.id_phong_tap', $gym)
                    ->where('d.tinh_trang', 1)->whereIn('ct.tinh_trang', [0, 1])
                    ->whereBetween('ct.ngay_ket_thuc', [$now->toDateString(), $now->addDays(7)->toDateString()])
                    ->distinct()->count('c.id');
            }
            return response()->json(['data' => $data]);
        }

        $allergyText = is_array($user->di_ung)
            ? implode(', ', array_filter($user->di_ung, fn ($v) => trim((string) $v) !== ''))
            : trim((string) ($user->di_ung ?? ''));

        $data['profile'] = [
            'goal' => $user->muc_tieu_hien_tai ?: null,
            'level' => $user->cap_do_hien_tai ?: null,
            'activity_level' => !empty($user->muc_tieu_hoat_dong) ? (string) $user->muc_tieu_hoat_dong : null,
            'allergy' => $allergyText !== '' ? $allergyText : 'Không',
            'note' => is_array($user->note) ? implode(', ', $user->note) : (string) ($user->note ?? ''),
        ];

        // 1. Lấy chỉ số dinh dưỡng thực tế:
        // Đồng bộ 100% với MembersController::checkCapNhatChiSo():
        // Chỉ công nhận đã nhập chỉ số khi có bản ghi trong lich_su_chi_so_dinh_duong
        // HOẶC đã từng cập nhật chỉ số (ngay_cap_nhat_chi_so != null) kèm đủ cân nặng > 0 và chiều cao > 0.
        // Không tính từ dữ liệu seed mặc định khi user chưa từng nhập chỉ số.
        $latestNutrition = null;
        if (Schema::hasTable('lich_su_chi_so_dinh_duong')) {
            $latestNutrition = DB::table('lich_su_chi_so_dinh_duong')
                ->where('id_user', $user->getKey())
                ->orderByDesc('id')
                ->first();
        }

        $weight = is_numeric($user->can_nang_kg) ? (float) $user->can_nang_kg : 0.0;
        $height = is_numeric($user->chieu_cao_cm) ? (float) $user->chieu_cao_cm : 0.0;
        $hasSubmittedMetrics = !empty($user->ngay_cap_nhat_chi_so);

        if (!$latestNutrition && $hasSubmittedMetrics && $weight > 0 && $height > 0) {
            $age = 25;
            if (!empty($user->ngay_sinh)) {
                try {
                    $parsedAge = CarbonImmutable::parse($user->ngay_sinh)->age;
                    if ($parsedAge >= 10 && $parsedAge <= 100) {
                        $age = $parsedAge;
                    }
                } catch (\Throwable $e) {
                    $age = 25;
                }
            }
            $activityFactors = [1 => 1.2, 2 => 1.375, 3 => 1.55, 4 => 1.725];
            $multiplier = $activityFactors[(int) ($user->muc_tieu_hoat_dong ?? 2)] ?? 1.375;
            $calc = \App\Services\NutritionService::calculateAll(
                $weight,
                $height,
                $age,
                $user->gioi_tinh ?? 0,
                $multiplier,
                $user->muc_tieu_hien_tai ?? 'maintain'
            );
            $latestNutrition = (object) array_merge($calc, ['created_at' => $now->toDateTimeString()]);
        }

        if ($latestNutrition) {
            $data['nutrition'] = [
                'can_nang' => (float) $latestNutrition->can_nang,
                'chieu_cao_cm' => $height > 0 ? $height : null,
                'bmi' => (float) $latestNutrition->bmi,
                'bmi_status' => $this->classifyBmi((float) $latestNutrition->bmi),
                'bmr' => (float) $latestNutrition->bmr,
                'tdee' => (float) $latestNutrition->tdee,
                'kcal_muc_tieu' => (float) $latestNutrition->kcal_muc_tieu,
                'protein' => (float) $latestNutrition->protein,
                'carb' => (float) $latestNutrition->carb,
                'fat' => (float) $latestNutrition->fat,
            ];
        }

        // 2. Lấy chương trình tập đang đăng ký (nếu có)
        if (Schema::hasTable('dang_ky_chuong_trinh') && Schema::hasTable('chuong_trinh_tap')) {
            $activeReg = DB::table('dang_ky_chuong_trinh as dk')
                ->join('chuong_trinh_tap as c', 'c.id', '=', 'dk.id_chuong_trinh')
                ->where('dk.id_hoi_vien', $user->getKey())
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
            if ($activeReg) {
                $data['active_program'] = [
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
        }

        // 2.5. Lấy kế hoạch bữa ăn đã đăng ký thực tế (ke_hoach_an + khau_phan_an)
        $mealPlan = collect();
        if (
            $data['active_program'] !== null
            && Schema::hasTable('ke_hoach_an')
            && Schema::hasTable('khau_phan_an')
            && Schema::hasTable('mon_an')
        ) {
            $mealPlan = DB::table('ke_hoach_an as kha')
                ->join('khau_phan_an as kpa', 'kha.id', '=', 'kpa.id_ke_hoach_an')
                ->join('mon_an as ma', 'kpa.id_mon_an', '=', 'ma.id')
                ->where('kha.id_dang_ky_chuong_trinh', $data['active_program']['registration_id'])
                ->where('kha.tinh_trang', 1)
                ->where(function ($q) use ($now) {
                    $q->whereNull('kpa.ngay_an')
                        ->orWhereDate('kpa.ngay_an', '>=', $now->toDateString());
                })
                ->orderBy('kpa.ngay_an')
                ->orderBy('kpa.gio_an')
                ->limit(24)
                ->get([
                    'kpa.ngay_an',
                    'kpa.gio_an',
                    'kpa.bua_an',
                    'ma.ten_mon_an',
                    'ma.calo',
                    'ma.protein',
                    'ma.loai_bua',
                ])
                ->map(fn ($mp) => [
                    'date' => $mp->ngay_an,
                    'time' => $mp->gio_an ? substr((string) $mp->gio_an, 0, 5) : null,
                    'meal_type_code' => $mp->bua_an ?: $mp->loai_bua,
                    'meal_type' => $this->formatMealType($mp->bua_an ?: $mp->loai_bua),
                    'name' => $mp->ten_mon_an,
                    'calories' => (float) ($mp->calo ?? 0),
                    'protein' => (float) ($mp->protein ?? 0),
                ])->values();
        }
        $data['meal_plan'] = $mealPlan;

        // 3. Gói tập của hội viên (phân biệt gói đang hiệu lực vs gói đã hết hạn theo ngay_ket_thuc)
        $todayDateStr = $now->toDateString();
        $data['packages'] = DB::table('dang_ky_goi as d')
            ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
            ->join('goi_tap as g', 'g.id', '=', 'ct.id_goi_tap')
            ->where('d.id_hoi_vien', $user->getKey())->where('g.id_phong_tap', $gym)
            ->where('d.tinh_trang', 1)->whereIn('ct.tinh_trang', [0, 1])
            ->orderByDesc('ct.id')->limit(20)
            ->get(['g.ten_goi_tap', 'ct.ngay_ket_thuc', 'ct.so_buoi'])
            ->map(function ($p) use ($todayDateStr) {
                $expClean = $p->ngay_ket_thuc ? explode('T', (string) $p->ngay_ket_thuc)[0] : null;
                $isExpired = $expClean !== null && $expClean !== '' && $expClean < $todayDateStr;
                return [
                    'name' => $p->ten_goi_tap,
                    'expires_at' => $p->ngay_ket_thuc,
                    'is_expired' => $isExpired,
                    'total_sessions' => (int) $p->so_buoi,
                    // Schema has purchased sessions, not an authoritative consumption ledger.
                    'remaining_sessions' => null,
                ];
            })->values();

        // 4. Lịch tập hôm nay & sắp tới của hội viên (giữ cả buổi hôm nay đã qua giờ để không báo nhầm "hôm nay là ngày nghỉ")
        $data['schedule'] = DB::table('lich_tap as l')
            ->join('dang_ky_chuong_trinh as dk', function ($join) {
                $join->on('dk.id', '=', 'l.id_dang_ky_chuong_trinh')
                    ->on('dk.id_hoi_vien', '=', 'l.id_hoi_vien')
                    ->on('dk.id_chuong_trinh', '=', 'l.id_chuong_trinh');
            })
            ->join('chuong_trinh_tap as c', 'c.id', '=', 'l.id_chuong_trinh')
            ->leftJoin('trainers as t', function ($join) use ($gym) {
                $join->on('t.id', '=', 'l.id_trainner')->where('t.id_phong_tap', '=', $gym);
            })
            ->where('l.id_hoi_vien', $user->getKey())->where('dk.tinh_trang', 1)
            ->whereIn('l.tinh_trang', ['0', '1', '2'])->whereDate('l.ngay_tap', '>=', $todayDateStr)
            ->orderBy('l.ngay_tap')->orderBy('l.gio_bat_dau')->limit(20)
            ->get(['c.ten_chuong_trinh', 'l.ngay_tap', 'l.gio_bat_dau', 'l.tinh_trang', 't.ho_ten'])
            ->map(function ($s) use ($now, $todayDateStr) {
                $isPastToday = ($s->ngay_tap === $todayDateStr)
                    && !empty($s->gio_bat_dau)
                    && ((string) $s->gio_bat_dau < $now->format('H:i:s'));
                return [
                    'name' => $s->ten_chuong_trinh,
                    'scheduled_date' => $s->ngay_tap,
                    'starts_at' => $s->gio_bat_dau
                        ? CarbonImmutable::parse($s->ngay_tap . ' ' . $s->gio_bat_dau, config('app.timezone'))->toIso8601String()
                        : null,
                    'trainer' => $s->ho_ten,
                    'status' => (string) ($s->tinh_trang ?? '0'),
                    'is_past_today' => $isPastToday,
                ];
            })->values();

        $week = DB::table('buoi_tap')->where('id_hoi_vien', $user->getKey())
            ->whereIn('tinh_trang', ['2', '3'])
            ->whereBetween('thoi_gian_bat_dau', [$now->startOfWeek()->toDateTimeString(), $now->toDateTimeString()]);
        $average = (clone $week)->avg('phan_tram_hoan_thanh');
        $data['progress'] = [
            'sessions_this_week' => (clone $week)->count(),
            'completion_percent' => $average === null ? null : round((float) $average, 2),
        ];

        $hasBodyMetrics = $data['nutrition'] !== null;
        $hasGoal = !empty($user->muc_tieu_hien_tai) && ($hasBodyMetrics || !empty($user->ngay_cap_nhat_chi_so));
        $hasRegisteredProgram = $data['active_program'] !== null;
        $hasMealPlan = $mealPlan->isNotEmpty();
        $hasActivePackage = $data['packages']->contains(fn ($p) => empty($p['is_expired']));
        $hasSchedule = $data['schedule']->isNotEmpty();

        $data['account_status'] = [
            'authenticated' => true,
            'has_body_metrics' => $hasBodyMetrics,
            'has_goal' => $hasGoal,
            'has_registered_program' => $hasRegisteredProgram,
            'has_meal_plan' => $hasMealPlan,
            'has_active_package' => $hasActivePackage,
            'has_schedule' => $hasSchedule,
        ];

        // 5. Gợi ý cá nhân hóa: CHỈ sinh dữ liệu gợi ý thực đơn/chương trình cá nhân hóa
        // khi hội viên ĐÃ thực sự nhập chỉ số cơ thể hoặc ĐÃ đăng ký chương trình tập.
        $hasPersonalizationData = $hasBodyMetrics || $hasRegisteredProgram;

        $programs = collect();
        if ($hasPersonalizationData && Schema::hasTable('chuong_trinh_tap')) {
            $progQuery = DB::table('chuong_trinh_tap')->where('tinh_trang', 1);
            if (!empty($user->muc_tieu_hien_tai)) {
                $g = $user->muc_tieu_hien_tai;
                $progQuery->where(function ($q) use ($g) {
                    $q->where('ten_chuong_trinh', 'like', "%{$g}%");
                    if (Schema::hasColumn('chuong_trinh_tap', 'muc_tieu')) {
                        $q->orWhere('muc_tieu', 'like', "%{$g}%");
                    }
                });
            }
            $cols = ['ten_chuong_trinh', 'so_buoi_moi_tuan'];
            $hasMucTieuCol = Schema::hasColumn('chuong_trinh_tap', 'muc_tieu');
            if ($hasMucTieuCol) {
                $cols[] = 'muc_tieu';
            }
            $programs = $progQuery->limit(3)->get($cols)
                ->map(fn ($p) => [
                    'name' => $p->ten_chuong_trinh,
                    'goal' => ($hasMucTieuCol && !empty($p->muc_tieu)) ? $p->muc_tieu : ($user->muc_tieu_hien_tai ?: 'Rèn luyện sức khỏe'),
                    'sessions_per_week' => (int) ($p->so_buoi_moi_tuan ?? 3),
                ])->values();

            if ($programs->isEmpty()) {
                $programs = DB::table('chuong_trinh_tap')->where('tinh_trang', 1)->limit(3)
                    ->get($cols)
                    ->map(fn ($p) => [
                        'name' => $p->ten_chuong_trinh,
                        'goal' => ($hasMucTieuCol && !empty($p->muc_tieu)) ? $p->muc_tieu : 'Rèn luyện sức khỏe',
                        'sessions_per_week' => (int) ($p->so_buoi_moi_tuan ?? 3),
                    ])->values();
            }
        }

        $exercises = collect();
        if ($hasPersonalizationData && Schema::hasTable('bai_tap')) {
            $exercises = DB::table('bai_tap')->where('tinh_trang', 1)->limit(5)
                ->get(['ten_bai_tap', 'thiet_bi'])
                ->map(fn ($e) => ['name' => $e->ten_bai_tap, 'equipment' => $e->thiet_bi])->values();
        }

        $meals = collect();
        if ($hasPersonalizationData && Schema::hasTable('mon_an')) {
            $meals = $this->selectBalancedMeals($user, 6);
        }

        $data['suggestions'] = [
            'programs' => $programs,
            'exercises' => $exercises,
            'meals' => $meals,
        ];

        return response()->json(['data' => $data]);
    }

    /**
     * Chuẩn hóa và mở rộng danh sách từ khóa dị ứng (hỗ trợ cả mảng, chuỗi JSON, chuỗi cách nhau dấu phẩy/gạch chéo
     * và tự mở rộng nhóm dị ứng lớn như Hải sản -> tôm/cua/mực/ghẹ/sò/nghêu/ốc).
     */
    protected function expandAllergyKeywords($rawAllergy): array
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

    /**
     * Chọn thực đơn đa dạng các bữa trong ngày (Sáng, Trưa, Phụ, Tối) theo dị ứng & mục tiêu.
     */
    protected function selectBalancedMeals($user, int $limit = 6, ?string $dietFilter = null)
    {
        $baseQuery = DB::table('mon_an')->where('tinh_trang', 1);
        $normalizedAllergyTokens = [];

        if ($user && !empty($user->di_ung)) {
            $uniqueKeywords = $this->expandAllergyKeywords($user->di_ung);
            foreach ($uniqueKeywords as $kw) {
                $normKw = trim($this->normalizeVietnamese($kw));
                if ($normKw !== '') {
                    $normalizedAllergyTokens[] = $normKw;
                }
            }
            $normalizedAllergyTokens = array_values(array_unique($normalizedAllergyTokens));
        }

        $filterSafeMeals = function ($rows) use ($normalizedAllergyTokens) {
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
        } elseif (str_contains($goalLower, 'eat clean') || str_contains($goalLower, 'giảm') || str_contains($goalLower, 'mỡ') || str_contains($goalLower, 'giam') || str_contains($goalLower, 'mo')) {
            $filteredQuery->whereIn('the_loai', ['Eat Clean', 'Giảm tinh bột (Low-carb/Keto)']);
        } elseif (str_contains($goalLower, 'tăng') || str_contains($goalLower, 'cơ') || str_contains($goalLower, 'tang') || str_contains($goalLower, 'co')) {
            $filteredQuery->whereIn('the_loai', ['Eat Clean', 'Bình thường (Ăn đa dạng)']);
        }

        $candidates = $filterSafeMeals($filteredQuery->get(['ten_mon_an', 'loai_bua', 'the_loai', 'calo', 'protein', 'nguyen_lieu']));
        // Nếu người dùng yêu cầu chế độ ăn cụ thể (vd: ăn chay/vegan) và có món khớp -> GIỮ NGUYÊN món khớp,
        // tuyệt đối không đổ món thịt/hải sản vào thay thế chỉ vì số món < 3!
        $isExplicitStrictDiet = ($dietFilter !== null || $preferredDietText !== '') && (
            str_contains($goalLower, 'chay') || str_contains($goalLower, 'vegan') || str_contains($goalLower, 'keto')
        );
        if ($candidates->isEmpty() || (!$isExplicitStrictDiet && $candidates->count() < 3)) {
            $fallbackCandidates = $filterSafeMeals($baseQuery->get(['ten_mon_an', 'loai_bua', 'the_loai', 'calo', 'protein', 'nguyen_lieu']));
            $candidates = $candidates->concat($fallbackCandidates)->unique('ten_mon_an')->values();
        }

        // Ưu tiên chọn đủ các bữa Sáng -> Trưa -> Phụ -> Tối để không bị lặp toàn bộ là SÁNG
        $preferredOrder = ['SANG', 'TRUA', 'PHU_CHIEU', 'TOI', 'PHU_SANG'];
        $picked = collect();
        $usedNames = [];

        foreach ($preferredOrder as $slot) {
            if ($picked->count() >= $limit) {
                break;
            }
            $match = $candidates->first(function ($m) use ($slot, $usedNames) {
                $type = strtoupper(trim((string) ($m->loai_bua ?? '')));
                return $type === $slot && !in_array($m->ten_mon_an, $usedNames, true);
            });
            if ($match) {
                $picked->push($match);
                $usedNames[] = $match->ten_mon_an;
            }
        }

        foreach ($candidates as $m) {
            if ($picked->count() >= $limit) {
                break;
            }
            if (!in_array($m->ten_mon_an, $usedNames, true)) {
                $picked->push($m);
                $usedNames[] = $m->ten_mon_an;
            }
        }

        return $picked->map(fn ($m) => [
            'name' => $m->ten_mon_an,
            'meal_type' => $this->formatMealType($m->loai_bua),
            'meal_type_code' => $m->loai_bua,
            'diet_type' => $m->the_loai,
            'calories' => (float) $m->calo,
            'protein' => (float) $m->protein,
        ])->values();
    }

    protected function formatMealType(?string $code): string
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

    protected function classifyBmi($bmi): string
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

    /**
     * API Trò chuyện Trực tiếp với AI Assistant (Đã tích hợp dữ liệu thực tế của tài khoản đang đăng nhập)
     */
    public function chat(Request $request)
    {
        $message = trim((string) $request->input('message', ''));
        if ($message === '') {
            return response()->json(['message' => 'Nội dung câu hỏi không được để trống.'], 422);
        }
        if (mb_strlen($message, 'UTF-8') > 2000) {
            return response()->json(['message' => 'Nội dung câu hỏi quá dài (tối đa 2.000 ký tự).'], 422);
        }

        $species = $request->input('species', 'cat') === 'bear' ? 'bear' : 'cat';
        $history = (array) $request->input('history', []);

        // 0. Xác thực tài khoản đang đăng nhập qua Bearer Token (Client / Trainer / Admin)
        // Tuyệt đối KHÔNG fallback sang hội viên #1 trong DB nếu không có token hợp lệ.
        if (!$request->attributes->has('assistant_user')) {
            $plainToken = $request->bearerToken();
            $token = $plainToken ? PersonalAccessToken::findToken($plainToken) : null;
            $expiration = config('sanctum.expiration');
            $isExpired = !$token
                || ($token->expires_at && $token->expires_at->isPast())
                || ($expiration && $token->created_at->lte(now()->subMinutes((int) $expiration)));

            if ($token && !$isExpired && ($token->can('*') || $token->can('assistant:read'))) {
                $user = $token->tokenable;
                $role = match (true) {
                    $user instanceof Client => 'member',
                    $user instanceof Trainer => 'trainer',
                    $user instanceof Admin => 'admin',
                    default => null,
                };

                $isActiveAccount = $role
                    && (int) ($user->tinh_trang ?? 0) === 1
                    && (int) ($user->is_block ?? 0) !== 1
                    && ($role !== 'trainer' || (int) ($user->is_active ?? 0) === 1);

                if ($isActiveAccount) {
                    $gymId = $role === 'admin'
                        ? config('assistant.admin_gyms.' . (string) $user->getKey())
                        : ($user->id_phong_tap ?? null);

                    if ($role === 'member' || ($gymId && (int) $gymId > 0)) {
                        $request->attributes->set('assistant_user', $user);
                        $request->attributes->set('assistant_identity', [
                            'id' => (string) $user->getKey(),
                            'gym_id' => $gymId ? (string) $gymId : '0',
                            'role' => $role,
                            'name' => $user->ho_ten ?? 'Người dùng VisionFit',
                        ]);
                    }
                }
            }
        }

        // 1. Trích xuất ngữ cảnh dữ liệu thực tế của chính tài khoản đang đăng nhập + RAG kho tri thức theo câu hỏi
        $contextResponse = $this->context($request);
        $contextData = $contextResponse->getData(true)['data'] ?? [];
        $retrievedKnowledge = $this->retrieveKnowledgeForQuery($message);
        if (!empty($retrievedKnowledge)) {
            $contextData['retrieved_knowledge'] = $retrievedKnowledge;
        }

        // 2. Tầng 1 & Tầng 2: Gọi LLM Engine đa tầng (Primary Gemini Failover -> Backup LLM Provider)
        $aiResult = $this->queryGeminiWithFailover($message, $contextData, $species, $history);
        if ($aiResult && !empty($aiResult['answer'])) {
            return response()->json([
                'status' => true,
                'answer' => $aiResult['answer'],
                'intent' => $aiResult['intent'] ?? 'general_support',
                'emotion' => $aiResult['emotion'] ?? 'explaining',
                'action' => $aiResult['action'] ?? null,
                'source' => $aiResult['source'] ?? 'gemini_ai',
            ]);
        }

        // 3. Tầng 3 (Dynamic Knowledge/API Backup): Kéo dữ liệu thực tế từ CSDL & kho tri thức VisionFit
        $dbResult = $this->generateDynamicDatabaseReply(
            $message,
            $contextData,
            $species,
            $history,
            $request->attributes->get('assistant_user')
        );
        return response()->json([
            'status' => true,
            'answer' => $dbResult['answer'],
            'intent' => $dbResult['intent'] ?? 'general_support',
            'emotion' => $dbResult['emotion'] ?? 'neutral',
            'action' => $dbResult['action'] ?? null,
            'source' => $dbResult['source'] ?? 'visionfit_rag_api_backup',
        ]);
    }

    /**
     * Helper định dạng ngày giờ Việt Nam: HH:mm dd/mm/yyyy
     */
    protected function formatVNTime($isoStr, $dateStr = null): string
    {
        if ($isoStr) {
            try {
                $d = \Carbon\Carbon::parse($isoStr);
                return $d->format('H:i d/m/Y');
            } catch (\Throwable $e) {
            }
        }
        if ($dateStr) {
            try {
                $d = \Carbon\Carbon::parse($dateStr);
                return $d->format('d/m/Y');
            } catch (\Throwable $e) {
                return (string) $dateStr;
            }
        }
        return 'Chưa có thời gian';
    }

    /**
     * Helper định dạng ngày Việt Nam: dd/mm/yyyy
     */
    protected function formatVNDate($dateStr): string
    {
        if (!$dateStr) {
            return 'Chưa có dữ liệu';
        }
        try {
            $clean = explode('T', (string) $dateStr)[0];
            $d = \Carbon\Carbon::parse($clean);
            return $d->format('d/m/Y');
        } catch (\Throwable $e) {
            return (string) $dateStr;
        }
    }

    /**
     * Tầng 0 (Dynamic RAG Retrieval): Tự động truy xuất tri thức liên quan từ các bảng VisionFit
     * (dinh_duong_the_thao, bach_khoa_toan_thu, mon_an, bai_tap, chuong_trinh_tap)
     * để cung cấp ngữ cảnh thực tế cho AI Model đọc và làm backup kéo dữ liệu khi AI lỗi.
     */
    protected function retrieveKnowledgeForQuery(string $message): array
    {
        $norm = $this->normalizeVietnamese($message);
        $stopwords = [
            'cho', 'toi', 'biet', 'la', 'gi', 'nhu', 'the', 'nao', 'co', 'khong', 'cua', 'ban', 'minh',
            'hoi', 've', 'giup', 'duoc', 'can', 'nen', 'hay', 'va', 'voi', 'mot', 'cac', 'nhung',
            'trong', 'khi', 'sau', 'truoc', 'nay', 'kia', 'bao', 'nhieu', 'tac', 'dung', 'cach',
            'huong', 'dan', 'goi', 'y', 'xem', 'tim', 'kiem', 'thong', 'tin',
        ];
        $rawTokens = preg_split('/[^a-z0-9]+/', $norm) ?: [];
        $tokens = array_values(array_unique(array_filter(
            $rawTokens,
            fn ($t) => strlen($t) >= 3 && !in_array($t, $stopwords, true)
        )));

        if (empty($tokens)) {
            return [];
        }

        $scoreText = function (string $haystack) use ($tokens): int {
            $h = $this->normalizeVietnamese($haystack);
            $score = 0;
            foreach ($tokens as $tok) {
                if (str_contains($h, $tok)) {
                    $score += strlen($tok) >= 5 ? 2 : 1;
                }
            }
            return $score;
        };

        $knowledge = [];

        // 1. Dinh dưỡng thể thao / Thực phẩm bổ sung (Whey, Creatine, BCAA, Pre-workout...)
        if (Schema::hasTable('dinh_duong_the_thao')) {
            $scored = [];
            foreach (DB::table('dinh_duong_the_thao')->where('tinh_trang', 1)->get(['ten_san_pham', 'danh_muc_ten', 'mo_ta_ngan', 'noi_dung_chi_tiet']) as $row) {
                $s = $scoreText(($row->ten_san_pham ?? '') . ' ' . ($row->danh_muc_ten ?? '')) * 2
                    + $scoreText((string) ($row->mo_ta_ngan ?? ''));
                if ($s >= 2) {
                    $scored[] = [
                        'score' => $s,
                        'name' => $row->ten_san_pham,
                        'category' => $row->danh_muc_ten,
                        'summary' => mb_substr(strip_tags((string) ($row->mo_ta_ngan ?: $row->noi_dung_chi_tiet)), 0, 260, 'UTF-8'),
                    ];
                }
            }
            usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);
            if (!empty($scored)) {
                $knowledge['sports_nutrition'] = array_map(
                    fn ($x) => ['name' => $x['name'], 'category' => $x['category'], 'summary' => $x['summary']],
                    array_slice($scored, 0, 2)
                );
            }
        }

        // 2. Bách khoa toàn thư thể hình
        if (Schema::hasTable('bach_khoa_toan_thu')) {
            $scored = [];
            foreach (DB::table('bach_khoa_toan_thu')->where('tinh_trang', 1)->get(['tieu_de', 'chu_de', 'tom_tat', 'noi_dung']) as $row) {
                $s = $scoreText(($row->tieu_de ?? '') . ' ' . ($row->chu_de ?? '')) * 2
                    + $scoreText((string) ($row->tom_tat ?? ''));
                if ($s >= 2) {
                    $scored[] = [
                        'score' => $s,
                        'title' => $row->tieu_de,
                        'topic' => $row->chu_de,
                        'summary' => mb_substr(strip_tags((string) ($row->tom_tat ?: $row->noi_dung)), 0, 280, 'UTF-8'),
                    ];
                }
            }
            usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);
            if (!empty($scored)) {
                $knowledge['encyclopedia'] = array_map(
                    fn ($x) => ['title' => $x['title'], 'topic' => $x['topic'], 'summary' => $x['summary']],
                    array_slice($scored, 0, 2)
                );
            }
        }

        // 3. Món ăn liên quan
        if (Schema::hasTable('mon_an')) {
            $scored = [];
            foreach (DB::table('mon_an')->where('tinh_trang', 1)->get(['ten_mon_an', 'loai_bua', 'calo', 'protein', 'carb', 'fat', 'nguyen_lieu']) as $row) {
                $s = $scoreText((string) ($row->ten_mon_an ?? '')) * 2 + $scoreText((string) ($row->nguyen_lieu ?? ''));
                if ($s >= 2) {
                    $scored[] = [
                        'score' => $s,
                        'name' => $row->ten_mon_an,
                        'meal_type' => $this->formatMealType($row->loai_bua),
                        'calories' => (float) ($row->calo ?? 0),
                        'protein' => (float) ($row->protein ?? 0),
                    ];
                }
            }
            usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);
            if (!empty($scored)) {
                $knowledge['matched_meals'] = array_map(
                    fn ($x) => ['name' => $x['name'], 'meal_type' => $x['meal_type'], 'calories' => $x['calories'], 'protein' => $x['protein']],
                    array_slice($scored, 0, 3)
                );
            }
        }

        // 4. Bài tập liên quan
        if (Schema::hasTable('bai_tap')) {
            $scored = [];
            $exQuery = DB::table('bai_tap')->where('bai_tap.tinh_trang', 1);
            if (Schema::hasTable('chi_tiet_bai_tap')) {
                $exQuery->leftJoin('chi_tiet_bai_tap', 'bai_tap.id', '=', 'chi_tiet_bai_tap.id_bai_tap')
                    ->select('bai_tap.ten_bai_tap', 'bai_tap.mo_ta', 'bai_tap.set_yeu_cau', 'bai_tap.rep_yeu_cau', 'bai_tap.thiet_bi', 'chi_tiet_bai_tap.canh_bao');
            } else {
                $exQuery->select('bai_tap.ten_bai_tap', 'bai_tap.mo_ta', 'bai_tap.set_yeu_cau', 'bai_tap.rep_yeu_cau', 'bai_tap.thiet_bi');
            }
            foreach ($exQuery->get() as $row) {
                $s = $scoreText((string) ($row->ten_bai_tap ?? '')) * 2 + $scoreText((string) ($row->mo_ta ?? ''));
                if ($s >= 2) {
                    $scored[] = [
                        'score' => $s,
                        'name' => $row->ten_bai_tap,
                        'sets' => (int) ($row->set_yeu_cau ?? 3),
                        'reps' => (int) ($row->rep_yeu_cau ?? 12),
                        'equipment' => $row->thiet_bi ?: 'Tự do',
                        'warning' => $row->canh_bao ?? null,
                    ];
                }
            }
            usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);
            if (!empty($scored)) {
                $knowledge['matched_exercises'] = array_map(
                    fn ($x) => ['name' => $x['name'], 'sets' => $x['sets'], 'reps' => $x['reps'], 'equipment' => $x['equipment'], 'warning' => $x['warning']],
                    array_slice($scored, 0, 3)
                );
            }
        }

        return $knowledge;
    }

    /**
     * Gọi AI Model với Cơ Chế Failover Đa Tầng:
     * - Tầng 1: Primary Gemini + danh sách model dự phòng (gemini_fallback_models)
     * - Tầng 2: Backup LLM API Provider độc lập (AI_BACKUP_API_URL / KEY / MODEL - Groq, OpenRouter, Gemini Key #2, Ollama...)
     */
    protected function queryGeminiWithFailover(string $message, array $context, string $species, array $history = []): ?array
    {
        $apiKey = config('assistant.gemini_api_key');
        $primaryUrl = config('assistant.gemini_api_url') ?: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
        $backupUrl = config('assistant.backup_api_url');
        $backupKey = config('assistant.backup_api_key');
        $backupModel = config('assistant.backup_model');

        // Tạo danh sách các AI endpoint/model theo thứ tự ưu tiên failover
        $providers = [];
        if ($apiKey) {
            $primaryModel = config('assistant.gemini_model') ?: 'gemini-flash-lite-latest';
            $fallbackModels = (array) config('assistant.gemini_fallback_models', []);
            $modelsToTry = array_values(array_unique(array_filter(array_merge([$primaryModel], $fallbackModels))));
            foreach ($modelsToTry as $m) {
                $providers[] = [
                    'tier' => 'gemini',
                    'url' => $primaryUrl,
                    'key' => $apiKey,
                    'model' => $m,
                ];
            }
        }
        if ($backupUrl && $backupKey && $backupModel) {
            $providers[] = [
                'tier' => 'backup_llm',
                'url' => $backupUrl,
                'key' => $backupKey,
                'model' => $backupModel,
            ];
        }

        if (empty($providers)) {
            return null;
        }

        $mascotRole = $species === 'cat'
            ? 'Bạn là Mèo VIF 🐱 - trợ lý linh vật thể hình VisionFit tinh nghịch, đáng yêu, thông minh, nói chuyện thân thiện (có thể chêm "Meo meo!" nhẹ nhàng).'
            : 'Bạn là Gấu VIF 🐻 - trợ lý linh vật thể hình VisionFit khỏe khoắn, tràn đầy năng lượng, vững chãi, luôn khích lệ tinh thần người tập.';

        $now = CarbonImmutable::now(config('app.timezone'));
        $todayVN = $now->format('d/m/Y');
        $todayIso = $now->toDateString();

        // Chuẩn hóa dữ liệu ngày giờ sang định dạng Việt Nam trước khi gửi sang AI
        $formattedContext = $context;
        if (!empty($formattedContext['schedule']) && is_array($formattedContext['schedule'])) {
            $formattedContext['schedule'] = array_map(function ($s) {
                return [
                    'name' => $s['name'] ?? 'Buổi tập',
                    'scheduled_date' => $s['scheduled_date'] ?? null,
                    'time' => $this->formatVNTime($s['starts_at'] ?? null, $s['scheduled_date'] ?? null),
                    'trainer' => $s['trainer'] ?? 'Tự tập',
                ];
            }, $formattedContext['schedule']);
        }
        if (!empty($formattedContext['packages']) && is_array($formattedContext['packages'])) {
            $formattedContext['packages'] = array_map(function ($p) {
                return [
                    'name' => $p['name'] ?? 'Gói tập',
                    'total_sessions' => $p['total_sessions'] ?? null,
                    'remaining_sessions' => $p['remaining_sessions'] ?? null,
                    'expires_at' => $this->formatVNDate($p['expires_at'] ?? null),
                ];
            }, $formattedContext['packages']);
        }

        $systemPrompt = "{$mascotRole}\n" .
            "Bạn là AI TRAINER — trợ lý tập luyện và dinh dưỡng thông minh trong ứng dụng VisionFit.\n" .
            "NGÀY HIỆN TẠI (giờ Việt Nam): {$todayVN} ({$todayIso}).\n" .
            "MỤC TIÊU: Hiểu yêu cầu bằng ngôn ngữ tự nhiên tiếng Việt, hỗ trợ tập luyện, tra cứu món ăn & bài tập, thể hiện cảm xúc linh vật phù hợp và thiết lập nhắc uống nước.\n\n" .
            "1. NGUYÊN TẮC GIAO TIẾP & NLP:\n" .
            "- Ưu tiên tiếng Việt tự nhiên, thân thiện, ngắn gọn, ấm áp (dưới 160 từ).\n" .
            "- Hiểu mọi cách nói đời thường: KHÔNG DẤU (như 'lich tap', 'cho toi xem bua an', 'chi so co the cua toi', 'chuong trinh cua toi hoan thanh bao nhieu roi'), viết tắt, tiếng lóng gym, lỗi chính tả.\n" .
            "- Duy trì ngữ cảnh hội thoại; hiểu các câu tiếp nối như 'bài này', 'món đó', 'tập tiếp'.\n\n" .
            "2. NGUYÊN TẮC TRUNG THỰC VỚI DỮ LIỆU TÀI KHOẢN (CỰC KỲ QUAN TRỌNG — KHÔNG ĐƯỢC VI PHẠM):\n" .
            "- Kiểm tra kỹ object `account_status` trong DỮ LIỆU NGỮ CẢNH:\n" .
            "  + Nếu `authenticated == false`: Nói rõ bạn chưa đăng nhập nên không có dữ liệu cá nhân.\n" .
            "  + Nếu `has_body_metrics == false` (hoặc `nutrition == null`): Khi hỏi về chỉ số cơ thể / thể trạng / BMI / BMR / TDEE / calo của tôi -> TUYỆT ĐỐI KHÔNG tự bịa số liệu; nói rõ bạn CHƯA cập nhật chỉ số cơ thể và đặt action `{\"type\": \"NAVIGATE_BODY_METRICS\", \"params\": {}}`.\n" .
            "  + Nếu `has_registered_program == false`: Khi hỏi lịch tập, tiến độ chương trình, hoàn thành bao nhiêu %, xem bữa ăn/kế hoạch ăn cá nhân, hoặc muốn bắt đầu tập -> PHẢI nói rõ bạn CHƯA đăng ký chương trình tập nào (TUYỆT ĐỐI KHÔNG in bảng 0 buổi hay tự bịa thực đơn) và đặt action `{\"type\": \"NAVIGATE_REGISTER_PROGRAM\", \"params\": {}}` (KHÔNG dùng `NAVIGATE_WORKOUT`).\n" .
            "  + Nếu `has_active_package == false` (hoặc `packages` rỗng): Khi hỏi gói tập -> nói rõ bạn chưa đăng ký gói tập nào và đặt action `{\"type\": \"NAVIGATE_REGISTER_PACKAGE\", \"params\": {}}`.\n" .
            "  + QUY TẮC PHÂN LOẠI BMI: Khi nêu chỉ số BMI, BẮT BUỘC dùng đúng nhãn trong `nutrition.bmi_status` (chuẩn châu Á, vd: 23.0-24.9 là Thừa cân), KHÔNG tự suy đoán phân loại khác.\n" .
            "  + QUY TẮC LỌC NGÀY LỊCH TẬP: Khi người dùng hỏi 'lịch tập HÔM NAY', chỉ liệt kê các buổi có `scheduled_date == '{$todayIso}'`; nếu hôm nay KHÔNG có buổi nào, nói rõ hôm nay là ngày nghỉ / không có lịch và chỉ nêu duy nhất 1 buổi gần nhất tiếp theo (TUYỆT ĐỐI KHÔNG liệt kê 4-5 ngày trong tương lai). Khi hỏi 'lịch tập NGÀY MAI', chỉ liệt kê các buổi ngày mai. Khi hỏi chung 'xem lịch tập' (không nói ngày cụ thể), liệt kê gọn tối đa 3 buổi sắp tới gần nhất bằng bảng `| Buổi tập | Thời gian | PT |`.\n" .
            "  + Nếu người dùng hỏi kiến thức chung (vd: 'cách hít đất đúng', '100g ức gà bao nhiêu calo', 'Whey Protein là gì') thì giải đáp hữu ích dựa trên `retrieved_knowledge`.\n\n" .
            "3. PHÂN LOẠI INTENT & ACTION:\n" .
            "• `NAVIGATE_WORKOUT`: CHỈ dùng khi `has_registered_program == true` và người dùng muốn mở Kế hoạch tập để tập luyện.\n" .
            "• `NAVIGATE_REGISTER_PROGRAM`: CHỈ dùng khi `has_registered_program == false` và người dùng hỏi lịch tập / bữa ăn kế hoạch / tiến độ chương trình / muốn bắt đầu tập.\n" .
            "• `NAVIGATE_BODY_METRICS`: CHỈ dùng khi `has_body_metrics == false` (hoặc người dùng yêu cầu cập nhật/chỉnh sửa lại chỉ số cơ thể). KHÔNG dùng nếu `has_body_metrics == true` và họ chỉ xem chỉ số.\n" .
            "• `NAVIGATE_REGISTER_PACKAGE`: CHỈ dùng khi `has_active_package == false` (hoặc người dùng muốn mua thêm/gia hạn/nâng cấp gói tập). KHÔNG dùng nếu `has_active_package == true` và họ chỉ kiểm tra gói hiện tại.\n" .
            "• `SET_WATER_REMINDER`: Bật/tắt nhắc uống nước (`{\"type\": \"SET_WATER_REMINDER\", \"params\": {\"enabled\": true|false}}`).\n" .
            "- Nếu không cần điều hướng thì đặt `action` là `null`.\n\n" .
            "4. BỘ BIỂU CẢM LINH VẬT (EMOTION):\n" .
            "Chọn 1 emotion: 'welcome', 'encouraging', 'celebrating', 'explaining', 'caring', 'reminding', 'apologetic', 'neutral'.\n\n" .
            "5. ĐỊNH DẠNG PHẢN HỒI:\n" .
            "- Khi có dữ liệu thực để liệt kê, dùng BẢNG Markdown tối đa 3 cột ngắn gọn cho mobile (lịch tập luôn dùng đúng tiêu đề `| Buổi tập | Thời gian | PT |` để không bị cắt chữ).\n" .
            "- Tên bữa ăn luôn viết tiếng Việt có dấu: Sáng, Phụ sáng, Trưa, Phụ chiều, Tối.\n" .
            "- Ngày giờ định dạng Việt Nam: 'HH:mm dd/mm/yyyy' hoặc 'dd/mm/yyyy'.\n" .
            "- Không dùng tiêu đề thô '#', '##', '###'; dùng `- **...**`.\n\n" .
            "6. DỮ LIỆU NGỮ CẢNH CỦA TÀI KHOẢN ĐANG TRUY VẤN:\n" .
            json_encode($formattedContext, JSON_UNESCAPED_UNICODE) . "\n\n" .
            "7. QUY TẮC ĐẦU RA JSON BẮT BUỘC:\n" .
            "Trả về duy nhất 1 object JSON hợp lệ, KHÔNG kèm text ngoài JSON:\n" .
            "{\n" .
            "  \"intent\": \"workout_navigation\" | \"food_detail\" | \"exercise_detail\" | \"water_reminder\" | \"general_support\",\n" .
            "  \"emotion\": \"welcome\" | \"encouraging\" | \"celebrating\" | \"explaining\" | \"caring\" | \"reminding\" | \"apologetic\" | \"neutral\",\n" .
            "  \"action\": { \"type\": \"NAVIGATE_WORKOUT\" | \"NAVIGATE_REGISTER_PROGRAM\" | \"NAVIGATE_BODY_METRICS\" | \"NAVIGATE_REGISTER_PACKAGE\" | \"SET_WATER_REMINDER\", \"params\": {} } | null,\n" .
            "  \"answer\": \"Nội dung phản hồi hoàn chỉnh cho hội viên...\"\n" .
            "}";

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        if (!empty($history) && is_array($history)) {
            foreach (array_slice($history, -4) as $h) {
                if (!empty($h['sender']) && !empty($h['text'])) {
                    $role = $h['sender'] === 'user' ? 'user' : 'assistant';
                    $messages[] = ['role' => $role, 'content' => mb_substr((string) $h['text'], 0, 1000, 'UTF-8')];
                }
            }
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        // Failover qua từng AI Model & Backup LLM Provider (timeout gọn 6s/model để tổng không vượt timeout mobile)
        foreach ($providers as $provider) {
            $currentModel = $provider['model'];
            $currentUrl = $provider['url'];
            $currentKey = $provider['key'];
            $tierPrefix = $provider['tier'];

            try {
                $payload = [
                    'model' => $currentModel,
                    'max_completion_tokens' => 1000,
                    'messages' => $messages,
                    'response_format' => ['type' => 'json_object'],
                ];

                $ch = curl_init($currentUrl);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_CONNECTTIMEOUT => 3,
                    CURLOPT_TIMEOUT => 6,
                    CURLOPT_HTTPHEADER => [
                        'Content-Type: application/json',
                        'Authorization: Bearer ' . $currentKey,
                    ],
                    CURLOPT_POSTFIELDS => json_encode($payload),
                    CURLOPT_SSL_VERIFYPEER => false,
                ]);

                $res = curl_exec($ch);
                $curlErr = curl_error($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode === 200 && $res) {
                    $decoded = json_decode($res, true);
                    $rawContent = $decoded['choices'][0]['message']['content'] ?? null;
                    if ($rawContent && is_string($rawContent)) {
                        $parsed = $this->parseAiJsonResponse($rawContent);
                        if (!empty($parsed['answer'])) {
                            $parsed['action'] = $this->sanitizeAiAction($parsed['action'] ?? null, $message, $context);
                            $parsed['source'] = $tierPrefix . '_' . preg_replace('/[^a-zA-Z0-9_]+/', '_', $currentModel);
                            return $parsed;
                        }
                    }
                } else {
                    Log::warning('[AssistantController] AI provider failed, failing over to next model', [
                        'tier' => $tierPrefix,
                        'model' => $currentModel,
                        'http_code' => $httpCode,
                        'curl_error' => $curlErr,
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('[AssistantController] AI provider exception: ' . $e->getMessage(), [
                    'tier' => $tierPrefix,
                    'model' => $currentModel,
                ]);
            }
        }

        return null;
    }

    /**
     * Parse chuỗi phản hồi từ AI thành cấu trúc JSON chuẩn (intent, emotion, action, answer)
     */
    protected function parseAiJsonResponse(string $rawContent): array
    {
        $content = trim($rawContent);

        // Bỏ markdown ```json ... ``` nếu AI bao quanh
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/ui', $content, $m)) {
            $content = trim($m[1]);
        }

        $json = json_decode($content, true);
        if (is_array($json) && !empty($json['answer'])) {
            return [
                'intent' => is_string($json['intent'] ?? null) ? $json['intent'] : 'general_support',
                'emotion' => is_string($json['emotion'] ?? null) ? $json['emotion'] : 'explaining',
                'action' => $this->normalizeAction($json['action'] ?? null),
                'answer' => trim((string) $json['answer']),
            ];
        }

        // Fallback: Nếu json_decode thất bại do AI chứa dấu nháy kép tiếng Việt chưa escape trong answer
        if (preg_match('/"answer"\s*:\s*"(.*?)"\s*\}?\s*\z/us', $content, $mAns)) {
            $rawAns = $mAns[1];
            // Decode JSON escapes an toàn UTF-8 (tránh lỗi stripcslashes làm hỏng \uXXXX tiếng Việt)
            $cleanAns = str_replace(['\\"', '\\n', '\\r', '\\t', '\\/', '\\\\'], ['"', "\n", "\r", "\t", '/', '\\'], $rawAns);
            $cleanAns = (string) preg_replace_callback('/\\\\u([0-9a-fA-F]{4})/', function ($u) {
                $decoded = json_decode('"\\u' . $u[1] . '"');
                return is_string($decoded) ? $decoded : $u[0];
            }, $cleanAns);
            $intent = 'general_support';
            if (preg_match('/"intent"\s*:\s*"([^"]+)"/u', $content, $mInt)) {
                $intent = $mInt[1];
            }
            $emotion = 'explaining';
            if (preg_match('/"emotion"\s*:\s*"([^"]+)"/u', $content, $mEmo)) {
                $emotion = $mEmo[1];
            }
            $action = null;
            // Hỗ trợ object lồng nhau 1 cấp (vd: SET_WATER_REMINDER có {"params":{"enabled":true}})
            if (preg_match('/"action"\s*:\s*(\{(?:[^{}]|\{[^{}]*\})*\})/u', $content, $mAct)) {
                $action = $this->normalizeAction(json_decode($mAct[1], true));
            }
            return [
                'intent' => $intent,
                'emotion' => $emotion,
                'action' => $action,
                'answer' => trim($cleanAns),
            ];
        }

        // Trường hợp AI trả về text thuần không theo JSON:
        return [
            'intent' => 'general_support',
            'emotion' => 'explaining',
            'action' => null,
            'answer' => $rawContent,
        ];
    }

    protected function normalizeVietnamese(string $str): string
    {
        $str = mb_strtolower(trim($str), 'UTF-8');
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

    protected function normalizeAction($action): ?array
    {
        if (!is_array($action) || empty($action['type']) || !is_string($action['type'])) {
            return null;
        }
        $type = strtoupper(trim($action['type']));
        $allowed = [
            'NAVIGATE_WORKOUT',
            'NAVIGATE_REGISTER_PROGRAM',
            'NAVIGATE_BODY_METRICS',
            'NAVIGATE_REGISTER_PACKAGE',
            'SET_WATER_REMINDER',
        ];
        if (!in_array($type, $allowed, true)) {
            return null;
        }
        $action['type'] = $type;
        return $action;
    }

    /**
     * Hậu kiểm action AI trả về theo đúng trạng thái thực tế của tài khoản
     * để tuyệt đối không hiện sai nút điều hướng hoặc bỏ sót nút đăng ký/cập nhật.
     */
    protected function sanitizeAiAction(?array $action, string $message, array $context): ?array
    {
        $action = $this->normalizeAction($action);
        $status = $context['account_status'] ?? [];
        $isAuth = (bool) ($status['authenticated'] ?? ($context['authenticated'] ?? false));
        $hasProg = (bool) ($status['has_registered_program'] ?? !empty($context['active_program']));
        $hasMetrics = (bool) ($status['has_body_metrics'] ?? !empty($context['nutrition']));
        $hasPkg = (bool) ($status['has_active_package'] ?? !empty($context['packages']));
        $actType = $action['type'] ?? null;
        $qLower = mb_strtolower($message, 'UTF-8');

        if (!$isAuth) {
            return ($actType !== null && str_starts_with($actType, 'NAVIGATE_')) ? null : $action;
        }

        if (!$hasProg && $actType === 'NAVIGATE_WORKOUT') {
            return ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen'];
        }
        if ($hasMetrics && $actType === 'NAVIGATE_BODY_METRICS' && !preg_match('/cập nhật|cap nhat|sửa|sua|đổi|doi|nhập lại|nhap lai/ui', $qLower)) {
            return null;
        }
        if ($hasPkg && $actType === 'NAVIGATE_REGISTER_PACKAGE' && !preg_match('/mua thêm|mua them|đăng ký thêm|dang ky them|nâng cấp|nang cap|gia hạn|gia han|đăng ký gói mới|dang ky goi moi/ui', $qLower)) {
            return null;
        }

        if ($actType === null) {
            if (!$hasProg && preg_match('/lịch tập|lich tap|tiến độ|tien do|tiến trình|tien trinh|hoàn thành|hoan thanh|bữa ăn|bua an|kế hoạch ăn|ke hoach an|khẩu phần|khau phan|lịch ăn|lich an/ui', $qLower)) {
                return ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen'];
            }
            if (!$hasMetrics && preg_match('/chỉ số|chi so|bmi|bmr|tdee|thể trạng|the trang|cơ thể của tôi|co the cua toi|thông số cơ thể|thong so co the|số đo cơ thể|so do co the/ui', $qLower)) {
                return ['type' => 'NAVIGATE_BODY_METRICS', 'screen' => 'AiConsultationScreen'];
            }
            if (!$hasPkg && preg_match('/gói tập|goi tap|gói của tôi|goi cua toi|thẻ tập|the tap|thẻ hội viên|the hoi vien|buổi còn|buoi con|còn bao nhiêu buổi|con bao nhieu buoi|còn mấy buổi|con may buoi/ui', $qLower)) {
                return ['type' => 'NAVIGATE_REGISTER_PACKAGE', 'screen' => 'WorkoutSelectionScreen'];
            }
        }

        return $action;
    }

    /**
     * Tầng 3 (Backup RAG Engine): Xử lý chính xác theo ngữ cảnh tài khoản và CSDL VisionFit
     */
    protected function generateDynamicDatabaseReply(string $message, array $context, string $species, array $history = [], $user = null): array
    {
        $q = mb_strtolower(trim($message), 'UTF-8');
        $isCat = $species === 'cat';
        $prefix = $isCat ? 'Meo meo! 🐱 ' : 'Gấu VIF đây! 🐻 ';

        $status = $context['account_status'] ?? [];
        $isAuthenticated = (bool) ($status['authenticated'] ?? ($context['authenticated'] ?? false));
        $hasBodyMetrics = (bool) ($status['has_body_metrics'] ?? !empty($context['nutrition']));
        $hasGoal = (bool) ($status['has_goal'] ?? !empty($context['profile']['goal']));
        $hasRegisteredProgram = (bool) ($status['has_registered_program'] ?? !empty($context['active_program']));
        $hasMealPlan = (bool) ($status['has_meal_plan'] ?? !empty($context['meal_plan']));

        $workoutOrRegisterAction = $hasRegisteredProgram
            ? ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage']
            : ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen'];

        // 0. Xử lý câu trả lời tiếp nối ngữ cảnh (Context follow-up)
        $lastAssistantMsg = '';
        if (!empty($history) && is_array($history)) {
            for ($i = count($history) - 1; $i >= 0; $i--) {
                if (($history[$i]['sender'] ?? '') === 'assistant' && !empty($history[$i]['text'])) {
                    $lastAssistantMsg = mb_strtolower($history[$i]['text'], 'UTF-8');
                    break;
                }
            }
        }

        $isAffirmative = preg_match('/^(có|co|ok|oke|được|duoc|uh|ừ|u|đồng ý|dong y|yes|yep|muốn|muon|chốt|nhất trí|kết nối đi|giúp mình|giup minh|tập luôn|tap luon)(?:$|[\s!.,?])/ui', $q);
        $isNegative = preg_match('/^(không|khong|k|ko|thôi|thoi|chưa|chua|no|nope|đừng|dung|không cần|khong can)(?:$|[\s!.,?])/ui', $q);

        if ($isAffirmative && $lastAssistantMsg) {
            if (preg_match('/pt|huấn luyện viên|huan luyen vien|kết nối/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'encouraging',
                    'action' => ['type' => 'NAVIGATE_REGISTER_PACKAGE', 'screen' => 'WorkoutSelectionScreen'],
                    'answer' => "{$prefix}Tuyệt vời! Mình đã ghi nhận bạn muốn kết nối Huấn luyện viên (PT). Bấm nút bên dưới để chọn gói tập kèm PT phù hợp ngay nhé! 💪🔥",
                ];
            }
            if (preg_match('/bắt đầu|bat dau|chiến|mở lịch|kế hoạch tập|tập luyện|tập ngay|đăng ký chương trình/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'encouraging',
                    'action' => $workoutOrRegisterAction,
                    'answer' => $hasRegisteredProgram
                        ? "{$prefix}Lên dây cót tinh thần chiến hết mình nào! Bấm nút bên dưới để mở ngay trang Kế hoạch tập luyện và bắt đầu buổi tập nhé! 🔥💪"
                        : "{$prefix}Tuyệt vời! Bấm nút bên dưới để vào màn hình **Đăng ký chương trình tập** và chọn lộ trình phù hợp cho bạn nhé! 📋💪",
                ];
            }
            if (preg_match('/uống nước|uong nuoc|nhắc nước/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'water_reminder',
                    'emotion' => 'reminding',
                    'action' => [
                        'type' => 'SET_WATER_REMINDER',
                        'params' => ['enabled' => true, 'interval_hours' => 2],
                    ],
                    'answer' => "{$prefix}Đã thiết lập nhắc bạn uống nước đều đặn mỗi 2 tiếng một lần! 💧 Uống đủ nước để cơ bắp phục hồi nhanh nhất nhé!",
                ];
            }
        }

        if ($isNegative && $lastAssistantMsg) {
            if (preg_match('/pt|huấn luyện viên|huan luyen vien|kết nối/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'neutral',
                    'action' => null,
                    'answer' => "{$prefix}Dạ không sao bạn nhé! Bạn hoàn toàn có thể tự tập luyện theo giáo án cá nhân trên ứng dụng. Khi nào cần PT hướng dẫn cứ nhắn cho mình nhé! 💪",
                ];
            }
            if (preg_match('/uống nước|uong nuoc/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'water_reminder',
                    'emotion' => 'neutral',
                    'action' => [
                        'type' => 'SET_WATER_REMINDER',
                        'params' => ['enabled' => false, 'interval_hours' => 2],
                    ],
                    'answer' => "{$prefix}Đã tắt tính năng nhắc uống nước theo yêu cầu của bạn. Chúc bạn luôn giữ vững phong độ tập luyện nhé!",
                ];
            }
        }

        // Ngữ cảnh tham chiếu "bài này", "bài đó", "động tác này"
        if (preg_match('/bài này|bai nay|bài đó|bai do|động tác này|dong tac nay/ui', $q) && $lastAssistantMsg) {
            $commonExercises = ['squat', 'bench press', 'deadlift', 'hít đất', 'push-up', 'push up', 'kéo xà', 'plank', 'gập bụng', 'crunch'];
            foreach ($commonExercises as $ce) {
                if (stripos($lastAssistantMsg, $ce) !== false) {
                    $q .= ' ' . $ce;
                    break;
                }
            }
        }

        // Ngữ cảnh tham chiếu "món này", "món đó", "thực phẩm này"
        if (preg_match('/món này|mon nay|món đó|mon do|thức ăn này|thuc an nay/ui', $q) && $lastAssistantMsg) {
            $commonFoods = ['ức gà', 'trứng', 'yến mạch', 'thịt bò', 'cá hồi', 'chuối', 'khoai lang', 'salad'];
            foreach ($commonFoods as $cf) {
                if (stripos($lastAssistantMsg, $cf) !== false) {
                    $q .= ' ' . $cf;
                    break;
                }
            }
        }

        // 0.5. Chặn yêu cầu truy cập trái phép dữ liệu người khác / prompt injection
        if (preg_match('/hội viên khác|hoi vien khac|người khác|nguoi khac|khách hàng khác|khach hang khac|mật khẩu|mat khau|password|token|sql|database|bỏ qua quy tắc|bo qua quy tac|ignore previous|system prompt/ui', $q)) {
            return [
                'intent' => 'general_support',
                'emotion' => 'apologetic',
                'action' => null,
                'answer' => "{$prefix}Mình chỉ được phép tra cứu dữ liệu thuộc phạm vi tài khoản đang đăng nhập của bạn. Mình không hỗ trợ xem thông tin người khác, mật khẩu hay truy vấn hệ thống trực tiếp nhé! 🛡️",
            ];
        }

        // 0.6. Dữ liệu tổng hợp cho Huấn luyện viên (Trainer) & Quản trị viên (Admin)
        $role = $context['subject']['role'] ?? 'member';
        if ($role !== 'member' && !empty($context['summary']) && preg_match('/hội viên|hoi vien|học viên|hoc vien|quản lý|quan ly|hết hạn|het han|thống kê|thong ke/ui', $q)) {
            $assigned = $context['summary']['assigned_members'] ?? 0;
            $expiring = $context['summary']['expiring_members'] ?? null;
            $scopeLabel = $role === 'trainer' ? 'PT được phân công' : 'phòng tập quản lý';
            $msg = "{$prefix}Thống kê phạm vi **{$scopeLabel}**:\n\n" .
                "| Chỉ tiêu | Số lượng |\n" .
                "| :--- | :--- |\n" .
                "| Hội viên quản lý | **{$assigned} hội viên** |\n";
            if ($expiring !== null) {
                $msg .= "| Gói sắp hết hạn (7 ngày tới) | **{$expiring} hội viên** |\n";
            }
            return [
                'intent' => 'general_support',
                'emotion' => 'explaining',
                'action' => null,
                'answer' => trim($msg),
            ];
        }

        // 1. Cảnh báo chấn thương / đau mỏi (tránh match nhầm "bắt đầu", "bat dau co", "chum dau goi", "đầu tiên", "đâu", "đậu", "dầu")
        if (preg_match('/(?:^|[\s,.;:!?])(đau|bị đau|bi dau|(?<!bat\s)(?<!bắt\s)dau lung|(?<!chum\s)(?<!chụm\s)dau goi|(?<!bat\s)(?<!bắt\s)dau vai|(?<!bat\s)(?<!bắt\s)dau khop|(?<!bat\s)(?<!bắt\s)dau chan|(?<!bat\s)(?<!bắt\s)dau tay|(?<!bat\s)(?<!bắt\s)dau bung|(?<!bat\s)(?<!bắt\s)dau nguc|dau qua|chấn thương|chan thuong|chuột rút|chuot rut|chóng mặt|chong mat|buốt|buot|ngất|ngat|đau khớp|sưng khớp|sung khop|trật khớp|trat khop)(?=$|[\s,.;:!?])/ui', $q)) {
            return [
                'intent' => 'general_support',
                'emotion' => 'caring',
                'action' => null,
                'answer' => "{$prefix}Hãy dừng ngay động tác đang gây đau hoặc khó chịu nhé! Chườm lạnh 15-20 phút nếu bị sưng và đừng cố gắng tập tiếp. Hãy báo ngay cho Huấn luyện viên (PT) hoặc bác sĩ thể thao để kiểm tra an toàn! 🛡️",
            ];
        }

        // 2. Nhắc nhở uống nước vs Tư vấn lượng nước uống mỗi ngày
        if (preg_match('/uống nước|uong nuoc|nhắc nước|nhac nuoc|uống bao nhiêu nước|uong bao nhieu nuoc|cốc nước|coc nuoc|nước lọc|nuoc loc|nhắc nhở uống nước|water reminder|drink water/ui', $q)) {
            $isWaterAdviceQuery = (bool) preg_match('/bao nhiêu nước|bao nhieu nuoc|mấy lít|may lit|có tốt không|co tot khong|lợi ích|loi ich/ui', $q)
                && !preg_match('/nhắc|nhac|bật|bat|tắt|tat|hủy|huy|dừng|dung|đừng|bỏ|bo|reminder|alarm/ui', $q);
            if ($isWaterAdviceQuery) {
                $weightKg = $context['nutrition']['can_nang'] ?? null;
                if (is_numeric($weightKg) && (float) $weightKg > 0) {
                    $liters = round(((float) $weightKg * 35) / 1000, 2);
                    $ans = "{$prefix}Với cân nặng hiện tại **{$weightKg} kg**, lượng nước khuyến nghị mỗi ngày cho bạn khoảng **{$liters} lít/ngày** (tính theo mức ~35ml/kg, cộng thêm 300–500ml nếu tập luyện đổ nhiều mồ hôi). Bạn có muốn mình bật nhắc uống nước mỗi 2 tiếng không? 💧";
                } else {
                    $ans = "{$prefix}Người trưởng thành nên uống khoảng **2 – 2.5 lít nước mỗi ngày** (và bổ sung thêm 300–500ml khi tập luyện). Bạn có muốn mình bật nhắc uống nước mỗi 2 tiếng không? 💧";
                }
                return [
                    'intent' => 'general_support',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => $ans,
                ];
            }

            $isOff = (bool) preg_match('/(?:^|[\s,.;:!?])(tắt|tat|hủy|huy|dừng|dung|đừng|bỏ|bo|khỏi|khoi|ngưng|ngừng|ngung|không cần|khong can|không nhắc|khong nhac|off|stop|disable)(?=$|[\s,.;:!?])/ui', $q);
            if ($isOff) {
                return [
                    'intent' => 'water_reminder',
                    'emotion' => 'neutral',
                    'action' => [
                        'type' => 'SET_WATER_REMINDER',
                        'params' => ['enabled' => false, 'interval_hours' => 2],
                    ],
                    'answer' => "{$prefix}Đã tắt tính năng tự động nhắc uống nước cho bạn. Khi nào muốn bật lại, bạn chỉ cần nhắn cho mình nhé!",
                ];
            }

            return [
                'intent' => 'water_reminder',
                'emotion' => 'reminding',
                'action' => [
                    'type' => 'SET_WATER_REMINDER',
                    'params' => ['enabled' => true, 'interval_hours' => 2],
                ],
                'answer' => "{$prefix}Đã thiết lập nhắc bạn uống nước đều đặn mỗi 2 tiếng một lần! 💧\nUống đủ 2-2.5 lít nước mỗi ngày giúp bôi trơn khớp và hỗ trợ phục hồi cơ bắp tốt hơn nhé!",
            ];
        }

        // 3. Gói tập (BỎ `the cua toi` vì đụng nhầm "co [the cua toi]", BỎ bare `bao nhieu buoi` vì đụng "đã tập bao nhiêu buổi")
        if (preg_match('/gói tập|goi tap|gói của tôi|goi cua toi|thẻ tập|the tap|thẻ hội viên|the hoi vien|hạn thẻ|han the|hạn gói|han goi|hạn sử dụng|han su dung|buổi còn|buoi con|còn bao nhiêu buổi|con bao nhieu buoi|còn mấy buổi|con may buoi|đăng ký gói|dang ky goi|mua gói|mua goi|kiểm tra gói|kiem tra goi/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập tài khoản hội viên nên mình chưa thể kiểm tra thông tin gói tập của bạn. Hãy đăng nhập trước nhé!",
                ];
            }
            $packages = $context['packages'] ?? [];
            if (is_object($packages) && method_exists($packages, 'toArray')) {
                $packages = $packages->toArray();
            }
            if (!empty($packages)) {
                $activePkgs = array_values(array_filter($packages, fn ($p) => empty($p['is_expired'])));
                if (empty($activePkgs)) {
                    $latest = $packages[0];
                    $expStr = !empty($latest['expires_at']) ? $this->formatVNDate($latest['expires_at']) : 'trước đó';
                    return [
                        'intent' => 'general_support',
                        'emotion' => 'reminding',
                        'action' => [
                            'type' => 'NAVIGATE_REGISTER_PACKAGE',
                            'screen' => 'WorkoutSelectionScreen',
                        ],
                        'answer' => "{$prefix}Gói tập **{$latest['name']}** của bạn **đã hết hạn vào ngày {$expStr}**. Hãy bấm nút bên dưới để gia hạn hoặc đăng ký gói tập mới nhé! 🎟",
                    ];
                }

                $res = "{$prefix}Thông tin gói tập hiện tại của bạn:\n\n" .
                    "| Gói tập | Số buổi | Hạn sử dụng |\n" .
                    "| :--- | :--- | :--- |\n";
                foreach ($activePkgs as $p) {
                    $name = $p['name'] ?? 'Gói tập';
                    if (isset($p['remaining_sessions']) && $p['remaining_sessions'] !== null) {
                        $sessions = "{$p['remaining_sessions']} buổi còn lại";
                    } elseif (!empty($p['total_sessions'])) {
                        $sessions = "{$p['total_sessions']} buổi đăng ký";
                    } else {
                        $sessions = 'Đang cập nhật';
                    }
                    $exp = !empty($p['expires_at']) ? $this->formatVNDate($p['expires_at']) : 'Không giới hạn';
                    $res .= "| {$name} | {$sessions} | {$exp} |\n";
                }
                return [
                    'intent' => 'general_support',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => trim($res),
                ];
            }

            return [
                'intent' => 'general_support',
                'emotion' => 'explaining',
                'action' => [
                    'type' => 'NAVIGATE_REGISTER_PACKAGE',
                    'screen' => 'WorkoutSelectionScreen',
                ],
                'answer' => "{$prefix}Hiện tại tài khoản của bạn **chưa đăng ký gói tập nào** trên hệ thống VisionFit. Bạn hãy bấm nút bên dưới để xem và đăng ký gói tập phù hợp nhé! 🎟",
            ];
        }

        // 4. Lịch tập (lọc chính xác theo HÔM NAY / NGÀY MAI / TUẦN NÀY / BUỔI TIẾP THEO; chưa đăng ký -> dẫn sang màn hình ĐĂNG KÝ)
        if (preg_match('/lịch tập|lich tap|xem lịch|xem lich|lịch hôm nay|lich hom nay|lịch ngày mai|lich ngay mai|lịch tuần|lich tuan|lịch trình|lich trinh|có lịch|co lich|hôm nay có tập|hom nay co tap|mai có tập|mai co tap|bữa nay có tập|bua nay co tap|buổi tập tiếp theo|buoi tap tiep theo|buổi tập hôm nay|buoi tap hom nay|buổi tập sắp tới|buoi tap sap toi|khi nào tập|khi nao tap|khi nào tôi tập|khi nao toi tap|mấy giờ tập|may gio tap|tập mấy giờ|tap may gio|lịch của tôi|lich cua toi/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập tài khoản nên mình chưa thể tra cứu lịch tập cá nhân của bạn. Hãy đăng nhập để xem lịch tập nhé!",
                ];
            }

            if (!$hasRegisteredProgram && empty($context['schedule'])) {
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'explaining',
                    'action' => [
                        'type' => 'NAVIGATE_REGISTER_PROGRAM',
                        'screen' => 'WorkoutPlanScreen',
                    ],
                    'answer' => "{$prefix}Hiện tại bạn **chưa đăng ký chương trình tập nào** trên hệ thống nên chưa có lịch tập.\nHãy bấm nút bên dưới để tới màn hình **Đăng ký chương trình tập** và chọn lộ trình phù hợp cho bạn nhé! 📋💪",
                ];
            }

            $schedule = $context['schedule'] ?? [];
            if (is_object($schedule) && method_exists($schedule, 'toArray')) {
                $schedule = $schedule->toArray();
            }

            if (!empty($schedule)) {
                $now = CarbonImmutable::now(config('app.timezone'));
                $todayIso = $now->toDateString();
                $todayVN = $now->format('d/m/Y');
                $tomorrowIso = $now->addDay()->toDateString();
                $tomorrowVN = $now->addDay()->format('d/m/Y');
                $weekEndIso = $now->endOfWeek()->toDateString();

                $isTodayQuery = (bool) preg_match('/hôm nay|hom nay|bữa nay|bua nay|today/ui', $q);
                $isTomorrowQuery = (bool) preg_match('/(?:^|[\s,.;:!?])(ngày mai|ngay mai|mai|tomorrow)(?=$|[\s,.;:!?])/ui', $q);
                $isNextOnlyQuery = (bool) preg_match('/tiếp theo|tiep theo|gần nhất|gan nhat|khi nào tập|khi nao tap|khi nào tôi tập|khi nao toi tap/ui', $q);
                $isThisWeekQuery = (bool) preg_match('/tuần này|tuan nay/ui', $q);

                $formatScheduleTable = function (array $items, string $heading): string {
                    $tbl = "{$heading}\n\n| Buổi tập | Thời gian | PT |\n| :--- | :--- | :--- |\n";
                    foreach ($items as $s) {
                        $time = $this->formatVNTime($s['starts_at'] ?? null, $s['scheduled_date'] ?? null);
                        $pt = !empty($s['trainer']) ? $s['trainer'] : 'Tự tập';
                        $name = $s['name'] ?? 'Buổi tập';
                        $tbl .= "| {$name} | {$time} | {$pt} |\n";
                    }
                    return trim($tbl);
                };

                if ($isTodayQuery) {
                    $todayItems = array_values(array_filter($schedule, fn ($s) => ($s['scheduled_date'] ?? '') === $todayIso));
                    if (!empty($todayItems)) {
                        $ans = $formatScheduleTable($todayItems, "{$prefix}Lịch tập **hôm nay ({$todayVN})** của bạn:") . "\n\nHãy chuẩn bị nước và đồ tập đầy đủ nhé! 💪";
                    } else {
                        $next = $schedule[0];
                        $nextTime = $this->formatVNTime($next['starts_at'] ?? null, $next['scheduled_date'] ?? null);
                        $nextName = $next['name'] ?? 'Buổi tập';
                        $nextPt = !empty($next['trainer']) ? $next['trainer'] : 'Tự tập';
                        $ans = "{$prefix}Hôm nay (**{$todayVN}**) bạn **không có lịch tập** (ngày nghỉ phục hồi).\n\n- **Buổi tập gần nhất tiếp theo:** {$nextName} lúc **{$nextTime}** ({$nextPt}).";
                    }
                    return [
                        'intent' => 'workout_navigation',
                        'emotion' => 'reminding',
                        'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                        'answer' => $ans,
                    ];
                }

                if ($isTomorrowQuery) {
                    $tomorrowItems = array_values(array_filter($schedule, fn ($s) => ($s['scheduled_date'] ?? '') === $tomorrowIso));
                    if (!empty($tomorrowItems)) {
                        $ans = $formatScheduleTable($tomorrowItems, "{$prefix}Lịch tập **ngày mai ({$tomorrowVN})** của bạn:");
                    } else {
                        $next = $schedule[0];
                        $nextTime = $this->formatVNTime($next['starts_at'] ?? null, $next['scheduled_date'] ?? null);
                        $nextName = $next['name'] ?? 'Buổi tập';
                        $ans = "{$prefix}Ngày mai (**{$tomorrowVN}**) bạn **không có lịch tập**.\n- **Buổi tập gần nhất tiếp theo:** {$nextName} lúc **{$nextTime}**.";
                    }
                    return [
                        'intent' => 'workout_navigation',
                        'emotion' => 'reminding',
                        'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                        'answer' => $ans,
                    ];
                }

                if ($isNextOnlyQuery) {
                    $upcomingOnly = array_values(array_filter($schedule, fn ($s) => empty($s['is_past_today']) && ($s['status'] ?? '0') !== '2'));
                    $nextList = !empty($upcomingOnly) ? array_slice($upcomingOnly, 0, 1) : array_slice($schedule, 0, 1);
                    $ans = $formatScheduleTable($nextList, "{$prefix}Buổi tập sắp tới gần nhất của bạn:");
                    return [
                        'intent' => 'workout_navigation',
                        'emotion' => 'reminding',
                        'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                        'answer' => $ans,
                    ];
                }

                if ($isThisWeekQuery) {
                    $weekItems = array_values(array_filter($schedule, fn ($s) => ($s['scheduled_date'] ?? '') !== '' && ($s['scheduled_date'] ?? '') <= $weekEndIso));
                    if (!empty($weekItems)) {
                        $ans = $formatScheduleTable(array_slice($weekItems, 0, 5), "{$prefix}Lịch tập còn lại **trong tuần này** của bạn:");
                    } else {
                        $next = $schedule[0];
                        $nextTime = $this->formatVNTime($next['starts_at'] ?? null, $next['scheduled_date'] ?? null);
                        $ans = "{$prefix}Tuần này bạn không còn buổi tập nào nữa. Buổi tập kế tiếp là **{$next['name']}** lúc **{$nextTime}**.";
                    }
                    return [
                        'intent' => 'workout_navigation',
                        'emotion' => 'reminding',
                        'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                        'answer' => $ans,
                    ];
                }

                $ans = $formatScheduleTable(array_slice($schedule, 0, 3), "{$prefix}Lịch tập sắp tới của bạn (3 buổi gần nhất):") . "\n\nHãy chuẩn bị nước và đồ tập đầy đủ nhé! 💪";
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'reminding',
                    'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                    'answer' => $ans,
                ];
            }

            $progName = $context['active_program']['name'] ?? 'chương trình hiện tại';
            return [
                'intent' => 'workout_navigation',
                'emotion' => 'explaining',
                'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                'answer' => "{$prefix}Bạn đang theo chương trình **{$progName}**, nhưng hiện chưa có buổi tập sắp tới trong lịch. Bạn có thể mở **Kế hoạch tập** để xem hoặc sắp xếp lại lịch nhé! 📅",
            ];
        }

        // 4.5. Tiến độ & mức độ hoàn thành chương trình tập (CHẶN hiển thị bảng 0 buổi khi chưa đăng ký chương trình!)
        if (preg_match('/chương trình của tôi|chuong trinh cua toi|tiến độ|tien do|tiến trình|tien trinh|kết quả tập|ket qua tap|hoàn thành|hoan thanh|tập được mấy buổi|tap duoc may buoi|tuần này tập|tuan nay tap|đã tập bao nhiêu|da tap bao nhieu|đạt bao nhiêu phần trăm|dat bao nhieu phan tram/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập nên mình chưa thể kiểm tra tiến độ chương trình tập của bạn.",
                ];
            }
            if (!$hasRegisteredProgram) {
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'explaining',
                    'action' => [
                        'type' => 'NAVIGATE_REGISTER_PROGRAM',
                        'screen' => 'WorkoutPlanScreen',
                    ],
                    'answer' => "{$prefix}Hiện tại bạn **chưa đăng ký chương trình tập nào** trên hệ thống nên chưa có tiến độ hoàn thành.\nBạn hãy bấm nút bên dưới để **Đăng ký chương trình tập** và bắt đầu theo dõi kết quả nhé! 📋💪",
                ];
            }

            $prog = $context['active_program'];
            $progName = $prog['name'] ?? 'Chương trình tập hiện tại';
            $progPct = isset($prog['completion_percent']) && $prog['completion_percent'] !== null
                ? "{$prog['completion_percent']}%"
                : '0%';
            $sessionsWeek = $context['progress']['sessions_this_week'] ?? 0;
            $weekPct = $context['progress']['completion_percent'] ?? null;
            $weekPctText = $weekPct === null ? 'Chưa có buổi kết thúc tuần này' : "{$weekPct}%";

            return [
                'intent' => 'general_support',
                'emotion' => $sessionsWeek > 0 ? 'encouraging' : 'explaining',
                'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                'answer' => "{$prefix}Tiến độ chương trình tập **{$progName}** của bạn:\n\n" .
                    "| Chỉ số | Kết quả |\n" .
                    "| :--- | :--- |\n" .
                    "| Hoàn thành chương trình | **{$progPct}** |\n" .
                    "| Số buổi tuần này | **{$sessionsWeek} buổi** |\n" .
                    "| Tỷ lệ hoàn thành TB tuần | **{$weekPctText}** |",
            ];
        }

        // 4.6. Hồ sơ mục tiêu / cấp độ / dị ứng cá nhân
        if (preg_match('/hồ sơ của tôi|ho so cua toi|mục tiêu của tôi|muc tieu cua toi|dị ứng của tôi|di ung cua toi|cấp độ của tôi|cap do cua toi/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập nên mình chưa thể xem hồ sơ cá nhân của bạn.",
                ];
            }
            $goal = $context['profile']['goal'] ?? null;
            $level = $context['profile']['level'] ?? null;
            $allergy = $context['profile']['allergy'] ?? 'Không';
            if (!$hasBodyMetrics && !$hasGoal) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'explaining',
                    'action' => ['type' => 'NAVIGATE_BODY_METRICS', 'screen' => 'AiConsultationScreen'],
                    'answer' => "{$prefix}Hiện tại bạn **chưa cập nhật hồ sơ thể trạng và mục tiêu tập luyện**. Hãy bấm nút bên dưới để cập nhật chiều cao, cân nặng, mục tiêu và dị ứng nhé! 📊",
                ];
            }
            return [
                'intent' => 'general_support',
                'emotion' => 'explaining',
                'action' => null,
                'answer' => "{$prefix}Thông tin hồ sơ tập luyện hiện tại của bạn:\n\n" .
                    "| Thông tin | Giá trị |\n" .
                    "| :--- | :--- |\n" .
                    "| Mục tiêu | " . ($goal ?: 'Chưa cập nhật') . " |\n" .
                    "| Cấp độ | " . ($level ?: 'Chưa cập nhật') . " |\n" .
                    "| Dị ứng thực phẩm | {$allergy} |",
            ];
        }

        // 5. Chỉ số cơ thể, thể trạng & dinh dưỡng (BMI, BMR, TDEE, Calo, Macros)
        if (preg_match('/chỉ số|chi so|cơ thể của tôi|co the cua toi|thông số cơ thể|thong so co the|số đo cơ thể|so do co the|thể trạng|the trang|bmi|bmr|tdee|dinh dưỡng calo|dinh duong calo|cân nặng của tôi|can nang cua toi|chiều cao của tôi|chieu cao cua toi|nặng bao nhiêu|nang bao nhieu|cao bao nhiêu|cao bao nhieu|calo của tôi|calo cua toi|nhu cầu calo|nhu cau calo|nhu cầu protein|nhu cau protein|macro của tôi|macro cua toi|cân nặng chiều cao|can nang chieu cao/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập nên mình chưa thể xem chỉ số thể trạng của bạn. Hãy đăng nhập để kiểm tra nhé!",
                ];
            }
            if ($hasBodyMetrics && !empty($context['nutrition'])) {
                $n = $context['nutrition'];
                $bmiLabel = $this->classifyBmi($n['bmi'] ?? null);
                return [
                    'intent' => 'general_support',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => "{$prefix}Bảng chỉ số thể trạng & dinh dưỡng cá nhân của bạn:\n\n" .
                        "| Chỉ số | Giá trị | Đánh giá / Đơn vị |\n" .
                        "| :--- | :--- | :--- |\n" .
                        "| Cân nặng | " . ($n['can_nang'] ?? '—') . " | kg |\n" .
                        "| Chiều cao | " . ($n['chieu_cao_cm'] ?? '—') . " | cm |\n" .
                        "| Chỉ số BMI | " . ($n['bmi'] ?? '—') . " | {$bmiLabel} |\n" .
                        "| BMR (Năng lượng nghỉ) | " . ($n['bmr'] ?? '—') . " | kcal/ngày |\n" .
                        "| Tiêu hao TDEE | " . ($n['tdee'] ?? '—') . " | kcal/ngày |\n" .
                        "| Calo mục tiêu | " . ($n['kcal_muc_tieu'] ?? '—') . " | kcal/ngày |\n" .
                        "| Đạm (Protein) | " . ($n['protein'] ?? '—') . " | g/ngày |\n" .
                        "| Tinh bột (Carb) | " . ($n['carb'] ?? '—') . " | g/ngày |\n" .
                        "| Chất béo (Fat) | " . ($n['fat'] ?? '—') . " | g/ngày |",
                ];
            }

            return [
                'intent' => 'general_support',
                'emotion' => 'explaining',
                'action' => [
                    'type' => 'NAVIGATE_BODY_METRICS',
                    'screen' => 'AiConsultationScreen',
                ],
                'answer' => "{$prefix}Hiện tại bạn **chưa cập nhật chỉ số cơ thể** (chiều cao, cân nặng, ngày sinh, mục tiêu) trên hệ thống nên mình chưa có dữ liệu để tính BMI, BMR, TDEE và nhu cầu calo cá nhân cho bạn.\n\nBạn hãy bấm nút bên dưới để nhập chỉ số cơ thể trước, sau đó hỏi lại mình nhé! 📊",
            ];
        }

        // 6. Bữa ăn theo kế hoạch đã đăng ký & Gợi ý thực đơn
        if (preg_match('/bữa ăn|bua an|kế hoạch ăn|ke hoach an|khẩu phần|khau phan|lịch ăn|lich an|thực đơn|thuc don|ăn gì|an gi|chế độ ăn|che do an|ăn chay|an chay|thuần chay|thuan chay|vegan|keto|low-carb|eat clean|giảm cân|giam can|giảm mỡ|giam mo|tăng cơ|tang co|bữa sáng|bua sang|bữa trưa|bua trua|bữa tối|bua toi/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'food_detail',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập tài khoản nên mình chưa có thông tin bữa ăn / dinh dưỡng của bạn. Hãy đăng nhập trước nhé!",
                ];
            }

            $isPersonalMealPlanQuery = (bool) preg_match('/xem bữa ăn|xem bua an|bữa ăn của tôi|bua an cua toi|bữa ăn hôm nay|bua an hom nay|bữa ăn ngày mai|bua an ngay mai|bữa sáng hôm nay|bua sang hom nay|bữa trưa hôm nay|bua trua hom nay|bữa tối hôm nay|bua toi hom nay|kế hoạch ăn|ke hoach an|khẩu phần|khau phan|lịch ăn|lich an|bữa ăn|bua an/ui', $q);

            // 6a. Hỏi xem bữa ăn / kế hoạch ăn đã đăng ký -> bắt buộc phải đã đăng ký chương trình tập
            if ($isPersonalMealPlanQuery) {
                if (!$hasRegisteredProgram && !$hasMealPlan) {
                    return [
                        'intent' => 'food_detail',
                        'emotion' => 'explaining',
                        'action' => [
                            'type' => 'NAVIGATE_REGISTER_PROGRAM',
                            'screen' => 'WorkoutPlanScreen',
                        ],
                        'answer' => "{$prefix}Hiện tại bạn **chưa đăng ký chương trình tập nào** trên hệ thống nên chưa có kế hoạch bữa ăn cá nhân.\nHãy bấm nút bên dưới để **Đăng ký chương trình tập**, hệ thống sẽ tự động tạo lịch bữa ăn phù hợp cho bạn nhé! 🥗📋",
                    ];
                }

                $mealPlan = $context['meal_plan'] ?? [];
                if (is_object($mealPlan) && method_exists($mealPlan, 'toArray')) {
                    $mealPlan = $mealPlan->toArray();
                }

                if (!empty($mealPlan)) {
                    $now = CarbonImmutable::now(config('app.timezone'));
                    $todayIso = $now->toDateString();
                    $tomorrowIso = $now->addDay()->toDateString();
                    $isTomorrowMeal = (bool) preg_match('/ngày mai|ngay mai|tomorrow/ui', $q);

                    if ($isTomorrowMeal) {
                        $dateMeals = array_values(array_filter($mealPlan, fn ($m) => ($m['date'] ?? '') === $tomorrowIso));
                        if (empty($dateMeals)) {
                            $fallbackNotice = "{$prefix}Ngày mai (**{$now->addDay()->format('d/m/Y')}**) hiện **chưa có thực đơn riêng** trên lịch.\n\nBạn có thể tham khảo kế hoạch bữa ăn gần nhất hiện có:";
                            $heading = $fallbackNotice;
                        } else {
                            $heading = "{$prefix}Kế hoạch bữa ăn **ngày mai ({$now->addDay()->format('d/m/Y')})** của bạn:";
                        }
                    } else {
                        $dateMeals = array_values(array_filter($mealPlan, fn ($m) => ($m['date'] ?? '') === $todayIso));
                        $heading = !empty($dateMeals)
                            ? "{$prefix}Kế hoạch bữa ăn **hôm nay ({$now->format('d/m/Y')})** của bạn:"
                            : "{$prefix}Kế hoạch bữa ăn sắp tới theo chương trình của bạn:";
                    }

                    $displayMeals = !empty($dateMeals) ? $dateMeals : array_slice($mealPlan, 0, 4);

                    // Lọc theo buổi ăn cụ thể (Sáng / Trưa / Tối / Phụ) nếu user hỏi rõ
                    if (preg_match('/bữa sáng|bua sang|buổi sáng|buoi sang/ui', $q)) {
                        $sub = array_values(array_filter($displayMeals, fn ($m) => str_contains(strtoupper((string) ($m['meal_type_code'] ?? '')), 'SANG')));
                        if (!empty($sub)) {
                            $displayMeals = $sub;
                        }
                    } elseif (preg_match('/bữa trưa|bua trua|buổi trưa|buoi trua/ui', $q)) {
                        $sub = array_values(array_filter($displayMeals, fn ($m) => str_contains(strtoupper((string) ($m['meal_type_code'] ?? '')), 'TRUA')));
                        if (!empty($sub)) {
                            $displayMeals = $sub;
                        }
                    } elseif (preg_match('/bữa tối|bua toi|buổi tối|buoi toi/ui', $q)) {
                        $sub = array_values(array_filter($displayMeals, fn ($m) => str_contains(strtoupper((string) ($m['meal_type_code'] ?? '')), 'TOI')));
                        if (!empty($sub)) {
                            $displayMeals = $sub;
                        }
                    }

                    $res = "{$heading}\n\n| Bữa | Tên món ăn | Calo | Đạm |\n| :--- | :--- | :--- | :--- |\n";
                    foreach (array_slice($displayMeals, 0, 5) as $m) {
                        $type = $this->formatMealType($m['meal_type_code'] ?? $m['meal_type'] ?? null);
                        $name = $m['name'] ?? 'Món ăn';
                        $cal = !empty($m['calories']) ? "{$m['calories']} kcal" : '—';
                        $pro = !empty($m['protein']) ? "{$m['protein']}g" : '—';
                        $res .= "| {$type} | {$name} | {$cal} | {$pro} |\n";
                    }
                    return [
                        'intent' => 'food_detail',
                        'emotion' => 'explaining',
                        'action' => null,
                        'answer' => trim($res),
                    ];
                }
            }

            // 6b. Hỏi gợi ý thực đơn dinh dưỡng
            if (!$hasBodyMetrics && !$hasRegisteredProgram) {
                return [
                    'intent' => 'food_detail',
                    'emotion' => 'explaining',
                    'action' => [
                        'type' => 'NAVIGATE_BODY_METRICS',
                        'screen' => 'AiConsultationScreen',
                    ],
                    'answer' => "{$prefix}Hiện tại bạn **chưa cập nhật chỉ số cơ thể** và **chưa đăng ký chương trình tập luyện** nên hệ thống chưa có dữ liệu để lập thực đơn cá nhân hóa cho bạn.\n\nBạn hãy bấm nút bên dưới để cập nhật chỉ số cơ thể trước nhé! 🥗",
                ];
            }

            $meals = $context['suggestions']['meals'] ?? [];
            if (Schema::hasTable('mon_an') && preg_match('/ăn chay|an chay|thuần chay|thuan chay|vegan|vegetarian|keto|low-carb|tăng cơ|tang co|giảm mỡ|giam mo|giảm cân|giam can|eat clean/ui', $q)) {
                $meals = $this->selectBalancedMeals($user, 6, $q);
            }
            if (is_object($meals) && method_exists($meals, 'toArray')) {
                $meals = $meals->toArray();
            }

            if (!empty($meals)) {
                $filtered = $meals;
                if (preg_match('/bữa sáng|bua sang|buổi sáng|buoi sang/ui', $q)) {
                    $m = array_values(array_filter($meals, fn ($x) => str_contains(strtoupper((string) ($x['meal_type_code'] ?? $x['meal_type'] ?? '')), 'SANG')));
                    if (!empty($m)) {
                        $filtered = $m;
                    }
                } elseif (preg_match('/bữa trưa|bua trua|buổi trưa|buoi trua/ui', $q)) {
                    $m = array_values(array_filter($meals, fn ($x) => str_contains(strtoupper((string) ($x['meal_type_code'] ?? $x['meal_type'] ?? '')), 'TRUA')));
                    if (!empty($m)) {
                        $filtered = $m;
                    }
                } elseif (preg_match('/bữa tối|bua toi|buổi tối|buoi toi/ui', $q)) {
                    $m = array_values(array_filter($meals, fn ($x) => str_contains(strtoupper((string) ($x['meal_type_code'] ?? $x['meal_type'] ?? '')), 'TOI')));
                    if (!empty($m)) {
                        $filtered = $m;
                    }
                }

                $res = "{$prefix}Gợi ý thực đơn dinh dưỡng phù hợp với hồ sơ của bạn:\n\n" .
                    "| Bữa | Tên món ăn | Calo | Đạm |\n" .
                    "| :--- | :--- | :--- | :--- |\n";
                foreach (array_slice($filtered, 0, 4) as $m) {
                    $cal = !empty($m['calories']) ? "{$m['calories']} kcal" : '—';
                    $pro = !empty($m['protein']) ? "{$m['protein']}g" : '—';
                    $type = $this->formatMealType($m['meal_type_code'] ?? $m['meal_type'] ?? null);
                    $name = $m['name'] ?? 'Món ăn';
                    $res .= "| {$type} | {$name} | {$cal} | {$pro} |\n";
                }
                return [
                    'intent' => 'food_detail',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => trim($res),
                ];
            }

            return [
                'intent' => 'food_detail',
                'emotion' => 'explaining',
                'action' => null,
                'answer' => "{$prefix}Hiện tại hệ thống chưa tìm thấy món ăn phù hợp trong cơ sở dữ liệu với điều kiện hồ sơ của bạn. Bạn hãy thử kiểm tra lại mục tiêu hoặc thông tin dị ứng trong Hồ sơ nhé!",
            ];
        }

        // 7. Khởi động chuẩn
        if (preg_match('/khởi động|khoi dong|warm up|warmup/ui', $q)) {
            return [
                'intent' => 'exercise_detail',
                'emotion' => 'encouraging',
                'action' => null,
                'answer' => "{$prefix}- **⏱️ 4 bước khởi động chuẩn (5 - 10 phút)**\n\n" .
                    "1. Xoay tròn cổ tay, cổ chân, khớp vai và khớp hông (2 phút)\n" .
                    "2. Jumping Jacks hoặc chạy bước nhỏ tại chỗ (1 - 2 phút)\n" .
                    "3. Giãn cơ động Dynamic Stretching cho nhóm cơ sắp tập (2 phút)\n" .
                    "4. Thực hiện 1 hiệp khởi động với mức tạ nhẹ ~30% trước khi vào bài chính! 🔥",
            ];
        }

        // 8. Điều hướng tập luyện (AI Workout Navigation — không chiếm nhánh khi user đang hỏi kỹ thuật 1 bài tập cụ thể như Squat/Push-Up/Deadlift/Plank!)
        $isSpecificExerciseQuery = (bool) preg_match('/squat|deadlift|bench press|bench|push-up|push up|hít đất|hit dat|plank|kéo xà|keo xa|pull-up|pull up|gập bụng|gap bung|crunch|kỹ thuật|ky thuat|cách tập|cach tap|hướng dẫn bài|huong dan bai/ui', $q);
        if (!$isSpecificExerciseQuery && preg_match('/tập luyện|tap luyen|muốn tập|muon tap|bắt đầu tập|bat dau tap|vào tập|vao tap|kế hoạch tập|ke hoach tap|tập ngay|tap ngay|đi tập|di tap|luyện tập|luyen tap|tập tiếp|tap tiep|tập gì|tap gi|giờ tập|gio tap|tập thôi|tap thoi|đi gym|di gym|tập nào|tap nao|vào bài|vao bai|work out|workout|^tập$|^tap$/ui', $q)) {
            $hasSchedule = !empty($context['schedule']) && count($context['schedule']) > 0;
            $activeProgram = $context['active_program']['name'] ?? null;

            if ($hasSchedule) {
                $firstSchedule = $context['schedule'][0];
                $time = $this->formatVNTime($firstSchedule['starts_at'] ?? null, $firstSchedule['scheduled_date'] ?? null);
                $prog = $firstSchedule['name'] ?? $activeProgram ?? 'Buổi tập';
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'encouraging',
                    'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                    'answer' => "{$prefix}Tuyệt vời quá! Buổi tập sắp tới của bạn là **{$prog}** ({$time}). Hãy khởi động thật kỹ rồi bấm nút bên dưới để mở **Kế hoạch tập** nhé! 💪🔥",
                ];
            }
            if ($activeProgram) {
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'encouraging',
                    'action' => ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'],
                    'answer' => "{$prefix}Bạn đang theo lộ trình **{$activeProgram}**. Hãy khởi động nhẹ 5-10 phút rồi bấm nút bên dưới để mở **Kế hoạch tập** và bắt đầu ngay nhé! 💪🔥",
                ];
            }

            return [
                'intent' => 'workout_navigation',
                'emotion' => 'explaining',
                'action' => ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen'],
                'answer' => "{$prefix}Hiện tại bạn **chưa đăng ký chương trình tập nào**. Hãy bấm nút bên dưới để tới màn hình **Đăng ký chương trình tập** và chọn lộ trình phù hợp với mục tiêu của bạn nhé! 📋💪",
            ];
        }

        // 9. Tra cứu món ăn cụ thể từ CSDL `mon_an` (AI Food Detail)
        $monAn = null;
        if (Schema::hasTable('mon_an')) {
            $foodKeywords = [
                'ức gà' => 'ức gà', 'uc ga' => 'ức gà', 'chicken' => 'ức gà',
                'trứng luộc' => 'trứng', 'trung luoc' => 'trứng', 'trứng ốp la' => 'trứng', 'trứng gà' => 'trứng', 'trứng' => 'trứng', 'egg' => 'trứng',
                'yến mạch' => 'yến mạch', 'yen mach' => 'yến mạch', 'oat' => 'yến mạch',
                'thịt bò' => 'bò', 'thit bo' => 'bò', 'beef' => 'bò',
                'cá hồi' => 'cá hồi', 'ca hoi' => 'cá hồi', 'salmon' => 'cá hồi',
                'chuối' => 'chuối', 'chuoi' => 'chuối', 'banana' => 'chuối',
                'khoai lang' => 'khoai lang', 'sweet potato' => 'khoai lang',
                'salad' => 'salad',
                'bánh mì' => 'bánh mì', 'banh mi' => 'bánh mì',
                'sữa chua' => 'sữa chua', 'sua chua' => 'sữa chua',
            ];
            foreach ($foodKeywords as $kw => $searchVal) {
                if (preg_match('/(?:^|[\s,.;:!?])' . preg_quote($kw, '/') . '(?=$|[\s,.;:!?])/ui', $q)) {
                    $monAn = DB::table('mon_an')
                        ->where('ten_mon_an', 'LIKE', '%' . $searchVal . '%')
                        ->orWhere('nguyen_lieu', 'LIKE', '%' . $searchVal . '%')
                        ->first();
                    if ($monAn) {
                        break;
                    }
                }
            }

            if (!$monAn && preg_match('/calo|bao nhiêu|bao nhieu|món|mon|protein|carb|fat|dinh dưỡng|dinh duong/ui', $q)) {
                $cleanFoodQuery = preg_replace('/calo|bao nhiêu|bao nhieu|dinh dưỡng|dinh duong|món ăn|mon an|món|mon|ăn|an|cho tôi biết|cho toi biet|hỏi|hoi|có|co|trong|và|va|protein|carb|fat|vậy|vay|bạn|ban|của|cua|tôi|toi/ui', '', $q);
                $cleanFoodQuery = trim(preg_replace('/\s+/', ' ', (string) $cleanFoodQuery));

                if (!empty($cleanFoodQuery) && mb_strlen($cleanFoodQuery, 'UTF-8') >= 3) {
                    try {
                        $monAn = DB::table('mon_an')
                            ->where('ten_mon_an', 'LIKE', '%' . $cleanFoodQuery . '%')
                            ->first();
                        // Fallback không phân biệt hoa/thường & dấu tiếng Việt (hỗ trợ cả SQLite & câu không dấu)
                        if (!$monAn) {
                            $needleNorm = $this->normalizeVietnamese($cleanFoodQuery);
                            $allMeals = DB::table('mon_an')->where('tinh_trang', 1)->get();
                            foreach ($allMeals as $candidate) {
                                $nameNorm = $this->normalizeVietnamese((string) ($candidate->ten_mon_an ?? ''));
                                $ingNorm = $this->normalizeVietnamese((string) ($candidate->nguyen_lieu ?? ''));
                                if (str_contains($nameNorm, $needleNorm) || str_contains($ingNorm, $needleNorm)) {
                                    $monAn = $candidate;
                                    break;
                                }
                            }
                        }
                    } catch (\Throwable $e) {
                    }
                }
            }
        }

        if ($monAn) {
            $calo = $monAn->calo ?? 0;
            $pro = $monAn->protein ?? 0;
            $carb = $monAn->carb ?? 0;
            $fat = $monAn->fat ?? 0;
            $gram = $monAn->khoi_luong_gram ?? 100;
            $nguyenLieu = !empty($monAn->nguyen_lieu) ? "- **Nguyên liệu chính:** " . str_replace("\n", ', ', trim($monAn->nguyen_lieu)) : '';
            $imgMd = !empty($monAn->anh_dai_dien) ? "![{$monAn->ten_mon_an}]({$monAn->anh_dai_dien})\n\n" : '';

            // Kiểm tra cảnh báo dị ứng (kể cả nhóm dị ứng mở rộng như Hải sản -> Tôm/Cua/Mực)
            $allergyWarning = '';
            $expandedAllergens = $this->expandAllergyKeywords($user->di_ung ?? ($context['profile']['allergy'] ?? ''));
            if (!empty($expandedAllergens)) {
                $dishNorm = $this->normalizeVietnamese((string) ($monAn->ten_mon_an ?? '') . ' ' . (string) ($monAn->nguyen_lieu ?? ''));
                $matchedAllergens = [];
                foreach ($expandedAllergens as $algTrim) {
                    $algNorm = trim($this->normalizeVietnamese($algTrim));
                    if ($algNorm !== '' && preg_match('/(?:^|[^a-z0-9])' . preg_quote($algNorm, '/') . '(?=$|[^a-z0-9])/', $dishNorm)) {
                        $matchedAllergens[] = $algTrim;
                    }
                }
                if (!empty($matchedAllergens)) {
                    $allergyWarning = "- **⚠️ Cảnh báo dị ứng:** Món này có chứa thành phần nằm trong danh sách dị ứng của bạn (**" . implode(', ', array_unique($matchedAllergens)) . "**). Hãy cân nhắc tránh hoặc đổi sang nguyên liệu thay thế an toàn nhé!\n";
                }
            }

            $res = "{$prefix}Thông tin dinh dưỡng món **{$monAn->ten_mon_an}** (khẩu phần {$gram}g):\n\n" .
                $imgMd .
                "| Calo | Đạm | Tinh bột | Chất béo |\n" .
                "| :--- | :--- | :--- | :--- |\n" .
                "| **{$calo} kcal** | **{$pro}g** | **{$carb}g** | **{$fat}g** |\n\n";

            if ($allergyWarning) {
                $res .= $allergyWarning;
            }
            if ($nguyenLieu) {
                $res .= "{$nguyenLieu}\n";
            }

            if ($pro >= 20) {
                $res .= "- **💡 Nhận xét:** Món ăn giàu đạm, rất phù hợp để phục hồi và phát triển cơ bắp sau tập!";
            } else {
                $res .= "- **💡 Nhận xét:** Món ăn cân bằng năng lượng, thích hợp nạp trước buổi tập hoặc bữa phụ.";
            }

            return [
                'intent' => 'food_detail',
                'emotion' => 'explaining',
                'action' => null,
                'answer' => trim($res),
            ];
        }

        // 10. Tra cứu bài tập cụ thể từ CSDL `bai_tap` (+ `chi_tiet_bai_tap`)
        $baiTap = null;
        if (Schema::hasTable('bai_tap')) {
            $exerciseKeywords = [
                'bench press' => 'bench press', 'bench' => 'bench press',
                'squat' => 'squat',
                'deadlift' => 'deadlift',
                'hít đất' => 'push-up', 'hit dat' => 'push-up', 'push up' => 'push-up', 'push-up' => 'push-up',
                'kéo xà' => 'pull', 'keo xa' => 'pull', 'pull up' => 'pull', 'pull-up' => 'pull',
                'plank' => 'plank',
                'gập bụng' => 'crunch', 'gap bung' => 'crunch', 'crunch' => 'crunch',
                'incline dumbbell press' => 'incline dumbbell press',
                'triceps pushdown' => 'triceps pushdown',
                'cable row' => 'cable row',
            ];
            foreach ($exerciseKeywords as $ekw => $searchVal) {
                if (stripos($q, $ekw) !== false) {
                    $query = DB::table('bai_tap');
                    if (Schema::hasTable('chi_tiet_bai_tap')) {
                        $query->leftJoin('chi_tiet_bai_tap', 'bai_tap.id', '=', 'chi_tiet_bai_tap.id_bai_tap')
                            ->select('bai_tap.*', 'chi_tiet_bai_tap.canh_bao', 'chi_tiet_bai_tap.huong_dan');
                    }
                    $baiTap = $query
                        ->where(function ($w) use ($searchVal) {
                            $w->where('bai_tap.ten_bai_tap', 'LIKE', '%' . $searchVal . '%')
                                ->orWhere('bai_tap.thiet_bi', 'LIKE', '%' . $searchVal . '%');
                        })
                        ->first();
                    if ($baiTap) {
                        break;
                    }
                }
            }

            if (!$baiTap && preg_match('/bài tập|bai tap|động tác|dong tac|cách tập|cach tap|hướng dẫn|huong dan|kỹ thuật|ky thuat/ui', $q)) {
                $cleanExerciseQuery = preg_replace('/bài tập|bai tap|động tác|dong tac|cách tập|cach tap|hướng dẫn|huong dan|tập như thế nào|tap nhu the nao|kỹ thuật|ky thuat|cho tôi biết|cho toi biet|bài|bai|tập|tap/ui', '', $q);
                $cleanExerciseQuery = trim(preg_replace('/\s+/', ' ', (string) $cleanExerciseQuery));

                if (!empty($cleanExerciseQuery) && mb_strlen($cleanExerciseQuery, 'UTF-8') >= 3) {
                    try {
                        $query = DB::table('bai_tap');
                        if (Schema::hasTable('chi_tiet_bai_tap')) {
                            $query->leftJoin('chi_tiet_bai_tap', 'bai_tap.id', '=', 'chi_tiet_bai_tap.id_bai_tap')
                                ->select('bai_tap.*', 'chi_tiet_bai_tap.canh_bao', 'chi_tiet_bai_tap.huong_dan');
                        }
                        $baiTap = $query
                            ->where('bai_tap.ten_bai_tap', 'LIKE', '%' . $cleanExerciseQuery . '%')
                            ->first();
                        if (!$baiTap) {
                            $needleNorm = $this->normalizeVietnamese($cleanExerciseQuery);
                            $allExQuery = DB::table('bai_tap')->where('bai_tap.tinh_trang', 1);
                            if (Schema::hasTable('chi_tiet_bai_tap')) {
                                $allExQuery->leftJoin('chi_tiet_bai_tap', 'bai_tap.id', '=', 'chi_tiet_bai_tap.id_bai_tap')
                                    ->select('bai_tap.*', 'chi_tiet_bai_tap.canh_bao', 'chi_tiet_bai_tap.huong_dan');
                            }
                            foreach ($allExQuery->get() as $candidate) {
                                $exNameNorm = $this->normalizeVietnamese((string) ($candidate->ten_bai_tap ?? ''));
                                if (str_contains($exNameNorm, $needleNorm)) {
                                    $baiTap = $candidate;
                                    break;
                                }
                            }
                        }
                    } catch (\Throwable $e) {
                    }
                }
            }
        }

        if ($baiTap) {
            $set = $baiTap->set_yeu_cau ?? 3;
            $rep = $baiTap->rep_yeu_cau ?? 12;
            $thietBi = !empty($baiTap->thiet_bi) ? $baiTap->thiet_bi : 'Tự do / Bodyweight';
            $canhBao = !empty($baiTap->canh_bao) ? "- **⚠️ Lưu ý kỹ thuật:** " . $baiTap->canh_bao : '';
            $imgMd = !empty($baiTap->anh_dai_dien) ? "![{$baiTap->ten_bai_tap}]({$baiTap->anh_dai_dien})\n\n" : '';

            $res = "{$prefix}Hướng dẫn kỹ thuật bài tập **{$baiTap->ten_bai_tap}**:\n\n" .
                $imgMd .
                "| Số hiệp | Số lần | Thiết bị |\n" .
                "| :--- | :--- | :--- |\n" .
                "| **{$set} hiệp** | **{$rep} reps** | {$thietBi} |\n\n";

            if (!empty($baiTap->mo_ta)) {
                $res .= "- **📋 Kỹ thuật thực hiện:** {$baiTap->mo_ta}\n";
            }
            if ($canhBao) {
                $res .= "{$canhBao}\n";
            }
            $res .= "- **💨 Nhịp thở:** Hít vào chậm khi hạ tạ/xuống động tác, thở dứt khoát khi dùng lực đẩy hoặc kéo!";

            return [
                'intent' => 'exercise_detail',
                'emotion' => 'explaining',
                'action' => null,
                'answer' => trim($res),
            ];
        }

        // 10.5. Kéo động từ Kho Tri Thức VisionFit (Dinh dưỡng thể thao & Bách khoa toàn thư) khi LLM không phản hồi
        $rk = $context['retrieved_knowledge'] ?? [];
        if (!empty($rk['sports_nutrition'])) {
            $item = $rk['sports_nutrition'][0];
            $cat = !empty($item['category']) ? " ({$item['category']})" : '';
            $summary = !empty($item['summary']) ? "\n\n{$item['summary']}" : '';
            return [
                'intent' => 'food_detail',
                'emotion' => 'explaining',
                'action' => null,
                'source' => 'visionfit_knowledge_sports_nutrition',
                'answer' => "{$prefix}Thông tin từ Sổ tay Dinh dưỡng Thể thao VisionFit:\n\n- **{$item['name']}**{$cat}{$summary}",
            ];
        }
        if (!empty($rk['encyclopedia'])) {
            $art = $rk['encyclopedia'][0];
            $topic = !empty($art['topic']) ? " — *{$art['topic']}*" : '';
            $summary = !empty($art['summary']) ? "\n\n{$art['summary']}" : '';
            return [
                'intent' => 'general_support',
                'emotion' => 'explaining',
                'action' => null,
                'source' => 'visionfit_knowledge_encyclopedia',
                'answer' => "{$prefix}Kiến thức từ Bách khoa Thể hình VisionFit:\n\n- **{$art['title']}**{$topic}{$summary}",
            ];
        }

        // 11. Chào hỏi
        if (preg_match('/(?:^|[\s,.;:!?])(chào|chao|hello|hi|hey|bạn là ai|ban la ai|tên gì|ten gi)(?=$|[\s,.;:!?])/ui', $q)) {
            return [
                'intent' => 'general_support',
                'emotion' => 'welcome',
                'action' => null,
                'answer' => $isCat
                    ? "Meo meo! Chào bạn nha! Mình là Mèo VIF 🐱 - trợ lý AI đồng hành thể hình tại VisionFit. Bạn muốn mình hỗ trợ về lịch tập, chỉ số dinh dưỡng hay tra cứu món ăn nào?"
                    : "Chào bạn! Mình là Gấu VIF 🐻 - trợ lý AI đồng hành thể hình tại VisionFit. Bạn muốn mình hỗ trợ về lịch tập, chỉ số dinh dưỡng hay tra cứu bài tập nào?",
            ];
        }

        // 11.5. Cảm ơn / tạm biệt thân thiện
        if (preg_match('/(?:^|[\s,.;:!?])(cảm ơn|cam on|thank|thanks|tks|tạm biệt|tam biet|bye)(?=$|[\s,.;:!?])/ui', $q)) {
            return [
                'intent' => 'general_support',
                'emotion' => 'encouraging',
                'action' => null,
                'answer' => "{$prefix}Không có gì đâu bạn ơi! Mình luôn sẵn sàng đồng hành cùng bạn trên hành trình tập luyện tại VisionFit. Chúc bạn luôn khỏe khoắn và tràn đầy năng lượng nhé! 💪✨",
            ];
        }

        // Mặc định (KHÔNG kèm action NAVIGATE_WORKOUT để tránh hiện nhầm nút)
        return [
            'intent' => 'general_support',
            'emotion' => 'neutral',
            'action' => null,
            'answer' => "{$prefix}Mình đã nhận câu hỏi: \"{$message}\".\nBạn có thể hỏi mình về:\n• Lịch tập hoặc gói tập của bạn\n• Chỉ số thể trạng (BMI/BMR/TDEE) & thực đơn dinh dưỡng\n• Tra cứu calo món ăn (vd: ức gà, yến mạch) hoặc kỹ thuật bài tập (vd: Squat, Push-Up)\n• Bật hoặc tắt nhắc uống nước mỗi 2 tiếng nhé! 🔥",
        ];
    }
}
