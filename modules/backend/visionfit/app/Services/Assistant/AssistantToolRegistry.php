<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\Log;

/**
 * Declarative registry, strict parameter validator, and role-enforced executor
 * for all Gemini Function Calling tools in VisionFit.
 */
class AssistantToolRegistry
{
    public const ALLOWED_NAVIGATION_TARGETS = [
        'NAVIGATE_WORKOUT' => 'headerPage',
        'NAVIGATE_REGISTER_PROGRAM' => 'WorkoutPlanScreen',
        'NAVIGATE_BODY_METRICS' => 'AiConsultationScreen',
        'NAVIGATE_REGISTER_PACKAGE' => 'WorkoutSelectionScreen',
    ];

    private const FORBIDDEN_SPOOF_KEYS = [
        'user_id', 'client_id', 'member_id', 'id_hoi_vien', 'id_nguoi_dung',
        'gym_id', 'id_phong_tap', 'role', 'sql', 'query_sql', 'url', 'endpoint',
    ];

    public function __construct(
        private readonly FitnessDataService $dataService,
        private readonly KnowledgeEmbeddingService $knowledgeService,
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

        // Member & Guest personal tools (guests get structured unauthenticated result if invoked)
        if (!$actor->authenticated || $actor->role === 'member') {
            $tools[] = [
                'name' => 'get_my_schedule',
                'description' => 'Lấy lịch tập cá nhân của hội viên đang đăng nhập theo ngày (hôm nay, ngày mai, tuần này, khoảng ngày cụ thể YYYY-MM-DD hoặc sắp tới), kèm thông tin giờ tập và PT phụ trách theo múi giờ Asia/Ho_Chi_Minh.',
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
                            'description' => 'Số buổi tối đa cần lấy (từ 1 đến 10; mặc định 3 cho lịch chung).',
                        ],
                    ],
                ],
            ];

            $tools[] = [
                'name' => 'get_my_packages',
                'description' => 'Lấy danh sách gói tập đã đăng ký của hội viên, gồm tên gói, tổng số buổi mua, số buổi còn lại (nếu có) và ngày hết hạn.',
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
                'description' => 'Lấy tiến độ chương trình tập đang theo học (% hoàn thành chương trình) và lịch sử số buổi đã hoàn thành trong tuần này.',
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
                'description' => 'Lấy chỉ số cơ thể và dinh dưỡng cá nhân đã tính bằng NutritionService (cân nặng, chiều cao, BMI và phân loại chuẩn châu Á, BMR, TDEE, calo mục tiêu, Protein/Carb/Fat, lượng nước khuyến nghị, mục tiêu và dị ứng).',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => new \stdClass(),
                ],
            ];

            $tools[] = [
                'name' => 'get_my_meal_plan',
                'description' => 'Lấy kế hoạch bữa ăn đã đăng ký của hội viên theo ngày (hôm nay, ngày mai, ngày YYYY-MM-DD hoặc sắp tới) và bữa ăn (SANG/TRUA/TOI/PHU_SANG/PHU_CHIEU/ALL), có lọc dị ứng thực phẩm.',
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
                            'description' => 'Loại bữa ăn cần lọc: SANG, TRUA, TOI, PHU_SANG, PHU_CHIEU hoặc ALL.',
                            'enum' => ['SANG', 'TRUA', 'TOI', 'PHU_SANG', 'PHU_CHIEU', 'ALL'],
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
                'description' => 'Lấy số liệu thống kê tổng hợp trong phạm vi được phân công của Huấn luyện viên hoặc phòng tập của Quản trị viên (không trả dữ liệu cá nhân của hội viên).',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => new \stdClass(),
                ],
            ];

            if ($actor->role === 'trainer') {
                $tools[] = [
                    'name' => 'get_my_schedule',
                    'description' => 'Lấy lịch dạy của Huấn luyện viên đang đăng nhập theo ngày hoặc khoảng ngày.',
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
            'description' => 'Tìm kiếm ngữ nghĩa (embeddings) trong kho kiến thức VisionFit gồm kỹ thuật bài tập, dinh dưỡng món ăn/calo, thực phẩm bổ sung thể thao (Whey, Creatine...) và bách khoa thể hình.',
            'parameters' => [
                'type' => 'OBJECT',
                'properties' => [
                    'query' => [
                        'type' => 'STRING',
                        'description' => 'Câu truy vấn hoặc chủ đề thể hình/dinh dưỡng cần tìm kiếm ngữ nghĩa.',
                    ],
                    'category' => [
                        'type' => 'STRING',
                        'description' => 'Danh mục kiến thức: all, exercise, food, sports_nutrition, encyclopedia, hoặc program.',
                        'enum' => ['all', 'exercise', 'food', 'sports_nutrition', 'encyclopedia', 'program'],
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
     * Validate tool name, reject spoofed identity/SQL/URL parameters, validate schema, and execute.
     *
     * @return array{result: array<string, mixed>, side_effect_action: ?array<string, mixed>, intent_hint: ?string}
     */
    public function execute(string $name, array $args, AssistantAuthContext $actor): array
    {
        $allowedNames = array_map(fn ($t) => $t['name'], $this->declarationsFor($actor));
        if (!in_array($name, $allowedNames, true)) {
            return [
                'result' => [
                    'status' => 'error',
                    'error_code' => 'UNKNOWN_OR_FORBIDDEN_TOOL',
                    'message' => "Công cụ '{$name}' không tồn tại hoặc không được phép cho vai trò hiện tại.",
                ],
                'side_effect_action' => null,
                'intent_hint' => null,
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
                ],
            };
        } catch (\Throwable $e) {
            Log::error('[AssistantToolRegistry] Tool execution failure', [
                'tool' => $name,
                'error' => $e->getMessage(),
            ]);
            return [
                'result' => [
                    'status' => 'error',
                    'error_code' => 'TOOL_EXECUTION_ERROR',
                    'message' => 'Không thể truy xuất dữ liệu từ công cụ lúc này. Vui lòng thông báo trung thực cho người dùng.',
                ],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }
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
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'date_preset không hợp lệ.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $dateFrom = isset($args['date_from']) && $args['date_from'] !== '' ? (string) $args['date_from'] : null;
        $dateTo = isset($args['date_to']) && $args['date_to'] !== '' ? (string) $args['date_to'] : null;

        if ($dateFrom !== null && !$this->isValidIsoDate($dateFrom)) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'date_from phải đúng định dạng YYYY-MM-DD.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }
        if ($dateTo !== null && !$this->isValidIsoDate($dateTo)) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'date_to phải đúng định dạng YYYY-MM-DD.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $limit = isset($args['limit']) ? (int) $args['limit'] : 5;
        if ($limit < 1 || $limit > 20) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'limit phải nằm trong khoảng 1..20.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $result = $this->dataService->getMySchedule($actor, $preset, $dateFrom, $dateTo, $limit);
        $action = null;
        if ($actor->authenticated && $actor->role === 'member') {
            $action = ($result['status'] ?? '') === 'no_registered_program'
                ? ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen']
                : ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'];
        }

        return [
            'result' => $result,
            'side_effect_action' => $action,
            'intent_hint' => 'workout_navigation',
        ];
    }

    private function execGetMyPackages(array $args, AssistantAuthContext $actor): array
    {
        $includeExpired = array_key_exists('include_expired', $args) ? (bool) $args['include_expired'] : true;
        $result = $this->dataService->getMyPackages($actor, $includeExpired);
        $action = (!empty($result['suggested_navigation']) && $actor->authenticated)
            ? ['type' => 'NAVIGATE_REGISTER_PACKAGE', 'screen' => 'WorkoutSelectionScreen']
            : null;

        return [
            'result' => $result,
            'side_effect_action' => $action,
            'intent_hint' => 'general_support',
        ];
    }

    private function execGetMyProgress(array $args, AssistantAuthContext $actor): array
    {
        $period = isset($args['period']) ? (string) $args['period'] : 'all';
        if (!in_array($period, ['this_week', 'program_overall', 'all'], true)) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'period không hợp lệ.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $result = $this->dataService->getMyProgress($actor, $period);
        $action = null;
        if ($actor->authenticated && $actor->role === 'member') {
            $action = ($result['status'] ?? '') === 'no_registered_program'
                ? ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen']
                : ['type' => 'NAVIGATE_WORKOUT', 'screen' => 'headerPage'];
        }

        return [
            'result' => $result,
            'side_effect_action' => $action,
            'intent_hint' => 'general_support',
        ];
    }

    private function execGetMyBodyMetrics(AssistantAuthContext $actor): array
    {
        $result = $this->dataService->getMyBodyMetrics($actor);
        $action = (($result['status'] ?? '') === 'missing_body_metrics' && $actor->authenticated)
            ? ['type' => 'NAVIGATE_BODY_METRICS', 'screen' => 'AiConsultationScreen']
            : null;

        return [
            'result' => $result,
            'side_effect_action' => $action,
            'intent_hint' => 'general_support',
        ];
    }

    private function execGetMyMealPlan(array $args, AssistantAuthContext $actor): array
    {
        $preset = isset($args['date_preset']) ? (string) $args['date_preset'] : 'today';
        if (!in_array($preset, ['today', 'tomorrow', 'upcoming', 'custom'], true)) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'date_preset không hợp lệ.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $date = isset($args['date']) && $args['date'] !== '' ? (string) $args['date'] : null;
        if ($date !== null && !$this->isValidIsoDate($date)) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'date phải đúng định dạng YYYY-MM-DD.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $mealType = isset($args['meal_type']) ? strtoupper((string) $args['meal_type']) : 'ALL';
        if (!in_array($mealType, ['SANG', 'TRUA', 'TOI', 'PHU_SANG', 'PHU_CHIEU', 'ALL'], true)) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'meal_type không hợp lệ.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $diet = isset($args['diet_preference']) && is_string($args['diet_preference']) ? trim($args['diet_preference']) : null;
        $result = $this->dataService->getMyMealPlan($actor, $preset, $date, $mealType, $diet ?: null);
        $action = (!empty($result['suggested_navigation']) && $actor->authenticated)
            ? ['type' => 'NAVIGATE_REGISTER_PROGRAM', 'screen' => 'WorkoutPlanScreen']
            : null;

        return [
            'result' => $result,
            'side_effect_action' => $action,
            'intent_hint' => 'food_detail',
        ];
    }

    private function execGetGymSummary(AssistantAuthContext $actor): array
    {
        return [
            'result' => $this->dataService->getRoleSummary($actor),
            'side_effect_action' => null,
            'intent_hint' => 'general_support',
        ];
    }

    private function execSearchKnowledge(array $args, AssistantAuthContext $actor): array
    {
        $query = isset($args['query']) && is_string($args['query']) ? trim($args['query']) : '';
        if ($query === '') {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'Tham số query là bắt buộc và không được để trống.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $category = isset($args['category']) ? strtolower((string) $args['category']) : 'all';
        if (!in_array($category, ['all', 'exercise', 'food', 'sports_nutrition', 'encyclopedia', 'program'], true)) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'category không hợp lệ.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $limit = isset($args['limit']) ? (int) $args['limit'] : 3;
        if ($limit < 1 || $limit > 6) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'limit phải từ 1 đến 6.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $result = $this->knowledgeService->search($query, $category, $limit, $actor);
        $intent = match ($category) {
            'exercise' => 'exercise_detail',
            'food', 'sports_nutrition' => 'food_detail',
            default => 'general_support',
        };

        return [
            'result' => $result,
            'side_effect_action' => null,
            'intent_hint' => $intent,
        ];
    }

    private function execSetWaterReminder(array $args): array
    {
        if (!array_key_exists('enabled', $args) || !is_bool($args['enabled'])) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'Tham số enabled (boolean) là bắt buộc.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
        }

        $interval = isset($args['interval_hours']) ? (int) $args['interval_hours'] : 2;
        if ($interval < 1 || $interval > 8) {
            return [
                'result' => ['status' => 'error', 'error_code' => 'INVALID_ARGUMENTS', 'message' => 'interval_hours phải từ 1 đến 8 giờ.'],
                'side_effect_action' => null,
                'intent_hint' => null,
            ];
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
        ];
    }

    private function execSuggestNavigation(array $args, AssistantAuthContext $actor): array
    {
        if (!$actor->authenticated || $actor->role !== 'member') {
            return [
                'result' => [
                    'status' => 'rejected',
                    'message' => 'Không thể điều hướng màn hình hội viên khi chưa đăng nhập.',
                ],
                'side_effect_action' => null,
                'intent_hint' => null,
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
            ];
        }

        // Xác minh trạng thái thật của tài khoản để không bao giờ dẫn vào tab đã đăng ký khi chưa đăng ký
        $hasProgram = $this->dataService->getActiveProgram($actor) !== null;
        if ($target === 'NAVIGATE_WORKOUT' && !$hasProgram) {
            $target = 'NAVIGATE_REGISTER_PROGRAM';
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
        ];
    }
}

