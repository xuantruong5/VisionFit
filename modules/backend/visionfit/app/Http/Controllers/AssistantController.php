<?php

namespace App\Http\Controllers;

use App\Services\Assistant\AssistantAuthContext;
use App\Services\Assistant\AssistantOrchestrator;
use App\Services\Assistant\FitnessDataService;
use Illuminate\Http\Request;

/**
 * Thin HTTP boundary for VisionFit AI Assistant.
 * Delegates identity verification, data queries, semantic search, and Gemini Function Calling
 * to dedicated services under App\Services\Assistant\.
 */
class AssistantController extends Controller
{
    public function __construct(
        private readonly FitnessDataService $dataService,
        private readonly AssistantOrchestrator $orchestrator,
    ) {
    }

    public function me(Request $request)
    {
        return response()->json(['data' => $request->attributes->get('assistant_identity')]);
    }

    public function context(Request $request)
    {
        $actor = AssistantAuthContext::fromRequest($request);
        return response()->json([
            'data' => $this->dataService->buildContextSnapshot($actor),
        ]);
    }

    public function chat(Request $request)
    {
        // Chặn các trường giả mạo danh tính hoặc chọn người dùng/phòng tập từ client
        foreach (['user_id', 'client_id', 'member_id', 'id_nguoi_dung', 'id_hoi_vien', 'gym_id', 'id_phong_tap', 'role'] as $forbidden) {
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
            'source' => $result['source'],
            'tool_calls' => $result['tool_calls'] ?? [],
        ];

        if (!$result['status']) {
            $payload['error_code'] = $result['error_code'] ?? 'AI_PROVIDER_UNAVAILABLE';
            $payload['retryable'] = (bool) ($result['retryable'] ?? true);
        }

        return response()->json($payload, $httpStatus);
    }
}
