<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\Log;

/**
 * Core Gemini Function Calling Orchestrator.
 *
 * Flow:
 *   User message -> LLM chooses tools & params -> Backend validates auth/role/args & executes
 *   -> Sends tool responses back to LLM (preserving provider metadata like thoughtSignature)
 *   -> LLM synthesizes final answer grounded strictly in tool results.
 *
 * No keyword/regex intent classification before LLM.
 * No silent regex/scripted fallback when providers fail — returns structured service error instead.
 */
class AssistantOrchestrator
{
    public function __construct(
        private readonly LlmClientInterface $primaryClient,
        private readonly AssistantToolRegistry $toolRegistry,
        private readonly FitnessDataService $dataService,
        private readonly ?LlmClientInterface $backupClient = null,
    ) {
    }

    /**
     * @param array<int, array<string, mixed>> $history
     * @return array{
     *   status: bool,
     *   http_status: int,
     *   answer: string,
     *   intent: string,
     *   emotion: string,
     *   action: ?array<string, mixed>,
     *   source: string,
     *   tool_calls: array<int, array<string, mixed>>,
     *   error_code?: string,
     *   retryable?: bool
     * }
     */
    public function handleChat(
        string $message,
        array $history,
        string $species,
        AssistantAuthContext $actor
    ): array {
        $maxRounds = max(1, (int) config('assistant.max_tool_rounds', 5));
        $maxRetries = max(0, (int) config('assistant.max_retries_per_call', 1));
        $totalBudgetSec = max(5, (int) config('assistant.total_timeout_seconds', 25));
        $deadline = microtime(true) + $totalBudgetSec;

        $systemPrompt = $this->buildSystemPrompt($species, $actor);
        $declarations = $this->toolRegistry->declarationsFor($actor);
        $providers = $this->buildProviderQueue();

        if (empty($providers)) {
            return $this->serviceErrorResponse(
                'AI_KEY_MISSING',
                'Dịch vụ trợ lý AI chưa được cấu hình khóa API (GEMINI_API_KEY). Vui lòng liên hệ quản trị viên.',
                false
            );
        }

        $lastError = null;

        foreach ($providers as $providerSpec) {
            $remaining = $deadline - microtime(true);
            if ($remaining <= 1.0) {
                $lastError = new LlmProviderException('AI_TIMEOUT', 'Yêu cầu trợ lý AI vượt quá thời gian xử lý cho phép.', 503, true);
                break;
            }

            try {
                return $this->runConversationLoop(
                    $providerSpec['client'],
                    $providerSpec['model'],
                    $systemPrompt,
                    $history,
                    $message,
                    $declarations,
                    $actor,
                    $maxRounds,
                    $maxRetries,
                    $deadline
                );
            } catch (LlmProviderException $e) {
                $lastError = $e;
                Log::warning('[AssistantOrchestrator] Provider attempt failed', [
                    'model' => $providerSpec['model'],
                    'error_code' => $e->errorCode,
                    'retryable' => $e->retryable,
                ]);
                if ($e->errorCode === 'AI_KEY_MISSING' || $e->errorCode === 'AI_AUTH_ERROR' || $e->errorCode === 'AI_MAX_ROUNDS_EXCEEDED') {
                    // Lỗi khóa API hoặc vượt vòng lặp -> dừng ngay, không lặp vô ích
                    if ($e->errorCode === 'AI_MAX_ROUNDS_EXCEEDED') {
                        break;
                    }
                    if ($providerSpec['tier'] === 'primary' && count($providers) === 1) {
                        break;
                    }
                }
            }
        }

        $code = $lastError?->errorCode ?? 'AI_PROVIDER_UNAVAILABLE';
        $retryable = $lastError?->retryable ?? true;
        $userMessage = match ($code) {
            'AI_KEY_MISSING' => 'Trợ lý AI hiện chưa được cấu hình khóa API. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
            'AI_QUOTA_EXCEEDED' => 'Trợ lý AI hiện đang quá tải hoặc tạm hết hạn mức. Bạn vui lòng đợi một lát rồi bấm thử lại nhé!',
            'AI_TIMEOUT' => 'Kết nối tới trợ lý AI đang chậm hơn bình thường. Bạn vui lòng bấm thử lại nhé!',
            'AI_MAX_ROUNDS_EXCEEDED' => 'Trợ lý AI cần quá nhiều bước tra cứu cho câu hỏi này. Bạn hãy thử hỏi gọn hơn hoặc thử lại nhé!',
            default => 'Dịch vụ trợ lý AI đang tạm gián đoạn nên chưa thể tra cứu lúc này. Bạn vui lòng bấm thử lại sau nhé!',
        };

        return $this->serviceErrorResponse($code, $userMessage, $retryable);
    }

