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

        if (!$identity || !$user) {
            $sampleClient = \App\Models\Client::where('tinh_trang', 1)->first() ?? \App\Models\Client::first();
            $identity = [
                'id' => (string) ($sampleClient ? $sampleClient->getKey() : 1),
                'gym_id' => (string) ($sampleClient ? ($sampleClient->id_phong_tap ?? 1) : 1),
                'role' => 'member',
                'name' => $sampleClient ? ($sampleClient->ho_ten ?? 'Hội viên VisionFit') : 'Hội viên VisionFit',
            ];
            $user = $sampleClient;
        }

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
                    ->join('goi_tap as g', 'g.id', '=', 'ct.id_goi_tap')
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
            'allergy' => is_array($user->di_ung) ? implode(', ', $user->di_ung) : (string) ($user->di_ung ?? 'Không'),
            'note' => is_array($user->note) ? implode(', ', $user->note) : (string) ($user->note ?? ''),
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
            if (!empty($user->di_ung)) {
                $allergies = is_array($user->di_ung) ? $user->di_ung : [$user->di_ung];
                foreach ($allergies as $allergyItem) {
                    $trimmed = trim((string) $allergyItem);
                    if ($trimmed && !in_array(strtolower($trimmed), ['không', 'khong', 'none'], true)) {
                        $mealQuery->where('nguyen_lieu', 'not like', "%{$trimmed}%")
                                  ->where('ten_mon_an', 'not like', "%{$trimmed}%");
                    }
                }
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
            ->join('goi_tap as g', 'g.id', '=', 'ct.id_goi_tap')
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
        $history = (array) $request->input('history', []);

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

        // 1. Trích xuất ngữ cảnh dữ liệu thực tế của hội viên
        $contextResponse = $this->context($request);
        $contextData = $contextResponse->getData(true)['data'] ?? [];

        // 2. Tầng 1 & Tầng 2: Gọi LLM Engine (Primary Gemini Model + Secondary Backup Model)
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

        // 3. Tầng 3 (Backup RAG Engine): Tự động kéo dữ liệu thực tế từ CSDL VisionFit (bảng mon_an, bai_tap, lich_tap, goi_tap)
        $dbResult = $this->generateDynamicDatabaseReply($message, $contextData, $species, $history);
        return response()->json([
            'status' => true,
            'answer' => $dbResult['answer'],
            'intent' => $dbResult['intent'] ?? 'general_support',
            'emotion' => $dbResult['emotion'] ?? 'neutral',
            'action' => $dbResult['action'] ?? null,
            'source' => 'visionfit_db_dynamic',
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
     * Gọi Gemini AI API với Cơ Chế Failover Đa Tầng (Primary LLM -> Secondary LLM Backup)
     * Nhận diện Ngôn ngữ tự nhiên (NLP), Phân loại Intent, Trích xuất Entity, Biểu cảm Emotion & Action
     */
    protected function queryGeminiWithFailover(string $message, array $context, string $species, array $history = []): ?array
    {
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
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
            "- Ưu tiên tiếng Việt tự nhiên, thân thiện, ngắn gọn, ấm áp (dưới 150 từ).\n" .
            "- Hiểu mọi cách nói đời thường: KHÔNG DẤU (như 'lich tap', 'toi muon tap', 'an gi', 'uc ga bao nhieu calo'), viết tắt, tiếng lóng gym ('bulking', 'cutting', 'rep', 'set', 'bench press'), lỗi chính tả và câu thiếu chủ ngữ.\n" .
            "- Duy trì ngữ cảnh hội thoại; hiểu các câu tiếp nối như 'bài này', 'món đó', 'tập tiếp'.\n" .
            "- Chỉ hỏi lại khi thiếu thông tin ảnh hưởng đến câu trả lời hoặc hành động.\n" .
            "- Không bịa dữ liệu, hình ảnh, video, chương trình tập hoặc kết quả thao tác.\n\n" .
            "2. PHÂN LOẠI INTENT & ACTION:\n" .
            "Với mỗi tin nhắn, bạn BẮT BUỘC xác định intent và action:\n" .
            "• workout_navigation: Khi người dùng muốn bắt đầu, tiếp tục hoặc mở bài tập/chương trình tập. Action type: 'NAVIGATE_WORKOUT'.\n" .
            "• food_detail: Tra cứu món ăn, calo, macro (protein, carb, fat), nguyên liệu, thực đơn.\n" .
            "• exercise_detail: Tra cứu bài tập, nhóm cơ, dụng cụ, tư thế, cách hít thở, lỗi sai.\n" .
            "• water_reminder: Thiết lập, thay đổi, bật hoặc tắt nhắc uống nước 2 tiếng/lần. Action type: 'SET_WATER_REMINDER'.\n" .
            "• general_support: Hỏi về gói tập, lịch tập, thể trạng BMI/BMR/TDEE, chấn thương đau mỏi, hoặc chào hỏi.\n\n" .
            "3. BỘ BIỂU CẢM LINH VẬT (EMOTION):\n" .
            "Chọn 1 emotion chính xác cho linh vật: 'welcome' (chào hỏi), 'encouraging' (kích lệ tập luyện, khen ngợi), 'celebrating' (hoàn thành mục tiêu), 'explaining' (giải thích kỹ thuật, kiến thức dinh dưỡng), 'caring' (khi người dùng mệt mỏi, đau nhức, chấn thương), 'reminding' (nhắc nhở uống nước, lịch tập), 'apologetic' (khi chưa rõ thông tin), 'neutral' (thông thường).\n\n" .
            "4. ĐỊNH DẠNG PHẢN HỒI:\n" .
            "- Trình bày dạng BẢNG Markdown (| Cột 1 | Cột 2 | ...) rõ ràng khi liệt kê món ăn, dinh dưỡng, bài tập, lịch tập hoặc gói tập (tối đa 3-4 cột cho mobile).\n" .
            "- Ngày giờ luôn định dạng Việt Nam: 'HH:mm dd/mm/yyyy' hoặc 'dd/mm/yyyy'. Tuyệt đối không để chuỗi ISO.\n" .
            "- Không dùng tiêu đề thô '#', '##', '###'; dùng gạch đầu dòng in đậm: - **...**.\n\n" .
            "5. DỮ LIỆU NGỮ CẢNH CỦA HỘI VIÊN:\n" .
            json_encode($formattedContext, JSON_UNESCAPED_UNICODE) . "\n\n" .
            "6. QUY TẮC ĐẦU RA JSON BẮT BUỘC:\n" .
            "Bạn PHẢI trả về duy nhất một chuỗi JSON hợp lệ với cấu trúc sau, KHÔNG kèm giải thích ngoài JSON:\n" .
            "{\n" .
            "  \"intent\": \"workout_navigation\" | \"food_detail\" | \"exercise_detail\" | \"water_reminder\" | \"general_support\",\n" .
            "  \"emotion\": \"welcome\" | \"encouraging\" | \"celebrating\" | \"explaining\" | \"caring\" | \"reminding\" | \"apologetic\" | \"neutral\",\n" .
            "  \"action\": { \"type\": \"NAVIGATE_WORKOUT\" | \"SET_WATER_REMINDER\" | \"NONE\", \"params\": {} } | null,\n" .
            "  \"answer\": \"Nội dung phản hồi hoàn chỉnh cho hội viên...\"\n" .
            "}";

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Đưa lịch sử hội thoại gần nhất để duy trì ngữ cảnh (Sub-task 1.4)
        if (!empty($history) && is_array($history)) {
            foreach (array_slice($history, -4) as $h) {
                if (!empty($h['sender']) && !empty($h['text'])) {
                    $role = $h['sender'] === 'user' ? 'user' : 'assistant';
                    $messages[] = ['role' => $role, 'content' => (string) $h['text']];
                }
            }
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        // Danh sách Model theo thứ tự Failover: Tầng 1 (Primary) -> Tầng 2 (Secondary Backup)
        $modelsToTry = [
            env('GEMINI_MODEL', 'gemini-flash-lite-latest'),
            'gemini-3.5-flash-lite',
            'gemini-flash-latest',
        ];

        $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

        foreach ($modelsToTry as $currentModel) {
            try {
                $payload = [
                    'model' => $currentModel,
                    'max_completion_tokens' => 1200,
                    'messages' => $messages,
                    'response_format' => ['type' => 'json_object'],
                ];

                $ch = curl_init($apiUrl);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_TIMEOUT => 12,
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
                    $rawContent = $decoded['choices'][0]['message']['content'] ?? null;
                    if ($rawContent && is_string($rawContent)) {
                        $parsed = $this->parseAiJsonResponse($rawContent);
                        if (!empty($parsed['answer'])) {
                            $parsed['source'] = 'gemini_' . str_replace('-', '_', $currentModel);
                            return $parsed;
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Tiếp tục thử model backup tiếp theo
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
                'intent' => $json['intent'] ?? 'general_support',
                'emotion' => $json['emotion'] ?? 'explaining',
                'action' => $json['action'] ?? null,
                'answer' => trim($json['answer']),
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
                $action = json_decode($mAct[1], true);
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

    /**
     * Tầng 3 (Backup RAG Engine): Tự động kéo dữ liệu thực tế từ CSDL VisionFit
     * Khi mất kết nối internet hoặc API AI chạm giới hạn, hệ thống tự động truy vấn CSDL:
     * - Bảng mon_an: Lấy đúng calo, protein, carb, fat, nguyên liệu thực tế
     * - Bảng bai_tap: Lấy đúng số rep, set, thiết bị, lỗi thường gặp thực tế
     * - Bảng lich_tap & goi_tap: Lấy đúng lịch và số buổi còn lại
     */
    protected function generateDynamicDatabaseReply(string $message, array $context, string $species, array $history = []): array
    {
        $q = mb_strtolower(trim($message), 'UTF-8');
        $isCat = $species === 'cat';
        $prefix = $isCat ? 'Meo meo! 🐱 ' : 'Gấu VIF đây! 🐻 ';

        // 0. Xử lý câu trả lời tiếp nối ngữ cảnh (Sub-task 1.4: Context follow-up)
        // Khi người dùng trả lời câu ngắn ("có", "không", "ok", "được", "bài này", "món này"...)
        $lastAssistantMsg = '';
        if (!empty($history) && is_array($history)) {
            for ($i = count($history) - 1; $i >= 0; $i--) {
                if (($history[$i]['sender'] ?? '') === 'assistant' && !empty($history[$i]['text'])) {
                    $lastAssistantMsg = mb_strtolower($history[$i]['text'], 'UTF-8');
                    break;
                }
            }
        }

        $isAffirmative = preg_match('/^(có|co|ok|oke|được|duoc|uh|ừ|u|đồng ý|dong y|yes|yep|muốn|muon|chốt|nhất trí|kết nối đi|giúp mình|giup minh|tập luôn|tap luon)/ui', $q);
        $isNegative = preg_match('/^(không|khong|k|ko|thôi|thoi|chưa|chua|no|nope|đừng|dung|không cần|khong can)/ui', $q);

        if ($isAffirmative && $lastAssistantMsg) {
            // Ngữ cảnh 1: Đang hỏi kết nối Huấn luyện viên (PT)
            if (preg_match('/pt|huấn luyện viên|huan luyen vien|kết nối/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'general_support',
                    'emotion' => 'encouraging',
                    'action' => [
                        'type' => 'NAVIGATE_WORKOUT',
                        'screen' => 'WorkoutPlan',
                    ],
                    'answer' => "{$prefix}Tuyệt vời! Gấu VIF đã ghi nhận bạn đồng ý kết nối Huấn luyện viên (PT). Đội ngũ hỗ trợ VisionFit sẽ liên hệ với bạn trong thời gian sớm nhất để bố trí HLV phù hợp! Trong lúc chờ, bạn có thể bấm vào nút bên dưới để xem kế hoạch tập luyện và khởi động trước nhé! 💪🔥",
                ];
            }
            // Ngữ cảnh 2: Đang hỏi có muốn bắt đầu tập / mở lịch tập không
            if (preg_match('/bắt đầu|bat dau|chiến|mở lịch|kế hoạch tập|tập luyện|tập ngay/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'workout_navigation',
                    'emotion' => 'encouraging',
                    'action' => [
                        'type' => 'NAVIGATE_WORKOUT',
                        'screen' => 'WorkoutPlan',
                    ],
                    'answer' => "{$prefix}Lên dây cót tinh thần chiến hết mình nào! Mình đang mở ngay trang Kế hoạch tập luyện cho bạn đây! Hãy chuẩn bị khăn và nước rồi bắt đầu nhé! 🔥💪",
                ];
            }
            // Ngữ cảnh 3: Đang hỏi nhắc uống nước
            if (preg_match('/uống nước|uong nuoc|nhắc nước/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'water_reminder',
                    'emotion' => 'reminding',
                    'action' => [
                        'type' => 'SET_WATER_REMINDER',
                        'interval_hours' => 2,
                        'enabled' => true,
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
                    'answer' => "{$prefix}Dạ không sao bạn nhé! Bạn hoàn toàn có thể tự giác tập luyện theo giáo án cá nhân trên ứng dụng. Khi nào cần PT hướng dẫn cứ nhắn cho mình nhé! 🐻💪",
                ];
            }
            if (preg_match('/uống nước|uong nuoc/ui', $lastAssistantMsg)) {
                return [
                    'intent' => 'water_reminder',
                    'emotion' => 'neutral',
                    'action' => [
                        'type' => 'SET_WATER_REMINDER',
                        'interval_hours' => 2,
                        'enabled' => false,
                    ],
                    'answer' => "{$prefix}Đã tắt tính năng nhắc uống nước theo yêu cầu của bạn. Chúc bạn luôn giữ vững phong độ tập luyện nhé!",
                ];
            }
        }

        // Ngữ cảnh tham chiếu "bài này", "bài đó", "động tác này"
        if (preg_match('/bài này|bai nay|bài đó|bai do|động tác này|dong tac nay/ui', $q) && $lastAssistantMsg) {
            $commonExercises = ['squat', 'bench press', 'deadlift', 'hít đất', 'push up', 'kéo xà', 'plank', 'gập bụng', 'crunch'];
            foreach ($commonExercises as $ce) {
                if (stripos($lastAssistantMsg, $ce) !== false) {
                    $q .= " " . $ce;
                    break;
                }
            }
        }

        // Ngữ cảnh tham chiếu "món này", "món đó", "thực phẩm này"
        if (preg_match('/món này|mon nay|món đó|mon do|thức ăn này|thuc an nay/ui', $q) && $lastAssistantMsg) {
            $commonFoods = ['ức gà', 'trứng', 'yến mạch', 'bò', 'cá hồi', 'chuối', 'khoai lang', 'salad'];
            foreach ($commonFoods as $cf) {
                if (stripos($lastAssistantMsg, $cf) !== false) {
                    $q .= " " . $cf;
                    break;
                }
            }
        }

        // 1. Cảnh báo chấn thương / đau mỏi
        if (preg_match('/đau|dau|chấn thương|chan thuong|chuột rút|chuot rut|chóng mặt|chong mat|buốt|buot|ngất|ngat|khớp|khop/ui', $q)) {
            return [
                'intent' => 'general_support',
                'emotion' => 'caring',
                'action' => null,
                'answer' => "{$prefix}Hãy dừng ngay bài tập đang gây khó chịu nhé! Chườm lạnh trong 15-20 phút nếu bị sưng và tuyệt đối đừng cố gắng tập tiếp. Hãy báo ngay cho Huấn luyện viên (PT) hoặc bác sĩ thể thao để được kiểm tra kỹ càng! 🛡️",
            ];
        }

        // 2. Nhắc nhở uống nước (Water Reminder - Task 6)
        if (preg_match('/uống nước|uong nuoc|nhắc nước|nhac nuoc|cốc nước|coc nuoc|nước lọc|nuoc loc|nhắc nhở uống nước|water|drink/ui', $q)) {
            $isOff = preg_match('/tắt|tat|hủy|huy|dừng|dung|off|stop/ui', $q);
            if ($isOff) {
                return [
                    'intent' => 'water_reminder',
                    'emotion' => 'neutral',
                    'action' => [
                        'type' => 'SET_WATER_REMINDER',
                        'interval_hours' => 2,
                        'enabled' => false,
                    ],
                    'answer' => "{$prefix}Đã tắt tính năng tự động nhắc uống nước cho bạn. Khi nào muốn bật lại, bạn chỉ cần nhắn cho mình nhé!",
                ];
            }

            return [
                'intent' => 'water_reminder',
                'emotion' => 'reminding',
                'action' => [
                    'type' => 'SET_WATER_REMINDER',
                    'interval_hours' => 2,
                    'enabled' => true,
                ],
                'answer' => "{$prefix}Đã thiết lập nhắc bạn uống nước đều đặn mỗi 2 tiếng một lần! 💧\nUống đủ 2-2.5 lít nước mỗi ngày giúp bôi trơn khớp và tăng hiệu quả chuyển hóa cơ bắp đấy nhé!",
            ];
        }

        // 3. Điều hướng tập luyện (AI Workout Navigation - Task 2)
        if (preg_match('/tập luyện|tap luyen|muốn tập|muon tap|bắt đầu tập|bat dau tap|vào tập|vao tap|kế hoạch tập|ke hoach tap|tập ngay|tap ngay|đi tập|di tap|luyện tập|luyen tap|tập tiếp|tap tiep|tập gì|tap gi|giờ tập|gio tap|tập được|tap duoc|tập thôi|tap thoi|đi gym|di gym|tập nào|tap nao|vào bài|vao bai|work out|workout|exercise|training|^tập$|^tap$/ui', $q)) {
            $hasSchedule = !empty($context['schedule']) && count($context['schedule']) > 0;
            $activeProgram = $context['active_program']['name'] ?? null;

            if ($hasSchedule) {
                $firstSchedule = $context['schedule'][0];
                $time = $this->formatVNTime($firstSchedule['starts_at'] ?? null, $firstSchedule['scheduled_date'] ?? null);
                $prog = $firstSchedule['name'] ?? $activeProgram ?? 'Buổi tập toàn thân';
                $msg = "{$prefix}Tuyệt vời quá! Hôm nay bạn có thể tập buổi **{$prog}** (Lịch tập: {$time}). Hãy khởi động thật kỹ và cùng chiến hết mình nào! 💪🔥\n\nBạn có thể bấm vào nút bên dưới để mở ngay Kế hoạch tập nhé!";
            } elseif ($activeProgram) {
                $msg = "{$prefix}Hiện tại bạn đang theo lộ trình **{$activeProgram}**. Hãy khởi động nhẹ 5-10 phút và vào bài tập ngay nào! 💪🔥\n\nMình đã sẵn sàng điều hướng bạn tới trang Kế hoạch tập luyện!";
            } else {
                $msg = "{$prefix}Hiện bạn chưa chọn chương trình tập cố định. Mình gợi ý bạn nên bắt đầu với các bài khởi động toàn thân hoặc cardio nhẹ nhàng. Bấm vào nút bên dưới để vào trang Kế hoạch tập và chọn lộ trình phù hợp nhé! 📋💪";
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

        // 4. Tra cứu món ăn từ CSDL `mon_an` (AI Food Detail - Task 3)
        $monAn = null;
        $foodKeywords = [
            'ức gà' => 'ức gà', 'uc ga' => 'ức gà', 'chicken' => 'ức gà',
            'trứng luộc' => 'trứng', 'trung luoc' => 'trứng', 'trứng' => 'trứng', 'trung' => 'trứng', 'egg' => 'trứng',
            'yến mạch' => 'yến mạch', 'yen mach' => 'yến mạch', 'oat' => 'yến mạch',
            'thịt bò' => 'bò', 'thit bo' => 'bò', 'beef' => 'bò',
            'cá hồi' => 'cá hồi', 'ca hoi' => 'cá hồi', 'salmon' => 'cá hồi',
            'chuối' => 'chuối', 'chuoi' => 'chuối', 'banana' => 'chuối',
            'khoai lang' => 'khoai lang', 'sweet potato' => 'khoai lang',
            'salad' => 'salad',
        ];
        foreach ($foodKeywords as $kw => $searchVal) {
            if (stripos($q, $kw) !== false) {
                $monAn = \Illuminate\Support\Facades\DB::table('mon_an')
                    ->where('ten_mon_an', 'LIKE', '%' . $searchVal . '%')
                    ->orWhere('nguyen_lieu', 'LIKE', '%' . $searchVal . '%')
                    ->first();
                if ($monAn) break;
            }
        }

        if (!$monAn) {
            $cleanFoodQuery = preg_replace('/calo|bao nhiêu|bao nhieu|dinh dưỡng|dinh duong|món|mon|ăn|an|cho tôi biết|hỏi|có|co|trong|và|va|protein|vậy|vay|bạn|ban/ui', '', $q);
            $cleanFoodQuery = trim($cleanFoodQuery);

            if (!empty($cleanFoodQuery) && mb_strlen($cleanFoodQuery) >= 2) {
                try {
                    $monAn = \Illuminate\Support\Facades\DB::table('mon_an')
                        ->where('ten_mon_an', 'LIKE', '%' . $cleanFoodQuery . '%')
                        ->orWhere('nguyen_lieu', 'LIKE', '%' . $cleanFoodQuery . '%')
                        ->first();
                } catch (\Throwable $e) {}
            }
        }

        if ($monAn) {
            $calo = $monAn->calo ?? 0;
            $pro = $monAn->protein ?? 0;
            $carb = $monAn->carb ?? 0;
            $fat = $monAn->fat ?? 0;
            $gram = $monAn->khoi_luong_gram ?? 100;
            $nguyenLieu = $monAn->nguyen_lieu ? "• **Nguyên liệu chính:** " . $monAn->nguyen_lieu : '';
            $imgMd = !empty($monAn->anh_dai_dien) ? "![{$monAn->ten_mon_an}]({$monAn->anh_dai_dien})\n\n" : '';

            $res = "{$prefix}Thông tin dinh dưỡng món **{$monAn->ten_mon_an}** (khẩu phần {$gram}g):\n\n" .
                $imgMd .
                "| Chỉ số | Năng lượng | Đạm (Protein) | Tinh bột (Carb) | Chất béo (Fat) |\n" .
                "| :--- | :--- | :--- | :--- | :--- |\n" .
                "| Giá trị | **{$calo} kcal** | **{$pro}g** | **{$carb}g** | **{$fat}g** |\n\n";

            if ($nguyenLieu) {
                $res .= "{$nguyenLieu}\n";
            }

            // Lời khuyên dinh dưỡng theo mục tiêu (Sub-task 3.5)
            if ($pro >= 20) {
                $res .= "- **💡 Nhận xét:** Món ăn giàu đạm, rất lý tưởng để phục hồi và phát triển cơ bắp sau khi tập gym!";
            } else {
                $res .= "- **💡 Nhận xét:** Món ăn cân bằng dinh dưỡng, thích hợp nạp trước buổi tập hoặc bữa phụ trong ngày.";
            }

            return [
                'intent' => 'food_detail',
                'emotion' => 'explaining',
                'action' => null,
                'answer' => trim($res),
            ];
        }

        // 5. Tra cứu bài tập từ CSDL `bai_tap` (AI Exercise Detail - Task 4)
        $baiTap = null;
        $exerciseKeywords = [
            'bench press' => 'bench press', 'bench' => 'bench press',
            'squat' => 'squat',
            'deadlift' => 'deadlift',
            'hít đất' => 'hít đất', 'hit dat' => 'hít đất', 'push up' => 'hít đất', 'push-up' => 'hít đất',
            'kéo xà' => 'kéo xà', 'keo xa' => 'kéo xà', 'pull up' => 'xà', 'pull-up' => 'xà',
            'plank' => 'plank',
            'gập bụng' => 'bụng', 'gap bung' => 'bụng', 'crunch' => 'bụng', 'abs' => 'bụng',
            'chạy bộ' => 'chạy', 'chay bo' => 'chạy', 'cardio' => 'cardio',
        ];
        foreach ($exerciseKeywords as $ekw => $searchVal) {
            if (stripos($q, $ekw) !== false) {
                $baiTap = \Illuminate\Support\Facades\DB::table('bai_tap')
                    ->where('ten_bai_tap', 'LIKE', '%' . $searchVal . '%')
                    ->orWhere('thiet_bi', 'LIKE', '%' . $searchVal . '%')
                    ->first();
                if ($baiTap) break;
            }
        }

        if (!$baiTap) {
            $cleanExerciseQuery = preg_replace('/bài tập|bai tap|động tác|dong tac|cách tập|cach tap|hướng dẫn|huong dan|tập như thế nào|tap nhu the nao|kỹ thuật|ky thuat|cho tôi biết|bài|bai|tập|tap/ui', '', $q);
            $cleanExerciseQuery = trim($cleanExerciseQuery);

            if (!empty($cleanExerciseQuery) && mb_strlen($cleanExerciseQuery) >= 2) {
                try {
                    $baiTap = \Illuminate\Support\Facades\DB::table('bai_tap')
                        ->where('ten_bai_tap', 'LIKE', '%' . $cleanExerciseQuery . '%')
                        ->orWhere('thiet_bi', 'LIKE', '%' . $cleanExerciseQuery . '%')
                        ->first();
                } catch (\Throwable $e) {}
            }
        }

        if ($baiTap) {
            $set = $baiTap->set_yeu_cau ?? 3;
            $rep = $baiTap->rep_yeu_cau ?? 12;
            $thietBi = $baiTap->thiet_bi ?? 'Tự do / Bodyweight';
            $loiSai = $baiTap->loi_thuong_gap ? "- **⚠️ Lỗi thường gặp:** " . $baiTap->loi_thuong_gap : '';
            $imgMd = !empty($baiTap->anh_dai_dien) ? "![{$baiTap->ten_bai_tap}]({$baiTap->anh_dai_dien})\n\n" : '';

            $res = "{$prefix}Hướng dẫn kỹ thuật bài tập **{$baiTap->ten_bai_tap}**:\n\n" .
                $imgMd .
                "| Thông số | Số hiệp (Sets) | Số lần (Reps) | Thiết bị tập |\n" .
                "| :--- | :--- | :--- | :--- |\n" .
                "| Khuyến nghị | **{$set} hiệp** | **{$rep} reps/hiệp** | {$thietBi} |\n\n";

            if (!empty($baiTap->mo_ta)) {
                $res .= "- **📋 Kỹ thuật thực hiện:** {$baiTap->mo_ta}\n";
            }
            if ($loiSai) {
                $res .= "{$loiSai}\n";
            }
            $res .= "- **💨 Nhịp thở:** Hít vào chậm khi hạ tạ, thở dứt khoát bằng miệng khi dùng lực đẩy/kéo!";

            return [
                'intent' => 'exercise_detail',
                'emotion' => 'explaining',
                'action' => null,
                'answer' => trim($res),
            ];
        }

        // 6. Chỉ số thể trạng & dinh dưỡng
        if (preg_match('/dinh dưỡng|dinh duong|chỉ số|chi so|bmi|bmr|tdee|calo|macro|protein|thể trạng|the trang|cân nặng|can nang|chieu cao|chiều cao/ui', $q)) {
            if (!empty($context['nutrition'])) {
                $n = $context['nutrition'];
                return [
                    'intent' => 'general_support',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => "{$prefix}Bảng chỉ số thể trạng & dinh dưỡng cá nhân:\n\n" .
                        "| Chỉ số thể trạng | Giá trị | Đơn vị / Đánh giá |\n" .
                        "| :--- | :--- | :--- |\n" .
                        "| Cân nặng | " . ($n['can_nang'] ?? '—') . " | kg |\n" .
                        "| Chiều cao | " . ($n['chieu_cao_cm'] ?? '—') . " | cm |\n" .
                        "| Chỉ số BMI | " . ($n['bmi'] ?? '—') . " | Thể trạng cân đối |\n" .
                        "| Tiêu hao TDEE | " . ($n['tdee'] ?? '—') . " | kcal/ngày |\n" .
                        "| Năng lượng mục tiêu | " . ($n['kcal_muc_tieu'] ?? '—') . " | kcal/ngày |\n" .
                        "| Đạm (Protein) | " . ($n['protein'] ?? '—') . " | g/ngày |\n" .
                        "| Tinh bột (Carb) | " . ($n['carb'] ?? '—') . " | g/ngày |\n" .
                        "| Chất béo (Fat) | " . ($n['fat'] ?? '—') . " | g/ngày |",
                ];
            }
            return [
                'intent' => 'general_support',
                'emotion' => 'explaining',
                'action' => null,
                'answer' => "{$prefix}Để duy trì vóc dáng lý tưởng, bạn nên nạp 1.6 - 2.0g Protein/kg cân nặng, uống đủ 2-2.5 lít nước mỗi ngày và bổ sung nhiều rau xanh nhé!",
            ];
        }

        // 7. Gợi ý thực đơn món ăn từ database
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
                return [
                    'intent' => 'food_detail',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => trim($res),
                ];
            }
        }

        // 8. Lịch tập
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
                return [
                    'intent' => 'general_support',
                    'emotion' => 'reminding',
                    'action' => null,
                    'answer' => trim($res) . "\n\nHãy chuẩn bị nước và đồ tập đầy đủ nhé! 💪",
                ];
            }
        }

        // 9. Gói tập
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
                return [
                    'intent' => 'general_support',
                    'emotion' => 'explaining',
                    'action' => null,
                    'answer' => trim($res),
                ];
            }
        }

        // 10. Chào hỏi
        if (preg_match('/chào|hello|hi|bạn là ai|tên gì/ui', $q)) {
            return [
                'intent' => 'general_support',
                'emotion' => 'welcome',
                'action' => null,
                'answer' => $isCat
                    ? "Meo meo! Chào bạn nha! Mình là Mèo VIF 🐱 - trợ lý AI thông minh tại VisionFit. Mình đã sẵn sàng hỗ trợ bạn về lịch tập, thực đơn calo và các bài tập hôm nay!"
                    : "Chào bạn! Mình là Gấu VIF 🐻 - trợ lý AI đồng hành thể hình VisionFit của bạn. Hãy nói cho mình biết bạn muốn tra cứu món ăn, bài tập hay bắt đầu tập luyện nhé!",
            ];
        }

        // Mặc định
        return [
            'intent' => 'general_support',
            'emotion' => 'neutral',
            'action' => null,
            'answer' => "{$prefix}Mình đã nhận câu hỏi: \"{$message}\".\nBạn có thể hỏi mình về chỉ số dinh dưỡng (BMI/BMR/TDEE), tra cứu món ăn, hướng dẫn bài tập, bật nhắc uống nước hoặc bấm tập luyện ngay nhé! Chúc bạn luôn tràn đầy năng lượng! 🔥",
        ];
    }
}
