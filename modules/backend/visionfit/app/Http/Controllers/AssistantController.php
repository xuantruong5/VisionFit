<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
        $role = $identity['role'];
        $gym = $identity['gym_id'];
        $now = CarbonImmutable::now(config('app.timezone'));
        $data = [
            'subject' => $identity,
            'profile' => ['goal' => null, 'level' => null, 'activity_level' => null, 'allergy' => null, 'note' => null],
            'nutrition' => null,
            'suggestions' => null,
            'packages' => [], 'schedule' => [],
            'progress' => ['sessions_this_week' => null, 'completion_percent' => null],
            'summary' => null,
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
                    ->join('goi_tap as g', 'g.id_goi_tap', '=', 'ct.id_goi_tap')
                    ->where('c.id_phong_tap', $gym)->where('g.id_phong_tap', $gym)
                    ->where('d.tinh_trang', 1)->whereIn('ct.tinh_trang', [0, 1])
                    ->whereBetween('ct.ngay_ket_thuc', [$now->toDateString(), $now->addDays(7)->toDateString()])
                    ->distinct()->count('c.id');
            }
            return response()->json(['data' => $data]);
        }

        $data['profile'] = [
            'goal' => $user->muc_tieu_hien_tai,
            'level' => $user->cap_do_hien_tai,
            'activity_level' => (string) ($user->muc_tieu_hoat_dong ?? '2'),
            'allergy' => (string) ($user->di_ung ?? 'Không'),
            'note' => (string) ($user->note ?? ''),
        ];

        // 1. Lấy chỉ số dinh dưỡng mới nhất từ lich_su_chi_so_dinh_duong (hoặc tính nhanh nếu chưa có)
        $latestNutrition = null;
        if (Schema::hasTable('lich_su_chi_so_dinh_duong')) {
            $latestNutrition = DB::table('lich_su_chi_so_dinh_duong')
                ->where('id_user', $user->getKey())
                ->orderByDesc('id')
                ->first();
        }

        if (!$latestNutrition && ($user->can_nang_kg || $user->chieu_cao_cm)) {
            $age = $user->ngay_sinh ? CarbonImmutable::parse($user->ngay_sinh)->age : 25;
            $activityFactors = [1 => 1.2, 2 => 1.375, 3 => 1.55, 4 => 1.725];
            $multiplier = $activityFactors[(int)($user->muc_tieu_hoat_dong ?? 2)] ?? 1.375;
            $calc = \App\Services\NutritionService::calculateAll(
                (float)($user->can_nang_kg ?? 65),
                (float)($user->chieu_cao_cm ?? 170),
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
                'chieu_cao_cm' => (float) ($user->chieu_cao_cm ?? 170),
                'bmi' => (float) $latestNutrition->bmi,
                'bmr' => (float) $latestNutrition->bmr,
                'tdee' => (float) $latestNutrition->tdee,
                'kcal_muc_tieu' => (float) $latestNutrition->kcal_muc_tieu,
                'protein' => (float) $latestNutrition->protein,
                'carb' => (float) $latestNutrition->carb,
                'fat' => (float) $latestNutrition->fat,
            ];
        }

        // 2. Gợi ý chương trình tập, bài tập và món ăn phù hợp theo client
        $programs = collect();
        if (Schema::hasTable('chuong_trinh_tap')) {
            $progQuery = DB::table('chuong_trinh_tap')->where('tinh_trang', 1);
            if (!empty($user->muc_tieu_hien_tai)) {
                $g = $user->muc_tieu_hien_tai;
                $progQuery->where(function ($q) use ($g) {
                    $q->where('ten_chuong_trinh', 'like', "%{$g}%")->orWhere('muc_tieu', 'like', "%{$g}%");
                });
            }
            $programs = $progQuery->limit(3)->get(['ten_chuong_trinh', 'muc_tieu', 'so_buoi_moi_tuan'])
                ->map(fn ($p) => [
                    'name' => $p->ten_chuong_trinh,
                    'goal' => $p->muc_tieu ?: $user->muc_tieu_hien_tai,
                    'sessions_per_week' => (int) $p->so_buoi_moi_tuan,
                ])->values();
            if ($programs->isEmpty()) {
                $programs = DB::table('chuong_trinh_tap')->where('tinh_trang', 1)->limit(3)
                    ->get(['ten_chuong_trinh', 'muc_tieu', 'so_buoi_moi_tuan'])
                    ->map(fn ($p) => [
                        'name' => $p->ten_chuong_trinh,
                        'goal' => $p->muc_tieu ?: 'Rèn luyện sức khỏe',
                        'sessions_per_week' => (int) $p->so_buoi_moi_tuan,
                    ])->values();
            }
        }

        $exercises = collect();
        if (Schema::hasTable('bai_tap')) {
            $exercises = DB::table('bai_tap')->where('tinh_trang', 1)->limit(5)
                ->get(['ten_bai_tap', 'thiet_bi'])
                ->map(fn ($e) => ['name' => $e->ten_bai_tap, 'equipment' => $e->thiet_bi])->values();
        }

        $meals = collect();
        if (Schema::hasTable('mon_an')) {
            $mealQuery = DB::table('mon_an')->where('tinh_trang', 1);
            if (!empty($user->di_ung) && !in_array(strtolower(trim($user->di_ung)), ['không', 'khong', 'none'], true)) {
                $allergy = trim($user->di_ung);
                $mealQuery->where('nguyen_lieu', 'not like', "%{$allergy}%")
                          ->where('ten_mon_an', 'not like', "%{$allergy}%");
            }
            $goalLower = strtolower($user->muc_tieu_hien_tai ?? '');
            if (str_contains($goalLower, 'giảm') || str_contains($goalLower, 'mỡ')) {
                $mealQuery->whereIn('the_loai', ['Eat Clean', 'Giảm tinh bột (Low-carb/Keto)']);
            } elseif (str_contains($goalLower, 'tăng') || str_contains($goalLower, 'cơ')) {
                $mealQuery->whereIn('the_loai', ['Eat Clean', 'Bình thường (Ăn đa dạng)']);
            }
            $meals = $mealQuery->limit(6)->get(['ten_mon_an', 'loai_bua', 'the_loai', 'calo', 'protein'])
                ->map(fn ($m) => [
                    'name' => $m->ten_mon_an,
                    'meal_type' => $m->loai_bua,
                    'diet_type' => $m->the_loai,
                    'calories' => (float) $m->calo,
                    'protein' => (float) $m->protein,
                ])->values();
            if ($meals->count() < 3) {
                $meals = DB::table('mon_an')->where('tinh_trang', 1)->limit(6)
                    ->get(['ten_mon_an', 'loai_bua', 'the_loai', 'calo', 'protein'])
                    ->map(fn ($m) => [
                        'name' => $m->ten_mon_an,
                        'meal_type' => $m->loai_bua,
                        'diet_type' => $m->the_loai,
                        'calories' => (float) $m->calo,
                        'protein' => (float) $m->protein,
                    ])->values();
            }
        }

        $data['suggestions'] = [
            'programs' => $programs,
            'exercises' => $exercises,
            'meals' => $meals,
        ];

        $data['packages'] = DB::table('dang_ky_goi as d')
            ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
            ->join('goi_tap as g', 'g.id_goi_tap', '=', 'ct.id_goi_tap')
            ->where('d.id_hoi_vien', $user->getKey())->where('g.id_phong_tap', $gym)
            ->where('d.tinh_trang', 1)->whereIn('ct.tinh_trang', [0, 1])
            ->orderByDesc('ct.id')->limit(20)
            ->get(['g.ten_goi_tap', 'ct.ngay_ket_thuc', 'ct.so_buoi'])
            ->map(fn ($p) => [
                'name' => $p->ten_goi_tap, 'expires_at' => $p->ngay_ket_thuc,
                'total_sessions' => (int) $p->so_buoi,
                // Schema has purchased sessions, not an authoritative consumption ledger.
                'remaining_sessions' => null,
            ])->values();

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
                    ? CarbonImmutable::parse($s->ngay_tap.' '.$s->gio_bat_dau, config('app.timezone'))->toIso8601String()
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

        return response()->json(['data' => $data]);
    }

    /**
     * API Trò chuyện Trực tiếp với AI Assistant (Đã huấn luyện với toàn bộ dữ liệu Hội viên)
     */
    public function chat(Request $request)
    {
        $message = trim((string) $request->input('message', ''));
        if ($message === '') {
            return response()->json(['message' => 'Nội dung câu hỏi không được để trống.'], 422);
        }

        $species = $request->input('species', 'cat') === 'bear' ? 'bear' : 'cat';

        // 0. Xác thực hội viên hoặc dùng dữ liệu hội viên mẫu nếu là khách / chưa đăng nhập
        if (!$request->attributes->has('assistant_user')) {
            $plainToken = $request->bearerToken();
            $token = $plainToken ? \Laravel\Sanctum\PersonalAccessToken::findToken($plainToken) : null;
            if ($token && (!$token->expires_at || !$token->expires_at->isPast())) {
                $user = $token->tokenable;
                if ($user instanceof \App\Models\Client) {
                    $request->attributes->set('assistant_user', $user);
                    $request->attributes->set('assistant_identity', [
                        'id' => (string) $user->getKey(),
                        'gym_id' => (string) $user->id_phong_tap,
                        'role' => 'member',
                        'name' => $user->ho_ten,
                    ]);
                }
            }
        }

        if (!$request->attributes->has('assistant_user')) {
            $sampleClient = \App\Models\Client::where('tinh_trang', 1)->first() ?? \App\Models\Client::first();
            if ($sampleClient) {
                $request->attributes->set('assistant_user', $sampleClient);
                $request->attributes->set('assistant_identity', [
                    'id' => (string) $sampleClient->getKey(),
                    'gym_id' => (string) ($sampleClient->id_phong_tap ?? 1),
                    'role' => 'member',
                    'name' => $sampleClient->ho_ten ?? 'Hội viên VisionFit',
                ]);
            }
        }

        // 1. Trích xuất ngữ cảnh dữ liệu thực tế đã huấn luyện của hội viên
        $contextResponse = $this->context($request);
        $contextData = $contextResponse->getData(true)['data'] ?? [];

        // 2. Gọi Gemini AI với dữ liệu huấn luyện thực tế
        $aiAnswer = $this->queryGemini($message, $contextData, $species);
        if ($aiAnswer) {
            return response()->json([
                'status' => true,
                'answer' => $aiAnswer,
                'source' => 'gemini_ai',
            ]);
        }

        // 3. Fallback sang bộ quy tắc RAG thông minh từ Database VisionFit
        $fallbackAnswer = $this->generateFallbackReply($message, $contextData, $species);
        return response()->json([
            'status' => true,
            'answer' => $fallbackAnswer,
            'source' => 'visionfit_rag',
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
            } catch (\Throwable $e) {}
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
     * Gọi Gemini AI API với System Prompt kèm dữ liệu ngữ cảnh thực tế của Hội viên
     */
    protected function queryGemini(string $message, array $context, string $species): ?string
    {
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return null;
        }

        $roleText = $species === 'cat'
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

        $systemPrompt = "{$roleText}\n" .
            "Bạn là trợ lý AI thông minh chuyên về Thể hình, Sức khỏe và Dinh dưỡng của hệ sinh thái VisionFit.\n" .
            "KHẢ NĂNG NHẬN BIẾT NGÔN NGỮ TỰ NHIÊN (BẮT BUỘC):\n" .
            "- Bạn thấu hiểu mọi cách diễn đạt tiếng Việt tự nhiên: gõ không dấu (như 'lich tap', 'toi muon tap luyen', 'an gi', 'tap nguc', 'chi so calo'), viết tắt, tiếng lóng gym, văn phong nói chuyện đời thường.\n" .
            "- Luôn nhận diện chính xác ý định (intent) của người dùng kể cả khi họ chỉ nhắn 1-2 từ ngắn gọn.\n" .
            "- Khi người dùng nói 'Tôi muốn tập luyện', 'tập ngay', 'bắt đầu tập', hãy nhiệt tình cổ vũ, gợi ý các bài tập hôm nay hoặc bài khởi động cần làm trước khi tập thật tự nhiên, không trả lời máy móc.\n" .
            "QUY TẮC PHẢN HỒI:\n" .
            "1. Dùng tiếng Việt chuẩn, ấm áp, ngắn gọn, súc tích (dưới 150 từ), dễ đọc trên màn hình điện thoại di động.\n" .
            "2. QUY TẮC BẢNG DỮ LIỆU (TỐI ƯU CHO ĐIỆN THOẠI):\n" .
            "Khi trả lời về CHỈ SỐ DINH DƯỠNG (BMI/BMR/TDEE/Calo/Macros), THỰC ĐƠN MÓN ĂN, BÀI TẬP, GÓI TẬP hoặc LỊCH TẬP, bạn BẮT BUỘC phải trình bày kết quả dưới dạng BẢNG Markdown (| Cột 1 | Cột 2 | ...) rõ ràng, có tiêu đề cột và hàng phân cách.\n" .
            "Để bảng dễ xem và thân thiện trên điện thoại:\n" .
            "- Giới hạn bảng tối đa từ 3 đến 4 cột chính (ví dụ: | STT | Tên bài tập | Sets x Reps | Ghi chú |).\n" .
            "- Nội dung từng ô cần súc tích, ngắn gọn.\n" .
            "3. QUY TẮC ĐỊNH DẠNG NGÀY GIỜ VIỆT NAM (BẮT BUỘC):\n" .
            "Khi hiển thị ngày giờ trong bảng Markdown hoặc câu trả lời, bạn BẮT BUỘC phải định dạng theo chuẩn Việt Nam: \"HH:mm dd/mm/yyyy\" (ví dụ: \"06:00 11/11/2026\") hoặc \"dd/mm/yyyy\" (ví dụ: \"11/11/2026\"). TUYỆT ĐỐI KHÔNG để chuỗi ISO như \"2026-11-11T06:00:00+07:00\" hay \"+00:00\".\n" .
            "4. QUY TẮC TIÊU ĐỀ & ĐỀ MỤC (BẮT BUỘC):\n" .
            "TUYỆT ĐỐI KHÔNG dùng các dấu thăng markdown thô như '###', '####', '#####', '##', '#'.\n" .
            "BẮT BUỘC thay các dấu đó bằng dấu gạch ngang '-' kèm in đậm:\n" .
            "- Tiêu đề chính / buổi tập: Dùng dấu gạch ngang: - **🏋️ LỊCH TẬP HÔM NAY: NGỰC & XÔ**\n" .
            "- Các phần bài tập (Khởi động, Bài tập chính, Giãn cơ): - **⏱️ 1. Khởi động (5 - 10 phút)**\n" .
            "- Nhóm cơ / phân mục chi tiết: - **NHÓM CƠ NGỰC (CHEST):**\n" .
            "- Không dùng đường kẻ '---' thô; dùng khoảng cách dòng thoáng.\n" .
            "5. Bám sát DỮ LIỆU THỰC TẾ ĐƯỢC CẤP của hội viên bên dưới:\n" .
            json_encode($formattedContext, JSON_UNESCAPED_UNICODE) . "\n" .
            "6. Nếu hội viên báo đau mỏi hoặc chấn thương: Khuyên dừng ngay bài tập, chườm lạnh nếu sưng và hỏi ý kiến Huấn luyện viên (PT) hoặc bác sĩ.\n" .
            "7. Không tự chế số buổi gói tập hay ngày hết hạn nếu không có trong dữ liệu.";

        try {
            $url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
            $model = env('GEMINI_MODEL', 'gemini-flash-lite-latest');
            $payload = [
                'model' => $model,
                'max_completion_tokens' => 1500,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $message],
                ],
            ];

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_TIMEOUT => 7,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $apiKey,
                ],
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_SSL_VERIFYPEER => false,
            ]);

            $res = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200 && $res) {
                $decoded = json_decode($res, true);
                $content = $decoded['choices'][0]['message']['content'] ?? null;
                if ($content && is_string($content)) {
                    return trim($content);
                }
            }
        } catch (\Throwable $e) {
            // Không ngắt luồng, để fallback xử lý
        }

        return null;
    }

    /**
     * Fallback RAG thông minh dựa trên Dữ Liệu Thực Tế từ Database
     */
    protected function generateFallbackReply(string $message, array $context, string $species): string
    {
        $q = mb_strtolower(trim($message), 'UTF-8');
        $isCat = $species === 'cat';
        $prefix = $isCat ? 'Meo meo! 🐱 ' : 'Gấu VIF đây! 🐻 ';

        // 1. Cảnh báo chấn thương
        if (preg_match('/đau|dau|chấn thương|chan thuong|chuột rút|chuot rut|chóng mặt|chong mat|buốt|buot|ngất|ngat|khớp|khop/ui', $q)) {
            return "{$prefix}Hãy dừng ngay bài tập đang gây khó chịu nhé! Chườm lạnh trong 15-20 phút nếu bị sưng và tuyệt đối đừng cố gắng tập tiếp. Hãy báo ngay cho Huấn luyện viên (PT) hoặc bác sĩ thể thao để được kiểm tra kỹ càng! 🛡️";
        }

        // 2. Chỉ số thể trạng & dinh dưỡng -> Dạng bảng Markdown tối ưu cho mobile
        if (preg_match('/dinh dưỡng|dinh duong|chỉ số|chi so|bmi|bmr|tdee|calo|macro|protein|thể trạng|the trang|cân nặng|can nang|chieu cao|chiều cao/ui', $q)) {
            if (!empty($context['nutrition'])) {
                $n = $context['nutrition'];
                return "{$prefix}Bảng chỉ số thể trạng & dinh dưỡng cá nhân:\n\n" .
                    "| Chỉ số thể trạng | Giá trị | Đơn vị / Đánh giá |\n" .
                    "| :--- | :--- | :--- |\n" .
                    "| Cân nặng | " . ($n['can_nang'] ?? '—') . " | kg |\n" .
                    "| Chiều cao | " . ($n['chieu_cao_cm'] ?? '—') . " | cm |\n" .
                    "| Chỉ số BMI | " . ($n['bmi'] ?? '—') . " | Thể trạng cân đối |\n" .
                    "| Tiêu hao TDEE | " . ($n['tdee'] ?? '—') . " | kcal/ngày |\n" .
                    "| Năng lượng mục tiêu | " . ($n['kcal_muc_tieu'] ?? '—') . " | kcal/ngày |\n" .
                    "| Đạm (Protein) | " . ($n['protein'] ?? '—') . " | g/ngày |\n" .
                    "| Tinh bột (Carb) | " . ($n['carb'] ?? '—') . " | g/ngày |\n" .
                    "| Chất béo (Fat) | " . ($n['fat'] ?? '—') . " | g/ngày |";
            }
            return "{$prefix}Để duy trì vóc dáng lý tưởng, bạn nên nạp 1.6 - 2.0g Protein/kg cân nặng, uống đủ 2-2.5 lít nước mỗi ngày và bổ sung nhiều rau xanh nhé!";
        }

        // 3. Gợi ý thực đơn món ăn -> Dạng bảng Markdown tối ưu cho mobile
        if (preg_match('/ăn gì|an gi|thực đơn|thuc don|món ăn|mon an|bữa sáng|bua sang|bữa trưa|bua trua|bữa tối|bua toi|eat clean|giảm cân|giam can|giảm mỡ|giam mo|tăng cơ|tang co/ui', $q)) {
            $meals = $context['suggestions']['meals'] ?? [];
            if (!empty($meals)) {
                $res = "{$prefix}Gợi ý thực đơn dinh dưỡng cho bạn:\n\n" .
                    "| Bữa ăn | Tên món ăn | Năng lượng | Đạm (Protein) |\n" .
                    "| :--- | :--- | :--- | :--- |\n";
                foreach (array_slice($meals, 0, 4) as $m) {
                    $cal = !empty($m['calories']) ? "{$m['calories']} kcal" : '—';
                    $pro = !empty($m['protein']) ? "{$m['protein']}g" : '—';
                    $type = $m['meal_type'] ?? 'Món chính';
                    $name = $m['name'] ?? 'Món ăn';
                    $res .= "| {$type} | {$name} | {$cal} | {$pro} |\n";
                }
                return trim($res);
            }
            return "{$prefix}Gợi ý thực đơn Eat Clean chuẩn thể hình:\n• Sáng: Yến mạch + sữa chua Hy Lạp + chuối chín\n• Trưa: 150g Ức gà áp chảo + cơm gạo lứt + bông cải xanh\n• Tối: Cá hồi hoặc thịt nạc bò sốt tiêu + salad dầu oliu! 🥗";
        }

        // 4. Lịch tập -> Dạng bảng Markdown chuẩn Việt Nam
        if (preg_match('/lịch|lich|hôm nay|hom nay|tiếp theo|tiep theo|khi nào tập|khi nao tap|ngày mai|ngay mai/ui', $q)) {
            $schedule = $context['schedule'] ?? [];
            if (!empty($schedule)) {
                $res = "{$prefix}Bảng lịch tập sắp tới của bạn trên hệ thống:\n\n" .
                    "| Buổi tập | Thời gian | Huấn luyện viên (PT) |\n" .
                    "| :--- | :--- | :--- |\n";
                foreach (array_slice($schedule, 0, 5) as $s) {
                    $time = $this->formatVNTime($s['starts_at'] ?? null, $s['scheduled_date'] ?? null);
                    $pt = !empty($s['trainer']) ? $s['trainer'] : 'Chưa có PT';
                    $name = $s['name'] ?? 'Buổi tập';
                    $res .= "| {$name} | {$time} | {$pt} |\n";
                }
                return trim($res) . "\n\nHãy chuẩn bị nước và đồ tập đầy đủ nhé! 💪";
            }
            return "{$prefix}Bạn hãy mở tab \"Kế hoạch tập\" trên ứng dụng để xem chi tiết bài tập được giao cho hôm nay nhé!";
        }

        // 5. Gói tập -> Dạng bảng Markdown chuẩn Việt Nam
        if (preg_match('/gói|goi|hạn|han|buổi còn|buoi con|bao nhiêu buổi|bao nhieu buoi|thẻ|the/ui', $q)) {
            $packages = $context['packages'] ?? [];
            if (!empty($packages)) {
                $res = "{$prefix}Thông tin gói tập hiện tại của bạn:\n\n" .
                    "| Gói tập | Buổi còn lại | Hạn sử dụng |\n" .
                    "| :--- | :--- | :--- |\n";
                foreach ($packages as $p) {
                    $name = $p['name'] ?? 'Gói tập';
                    $rem = isset($p['remaining_sessions']) ? "{$p['remaining_sessions']} buổi" : 'Chưa có dữ liệu';
                    $exp = !empty($p['expires_at']) ? $this->formatVNDate($p['expires_at']) : 'Không giới hạn';
                    $res .= "| {$name} | {$rem} | {$exp} |\n";
                }
                return trim($res);
            }
            return "{$prefix}Bạn có thể xem số buổi tập còn lại và hạn thẻ tập trong mục \"Hồ sơ cá nhân\" > \"Gói tập của tôi\" nhé!";
        }

        // 6. Bài tập, Tập luyện & Khởi động -> Dạng bảng Markdown chuẩn Việt Nam
        if (preg_match('/khởi động|khoi dong|bài tập|bai tap|động tác|dong tac|tập gì|tap gi|ngực|nguc|lưng|lung|chân|chan|tay|bụng|bung|tập luyện|tap luyen|muốn tập|muon tap|luyện tập|luyen tap|kế hoạch tập|ke hoach tap/ui', $q)) {
            if (preg_match('/khởi động|khoi dong/ui', $q)) {
                return "{$prefix}- **⏱️ 4 bước khởi động chuẩn (5 - 10 phút)**\n\n" .
                    "1. Xoay tròn cổ tay, cổ chân, khớp vai và khớp hông (2 phút)\n" .
                    "2. Jumping Jacks hoặc chạy gót chạm mông nhẹ (1 phút)\n" .
                    "3. Giãn cơ động Dynamic Stretching (1 phút)\n" .
                    "4. Đẩy 1 set tạ nhẹ 30% để làm nóng cơ khớp trước khi vào bài chính! 🔥";
            }
            $exercises = $context['suggestions']['exercises'] ?? [];
            if (!empty($exercises)) {
                $res = "{$prefix}Bảng bài tập gợi ý phù hợp cho bạn:\n\n" .
                    "| STT | Tên bài tập | Nhóm cơ | Thiết bị |\n" .
                    "| :--- | :--- | :--- | :--- |\n";
                $idx = 1;
                foreach (array_slice($exercises, 0, 4) as $e) {
                    $name = $e['name'] ?? 'Bài tập';
                    $muscle = $e['muscle_group'] ?? 'Toàn thân';
                    $equip = $e['equipment'] ?? 'Tự do';
                    $res .= "| {$idx} | {$name} | {$muscle} | {$equip} |\n";
                    $idx++;
                }
                return trim($res);
            }
            return "{$prefix}Hôm nay bạn hãy mở tab \"Kế hoạch tập\" để tập theo đúng giáo án được thiết kế cho bạn nhé. Chúc bạn có buổi tập sung sức! 💪";
        }

        // Mặc định
        return "{$prefix}Mình đã nhận câu hỏi: \"{$message}\".\nBạn có thể hỏi mình về chỉ số dinh dưỡng (BMI/BMR/TDEE), gói tập còn lại, thực đơn ăn uống hoặc gợi ý bài tập hôm nay nhé! Chúc bạn luôn giữ vững phong độ tập luyện! 🔥";
    }
}