    private function runConversationLoop(
        LlmClientInterface $client,
        string $model,
        string $systemPrompt,
        array $history,
        string $message,
        array $declarations,
        AssistantAuthContext $actor,
        int $maxRounds,
        int $maxRetries,
        float $deadline
    ): array {
        $contents = $this->buildInitialContents($history, $message);
        $toolTrace = [];
        $finalAction = null;
        $intentHint = 'general_support';
        $rounds = 0;

        while ($rounds < $maxRounds) {
            $rounds++;
            $remainingSec = (int) floor($deadline - microtime(true));
            if ($remainingSec < 2) {
                throw new LlmProviderException('AI_TIMEOUT', 'Vượt quá tổng thời gian xử lý của trợ lý AI.', 503, true);
            }

            $turn = $this->callWithRetry(
                $client,
                $model,
                $systemPrompt,
                $contents,
                $declarations,
                min(12, $remainingSec),
                $maxRetries
            );

            $functionCalls = $turn['function_calls'] ?? [];

            // Không còn yêu cầu gọi hàm -> xác minh tính nhất quán thứ/ngày (Asia/Ho_Chi_Minh) rồi trả câu trả lời cuối
            if (empty($functionCalls)) {
                $answer = trim((string) ($turn['text'] ?? ''));
                if ($answer === '') {
                    throw new LlmProviderException('AI_MALFORMED_RESPONSE', 'Mô hình AI trả về nội dung rỗng.', 503, true);
                }

                $verified = VietnameseDateVerifier::repairMismatchedWeekdays($answer);
                if (!empty($verified['mismatches'])) {
                    Log::warning('[AssistantOrchestrator] Repaired mismatched Vietnamese weekday in LLM answer', [
                        'mismatches' => $verified['mismatches'],
                    ]);
                    $answer = $verified['text'];
                }

                $emotion = $this->resolveEmotion($toolTrace, $finalAction);
                return [
                    'status' => true,
                    'http_status' => 200,
                    'answer' => $answer,
                    'intent' => $intentHint,
                    'emotion' => $emotion,
                    'action' => $finalAction,
                    'source' => ($turn['provider'] ?? 'gemini_fc') . ':' . ($turn['model'] ?? $model),
                    'tool_calls' => $toolTrace,
                ];
            }

            // Bảo toàn toàn bộ model turn (gồm thoughtSignature, thought, functionCall...) theo đúng spec Gemini REST
            $contents[] = $turn['raw_model_content'];

            // Thực thi toàn bộ các công cụ mà LLM yêu cầu trong lượt này (hỗ trợ multi-tool song song)
            $responseParts = [];
            foreach ($functionCalls as $fc) {
                $fcName = (string) $fc['name'];
                $fcArgs = is_array($fc['args']) ? $fc['args'] : [];
                $exec = $this->toolRegistry->execute($fcName, $fcArgs, $actor);

                $toolTrace[] = [
                    'name' => $fcName,
                    'args' => $this->redactTraceArgs($fcArgs),
                    'status' => (string) ($exec['result']['status'] ?? 'ok'),
                    'method' => $exec['api_call']['method'] ?? null,
                    'endpoint' => $exec['api_call']['endpoint'] ?? null,
                    'http_status' => $exec['api_call']['http_status'] ?? null,
                ];

                if (!empty($exec['intent_hint'])) {
                    $intentHint = $exec['intent_hint'];
                }
                if (!empty($exec['side_effect_action'])) {
                    // Ưu tiên action điều hướng hoặc nhắc nước hợp lệ mới nhất
                    $finalAction = $exec['side_effect_action'];
                }

                $fnResp = [
                    'name' => $fcName,
                    'response' => $exec['result'],
                ];
                if (!empty($fc['id'])) {
                    $fnResp['id'] = $fc['id'];
                }
                $responseParts[] = ['functionResponse' => $fnResp];
            }

            $contents[] = [
                'role' => 'user',
                'parts' => $responseParts,
            ];
        }

        throw new LlmProviderException(
            'AI_MAX_ROUNDS_EXCEEDED',
            "Đã vượt giới hạn {$maxRounds} vòng gọi công cụ.",
            503,
            true
        );
    }

