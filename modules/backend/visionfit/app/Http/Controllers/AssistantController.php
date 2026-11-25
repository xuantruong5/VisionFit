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

        // 1. Lấy chỉ số dinh dưỡng thực tế: chỉ có khi user đã lưu bảng lich_su_chi_so_dinh_duong
        // hoặc đã nhập ĐẦY ĐỦ cả cân nặng (>0) và chiều cao (>0). Tuyệt đối không tự bịa số mặc định.
        $latestNutrition = null;
        if (Schema::hasTable('lich_su_chi_so_dinh_duong')) {
            $latestNutrition = DB::table('lich_su_chi_so_dinh_duong')
                ->where('id_user', $user->getKey())
                ->orderByDesc('id')
                ->first();
        }

        $weight = is_numeric($user->can_nang_kg) ? (float) $user->can_nang_kg : 0.0;
        $height = is_numeric($user->chieu_cao_cm) ? (float) $user->chieu_cao_cm : 0.0;

        if (!$latestNutrition && $weight > 0 && $height > 0) {
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

        // 3. Gói tập đang hoạt động của hội viên
        $data['packages'] = DB::table('dang_ky_goi as d')
            ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
            ->join('goi_tap as g', 'g.id', '=', 'ct.id_goi_tap')
            ->where('d.id_hoi_vien', $user->getKey())->where('g.id_phong_tap', $gym)
            ->where('d.tinh_trang', 1)->whereIn('ct.tinh_trang', [0, 1])
            ->orderByDesc('ct.id')->limit(20)
            ->get(['g.ten_goi_tap', 'ct.ngay_ket_thuc', 'ct.so_buoi'])
            ->map(fn ($p) => [
                'name' => $p->ten_goi_tap,
                'expires_at' => $p->ngay_ket_thuc,
                'total_sessions' => (int) $p->so_buoi,
                // Schema has purchased sessions, not an authoritative consumption ledger.
                'remaining_sessions' => null,
            ])->values();

        // 4. Lịch tập sắp tới của hội viên
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
            ->whereIn('l.tinh_trang', ['0', '1'])->whereDate('l.ngay_tap', '>=', $now->toDateString())
            ->where(function ($query) use ($now) {
                $query->whereDate('l.ngay_tap', '>', $now->toDateString())
                    ->orWhereNull('l.gio_bat_dau')->orWhere('l.gio_bat_dau', '>=', $now->format('H:i:s'));
            })
            ->orderBy('l.ngay_tap')->orderBy('l.gio_bat_dau')->limit(20)
            ->get(['c.ten_chuong_trinh', 'l.ngay_tap', 'l.gio_bat_dau', 't.ho_ten'])
            ->map(fn ($s) => [
                'name' => $s->ten_chuong_trinh,
                'scheduled_date' => $s->ngay_tap,
                'starts_at' => $s->gio_bat_dau
                    ? CarbonImmutable::parse($s->ngay_tap . ' ' . $s->gio_bat_dau, config('app.timezone'))->toIso8601String()
                    : null,
                'trainer' => $s->ho_ten,
            ])->values();

        $week = DB::table('buoi_tap')->where('id_hoi_vien', $user->getKey())
            ->whereIn('tinh_trang', ['2', '3'])
            ->whereBetween('thoi_gian_bat_dau', [$now->startOfWeek()->toDateTimeString(), $now->toDateTimeString()]);
        $average = (clone $week)->avg('phan_tram_hoan_thanh');
        $data['progress'] = [
            'sessions_this_week' => (clone $week)->count(),
            'completion_percent' => $average === null ? null : round((float) $average, 2),
        ];

        $hasBodyMetrics = $data['nutrition'] !== null;
        $hasGoal = !empty($user->muc_tieu_hien_tai);
        $hasRegisteredProgram = $data['active_program'] !== null;
        $hasActivePackage = $data['packages']->isNotEmpty();
        $hasSchedule = $data['schedule']->isNotEmpty();

        $data['account_status'] = [
            'authenticated' => true,
            'has_body_metrics' => $hasBodyMetrics,
            'has_goal' => $hasGoal,
            'has_registered_program' => $hasRegisteredProgram,
            'has_active_package' => $hasActivePackage,
            'has_schedule' => $hasSchedule,
        ];

        // 5. Gợi ý cá nhân hóa: CHỈ sinh dữ liệu gợi ý thực đơn/chương trình cá nhân hóa
        // khi hội viên ĐÃ cập nhật chỉ số cơ thể hoặc đã có mục tiêu/lộ trình đăng ký.
        $hasPersonalizationData = $hasBodyMetrics || $hasGoal || $hasRegisteredProgram;

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
     * Chọn thực đơn đa dạng các bữa trong ngày (Sáng, Trưa, Phụ, Tối) theo dị ứng & mục tiêu.
     */
    protected function selectBalancedMeals($user, int $limit = 6, ?string $dietFilter = null)
    {
        $baseQuery = DB::table('mon_an')->where('tinh_trang', 1);

        if ($user && !empty($user->di_ung)) {
            $rawAllergies = is_array($user->di_ung) ? $user->di_ung : [$user->di_ung];
            $allergyKeywords = [];
            foreach ($rawAllergies as $allergyItem) {
                $parts = preg_split('/[\/,;]+/', (string) $allergyItem) ?: [];
                foreach ($parts as $part) {
                    $trimmed = trim($part);
                    $lower = mb_strtolower($trimmed, 'UTF-8');
                    if (!$trimmed || in_array($lower, ['không', 'khong', 'none'], true)) {
                        continue;
                    }
                    $allergyKeywords[] = $trimmed;
                    // Mở rộng các nhóm dị ứng phổ biến để lọc an toàn thực sự
                    if (str_contains($lower, 'hải sản') || str_contains($lower, 'hai san')) {
                        array_push($allergyKeywords, 'tôm', 'cua', 'mực', 'ghẹ', 'sò', 'nghêu', 'ốc');
                    } elseif (str_contains($lower, 'trứng') || str_contains($lower, 'trung')) {
                        $allergyKeywords[] = 'trứng';
                    } elseif (str_contains($lower, 'sữa') || str_contains($lower, 'sua') || str_contains($lower, 'lactose')) {
                        array_push($allergyKeywords, 'sữa', 'phô mai', 'bơ sữa', 'whey');
                    } elseif (str_contains($lower, 'đậu phộng') || str_contains($lower, 'dau phong')) {
                        array_push($allergyKeywords, 'đậu phộng', 'lạc');
                    }
                }
            }
            foreach (array_unique($allergyKeywords) as $kw) {
                $baseQuery->where(function ($q) use ($kw) {
                    $q->whereNull('nguyen_lieu')->orWhere('nguyen_lieu', 'not like', "%{$kw}%");
                })->where('ten_mon_an', 'not like', "%{$kw}%");
            }
        }

        $filteredQuery = clone $baseQuery;
        $goalLower = mb_strtolower($dietFilter ?: ($user->muc_tieu_hien_tai ?? ''), 'UTF-8');
        if (str_contains($goalLower, 'chay') || str_contains($goalLower, 'vegan')) {
            $filteredQuery->whereIn('the_loai', ['Thuần chay (Vegan)', 'Ăn chay (Vegetarian)']);
        } elseif (str_contains($goalLower, 'eat clean') || str_contains($goalLower, 'giảm') || str_contains($goalLower, 'mỡ') || str_contains($goalLower, 'giam') || str_contains($goalLower, 'mo')) {
            $filteredQuery->whereIn('the_loai', ['Eat Clean', 'Giảm tinh bột (Low-carb/Keto)']);
        } elseif (str_contains($goalLower, 'tăng') || str_contains($goalLower, 'cơ') || str_contains($goalLower, 'tang') || str_contains($goalLower, 'co')) {
            $filteredQuery->whereIn('the_loai', ['Eat Clean', 'Bình thường (Ăn đa dạng)']);
        }

        $candidates = $filteredQuery->get(['ten_mon_an', 'loai_bua', 'the_loai', 'calo', 'protein']);
        // Nếu người dùng yêu cầu chế độ ăn cụ thể (vd: ăn chay/vegan) và có món khớp -> GIỮ NGUYÊN món khớp,
        // tuyệt đối không đổ món thịt/hải sản vào thay thế chỉ vì số món < 3!
        $isExplicitStrictDiet = $dietFilter !== null && (
            str_contains($goalLower, 'chay') || str_contains($goalLower, 'vegan') || str_contains($goalLower, 'keto')
        );
        if ($candidates->isEmpty() || (!$isExplicitStrictDiet && $candidates->count() < 3)) {
            $fallbackCandidates = $baseQuery->get(['ten_mon_an', 'loai_bua', 'the_loai', 'calo', 'protein']);
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
            'PHU_CHIEU', 'PHU_XE', 'PHỤ CHIỀU' => 'Phụ chiều',
            'TOI', 'BUA_TOI', 'TỐI' => 'Tối',
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

        // Chuẩn hóa dữ liệu ngày giờ sang định dạng Việt Nam trước khi gửi sang AI
        $formattedContext = $context;
        if (!empty($formattedContext['schedule']) && is_array($formattedContext['schedule'])) {
            $formattedContext['schedule'] = array_map(function ($s) {
                return [
                    'name' => $s['name'] ?? 'Buổi tập',
                    'time' => $this->formatVNTime($s['starts_at'] ?? null, $s['scheduled_date'] ?? null),
                    'trainer' => $s['trainer'] ?? 'Chưa có PT',
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
            "MỤC TIÊU: Hiểu yêu cầu bằng ngôn ngữ tự nhiên tiếng Việt, hỗ trợ tập luyện, tra cứu món ăn & bài tập, thể hiện cảm xúc linh vật phù hợp và thiết lập nhắc uống nước.\n\n" .
            "1. NGUYÊN TẮC GIAO TIẾP & NLP:\n" .
            "- Ưu tiên tiếng Việt tự nhiên, thân thiện, ngắn gọn, ấm áp (dưới 160 từ).\n" .
            "- Hiểu mọi cách nói đời thường: KHÔNG DẤU (như 'lich tap', 'cho toi xem lich tap', 'toi muon tap', 'an gi', 'uc ga bao nhieu calo'), viết tắt, tiếng lóng gym ('bulking', 'cutting', 'rep', 'set', 'bench press'), lỗi chính tả và câu thiếu chủ ngữ.\n" .
            "- Duy trì ngữ cảnh hội thoại; hiểu các câu tiếp nối như 'bài này', 'món đó', 'tập tiếp'.\n\n" .
            "2. NGUYÊN TẮC TRUNG THỰC VỚI DỮ LIỆU TÀI KHOẢN (CỰC KỲ QUAN TRỌNG — KHÔNG ĐƯỢC VI PHẠM):\n" .
            "- Kiểm tra kỹ object `account_status` trong DỮ LIỆU NGỮ CẢNH:\n" .
            "  + Nếu `authenticated == false`: Nói rõ bạn chưa đăng nhập nên không có dữ liệu cá nhân.\n" .
            "  + Nếu `has_body_metrics == false` (hoặc `nutrition == null`): Khi hỏi về chỉ số thể trạng / BMI / BMR / TDEE / calo của tôi -> TUYỆT ĐỐI KHÔNG tự bịa số liệu; phải nói rõ bạn CHƯA cập nhật chỉ số cơ thể (chiều cao, cân nặng, mục tiêu) và hướng dẫn vào mục Hồ sơ / Cập nhật chỉ số cơ thể.\n" .
            "  + Nếu `has_body_metrics == false` VÀ `has_goal == false` VÀ `has_registered_program == false`: Khi hỏi gợi ý thực đơn cá nhân hóa -> PHẢI nói rõ bạn CHƯA cập nhật chỉ số thể trạng và chưa đăng ký lộ trình tập luyện nên hệ thống chưa có thực đơn cá nhân hóa theo calo/dị ứng cho bạn, và nhắc bạn cập nhật chỉ số cơ thể trước (KHÔNG tự bịa bảng thực đơn như thể user đã có hồ sơ!).\n" .
            "  + Nếu `has_schedule == false` (hoặc `schedule` rỗng): Khi hỏi xem lịch tập -> PHẢI nói rõ bạn hiện chưa có lịch tập nào được đăng ký trên hệ thống, gợi ý vào tab Kế hoạch tập để chọn chương trình tập.\n" .
            "  + Nếu `has_active_package == false` (hoặc `packages` rỗng): Khi hỏi gói tập -> PHẢI nói rõ bạn hiện chưa đăng ký gói tập nào.\n" .
            "  + Nếu người dùng hỏi kiến thức chung (ví dụ: 'cách hít đất đúng', '100g ức gà bao nhiêu calo', 'khởi động thế nào') thì vẫn giải đáp hữu ích bình thường.\n\n" .
            "3. PHÂN LOẠI INTENT & ACTION:\n" .
            "• workout_navigation: Khi người dùng muốn bắt đầu tập, mở kế hoạch tập, hoặc xem lịch tập để đi tập. Action: {\"type\": \"NAVIGATE_WORKOUT\", \"params\": {}}.\n" .
            "• food_detail: Tra cứu món ăn, calo, macro, thực đơn.\n" .
            "• exercise_detail: Tra cứu bài tập, nhóm cơ, dụng cụ, tư thế, khởi động.\n" .
            "• water_reminder: Bật/tắt nhắc uống nước. Action: {\"type\": \"SET_WATER_REMINDER\", \"params\": {\"enabled\": true|false}}.\n" .
            "• general_support: Gói tập, lịch tập, chỉ số thể trạng, chấn thương đau mỏi, chào hỏi.\n" .
            "- Nếu không có hành động đặc biệt thì đặt `action` là `null`.\n\n" .
            "4. BỘ BIỂU CẢM LINH VẬT (EMOTION):\n" .
            "Chọn 1 emotion: 'welcome', 'encouraging', 'celebrating', 'explaining', 'caring', 'reminding', 'apologetic', 'neutral'.\n\n" .
            "5. ĐỊNH DẠNG PHẢN HỒI:\n" .
            "- Khi có dữ liệu thực để liệt kê (chỉ số dinh dưỡng, thực đơn, bài tập, lịch tập, gói tập), dùng BẢNG Markdown tối đa 3-4 cột ngắn gọn cho màn hình mobile.\n" .
            "- Tên bữa ăn luôn viết tiếng Việt có dấu gọn gàng: Sáng, Phụ sáng, Trưa, Phụ chiều, Tối (không để 'SANG', 'PHU_SANG').\n" .
            "- Ngày giờ luôn định dạng Việt Nam: 'HH:mm dd/mm/yyyy' hoặc 'dd/mm/yyyy'. Tuyệt đối không để chuỗi ISO.\n" .
            "- Không dùng tiêu đề thô '#', '##', '###'; dùng gạch đầu dòng in đậm: - **...**.\n\n" .
            "6. DỮ LIỆU NGỮ CẢNH CỦA TÀI KHOẢN ĐANG TRUY VẤN:\n" .
            json_encode($formattedContext, JSON_UNESCAPED_UNICODE) . "\n\n" .
            "7. QUY TẮC ĐẦU RA JSON BẮT BUỘC:\n" .
            "Trả về duy nhất 1 object JSON hợp lệ, KHÔNG kèm text ngoài JSON:\n" .
            "{\n" .
            "  \"intent\": \"workout_navigation\" | \"food_detail\" | \"exercise_detail\" | \"water_reminder\" | \"general_support\",\n" .
            "  \"emotion\": \"welcome\" | \"encouraging\" | \"celebrating\" | \"explaining\" | \"caring\" | \"reminding\" | \"apologetic\" | \"neutral\",\n" .
            "  \"action\": { \"type\": \"NAVIGATE_WORKOUT\" | \"SET_WATER_REMINDER\", \"params\": {} } | null,\n" .
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
            $cleanAns = stripcslashes($rawAns);
            $intent = 'general_support';
            if (preg_match('/"intent"\s*:\s*"([^"]+)"/u', $content, $mInt)) {
                $intent = $mInt[1];
            }
            $emotion = 'explaining';
            if (preg_match('/"emotion"\s*:\s*"([^"]+)"/u', $content, $mEmo)) {
                $emotion = $mEmo[1];
            }
            $action = null;
            if (preg_match('/"action"\s*:\s*(\{[^}]+\})/u', $content, $mAct)) {
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
        if (!in_array($type, ['NAVIGATE_WORKOUT', 'SET_WATER_REMINDER'], true)) {
            return null;
        }
        $action['type'] = $type;
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
                    'action' => [
                        'type' => 'NAVIGATE_WORKOUT',
                        'screen' => 'WorkoutPlan',
                    ],
                    'answer' => "{$prefix}Tuyệt vời! Mình đã ghi nhận bạn muốn kết nối Huấn luyện viên (PT). Bạn có thể vào mục Gói tập / Kế hoạch tập để chọn HLV phù hợp ngay nhé! 💪🔥",
                ];
            }
            if (preg_match('/bắt đầu|bat dau|chiến|mở lịch|kế hoạch tập|tập luyện|tập ngay/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'encouraging',
                    'action' => [
                        'type' => 'NAVIGATE_WORKOUT',
                        'screen' => 'WorkoutPlan',
                    ],
                    'answer' => "{$prefix}Lên dây cót tinh thần chiến hết mình nào! Bấm nút bên dưới để mở ngay trang Kế hoạch tập luyện và bắt đầu buổi tập nhé! 🔥💪",
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

        // 1. Cảnh báo chấn thương / đau mỏi (tránh match nhầm "bắt đầu", "đầu tiên", "đâu", "đậu", "dầu")
        if (preg_match('/(?:^|[\s,.;:!?])(đau|bị đau|bi dau|dau lung|dau goi|dau vai|dau khop|dau co|dau chan|dau tay|dau bung|dau nguc|dau qua|chấn thương|chan thuong|chuột rút|chuot rut|chóng mặt|chong mat|buốt|buot|ngất|ngat|đau khớp|sưng khớp|sung khop|trật khớp|trat khop)(?=$|[\s,.;:!?])/ui', $q)) {
            return [
                'intent' => 'general_support',
                'emotion' => 'caring',
                'action' => null,
                'answer' => "{$prefix}Hãy dừng ngay động tác đang gây đau hoặc khó chịu nhé! Chườm lạnh 15-20 phút nếu bị sưng và đừng cố gắng tập tiếp. Hãy báo ngay cho Huấn luyện viên (PT) hoặc bác sĩ thể thao để kiểm tra an toàn! 🛡️",
            ];
        }

        // 2. Nhắc nhở uống nước (Water Reminder)
        if (preg_match('/uống nước|uong nuoc|nhắc nước|nhac nuoc|cốc nước|coc nuoc|nước lọc|nuoc loc|nhắc nhở uống nước|water reminder|drink water/ui', $q)) {
            $isOff = (bool) preg_match('/(?:^|[\s,.;:!?])(tắt|tat|hủy|huy|dừng|dung|off|stop)(?=$|[\s,.;:!?])/ui', $q);
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

        // 3. Gói tập (kiểm tra trước khi tra cứu món/bài tập; tránh match nhầm "thế", "hạn chế", "gọi")
        if (preg_match('/gói tập|goi tap|gói của tôi|goi cua toi|thẻ tập|the tap|thẻ của tôi|the cua toi|hạn thẻ|han the|hạn gói|han goi|hạn sử dụng|han su dung|buổi còn|buoi con|bao nhiêu buổi|bao nhieu buoi|còn mấy buổi|con may buoi|đăng ký gói|dang ky goi/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập tài khoản hội viên nên mình chưa thể kiểm tra thông tin gói tập của bạn. Hãy đăng nhập trước nhé!",
                ];
            }
            $packages = $context['packages'] ?? [];
            if (!empty($packages)) {
                $res = "{$prefix}Thông tin gói tập hiện tại của bạn:\n\n" .
                    "| Gói tập | Số buổi | Hạn sử dụng |\n" .
                    "| :--- | :--- | :--- |\n";
                foreach ($packages as $p) {
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
                'action' => null,
                'answer' => "{$prefix}Hiện tại tài khoản của bạn chưa đăng ký gói tập nào trên hệ thống VisionFit. Bạn có thể vào mục **Thêm > Gói tập của tôi** hoặc chọn đăng ký gói tập phù hợp để bắt đầu nhé!",
            ];
        }

        // 4. Lịch tập (luôn có phản hồi rõ ràng kể cả khi chưa có lịch tập)
        if (preg_match('/lịch tập|lich tap|xem lịch|xem lich|lịch hôm nay|lich hom nay|lịch ngày mai|lich ngay mai|lịch tuần|lich tuan|lịch trình|lich trinh|có lịch|co lich|buổi tập tiếp theo|buoi tap tiep theo|buổi tập hôm nay|buoi tap hom nay|buổi tập sắp tới|buoi tap sap toi|khi nào tập|khi nao tap|mấy giờ tập|may gio tap|tập mấy giờ|tap may gio|lịch của tôi|lich cua toi/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập tài khoản nên mình chưa thể tra cứu lịch tập cá nhân của bạn. Hãy đăng nhập để xem lịch tập nhé!",
                ];
            }
            $schedule = $context['schedule'] ?? [];
            if (!empty($schedule)) {
                $res = "{$prefix}Bảng lịch tập sắp tới của bạn trên hệ thống:\n\n" .
                    "| Buổi tập | Thời gian | Huấn luyện viên |\n" .
                    "| :--- | :--- | :--- |\n";
                foreach (array_slice($schedule, 0, 5) as $s) {
                    $time = $this->formatVNTime($s['starts_at'] ?? null, $s['scheduled_date'] ?? null);
                    $pt = !empty($s['trainer']) ? $s['trainer'] : 'Tự tập';
                    $name = $s['name'] ?? 'Buổi tập';
                    $res .= "| {$name} | {$time} | {$pt} |\n";
                }
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'reminding',
                    'action' => [
                        'type' => 'NAVIGATE_WORKOUT',
                        'screen' => 'WorkoutPlan',
                    ],
                    'answer' => trim($res) . "\n\nHãy chuẩn bị nước và đồ tập đầy đủ nhé! 💪",
                ];
            }

            if ($hasRegisteredProgram && !empty($context['active_program']['name'])) {
                $progName = $context['active_program']['name'];
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'explaining',
                    'action' => [
                        'type' => 'NAVIGATE_WORKOUT',
                        'screen' => 'WorkoutPlan',
                    ],
                    'answer' => "{$prefix}Bạn đang theo chương trình **{$progName}**, nhưng hiện chưa có buổi tập sắp tới trong lịch. Bạn có thể mở **Kế hoạch tập** để xem hoặc sắp xếp lại lịch tập nhé! 📅",
                ];
            }

            return [
                'intent' => 'workout_navigation',
                'emotion' => 'explaining',
                'action' => [
                    'type' => 'NAVIGATE_WORKOUT',
                    'screen' => 'WorkoutPlan',
                ],
                'answer' => "{$prefix}Hiện tại bạn **chưa đăng ký chương trình tập hoặc chưa có lịch tập nào** trên hệ thống.\nBạn hãy bấm nút bên dưới để vào **Kế hoạch tập**, chọn mục tiêu và tạo lịch tập cho riêng mình nhé! 📋💪",
            ];
        }

        // 4.5. Tiến độ tập luyện trong tuần
        if (preg_match('/tiến độ|tien do|hoàn thành|hoan thanh|tập được mấy buổi|tap duoc may buoi|tuần này tập|tuan nay tap/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập nên mình chưa thể kiểm tra tiến độ tập luyện của bạn.",
                ];
            }
            $sessionsWeek = $context['progress']['sessions_this_week'] ?? 0;
            $pct = $context['progress']['completion_percent'] ?? null;
            $pctText = $pct === null ? 'Chưa có dữ liệu' : "{$pct}%";
            return [
                'intent' => 'general_support',
                'emotion' => $sessionsWeek > 0 ? 'encouraging' : 'explaining',
                'action' => null,
                'answer' => "{$prefix}Tiến độ tập luyện tuần này của bạn:\n\n" .
                    "| Chỉ số tuần này | Kết quả |\n" .
                    "| :--- | :--- |\n" .
                    "| Số buổi đã hoàn thành | **{$sessionsWeek} buổi** |\n" .
                    "| Tỷ lệ hoàn thành TB | **{$pctText}** |",
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
            if (!$goal && !$level && !$hasBodyMetrics) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => "{$prefix}Hiện tại bạn **chưa hoàn thiện hồ sơ thể trạng và mục tiêu tập luyện**. Hãy vào mục Hồ sơ để cập nhật chiều cao, cân nặng, mục tiêu và dị ứng (nếu có) nhé!",
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

        // 5. Chỉ số thể trạng & dinh dưỡng (BMI, BMR, TDEE, Calo, Macros)
        if (preg_match('/chỉ số|chi so|thể trạng|the trang|bmi|bmr|tdee|dinh dưỡng calo|dinh duong calo|cân nặng của tôi|can nang cua toi|chiều cao của tôi|chieu cao cua toi|calo của tôi|calo cua toi|macro của tôi|macro cua toi/ui', $q)) {
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
                'action' => null,
                'answer' => "{$prefix}Hiện tại bạn **chưa cập nhật chỉ số cơ thể** (chiều cao, cân nặng, ngày sinh, mục tiêu) trên hệ thống nên mình chưa có dữ liệu để tính BMI, BMR, TDEE và nhu cầu calo cá nhân cho bạn.\n\nBạn hãy vào **Hồ sơ cá nhân / Cập nhật chỉ số thể trạng** để nhập thông tin trước, sau đó hỏi lại mình nhé! 📊",
            ];
        }

        // 6. Gợi ý thực đơn & chế độ ăn (CHỈ trả bảng cá nhân hóa khi đã có chỉ số/mục tiêu/đăng ký)
        if (preg_match('/thực đơn|thuc don|ăn gì|an gi|chế độ ăn|che do an|eat clean|giảm cân|giam can|giảm mỡ|giam mo|tăng cơ|tang co|bữa sáng|bua sang|bữa trưa|bua trua|bữa tối|bua toi/ui', $q)) {
            if (!$isAuthenticated) {
                return [
                    'intent' => 'food_detail',
                    'emotion' => 'apologetic',
                    'action' => null,
                    'answer' => "{$prefix}Bạn chưa đăng nhập tài khoản nên mình chưa có hồ sơ dinh dưỡng của bạn. Hãy đăng nhập và cập nhật chỉ số cơ thể để nhận thực đơn phù hợp nhé!",
                ];
            }

            if (!$hasBodyMetrics && !$hasGoal && !$hasRegisteredProgram) {
                return [
                    'intent' => 'food_detail',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => "{$prefix}Hiện tại bạn **chưa cập nhật chỉ số thể trạng** (chiều cao, cân nặng, mục tiêu) và **chưa đăng ký lộ trình tập luyện** nên hệ thống chưa có dữ liệu để lập thực đơn cá nhân hóa cho bạn.\n\nBạn hãy cập nhật hồ sơ cơ thể trước để mình tính đúng mức calo và gợi ý thực đơn phù hợp nhất (tránh dị ứng nếu có) nhé! 🥗",
                ];
            }

            $meals = $context['suggestions']['meals'] ?? [];
            // Nếu người dùng yêu cầu cụ thể 1 chế độ ăn khác mục tiêu hồ sơ (vd: ăn chay, tăng cơ, giảm mỡ) -> truy vấn lại theo đúng yêu cầu
            if (Schema::hasTable('mon_an') && preg_match('/ăn chay|an chay|thuần chay|thuan chay|vegan|vegetarian|keto|low-carb|tăng cơ|tang co|giảm mỡ|giam mo|giảm cân|giam can|eat clean/ui', $q)) {
                $meals = $this->selectBalancedMeals($user, 6, $q);
            }
            if (is_object($meals) && method_exists($meals, 'toArray')) {
                $meals = $meals->toArray();
            }

            // Lọc theo bữa nếu người dùng hỏi cụ thể bữa sáng / trưa / tối
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

        // 8. Điều hướng tập luyện (AI Workout Navigation)
        if (preg_match('/tập luyện|tap luyen|muốn tập|muon tap|bắt đầu tập|bat dau tap|vào tập|vao tap|kế hoạch tập|ke hoach tap|tập ngay|tap ngay|đi tập|di tap|luyện tập|luyen tap|tập tiếp|tap tiep|tập gì|tap gi|giờ tập|gio tap|tập thôi|tap thoi|đi gym|di gym|tập nào|tap nao|vào bài|vao bai|work out|workout|^tập$|^tap$/ui', $q)) {
            $hasSchedule = !empty($context['schedule']) && count($context['schedule']) > 0;
            $activeProgram = $context['active_program']['name'] ?? null;

            if ($hasSchedule) {
                $firstSchedule = $context['schedule'][0];
                $time = $this->formatVNTime($firstSchedule['starts_at'] ?? null, $firstSchedule['scheduled_date'] ?? null);
                $prog = $firstSchedule['name'] ?? $activeProgram ?? 'Buổi tập';
                $msg = "{$prefix}Tuyệt vời quá! Buổi tập sắp tới của bạn là **{$prog}** ({$time}). Hãy khởi động thật kỹ rồi bấm nút bên dưới để mở **Kế hoạch tập** nhé! 💪🔥";
            } elseif ($activeProgram) {
                $msg = "{$prefix}Bạn đang theo lộ trình **{$activeProgram}**. Hãy khởi động nhẹ 5-10 phút rồi bấm nút bên dưới để mở **Kế hoạch tập** và bắt đầu ngay nhé! 💪🔥";
            } else {
                $msg = "{$prefix}Hiện tại bạn **chưa đăng ký chương trình tập nào**. Hãy bấm nút bên dưới để mở **Kế hoạch tập** và chọn lộ trình phù hợp với mục tiêu của bạn nhé! 📋💪";
            }

            return [
                'intent' => 'workout_navigation',
                'emotion' => 'encouraging',
                'action' => [
                    'type' => 'NAVIGATE_WORKOUT',
                    'screen' => 'WorkoutPlan',
                ],
                'answer' => $msg,
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

            $res = "{$prefix}Thông tin dinh dưỡng món **{$monAn->ten_mon_an}** (khẩu phần {$gram}g):\n\n" .
                $imgMd .
                "| Calo | Đạm | Tinh bột | Chất béo |\n" .
                "| :--- | :--- | :--- | :--- |\n" .
                "| **{$calo} kcal** | **{$pro}g** | **{$carb}g** | **{$fat}g** |\n\n";

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

        // Mặc định (KHÔNG kèm action NAVIGATE_WORKOUT để tránh hiện nhầm nút)
        return [
            'intent' => 'general_support',
            'emotion' => 'neutral',
            'action' => null,
            'answer' => "{$prefix}Mình đã nhận câu hỏi: \"{$message}\".\nBạn có thể hỏi mình về:\n• Lịch tập hoặc gói tập của bạn\n• Chỉ số thể trạng (BMI/BMR/TDEE) & thực đơn dinh dưỡng\n• Tra cứu calo món ăn (vd: ức gà, yến mạch) hoặc kỹ thuật bài tập (vd: Squat, Push-Up)\n• Bật hoặc tắt nhắc uống nước mỗi 2 tiếng nhé! 🔥",
        ];
    }
}
