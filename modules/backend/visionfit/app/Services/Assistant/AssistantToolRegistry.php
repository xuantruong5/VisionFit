<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\Log;

/**
 * Declarative registry, strict parameter validator, and real internal HTTP API executor
 * for all Gemini Function Calling tools in VisionFit.
 *
 * Every data/knowledge tool executes a verified read-only API endpoint via InternalApiClientInterface
 * through Laravel's router and AssistantToken middleware (never bypassing middleware).
 */
class AssistantToolRegistry
{
    public const ALLOWED_NAVIGATION_TARGETS = [
        'NAVIGATE_WORKOUT' => 'headerPage',
        'NAVIGATE_REGISTER_PROGRAM' => 'WorkoutPlanScreen',
        'NAVIGATE_BODY_METRICS' => 'AiConsultationScreen',
        'NAVIGATE_REGISTER_PACKAGE' => 'WorkoutSelectionScreen',
    ];

    public const MISSING_DATA_PHRASE = 'Tôi chưa có thông tin đó trong dữ liệu hiện có.';

    private const EMPTY_DATA_STATUSES = [
        'empty',
        'no_package',
        'no_registered_program',
        'missing_body_metrics',
        'no_session_in_range',
        'no_registered_program_and_metrics',
    ];

    private const FORBIDDEN_SPOOF_KEYS = [
        'user_id', 'client_id', 'member_id', 'id_hoi_vien', 'id_nguoi_dung',
        'gym_id', 'id_phong_tap', 'role', 'sql', 'query_sql', 'url', 'endpoint',
    ];

    public function __construct(
        private readonly InternalApiClientInterface $apiClient,
    ) {
    }