    private function callWithRetry(
        LlmClientInterface $client,
        string $model,
        string $systemPrompt,
        array $contents,
        array $declarations,
        int $timeoutSec,
        int $maxRetries
    ): array {
        $attempt = 0;
        while (true) {
            try {
                return $client->generateTurn($model, $systemPrompt, $contents, $declarations, $timeoutSec);
            } catch (LlmProviderException $e) {
                $attempt++;
                $canRetry = $attempt <= $maxRetries
                    && $e->retryable
                    && in_array($e->errorCode, ['AI_TIMEOUT', 'AI_PROVIDER_ERROR'], true);
                if (!$canRetry) {
                    throw $e;
                }
            }
        }
    }

    /**
     * Build ordered list of verified tool-calling models + optional backup tool-calling provider.
     *
     * @return array<int, array{tier: string, client: LlmClientInterface, model: string}>
     */
    private function buildProviderQueue(): array
    {
        $queue = [];
        $primaryKey = config('assistant.gemini_api_key');

        // Cho phép fake client được inject trong kiểm thử ngay cả khi không đặt key thật,
        // nhưng nếu dùng GeminiFunctionCallingClient thật mà thiếu key -> trả rỗng để báo AI_KEY_MISSING.
        $isRealGeminiClient = $this->primaryClient instanceof GeminiFunctionCallingClient;
        if (!$isRealGeminiClient || (is_string($primaryKey) && trim($primaryKey) !== '')) {
            $primaryModel = (string) config('assistant.gemini_model', 'gemini-2.5-flash');
            $fallbacks = (array) config('assistant.gemini_fallback_models', []);
            $models = array_values(array_unique(array_filter(array_merge([$primaryModel], $fallbacks))));
            foreach ($models as $m) {
                $queue[] = [
                    'tier' => 'primary',
                    'client' => $this->primaryClient,
                    'model' => $m,
                ];
            }
        }

        if ($this->backupClient !== null) {
            $backupModel = trim((string) config('assistant.backup_model', ''));
            if ($backupModel !== '') {
                $queue[] = [
                    'tier' => 'backup',
                    'client' => $this->backupClient,
                    'model' => $backupModel,
                ];
            }
        }

        return $queue;
    }

