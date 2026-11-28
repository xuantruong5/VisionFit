<?php

namespace App\Http\Controllers;

use App\Services\Assistant\AssistantAuthContext;
use App\Services\Assistant\AssistantOrchestrator;
use App\Services\Assistant\FitnessDataService;
use App\Services\Assistant\KnowledgeEmbeddingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thin HTTP boundary for VisionFit AI Assistant.
 * Exposes authenticated read-only domain endpoints (protected by AssistantToken middleware)
 * and the /assistant/chat Gemini Function Calling endpoint.
 */
class AssistantController extends Controller
{
    private const FORBIDDEN_SELECTORS = [
        'user_id', 'client_id', 'member_id', 'id_nguoi_dung', 'id_hoi_vien', 'gym_id', 'id_phong_tap', 'role',
    ];

    public function __construct(
        private readonly FitnessDataService $dataService,
        private readonly KnowledgeEmbeddingService $knowledgeService,
        private readonly AssistantOrchestrator $orchestrator,
    ) {
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->attributes->get('assistant_identity')]);
    }

    public function context(Request $request): JsonResponse
    {
        $actor = AssistantAuthContext::fromRequest($request);
        return response()->json([
            'data' => $this->dataService->buildContextSnapshot($actor),
        ]);
    }

    /**
     * GET /api/assistant/schedule (roles: member, trainer)
     */
    public function toolSchedule(Request $request): JsonResponse
    {
        $actor = AssistantAuthContext::fromRequest($request);
        if (!in_array($actor->role, ['member', 'trainer'], true)) {
            return response()->json([
                'message' => 'Vai trò hiện tại không có quyền tra cứu lịch tập cá nhân.',
                'error_code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        $preset = (string) $request->query('date_preset', 'upcoming');
        if (!in_array($preset, ['today', 'tomorrow', 'this_week', 'upcoming', 'custom'], true)) {
            return response()->json(['message' => 'Tham số date_preset không hợp lệ.'], 422);
        }

        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $dateFromStr = is_string($dateFrom) && trim($dateFrom) !== '' ? trim($dateFrom) : null;
        $dateToStr = is_string($dateTo) && trim($dateTo) !== '' ? trim($dateTo) : null;

        if ($dateFromStr !== null && !$this->isValidIsoDate($dateFromStr)) {
            return response()->json(['message' => 'Tham số date_from phải đúng định dạng YYYY-MM-DD.'], 422);
        }
        if ($dateToStr !== null && !$this->isValidIsoDate($dateToStr)) {
            return response()->json(['message' => 'Tham số date_to phải đúng định dạng YYYY-MM-DD.'], 422);
        }

        $limit = (int) $request->query('limit', 5);
        if ($limit < 1 || $limit > 20) {
            return response()->json(['message' => 'Tham số limit phải nằm trong khoảng 1..20.'], 422);
        }

        return response()->json([
            'data' => $this->dataService->getMySchedule($actor, $preset, $dateFromStr, $dateToStr, $limit),
        ]);
    }

    /**
     * GET /api/assistant/packages (role: member)
     */
    public function toolPackages(Request $request): JsonResponse
    {
        $actor = AssistantAuthContext::fromRequest($request);
        if ($actor->role !== 'member') {
            return response()->json([
                'message' => 'Chỉ tài khoản hội viên mới có quyền xem gói tập cá nhân.',
                'error_code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        $rawInclude = $request->query('include_expired', '1');
        $includeExpired = filter_var($rawInclude, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($includeExpired === null) {
            $includeExpired = true;
        }

        return response()->json([
            'data' => $this->dataService->getMyPackages($actor, $includeExpired),
        ]);
    }

    /**
     * GET /api/assistant/progress (role: member)
     */
    public function toolProgress(Request $request): JsonResponse
    {
        $actor = AssistantAuthContext::fromRequest($request);
        if ($actor->role !== 'member') {
            return response()->json([
                'message' => 'Chỉ tài khoản hội viên mới có quyền xem tiến độ tập luyện cá nhân.',
                'error_code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        $period = (string) $request->query('period', 'all');
        if (!in_array($period, ['this_week', 'program_overall', 'all'], true)) {
            return response()->json(['message' => 'Tham số period không hợp lệ.'], 422);
        }

        return response()->json([
            'data' => $this->dataService->getMyProgress($actor, $period),
        ]);
    }

    /**
     * GET /api/assistant/body-metrics (role: member)
     */
    public function toolBodyMetrics(Request $request): JsonResponse
    {
        $actor = AssistantAuthContext::fromRequest($request);
        if ($actor->role !== 'member') {
            return response()->json([
                'message' => 'Chỉ tài khoản hội viên mới có quyền xem chỉ số cơ thể cá nhân.',
                'error_code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        return response()->json([
            'data' => $this->dataService->getMyBodyMetrics($actor),
        ]);
    }

    /**
     * GET /api/assistant/meal-plan (role: member)
     */
    public function toolMealPlan(Request $request): JsonResponse
    {
        $actor = AssistantAuthContext::fromRequest($request);
        if ($actor->role !== 'member') {
            return response()->json([
                'message' => 'Chỉ tài khoản hội viên mới có quyền xem kế hoạch bữa ăn cá nhân.',
                'error_code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        $preset = (string) $request->query('date_preset', 'today');
        if (!in_array($preset, ['today', 'tomorrow', 'upcoming', 'custom'], true)) {
            return response()->json(['message' => 'Tham số date_preset không hợp lệ.'], 422);
        }

        $date = $request->query('date');
        $dateStr = is_string($date) && trim($date) !== '' ? trim($date) : null;
        if ($dateStr !== null && !$this->isValidIsoDate($dateStr)) {
            return response()->json(['message' => 'Tham số date phải đúng định dạng YYYY-MM-DD.'], 422);
        }

        $mealType = FitnessDataService::canonicalMealType((string) $request->query('meal_type', 'ALL'));
        if ($mealType === null) {
            return response()->json(['message' => 'Tham số meal_type không hợp lệ.'], 422);
        }

        $diet = $request->query('diet_preference');
        $dietStr = is_string($diet) && trim($diet) !== '' ? trim($diet) : null;

        return response()->json([
            'data' => $this->dataService->getMyMealPlan($actor, $preset, $dateStr, $mealType, $dietStr),
        ]);
    }

    /**
     * GET /api/assistant/summary (roles: trainer, admin)
     */
    public function toolSummary(Request $request): JsonResponse
    {
        $actor = AssistantAuthContext::fromRequest($request);
        if (!in_array($actor->role, ['trainer', 'admin'], true)) {
            return response()->json([
                'message' => 'Tài khoản hội viên không có quyền truy cập thống kê tổng hợp phòng tập.',
                'error_code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        return response()->json([
            'data' => $this->dataService->getRoleSummary($actor),
        ]);
    }

    /**
     * GET /api/assistant/knowledge/search (public catalog + optional Bearer token for allergy check)
     */
    public function toolSearchKnowledge(Request $request): JsonResponse
    {
        foreach (self::FORBIDDEN_SELECTORS as $forbidden) {
            if ($request->query->has($forbidden)) {
                return response()->json([
                    'message' => 'API tìm kiếm kiến thức không nhận tham số chọn danh tính hoặc phạm vi.',
                    'error_code' => 'FORBIDDEN_IDENTITY_SELECTOR',
                ], 422);
            }
        }

        $query = trim((string) $request->query('query', ''));
        if ($query === '') {
            return response()->json(['message' => 'Tham số query là bắt buộc.'], 422);
        }

        $category = strtolower((string) $request->query('category', 'all'));
        if (!in_array($category, ['all', 'exercise', 'food', 'sports_nutrition', 'encyclopedia', 'program'], true)) {
            return response()->json(['message' => 'Tham số category không hợp lệ.'], 422);
        }

        $limit = (int) $request->query('limit', 3);
        if ($limit < 1 || $limit > 6) {
            return response()->json(['message' => 'Tham số limit phải từ 1 đến 6.'], 422);
        }

        $strictCategory = filter_var($request->query('strict_category', '0'), FILTER_VALIDATE_BOOLEAN);

        $actor = AssistantAuthContext::fromRequest($request);

        return response()->json([
            'data' => $this->knowledgeService->search($query, $category, $limit, $actor, $strictCategory),
        ]);
    }

    public function chat(Request $request): JsonResponse
    {
        // Chặn các trường giả mạo danh tính hoặc chọn người dùng/phòng tập từ client
        foreach (self::FORBIDDEN_SELECTORS as $forbidden) {
            if ($request->has($forbidden) || $request->query->has($forbidden)) {
                return response()->json([
                    'status' => false,
                    'message' => 'API trợ lý không chấp nhận tham số chọn danh tính hoặc phạm vi từ client.',
                    'error_code' => 'FORBIDDEN_IDENTITY_SELECTOR',
                    'retryable' => false,
                ], 422);
            }
        }

        $message = trim((string) $request->input('message', ''));
        if ($message === '') {
            return response()->json(['message' => 'Nội dung câu hỏi không được để trống.'], 422);
        }
        if (mb_strlen($message, 'UTF-8') > 2000) {
            return response()->json(['message' => 'Nội dung câu hỏi quá dài (tối đa 2.000 ký tự).'], 422);
        }

        $species = $request->input('species', 'cat') === 'bear' ? 'bear' : 'cat';
        $history = is_array($request->input('history')) ? $request->input('history') : [];

        // Xác thực danh tính duy nhất từ Bearer Token (tuyệt đối không fallback sang hội viên #1)
        $actor = AssistantAuthContext::fromRequest($request);

        $result = $this->orchestrator->handleChat($message, $history, $species, $actor);
        $httpStatus = (int) ($result['http_status'] ?? 200);

        $payload = [
            'status' => (bool) $result['status'],
            'answer' => $result['answer'],
            'intent' => $result['intent'],
            'emotion' => $result['emotion'],
            'action' => $result['action'],
            'auto_navigate' => (bool) ($result['auto_navigate'] ?? false),
            'source' => $result['source'],
            'tool_calls' => $result['tool_calls'] ?? [],
        ];

        if (!$result['status']) {
            $payload['error_code'] = $result['error_code'] ?? 'AI_PROVIDER_UNAVAILABLE';
            $payload['retryable'] = (bool) ($result['retryable'] ?? true);
        } else {
            if (!empty($result['error_code'])) {
                $payload['error_code'] = $result['error_code'];
            }
            if (array_key_exists('retryable', $result) && $result['retryable'] !== null) {
                $payload['retryable'] = (bool) $result['retryable'];
            }
        }

        return response()->json($payload, $httpStatus);
    }

    private function isValidIsoDate(string $v): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
            return false;
        }
        [$y, $m, $d] = array_map('intval', explode('-', $v));
        return checkdate($m, $d, $y);
    }
}