    /**
     * Return Gemini `functionDeclarations` filtered by authenticated actor role.
     *
     * @return array<int, array<string, mixed>>
     */
    public function declarationsFor(AssistantAuthContext $actor): array
    {
        $tools = [];

        // Member & Guest personal tools (guests get genuine HTTP 401/403 from AssistantToken middleware)
        if (!$actor->authenticated || $actor->role === 'member') {
            $tools[] = [
                'name' => 'get_my_schedule',
                'description' => 'Gọi API GET /api/assistant/schedule để lấy lịch tập cá nhân của hội viên đang đăng nhập theo ngày (hôm nay, ngày mai, tuần này, khoảng ngày cụ thể YYYY-MM-DD hoặc sắp tới), kèm thông tin giờ tập và PT phụ trách theo múi giờ Asia/Ho_Chi_Minh.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'date_preset' => [
                            'type' => 'STRING',
                            'description' => 'Khoảng thời gian cần tra cứu: today (hôm nay), tomorrow (ngày mai), this_week (tuần này), upcoming (các buổi sắp tới), hoặc custom (khi truyền date_from/date_to).',
                            'enum' => ['today', 'tomorrow', 'this_week', 'upcoming', 'custom'],
                        ],
                        'date_from' => [
                            'type' => 'STRING',
                            'description' => 'Ngày bắt đầu định dạng YYYY-MM-DD (giờ Việt Nam Asia/Ho_Chi_Minh), dùng khi người dùng hỏi ngày cụ thể (vd: ngày mốt, thứ 5, hôm sau...).',
                        ],
                        'date_to' => [
                            'type' => 'STRING',
                            'description' => 'Ngày kết thúc định dạng YYYY-MM-DD (tùy chọn; mặc định bằng date_from).',
                        ],
                        'limit' => [
                            'type' => 'INTEGER',
                            'description' => 'Số buổi tối đa cần lấy (từ 1 đến 10; mặc định 5).',
                        ],
                    ],
                ],
            ];

            $tools[] = [
                'name' => 'get_my_packages',
                'description' => 'Gọi API GET /api/assistant/packages để lấy danh sách gói tập đã đăng ký của hội viên, phân biệt rõ tổng số buổi đăng ký (total_sessions), số buổi đã dùng (used_sessions), số buổi còn lại (remaining_sessions — tính từ buoi_tap_pt cho gói PT, hoặc null kèm lý do thiếu dữ liệu cho gói thường) và ngày hết hạn.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'include_expired' => [
                            'type' => 'BOOLEAN',
                            'description' => 'Có bao gồm gói tập đã hết hạn hay không (mặc định true).',
                        ],
                    ],
                ],
            ];

            $tools[] = [
                'name' => 'get_my_progress',
                'description' => 'Gọi API GET /api/assistant/progress để lấy tiến độ chương trình tập đang theo học (% hoàn thành chương trình) và lịch sử số buổi đã hoàn thành trong tuần này.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'period' => [
                            'type' => 'STRING',
                            'description' => 'Phạm vi tiến độ: this_week, program_overall, hoặc all.',
                            'enum' => ['this_week', 'program_overall', 'all'],
                        ],
                    ],
                ],
            ];

            $tools[] = [
                'name' => 'get_my_body_metrics',
                'description' => 'Gọi API GET /api/assistant/body-metrics để lấy chỉ số cơ thể và dinh dưỡng cá nhân đã tính bằng NutritionService (cân nặng, chiều cao, BMI và phân loại chuẩn châu Á, BMR, TDEE, calo mục tiêu, Protein/Carb/Fat, lượng nước khuyến nghị, mục tiêu và dị ứng).',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => new \stdClass(),
                ],
            ];

            $tools[] = [
                'name' => 'get_my_meal_plan',
                'description' => 'Gọi API GET /api/assistant/meal-plan để lấy kế hoạch bữa ăn CÁ NHÂN đã đăng ký của hội viên theo ngày (hôm nay, ngày mai, YYYY-MM-DD hoặc sắp tới) và bữa ăn (SANG/PHU_SANG/TRUA/PHU_TRUA/TOI/PHU_TOI/ALL), gồm tên món, giờ ăn, calo, macro (đạm/carb/fat) và cảnh báo dị ứng từng món (allergy_warning). BẮT BUỘC dùng công cụ này cho mọi câu hỏi về bữa ăn thuộc thực đơn cá nhân (kể cả câu hỏi tiếp nối như "Thế bữa sáng hôm nay có bao nhiêu calo?").',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'date_preset' => [
                            'type' => 'STRING',
                            'description' => 'today, tomorrow, upcoming hoặc custom.',
                            'enum' => ['today', 'tomorrow', 'upcoming', 'custom'],
                        ],
                        'date' => [
                            'type' => 'STRING',
                            'description' => 'Ngày cụ thể YYYY-MM-DD (tùy chọn).',
                        ],
                        'meal_type' => [
                            'type' => 'STRING',
                            'description' => 'Loại bữa ăn cần lọc: SANG (sáng), PHU_SANG (phụ sáng), TRUA (trưa), PHU_TRUA (phụ trưa/phụ chiều), TOI (tối), PHU_TOI (phụ tối) hoặc ALL.',
                            'enum' => array_values(FitnessDataService::MEAL_TYPE_FILTERS),
                        ],
                        'diet_preference' => [
                            'type' => 'STRING',
                            'description' => 'Chế độ ăn mong muốn nếu người dùng nêu rõ (vd: Eat Clean, Thuần chay, Keto, Giảm mỡ, Tăng cơ).',
                        ],
                    ],
                ],
            ];

            $tools[] = [
                'name' => 'suggest_app_navigation',
                'description' => 'Gắn nút điều hướng an toàn trong ứng dụng VisionFit khi cần mở màn hình phù hợp: NAVIGATE_WORKOUT (chỉ khi ĐÃ đăng ký chương trình), NAVIGATE_REGISTER_PROGRAM (khi CHƯA đăng ký chương trình), NAVIGATE_BODY_METRICS (khi CHƯA cập nhật chỉ số hoặc user muốn sửa chỉ số), NAVIGATE_REGISTER_PACKAGE (khi CHƯA có gói tập/gói hết hạn hoặc user muốn mua thêm gói).',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'target' => [
                            'type' => 'STRING',
                            'description' => 'Đích điều hướng trong danh sách cho phép.',
                            'enum' => array_keys(self::ALLOWED_NAVIGATION_TARGETS),
                        ],
                    ],
                    'required' => ['target'],
                ],
            ];
        } else {
            // Trainer & Admin scoped tools
            $tools[] = [
                'name' => 'get_gym_summary',
                'description' => 'Gọi API GET /api/assistant/summary để lấy số liệu thống kê tổng hợp trong phạm vi được phân công của Huấn luyện viên hoặc phòng tập của Quản trị viên (không trả dữ liệu cá nhân của hội viên).',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => new \stdClass(),
                ],
            ];

            if ($actor->role === 'trainer') {
                $tools[] = [
                    'name' => 'get_my_schedule',
                    'description' => 'Gọi API GET /api/assistant/schedule để lấy lịch dạy của Huấn luyện viên đang đăng nhập theo ngày hoặc khoảng ngày.',
                    'parameters' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'date_preset' => [
                                'type' => 'STRING',
                                'enum' => ['today', 'tomorrow', 'this_week', 'upcoming', 'custom'],
                            ],
                            'date_from' => ['type' => 'STRING', 'description' => 'YYYY-MM-DD'],
                            'date_to' => ['type' => 'STRING', 'description' => 'YYYY-MM-DD'],
                            'limit' => ['type' => 'INTEGER'],
                        ],
                    ],
                ];
            }
        }

        // Universal tools (knowledge semantic search + water reminder)
        $tools[] = [
            'name' => 'search_fitness_knowledge',
            'description' => 'Gọi API GET /api/assistant/knowledge/search để tìm kiếm ngữ nghĩa (embeddings) trong kho kiến thức CHUNG của VisionFit gồm kỹ thuật bài tập, thông tin dinh dưỡng chung của món ăn ngoài kế hoạch cá nhân, thực phẩm bổ sung thể thao (Whey, Creatine...) và bách khoa thể hình. KHÔNG dùng thay cho `get_my_meal_plan` khi người dùng hỏi về bữa ăn trong thực đơn cá nhân (vd: bữa sáng/trưa/tối hôm nay của tôi). Mặc định dùng category="all" trừ khi người dùng nêu rõ giới hạn danh mục.',
            'parameters' => [
                'type' => 'OBJECT',
                'properties' => [
                    'query' => [
                        'type' => 'STRING',
                        'description' => 'Câu truy vấn hoặc chủ đề thể hình/dinh dưỡng cần tìm kiếm ngữ nghĩa.',
                    ],
                    'category' => [
                        'type' => 'STRING',
                        'description' => 'Danh mục kiến thức (mặc định "all" nếu câu hỏi không giới hạn rõ nguồn): all, exercise, food, sports_nutrition, encyclopedia, hoặc program.',
                        'enum' => ['all', 'exercise', 'food', 'sports_nutrition', 'encyclopedia', 'program'],
                    ],
                    'strict_category' => [
                        'type' => 'BOOLEAN',
                        'description' => 'Chỉ đặt true khi người dùng yêu cầu rõ ràng chỉ tìm trong đúng một danh mục cụ thể; mặc định false (cho phép tự mở rộng sang "all" nếu category suy đoán không có kết quả).',
                    ],
                    'limit' => [
                        'type' => 'INTEGER',
                        'description' => 'Số kết quả tối đa (1 đến 5, mặc định 3).',
                    ],
                ],
                'required' => ['query'],
            ],
        ];

        $tools[] = [
            'name' => 'set_water_reminder',
            'description' => 'Bật hoặc tắt nhắc nhở uống nước định kỳ trên ứng dụng khi người dùng yêu cầu rõ ràng (KHÔNG gọi khi người dùng chỉ hỏi lượng nước nên uống mỗi ngày).',
            'parameters' => [
                'type' => 'OBJECT',
                'properties' => [
                    'enabled' => [
                        'type' => 'BOOLEAN',
                        'description' => 'true để bật nhắc uống nước, false để tắt.',
                    ],
                    'interval_hours' => [
                        'type' => 'INTEGER',
                        'description' => 'Chu kỳ nhắc tính theo giờ (1 đến 8, mặc định 2).',
                    ],
                ],
                'required' => ['enabled'],
            ],
        ];

        return $tools;
    }

    /**
     * Validate tool name, reject spoofed identity/SQL/URL parameters, validate schema,
     * and execute via verified internal read-only HTTP API endpoints.
     *
     * @return array{
     *   result: array<string, mixed>,
     *   side_effect_action: ?array<string, mixed>,
     *   intent_hint: ?string,
     *   api_call: ?array{method: string, endpoint: string, http_status: int}
     * }
     */
    public function execute(string $name, array $args, AssistantAuthContext $actor): array
    {
        $allowedNames = array_map(fn ($t) => $t['name'], $this->declarationsFor($actor));
        if (!in_array($name, $allowedNames, true)) {
            $isForbiddenRoleTool = in_array($name, [
                'get_my_schedule', 'get_my_packages', 'get_my_progress',
                'get_my_body_metrics', 'get_my_meal_plan', 'get_gym_summary',
            ], true);

            return [
                'result' => [
                    'status' => $isForbiddenRoleTool ? 'forbidden' : 'error',
                    'error_code' => $isForbiddenRoleTool ? 'FORBIDDEN_TOOL_FOR_ROLE' : 'UNKNOWN_OR_FORBIDDEN_TOOL',
                    'message' => $isForbiddenRoleTool
                        ? "Tài khoản hiện tại không có quyền sử dụng công cụ '{$name}'."
                        : "Công cụ '{$name}' không tồn tại hoặc không được phép cho vai trò hiện tại.",
                ],
                'side_effect_action' => null,
                'intent_hint' => null,
                'api_call' => null,
            ];
        }

        // Chặn mọi tham số giả mạo danh tính / phạm vi / SQL / URL do model hoặc prompt injection chèn vào
        foreach (self::FORBIDDEN_SPOOF_KEYS as $badKey) {
            if (array_key_exists($badKey, $args)) {
                Log::warning('[AssistantToolRegistry] Blocked forbidden spoof argument in tool call', [
                    'tool' => $name,
                    'forbidden_key' => $badKey,
                    'actor_role' => $actor->role,
                ]);
                return [
                    'result' => [
                        'status' => 'error',
                        'error_code' => 'FORBIDDEN_ARGUMENT',
                        'message' => "Tham số '{$badKey}' bị từ chối vì lý do bảo mật. Hệ thống chỉ dùng danh tính xác thực từ phiên đăng nhập hiện tại.",
                    ],
                    'side_effect_action' => null,
                    'intent_hint' => null,
                    'api_call' => null,
                ];
            }
        }

        try {
            return match ($name) {
                'get_my_schedule' => $this->execGetMySchedule($args, $actor),
                'get_my_packages' => $this->execGetMyPackages($args, $actor),
                'get_my_progress' => $this->execGetMyProgress($args, $actor),
                'get_my_body_metrics' => $this->execGetMyBodyMetrics($actor),
                'get_my_meal_plan' => $this->execGetMyMealPlan($args, $actor),
                'get_gym_summary' => $this->execGetGymSummary($actor),
                'search_fitness_knowledge' => $this->execSearchKnowledge($args, $actor),
                'set_water_reminder' => $this->execSetWaterReminder($args),
                'suggest_app_navigation' => $this->execSuggestNavigation($args, $actor),
                default => [
                    'result' => ['status' => 'error', 'error_code' => 'UNKNOWN_TOOL', 'message' => 'Công cụ không được hỗ trợ.'],
                    'side_effect_action' => null,
                    'intent_hint' => null,
                    'api_call' => null,
                ],
            };
        } catch (\Throwable $e) {
            Log::error('[AssistantToolRegistry] Tool execution failure', [
                'tool' => $name,
                'error' => $e->getMessage(),
            ]);
            return [
                'result' => [
                    'status' => 'api_error',
                    'error_code' => 'TOOL_EXECUTION_ERROR',
                    'message' => 'Hiện chưa truy xuất được dữ liệu từ hệ thống do lỗi kỹ thuật. Tuyệt đối không kết luận rằng dữ liệu không tồn tại.',
                ],
                'side_effect_action' => null,
                'intent_hint' => null,
                'api_call' => null,
            ];
        }
    }

    /**
     * Dispatch an allowlisted internal GET API call and normalize HTTP 200/401/403/422/5xx into tool results.
     *
     * @param array<string, scalar|null> $query
     * @return array{result: array<string, mixed>, api_call: array{method: string, endpoint: string, http_status: int}, ok: bool}
     */
    private function dispatchInternalGet(string $endpoint, array $query, AssistantAuthContext $actor): array
    {
        $res = $this->apiClient->get($endpoint, $query, $actor->bearerToken());
        $apiCall = [
            'method' => $res['method'],
            'endpoint' => $res['endpoint'],
            'http_status' => $res['http_status'],
        ];

        if ($res['ok'] && is_array($res['body']) && isset($res['body']['data']) && is_array($res['body']['data'])) {
            $data = $res['body']['data'];
            $status = (string) ($data['status'] ?? 'ok');
            if (in_array($status, self::EMPTY_DATA_STATUSES, true)) {
                $data['missing_data_phrase'] = self::MISSING_DATA_PHRASE;
            }
            return [
                'ok' => true,
                'result' => $data,
                'api_call' => $apiCall,
            ];
        }

        if ($res['http_status'] === 401) {
            return [
                'ok' => false,
                'result' => [
                    'status' => 'unauthenticated',
                    'http_status' => 401,
                    'message' => $res['error_message'] ?: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn nên chưa thể truy xuất dữ liệu cá nhân.',
                ],
                'api_call' => $apiCall,
            ];
        }

        if ($res['http_status'] === 403) {
            return [
                'ok' => false,
                'result' => [
                    'status' => 'forbidden',
                    'http_status' => 403,
                    'error_code' => $res['error_code'] ?? 'FORBIDDEN',
                    'message' => $res['error_message'] ?: 'Tài khoản hiện tại không có quyền truy cập dữ liệu này.',
                ],
                'api_call' => $apiCall,
            ];
        }

        if ($res['http_status'] === 422) {
            return [
                'ok' => false,
                'result' => [
                    'status' => 'error',
                    'http_status' => 422,
                    'error_code' => 'INVALID_ARGUMENTS',
                    'message' => $res['error_message'] ?: 'Tham số truy vấn API không hợp lệ.',
                ],
                'api_call' => $apiCall,
            ];
        }

        return [
            'ok' => false,
            'result' => [
                'status' => 'api_error',
                'http_status' => $res['http_status'],
                'error_code' => $res['error_code'] ?? 'INTERNAL_API_ERROR',
                'message' => 'Hiện chưa truy xuất được dữ liệu từ máy chủ do lỗi kết nối, timeout hoặc lỗi hệ thống. Không được kết luận rằng dữ liệu không tồn tại.',
            ],
            'api_call' => $apiCall,
        ];
    }

    private function isValidIsoDate(mixed $v): bool
    {
        if (!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
            return false;
        }
        [$y, $m, $d] = array_map('intval', explode('-', $v));
        return checkdate($m, $d, $y);
    }

    private function execGetMySchedule(array $args, AssistantAuthContext $actor): array
    {
        $preset = isset($args['date_preset']) ? (string) $args['date_preset'] : 'upcoming';
        if (!in_array($preset, ['today', 'tomorrow', 'this_week', 'upcoming', 'custom'], true)) {
            return $this->invalidArgs('date_preset không hợp lệ.');
        }

        $dateFrom = isset($args['date_from']) && $args['date_from'] !== '' ? (string) $args['date_from'] : null;
        $dateTo = isset($args['date_to']) && $args['date_to'] !== '' ? (string) $args['date_to'] : null;

        if ($dateFrom !== null && !$this->isValidIsoDate($dateFrom)) {
            return $this->invalidArgs('date_from phải đúng định dạng YYYY-MM-DD.');
        }
        if ($dateTo !== null && !$this->isValidIsoDate($dateTo)) {
            return $this->invalidArgs('date_to phải đúng định dạng YYYY-MM-DD.');
        }

        $limit = isset($args['limit']) ? (int) $args['limit'] : 5;
        if ($limit < 1 || $limit > 20) {
            return $this->invalidArgs('limit phải nằm trong khoảng 1..20.');
        }

        $call = $this->dispatchInternalGet('/api/assistant/schedule', [
            'date_preset' => $preset,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'limit' => $limit,
        ], $actor);

        $action = null;
        if ($call['ok'] && $actor->authenticated && $actor->role === 'member') {
            $action = ($call['result']['status'] ?? '') === 'no_registered_program'
                ? ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen']
                : ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'];
        }

        return [
            'result' => $call['result'],
            'side_effect_action' => $action,
            'intent_hint' => 'workout_navigation',
            'api_call' => $call['api_call'],
        ];
    }

    private function execGetMyPackages(array $args, AssistantAuthContext $actor): array
    {
        $includeExpired = array_key_exists('include_expired', $args) ? (bool) $args['include_expired'] : true;
        $call = $this->dispatchInternalGet('/api/assistant/packages', [
            'include_expired' => $includeExpired ? '1' : '0',
        ], $actor);

        $action = ($call['ok'] && !empty($call['result']['suggested_navigation']) && $actor->authenticated)
            ? ['type' => 'NAVIGATE_REGISTER_PACKAGE', 'screen' => 'WorkoutSelectionScreen']
            : null;

        return [
            'result' => $call['result'],
            'side_effect_action' => $action,
            'intent_hint' => 'general_support',
            'api_call' => $call['api_call'],
        ];
    }

    private function execGetMyProgress(array $args, AssistantAuthContext $actor): array
    {
        $period = isset($args['period']) ? (string) $args['period'] : 'all';
        if (!in_array($period, ['this_week', 'program_overall', 'all'], true)) {
            return $this->invalidArgs('period không hợp lệ.');
        }

        $call = $this->dispatchInternalGet('/api/assistant/progress', [
            'period' => $period,
        ], $actor);

        $action = null;
        if ($call['ok'] && $actor->authenticated && $actor->role === 'member') {
            $action = ($call['result']['status'] ?? '') === 'no_registered_program'
                ? ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen']
                : ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'];
        }

        return [
            'result' => $call['result'],
            'side_effect_action' => $action,
            'intent_hint' => 'general_support',
            'api_call' => $call['api_call'],
        ];
    }

    private function execGetMyBodyMetrics(AssistantAuthContext $actor): array
    {
        $call = $this->dispatchInternalGet('/api/assistant/body-metrics', [], $actor);
        $action = ($call['ok'] && ($call['result']['status'] ?? '') === 'missing_body_metrics' && $actor->authenticated)
            ? ['type' => 'NAVIGATE_BODY_METRICS', 'screen' => 'AiConsultationScreen']
            : null;

        return [
            'result' => $call['result'],
            'side_effect_action' => $action,
            'intent_hint' => 'general_support',
            'api_call' => $call['api_call'],
        ];
    }

    private function execGetMyMealPlan(array $args, AssistantAuthContext $actor): array
    {
        $preset = isset($args['date_preset']) ? (string) $args['date_preset'] : 'today';
        if (!in_array($preset, ['today', 'tomorrow', 'upcoming', 'custom'], true)) {
            return $this->invalidArgs('date_preset không hợp lệ.');
        }

        $date = isset($args['date']) && $args['date'] !== '' ? (string) $args['date'] : null;
        if ($date !== null && !$this->isValidIsoDate($date)) {
            return $this->invalidArgs('date phải đúng định dạng YYYY-MM-DD.');
        }

        $mealType = FitnessDataService::canonicalMealType(isset($args['meal_type']) ? (string) $args['meal_type'] : 'ALL');
        if ($mealType === null) {
            return $this->invalidArgs('meal_type không hợp lệ.');
        }

        $diet = isset($args['diet_preference']) && is_string($args['diet_preference']) ? trim($args['diet_preference']) : null;
        $call = $this->dispatchInternalGet('/api/assistant/meal-plan', [
            'date_preset' => $preset,
            'date' => $date,
            'meal_type' => $mealType,
            'diet_preference' => $diet ?: null,
        ], $actor);

        $action = ($call['ok'] && !empty($call['result']['suggested_navigation']) && $actor->authenticated)
            ? ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen']
            : null;

        return [
            'result' => $call['result'],
            'side_effect_action' => $action,
            'intent_hint' => 'food_detail',
            'api_call' => $call['api_call'],
        ];
    }

    private function execGetGymSummary(AssistantAuthContext $actor): array
    {
        $call = $this->dispatchInternalGet('/api/assistant/summary', [], $actor);
        return [
            'result' => $call['result'],
            'side_effect_action' => null,
            'intent_hint' => 'general_support',
            'api_call' => $call['api_call'],
        ];
    }

    private function execSearchKnowledge(array $args, AssistantAuthContext $actor): array
    {
        $query = isset($args['query']) && is_string($args['query']) ? trim($args['query']) : '';
        if ($query === '') {
            return $this->invalidArgs('Tham số query là bắt buộc và không được để trống.');
        }

        $category = isset($args['category']) ? strtolower((string) $args['category']) : 'all';
        if (!in_array($category, ['all', 'exercise', 'food', 'sports_nutrition', 'encyclopedia', 'program'], true)) {
            return $this->invalidArgs('category không hợp lệ.');
        }

        $limit = isset($args['limit']) ? (int) $args['limit'] : 3;
        if ($limit < 1 || $limit > 6) {
            return $this->invalidArgs('limit phải từ 1 đến 6.');
        }

        $strictCategory = array_key_exists('strict_category', $args) ? (bool) $args['strict_category'] : false;

        $call = $this->dispatchInternalGet('/api/assistant/knowledge/search', [
            'query' => $query,
            'category' => $category,
            'limit' => $limit,
            'strict_category' => $strictCategory ? '1' : '0',
        ], $actor);

        $intent = match ($category) {
            'exercise' => 'exercise_detail',
            'food', 'sports_nutrition' => 'food_detail',
            default => 'general_support',
        };

        return [
            'result' => $call['result'],
            'side_effect_action' => null,
            'intent_hint' => $intent,
            'api_call' => $call['api_call'],
        ];
    }

    private function execSetWaterReminder(array $args): array
    {
        if (!array_key_exists('enabled', $args) || !is_bool($args['enabled'])) {
            return $this->invalidArgs('Tham số enabled (boolean) là bắt buộc.');
        }

        $interval = isset($args['interval_hours']) ? (int) $args['interval_hours'] : 2;
        if ($interval < 1 || $interval > 8) {
            return $this->invalidArgs('interval_hours phải từ 1 đến 8 giờ.');
        }

        $enabled = (bool) $args['enabled'];
        return [
            'result' => [
                'status' => 'ok',
                'enabled' => $enabled,
                'interval_hours' => $interval,
            ],
            'side_effect_action' => [
                'type' => 'SET_WATER_REMINDER',
                'params' => [
                    'enabled' => $enabled,
                    'interval_hours' => $interval,
                ],
            ],
            'intent_hint' => 'water_reminder',
            'api_call' => null,
        ];
    }

    private function execSuggestNavigation(array $args, AssistantAuthContext $actor): array
    {
        if (!$actor->authenticated || $actor->role !== 'member') {
            return [
                'result' => [
                    'status' => 'unauthenticated',
                    'message' => 'Không thể điều hướng màn hình hội viên khi chưa đăng nhập.',
                ],
                'side_effect_action' => null,
                'intent_hint' => null,
                'api_call' => null,
            ];
        }

        $target = strtoupper(trim((string) ($args['target'] ?? '')));
        if (!isset(self::ALLOWED_NAVIGATION_TARGETS[$target])) {
            return [
                'result' => [
                    'status' => 'error',
                    'error_code' => 'INVALID_NAVIGATION_TARGET',
                    'message' => 'Đích điều hướng không nằm trong danh sách cho phép.',
                ],
                'side_effect_action' => null,
                'intent_hint' => null,
                'api_call' => null,
            ];
        }

        // Xác minh trạng thái thật của tài khoản qua API nội bộ để không bao giờ dẫn vào tab đã đăng ký khi chưa đăng ký
        $apiCall = null;
        if ($target === 'NAVIGATE_WORKOUT') {
            $check = $this->dispatchInternalGet('/api/assistant/progress', ['period' => 'program_overall'], $actor);
            $apiCall = $check['api_call'];
            $hasProgram = $check['ok'] && (bool) ($check['result']['has_registered_program'] ?? false);
            if (!$hasProgram) {
                $target = 'NAVIGATE_REGISTER_PROGRAM';
            }
        }

        return [
            'result' => [
                'status' => 'ok',
                'approved_target' => $target,
                'screen' => self::ALLOWED_NAVIGATION_TARGETS[$target],
            ],
            'side_effect_action' => [
                'type' => $target,
                'screen' => self::ALLOWED_NAVIGATION_TARGETS[$target],
            ],
            'intent_hint' => 'workout_navigation',
            'api_call' => $apiCall,
        ];
    }

    private function invalidArgs(string $message): array
    {
        return [
            'result' => [
                'status' => 'error',
                'error_code' => 'INVALID_ARGUMENTS',
                'message' => $message,
            ],
            'side_effect_action' => null,
            'intent_hint' => null,
            'api_call' => null,
        ];
    }
}