    private function buildInitialContents(array $history, string $message): array
    {
        $contents = [];
        foreach (array_slice($history, -8) as $h) {
            if (!is_array($h) || empty($h['text']) || !is_string($h['text'])) {
                continue;
            }
            $role = ($h['sender'] ?? '') === 'user' ? 'user' : 'model';
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => mb_substr(trim($h['text']), 0, 1200, 'UTF-8')]],
            ];
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $message]],
        ];

        return $contents;
    }

    private function buildSystemPrompt(string $species, AssistantAuthContext $actor): string
    {
        $now = $this->dataService->nowVN();
        $tomorrow = $now->addDay();
        $todayIso = $now->toDateString();
        $todayVN = $now->format('d/m/Y');
        $timeVN = $now->format('H:i');
        $tomorrowIso = $tomorrow->toDateString();
        $weekday = VietnameseDateVerifier::weekdayVn($now);
        $tomorrowWeekday = VietnameseDateVerifier::weekdayVn($tomorrow);

        $persona = $species === 'cat'
            ? 'Bạn là Mèo VIF 🐱 — trợ lý linh vật thể hình VisionFit tinh nghịch, thân thiện, khích lệ người tập.'
            : 'Bạn là Gấu VIF 🐻 — trợ lý linh vật thể hình VisionFit khỏe khoắn, ấm áp, luôn đồng hành cùng người tập.';

        $actorLine = $actor->authenticated
            ? "Trạng thái phiên: ĐÃ ĐĂNG NHẬP | Vai trò đã xác thực bởi server: {$actor->role} | Tên hiển thị: {$actor->name}."
            : 'Trạng thái phiên: CHƯA ĐĂNG NHẬP (khách). Không có dữ liệu cá nhân; chỉ được trả lời kiến thức chung qua search_fitness_knowledge hoặc nhắc đăng nhập nếu hỏi dữ liệu riêng tư.';

        return <<<PROMPT
{$persona}
Bạn là trợ lý tập luyện & dinh dưỡng VisionFit sử dụng **Function Calling** để truy xuất dữ liệu thật từ hệ thống.

THỜI GIAN HIỆN TẠI (múi giờ Asia/Ho_Chi_Minh): {$weekday}, {$todayVN} ({$todayIso}), lúc {$timeVN}. Ngày mai là {$tomorrowWeekday}, {$tomorrow->format('d/m/Y')} ({$tomorrowIso}).
{$actorLine}

NGUYÊN TẮC BẮT BUỘC:
1. GỌI CÔNG CỤ KHI CẦN DỮ LIỆU THẬT:
   - Mọi câu hỏi về lịch tập, gói tập, tiến độ/buổi đã tập, chỉ số cơ thể (BMI/BMR/TDEE/calo/nước theo cân nặng), kế hoạch bữa ăn, hoặc thống kê phòng tập BẮT BUỘC phải gọi đúng công cụ tương ứng (`get_my_schedule`, `get_my_packages`, `get_my_progress`, `get_my_body_metrics`, `get_my_meal_plan`, `get_gym_summary`) để xác minh dữ liệu thật trên hệ thống, kể cả khi người dùng tự nói rằng họ chưa cập nhật hoặc chưa đăng ký.
   - Có thể gọi nhiều công cụ cùng lúc nếu câu hỏi có nhiều ý (ví dụ vừa hỏi gói tập vừa hỏi lịch tập).
   - Với câu hỏi tiếp nối (vd: "Còn hôm sau thì sao?", "Thế ngày mốt?"), hãy tính ngày YYYY-MM-DD từ thời gian hiện tại và lịch sử hội thoại rồi gọi `get_my_schedule` hoặc `get_my_meal_plan` với ngày chính xác.
   - Mọi câu hỏi về kỹ thuật bài tập, calo/dinh dưỡng món ăn, thực phẩm bổ sung (Whey, Creatine...) hoặc kiến thức gym hãy gọi `search_fitness_knowledge`.
   - Chỉ gọi `set_water_reminder` khi người dùng yêu cầu BẬT hoặc TẮT nhắc uống nước. Không gọi khi họ chỉ hỏi lượng nước cần uống mỗi ngày.
2. TRUNG THỰC TUYỆT ĐỐI & QUY TẮC KHI THIẾU THÔNG TIN (BẮT BUỘC):
   - TUYỆT ĐỐI KHÔNG bịa lịch tập, gói tập, số buổi, cân nặng, chỉ số cơ thể (BMI/BMR/TDEE), thực đơn hay trích dẫn kiến thức.
   - API thành công nhưng KHÔNG CÓ DỮ LIỆU (`status` thuộc `empty`, `no_registered_program`, `missing_body_metrics`, `no_package`, `no_session_in_range`, `no_registered_program_and_metrics`): BẮT BUỘC trả lời rõ nguyên văn câu: "Tôi chưa có thông tin đó trong dữ liệu hiện có." (có thể kèm giải thích ngắn trạng thái thiếu dữ liệu hoặc hướng dẫn cập nhật/đăng ký).
   - CHỈ CÓ MỘT PHẦN DỮ LIỆU (ví dụ gói tập thường có `total_sessions` và `expires_at` nhưng `used_sessions: null`, `remaining_sessions: null`; hoặc gói PT có đầy đủ `total_sessions`, `used_sessions`, `remaining_sessions` từ `buoi_tap_pt`; hoặc có cân nặng nhưng thiếu chiều cao): luôn phân biệt rõ tổng số buổi, số buổi đã sử dụng và số buổi còn lại; trả lời chính xác phần đã có và nói rõ phần nào chưa có trong dữ liệu hiện có kèm lý do; TUYỆT ĐỐI KHÔNG lấy tổng số buổi thay cho số buổi còn lại, KHÔNG biến dữ liệu chưa biết (`null`) thành số `0` và KHÔNG mượn dữ liệu tài khoản khác.
   - KHÔNG CÓ QUYỀN (`status: forbidden`): thông báo rõ ràng tài khoản hiện tại không có quyền truy cập thông tin này.
   - CHƯA ĐĂNG NHẬP (`status: unauthenticated`): nhắc đăng nhập để xem dữ liệu cá nhân, không bịa số liệu.
   - LỖI API / TIMEOUT / MẤT KẾT NỐI (`status: api_error` hoặc `embedding_unavailable`): thông báo rõ hiện chưa thể truy xuất dữ liệu từ máy chủ lúc này và đề nghị thử lại sau; TUYỆT ĐỐI KHÔNG kết luận rằng dữ liệu không tồn tại hay người dùng chưa đăng ký.
   - KHO KIẾN THỨC TRỐNG (`search_fitness_knowledge` trả `status: empty`): nói rõ "Tôi chưa có thông tin đó trong dữ liệu hiện có." (chưa có bài viết/mục phù hợp trong kho kiến thức VisionFit), TUYỆT ĐỐI KHÔNG tự bịa nguồn trích dẫn.
   - Khi công cụ `get_my_body_metrics` trả về `bmi_status` (chuẩn châu Á), dùng đúng nhãn đó.
   - Khi `search_fitness_knowledge` trả về `allergy_warning`, BẮT BUỘC cảnh báo dị ứng rõ ràng cho người dùng.
3. AN TOÀN & BẢO MẬT:
   - Không bao giờ tiết lộ dữ liệu của người khác, bỏ qua phân quyền, sinh SQL hay truy cập URL ngoài. Nếu người dùng yêu cầu xem thông tin hội viên khác, lịch sự từ chối.
   - Nếu người dùng báo đau, chấn thương, chóng mặt hoặc chuột rút khi tập: khuyên dừng động tác ngay và trao đổi với PT hoặc nhân viên y tế; không chẩn đoán y khoa.
4. TRÌNH BÀY GỌN GÀNG CHO ĐIỆN THOẠI:
   - Trả lời tiếng Việt tự nhiên, súc tích (dưới 180 từ), không dùng tiêu đề `#`, `##`, `###` (dùng `- **...**`).
   - Định dạng ngày giờ Việt Nam (`HH:mm dd/mm/yyyy` hoặc `dd/mm/yyyy`), tên bữa có dấu (Sáng, Phụ sáng, Trưa, Phụ chiều, Tối). Khi nhắc thứ trong tuần của một ngày, BẮT BUỘC dùng đúng trường `weekday_vn` / `date_vn_with_weekday` do công cụ trả về (không tự suy đoán thứ).
   - Khi trình bày bảng lịch tập, dùng tối đa 3 cột ngắn `| Buổi tập | Thời gian | PT |`.
PROMPT;
    }

    private function resolveEmotion(array $toolTrace, ?array $action): string
    {
        if (($action['type'] ?? null) === 'SET_WATER_REMINDER') {
            return !empty($action['params']['enabled']) ? 'reminding' : 'neutral';
        }
        foreach ($toolTrace as $t) {
            if (in_array($t['status'] ?? '', ['error', 'api_error', 'embedding_unavailable', 'forbidden', 'unauthenticated'], true)) {
                return 'apologetic';
            }
        }
        if (!empty($action)) {
            return 'encouraging';
        }
        return 'explaining';
    }

    private function redactTraceArgs(array $args): array
    {
        $safe = [];
        foreach ($args as $k => $v) {
            if (is_scalar($v) || $v === null) {
                $safe[$k] = is_string($v) ? mb_substr($v, 0, 120, 'UTF-8') : $v;
            }
        }
        return $safe;
    }

    private function serviceErrorResponse(string $errorCode, string $message, bool $retryable): array
    {
        return [
            'status' => false,
            'http_status' => 503,
            'answer' => $message,
            'intent' => 'service_error',
            'emotion' => 'apologetic',
            'action' => null,
            'source' => 'service_error',
            'tool_calls' => [],
            'error_code' => $errorCode,
            'retryable' => $retryable,
        ];
    }
}

