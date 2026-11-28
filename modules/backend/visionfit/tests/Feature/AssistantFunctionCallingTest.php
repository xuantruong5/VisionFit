<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Trainer;
use App\Services\Assistant\AssistantOrchestrator;
use App\Services\Assistant\AssistantToolRegistry;
use App\Services\Assistant\EmbeddingClientInterface;
use App\Services\Assistant\FitnessDataService;
use App\Services\Assistant\LlmClientInterface;
use App\Services\Assistant\LlmProviderException;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\UsesIsolatedTestDatabase;
use Tests\TestCase;

/**
 * Kiểm thử toàn diện luồng Gemini Function Calling (mock provider),
 * phân quyền theo vai trò/phòng tập, múi giờ Asia/Ho_Chi_Minh, và xử lý lỗi dịch vụ.
 */
class AssistantFunctionCallingTest extends TestCase
{
    use UsesIsolatedTestDatabase;

    private string $kbIndexPath = '';

    protected function tearDown(): void
    {
        foreach ([$this->kbIndexPath, $this->kbIndexPath . '.lock'] as $f) {
            if ($f !== '' && is_file($f)) {
                @unlink($f);
            }
        }
        parent::tearDown();
    }

    protected function setUp(): void
    {
        parent::setUp();

        // Chỉ mục kho kiến thức là FILE: mỗi test dùng file tạm riêng, không đụng storage/ thật
        $this->kbIndexPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vf_kb_' . uniqid('', true) . '.bin';
        config([
            'assistant.knowledge_index_path' => $this->kbIndexPath,
            'assistant.embedding_query_cache_store' => 'array',
            'assistant.answer_cache_store' => 'array',
        ]);

        config([
            'assistant.gemini_api_key' => 'test-mock-key',
            'assistant.gemini_model' => 'gemini-flash-lite-latest',
            'assistant.gemini_fallback_models' => ['gemini-flash-lite-latest'],
            'assistant.max_tool_rounds' => 5,
            'assistant.max_retries_per_call' => 1,
            'assistant.total_timeout_seconds' => 25,
            'assistant.backup_api_url' => '',
            'assistant.backup_api_key' => '',
            'assistant.backup_model' => '',
        ]);

        $this->resetVerifiedTestDatabase([
            '2026_09_11_060235_create_clients_table.php',
            '2026_09_11_081536_create_trainers_table.php',
            '2026_09_11_081651_create_admins_table.php',
            '2026_09_11_122454_create_personal_access_tokens_table.php',
            '2026_09_11_062223_create_goi_tap_table.php',
            '2026_09_11_074132_create_dang_ky_goi_table.php',
            '2026_09_11_074714_create_chi_tiet_dang_ky_goi_table.php',
            '2026_11_22_203956_create_buoi_tap_pt_table.php',
            '2026_09_11_080320_create_chuong_trinh_tap_table.php',
            '2026_09_11_081119_create_dang_ky_chuong_trinh_table.php',
            '2026_09_11_073144_create_lich_tap_table.php',
            '2026_09_11_072708_create_buoi_tap_table.php',
            '2026_09_11_062608_create_bai_tap_table.php',
            '2026_10_15_170400_create_chi_tiet_bai_tap_table.php',
            '2026_09_13_122736_create_mon_an_table.php',
            '2026_09_13_120830_create_ke_hoach_an_table.php',
            '2026_09_13_122252_create_khau_phan_an_table.php',
            '2026_11_01_000001_create_lich_su_chi_so_dinh_duong_table.php',
            '2026_09_17_170000_create_bach_khoa_toan_thu_table.php',
            '2026_09_18_130000_create_dinh_duong_the_thao_table.php',
        ]);
    }

    /** Nạp sẵn chỉ mục kho kiến thức (file) với embedder đang được bind trong container. */
    private function seedKnowledgeIndex(array $rows): void
    {
        $service = new \App\Services\Assistant\KnowledgeEmbeddingService(
            app(\App\Services\Assistant\EmbeddingClientInterface::class),
            new FitnessDataService()
        );
        $service->writeIndex(array_map(fn ($r) => [
            'source_table' => $r[0], 'source_id' => $r[1], 'category' => $r[2], 'title' => $r[3], 'vector' => [1.0, 0.0],
        ], $rows));
    }

    private function createMember(int $id, int $gym = 10, array $overrides = []): Client
    {
        return Client::forceCreate(array_merge([
            'id' => $id,
            'id_phong_tap' => $gym,
            'email' => "member{$id}@test.local",
            'password' => 'secret',
            'ho_ten' => "Member {$id}",
            'tinh_trang' => 1,
            'is_active' => 1,
            'is_block' => 0,
            'chieu_cao_cm' => null,
            'can_nang_kg' => null,
            'ngay_cap_nhat_chi_so' => null,
        ], $overrides));
    }

    private function headersFor($user): array
    {
        return ['Authorization' => 'Bearer ' . $user->createToken('fc-test')->plainTextToken];
    }

    private function clearControllerBindingCache(): void
    {
        $this->app->forgetInstance(AssistantOrchestrator::class);
        $this->app->forgetInstance(AssistantToolRegistry::class);
        $this->app->forgetInstance(\App\Services\Assistant\KnowledgeEmbeddingService::class);
        $this->app->forgetInstance(\App\Http\Controllers\AssistantController::class);
        foreach ($this->app['router']->getRoutes() as $route) {
            if (property_exists($route, 'controller')) {
                $route->controller = null;
            }
        }
    }

    private function bindFakeLlm(callable $handler): object
    {
        $this->clearControllerBindingCache();
        $fake = new class($handler) implements LlmClientInterface {
            public array $recordedCalls = [];
            private $handler;

            public function __construct(callable $handler)
            {
                $this->handler = $handler;
            }

            public function generateTurn(
                string $model,
                string $systemPrompt,
                array $contents,
                array $toolDeclarations,
                int $timeoutSeconds = 12
            ): array {
                $callIndex = count($this->recordedCalls);
                $this->recordedCalls[] = [
                    'model' => $model,
                    'system_prompt' => $systemPrompt,
                    'contents' => $contents,
                    'tool_declarations' => $toolDeclarations,
                    'timeout' => $timeoutSeconds,
                ];
                return ($this->handler)($callIndex, $contents, $toolDeclarations, $model, $systemPrompt);
            }
        };

        $this->app->instance(LlmClientInterface::class, $fake);
        return $fake;
    }

    private function modelToolCallTurn(array $calls, string $signature = 'sig_test_123'): array
    {
        $parts = [];
        $fcList = [];
        foreach ($calls as $idx => [$name, $args]) {
            $part = [
                'functionCall' => ['name' => $name, 'args' => $args],
                'thoughtSignature' => $signature . '_' . $idx,
            ];
            $parts[] = $part;
            $fcList[] = [
                'id' => null,
                'name' => $name,
                'args' => $args,
                'raw_part' => $part,
            ];
        }

        return [
            'text' => null,
            'function_calls' => $fcList,
            'raw_model_content' => ['role' => 'model', 'parts' => $parts],
            'finish_reason' => 'STOP',
            'model' => 'gemini-2.5-flash',
            'provider' => 'gemini_fc',
            'usage' => ['prompt_tokens' => 100, 'completion_tokens' => 25, 'total_tokens' => 125],
        ];
    }

    private function modelTextTurn(string $text, string $model = 'gemini-2.5-flash', string $provider = 'gemini_fc'): array
    {
        return [
            'text' => $text,
            'function_calls' => [],
            'raw_model_content' => ['role' => 'model', 'parts' => [['text' => $text]]],
            'finish_reason' => 'STOP',
            'model' => $model,
            'provider' => $provider,
            'usage' => ['prompt_tokens' => 120, 'completion_tokens' => 40, 'total_tokens' => 160],
        ];
    }

    // 1. Một lượt gọi công cụ + bảo toàn thoughtSignature + trả lời cuối dựa trên dữ liệu thật
    public function test_single_tool_call_preserves_thought_signature_and_returns_real_data(): void
    {
        $member = $this->createMember(1, 10, ['ho_ten' => 'Nguyễn Văn An']);
        $pt = Trainer::forceCreate(['id' => 5, 'id_phong_tap' => 10, 'ho_ten' => 'HLV Minh Tuấn', 'tinh_trang' => 1, 'is_active' => 1]);
        $progId = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'Giảm mỡ 30 ngày', 'tinh_trang' => 1]);
        $dkId = DB::table('dang_ky_chuong_trinh')->insertGetId(['id_hoi_vien' => 1, 'id_chuong_trinh' => $progId, 'tinh_trang' => 1]);
        $tomorrow = CarbonImmutable::now('Asia/Ho_Chi_Minh')->addDay()->toDateString();
        DB::table('lich_tap')->insert([
            'id_dang_ky_chuong_trinh' => $dkId, 'id_chuong_trinh' => $progId,
            'id_hoi_vien' => 1, 'id_trainner' => $pt->id,
            'ngay_tap' => $tomorrow, 'gio_bat_dau' => '18:00:00', 'tinh_trang' => '0',
        ]);

        $fake = $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_schedule', ['date_preset' => 'tomorrow']]], 'enc_thought_sig');
            }
            // Kiểm tra lượt 2 giữ nguyên thoughtSignature và nhận đúng functionResponse chứa dữ liệu thật
            $modelParts = $contents[1]['parts'] ?? [];
            $this->assertSame('enc_thought_sig_0', $modelParts[0]['thoughtSignature'] ?? null);
            $toolResp = $contents[2]['parts'][0]['functionResponse']['response'] ?? [];
            $this->assertSame('ok', $toolResp['status']);
            $this->assertSame('HLV Minh Tuấn', $toolResp['sessions'][0]['trainer']);
            return $this->modelTextTurn('Ngày mai bạn có buổi Giảm mỡ 30 ngày lúc 18:00 với HLV Minh Tuấn.');
        });

        $res = $this->postJson('/api/assistant/chat', [
            'message' => 'Chiều mai có lịch với PT không?',
            'species' => 'bear',
        ], $this->headersFor($member))->assertOk();

        $res->assertJsonPath('status', true)
            ->assertJsonPath('source', 'gemini_fc:gemini-2.5-flash')
            ->assertJsonPath('action.type', 'NAVIGATE_WORKOUT')
            ->assertJsonPath('tool_calls.0.name', 'get_my_schedule')
            ->assertJsonPath('tool_calls.0.status', 'ok');
        $this->assertStringContainsString('HLV Minh Tuấn', (string) $res->json('answer'));
        $this->assertCount(2, $fake->recordedCalls);
    }

    // 2. Nhiều công cụ trong cùng 1 câu hỏi (multi-tool parallel execution)
    public function test_multiple_tools_called_in_same_question(): void
    {
        $member = $this->createMember(2, 10, ['chieu_cao_cm' => 170, 'can_nang_kg' => 65, 'ngay_cap_nhat_chi_so' => now()]);
        $g = DB::table('goi_tap')->insertGetId(['id_phong_tap' => 10, 'ma_goi_tap' => 'VIP1', 'ten_goi_tap' => 'Gói VIP 24 buổi', 'thoi_han_ngay' => 90, 'gia' => 3000000]);
        $d = DB::table('dang_ky_goi')->insertGetId(['id_hoi_vien' => 2]);
        DB::table('chi_tiet_dang_ky_goi')->insert(['id_dang_ky_goi' => $d, 'id_goi_tap' => $g, 'so_buoi' => 24, 'ngay_ket_thuc' => now()->addDays(30)->toDateString()]);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([
                    ['get_my_packages', []],
                    ['get_my_body_metrics', []],
                ]);
            }
            $respParts = $contents[2]['parts'] ?? [];
            $this->assertCount(2, $respParts);
            $this->assertSame('get_my_packages', $respParts[0]['functionResponse']['name']);
            $this->assertSame('get_my_body_metrics', $respParts[1]['functionResponse']['name']);
            $this->assertSame('Gói VIP 24 buổi', $respParts[0]['functionResponse']['response']['packages'][0]['name']);
            $this->assertSame(22.49, $respParts[1]['functionResponse']['response']['metrics']['bmi']);
            return $this->modelTextTurn('Bạn đang có Gói VIP 24 buổi và BMI hiện tại là 22.49 (Bình thường).');
        });

        $res = $this->postJson('/api/assistant/chat', [
            'message' => 'Kiểm tra gói tập và chỉ số BMI của tôi',
            'species' => 'bear',
        ], $this->headersFor($member))->assertOk();

        $this->assertCount(2, $res->json('tool_calls'));
        $this->assertSame('get_my_packages', $res->json('tool_calls.0.name'));
        $this->assertSame('get_my_body_metrics', $res->json('tool_calls.1.name'));
    }

    // 3. Câu hỏi tiếp nối dựa vào lịch sử hội thoại
    public function test_followup_question_uses_history_and_queries_next_day(): void
    {
        $member = $this->createMember(3, 10);
        $progId = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'Sức bền', 'tinh_trang' => 1]);
        $dkId = DB::table('dang_ky_chuong_trinh')->insertGetId(['id_hoi_vien' => 3, 'id_chuong_trinh' => $progId, 'tinh_trang' => 1]);
        $dayAfterTomorrow = CarbonImmutable::now('Asia/Ho_Chi_Minh')->addDays(2)->toDateString();
        DB::table('lich_tap')->insert([
            'id_dang_ky_chuong_trinh' => $dkId, 'id_chuong_trinh' => $progId,
            'id_hoi_vien' => 3, 'ngay_tap' => $dayAfterTomorrow, 'gio_bat_dau' => '07:00:00', 'tinh_trang' => '0',
        ]);

        $this->bindFakeLlm(function (int $step, array $contents) use ($dayAfterTomorrow) {
            if ($step === 0) {
                // Xác nhận lịch sử hội thoại đã được truyền vào contents
                $this->assertSame('Mai tôi tập gì?', $contents[0]['parts'][0]['text']);
                $this->assertSame('Còn hôm sau thì sao?', $contents[2]['parts'][0]['text']);
                return $this->modelToolCallTurn([['get_my_schedule', ['date_preset' => 'custom', 'date_from' => $dayAfterTomorrow]]]);
            }
            $resp = $contents[4]['parts'][0]['functionResponse']['response'];
            $this->assertSame($dayAfterTomorrow, $resp['sessions'][0]['scheduled_date']);
            return $this->modelTextTurn("Ngày {$dayAfterTomorrow} bạn có buổi tập Sức bền lúc 07:00.");
        });

        $res = $this->postJson('/api/assistant/chat', [
            'message' => 'Còn hôm sau thì sao?',
            'species' => 'bear',
            'history' => [
                ['sender' => 'user', 'text' => 'Mai tôi tập gì?'],
                ['sender' => 'assistant', 'text' => 'Ngày mai bạn được nghỉ phục hồi nhé.'],
            ],
        ], $this->headersFor($member))->assertOk();

        $this->assertStringContainsString('Sức bền', (string) $res->json('answer'));
    }

    // 4. Tên công cụ không tồn tại, tham số sai hoặc thiếu -> trả lỗi có cấu trúc về LLM, không crash 500
    public function test_unknown_tool_and_invalid_arguments_return_structured_errors_to_llm(): void
    {
        $member = $this->createMember(4, 10);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([
                    ['drop_all_tables', []],
                    ['get_my_schedule', ['date_from' => 'not-a-date']],
                    ['search_fitness_knowledge', []],
                ]);
            }
            $parts = $contents[2]['parts'] ?? [];
            $this->assertSame('UNKNOWN_OR_FORBIDDEN_TOOL', $parts[0]['functionResponse']['response']['error_code']);
            $this->assertSame('INVALID_ARGUMENTS', $parts[1]['functionResponse']['response']['error_code']);
            $this->assertSame('INVALID_ARGUMENTS', $parts[2]['functionResponse']['response']['error_code']);
            return $this->modelTextTurn('Xin lỗi, yêu cầu tra cứu chưa hợp lệ nên mình chưa thể thực hiện.');
        });

        $res = $this->postJson('/api/assistant/chat', [
            'message' => 'Kiểm tra lịch giúp mình',
            'species' => 'bear',
        ], $this->headersFor($member))->assertOk();

        $this->assertSame('error', $res->json('tool_calls.0.status'));
        $this->assertSame('error', $res->json('tool_calls.1.status'));
        $this->assertSame('error', $res->json('tool_calls.2.status'));
    }

    // 5. Công cụ trả dữ liệu rỗng / thiếu dữ liệu trung thực (không biến null thành 0) + lỗi ngoại lệ trong công cụ
    public function test_tool_returns_empty_missing_state_and_handles_tool_exception(): void
    {
        // 5a: Member chưa nhập cân nặng -> get_my_body_metrics trả missing_body_metrics (metrics = null)
        $fresh = $this->createMember(5, 10, ['chieu_cao_cm' => 160, 'can_nang_kg' => 52, 'ngay_cap_nhat_chi_so' => null]);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_body_metrics', []]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame('missing_body_metrics', $resp['status']);
            $this->assertNull($resp['metrics']);
            return $this->modelTextTurn('Bạn chưa cập nhật cân nặng và chiều cao nên mình chưa thể tính TDEE cho bạn.');
        });

        $res = $this->postJson('/api/assistant/chat', [
            'message' => 'Tôi chưa cập nhật cân nặng thì bạn biết TDEE của tôi không?',
            'species' => 'bear',
        ], $this->headersFor($fresh))->assertOk();

        $res->assertJsonPath('action.type', 'NAVIGATE_BODY_METRICS')
            ->assertJsonPath('tool_calls.0.status', 'missing_body_metrics');

        // 5b: Tool gặp lỗi ngoại lệ/timeout -> không sập 500, trả TOOL_EXECUTION_ERROR về LLM
        $brokenEmbed = new class implements EmbeddingClientInterface {
            public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array
            {
                throw new LlmProviderException('EMBEDDING_TIMEOUT', 'Timeout kết nối embedding', 503, true);
            }

            public function modelName(): string
            {
                return 'gemini-embedding-001';
            }
        };
        $this->app->instance(EmbeddingClientInterface::class, $brokenEmbed);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['search_fitness_knowledge', ['query' => 'kỹ thuật squat']]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame('embedding_unavailable', $resp['status']);
            return $this->modelTextTurn('Kho tri thức hiện tạm gián đoạn, bạn thử lại sau nhé.');
        });

        $this->postJson('/api/assistant/chat', [
            'message' => 'Hướng dẫn Squat',
            'species' => 'bear',
        ], $this->headersFor($fresh))->assertOk()
            ->assertJsonPath('tool_calls.0.status', 'embedding_unavailable');
    }

    // 6. Provider lỗi, hết hạn mức (429), sai định dạng, vượt giới hạn vòng gọi & thiếu API key -> trả 503 có cấu trúc, KHÔNG fallback regex
    public function test_provider_failures_quota_malformed_max_rounds_and_missing_key(): void
    {
        $member = $this->createMember(6, 10);
        $h = $this->headersFor($member);

        // 6a. Hết hạn mức 429
        $this->bindFakeLlm(fn () => throw new LlmProviderException('AI_QUOTA_EXCEEDED', 'Quota exceeded', 503, true));
        $this->postJson('/api/assistant/chat', ['message' => 'Cho toi xem lich tap'], $h)
            ->assertStatus(503)
            ->assertJsonPath('status', false)
            ->assertJsonPath('error_code', 'AI_QUOTA_EXCEEDED')
            ->assertJsonPath('source', 'service_error')
            ->assertJsonPath('retryable', true);

        // 6b. Phản hồi sai định dạng (rỗng)
        $this->bindFakeLlm(fn () => $this->modelTextTurn('   '));
        $this->postJson('/api/assistant/chat', ['message' => 'Xin chào'], $h)
            ->assertStatus(503)
            ->assertJsonPath('error_code', 'AI_MALFORMED_RESPONSE')
            ->assertJsonPath('source', 'service_error');

        // 6c. Vượt giới hạn vòng gọi công cụ (infinite tool loop bị chặn ở max_tool_rounds)
        config(['assistant.max_tool_rounds' => 2]);
        $this->bindFakeLlm(fn () => $this->modelToolCallTurn([['get_my_packages', []]]));
        $this->postJson('/api/assistant/chat', ['message' => 'Gói tập của tôi'], $h)
            ->assertStatus(503)
            ->assertJsonPath('error_code', 'AI_MAX_ROUNDS_EXCEEDED')
            ->assertJsonPath('source', 'service_error');

        // 6d. Thiếu API key với client thật -> trả 503 AI_KEY_MISSING, tuyệt đối không fallback regex!
        $this->app->forgetInstance(LlmClientInterface::class);
        $this->clearControllerBindingCache();
        config(['assistant.gemini_api_key' => '']);
        $resKey = $this->postJson('/api/assistant/chat', ['message' => 'Bật nhắc uống nước'], $h)
            ->assertStatus(503)
            ->assertJsonPath('error_code', 'AI_KEY_MISSING')
            ->assertJsonPath('source', 'service_error')
            ->assertJsonPath('action', null);
        $this->assertStringNotContainsString('mỗi 2 tiếng', (string) $resKey->json('answer'));
    }

    // 7. Đổi tài khoản và đăng xuất: tuyệt đối không dùng lại dữ liệu của tài khoản trước
    public function test_account_switch_and_logout_never_reuse_previous_account_data(): void
    {
        $memberA = $this->createMember(10, 10, ['ho_ten' => 'Member A', 'chieu_cao_cm' => 180, 'can_nang_kg' => 80, 'ngay_cap_nhat_chi_so' => now()]);
        $memberB = $this->createMember(11, 10, ['ho_ten' => 'Member B', 'chieu_cao_cm' => null, 'can_nang_kg' => null, 'ngay_cap_nhat_chi_so' => null]);

        $tokA = $memberA->createToken('a');
        $hA = ['Authorization' => 'Bearer ' . $tokA->plainTextToken];
        $hB = $this->headersFor($memberB);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step % 2 === 0) {
                return $this->modelToolCallTurn([['get_my_body_metrics', []]]);
            }
            $resp = end($contents)['parts'][0]['functionResponse']['response'];
            $w = $resp['metrics']['weight_kg'] ?? 'NONE';
            return $this->modelTextTurn("STATUS={$resp['status']} WEIGHT={$w}");
        });

        // Member A thấy 80kg
        $rA = $this->postJson('/api/assistant/chat', ['message' => 'Chỉ số của tôi'], $hA)->assertOk();
        $this->assertStringContainsString('WEIGHT=80', (string) $rA->json('answer'));

        // Đổi sang Member B -> thấy missing_body_metrics, KHÔNG thấy 80kg
        $rB = $this->postJson('/api/assistant/chat', ['message' => 'Chỉ số của tôi'], $hB)->assertOk();
        $this->assertStringContainsString('STATUS=missing_body_metrics', (string) $rB->json('answer'));
        $this->assertStringNotContainsString('80', (string) $rB->json('answer'));

        // Đăng xuất (thu hồi token A) -> dùng lại token A bị xem là guest (unauthenticated), không thấy 80kg
        $tokA->accessToken->delete();
        $rLoggedOut = $this->postJson('/api/assistant/chat', ['message' => 'Chỉ số của tôi'], $hA)->assertOk();
        $this->assertStringContainsString('STATUS=unauthenticated', (string) $rLoggedOut->json('answer'));
        $this->assertStringNotContainsString('80', (string) $rLoggedOut->json('answer'));
    }

    // 8. Phân quyền nghiêm ngặt: Member A != Member B, Trainer ngoài phân công, Admin ngoài phòng tập, chặn giả mạo danh tính
    public function test_role_isolation_and_spoof_blocking(): void
    {
        $memberA = $this->createMember(20, 10, ['ho_ten' => 'Alice']);
        $memberB = $this->createMember(21, 10, ['ho_ten' => 'Bob']);
        $memberOtherGym = $this->createMember(22, 20, ['ho_ten' => 'Charlie Gym20']);

        $gB = DB::table('goi_tap')->insertGetId(['id_phong_tap' => 10, 'ma_goi_tap' => 'BOB99', 'ten_goi_tap' => 'Gói Bí Mật Của Bob', 'thoi_han_ngay' => 30, 'gia' => 1000]);
        $dB = DB::table('dang_ky_goi')->insertGetId(['id_hoi_vien' => 21]);
        DB::table('chi_tiet_dang_ky_goi')->insert(['id_dang_ky_goi' => $dB, 'id_goi_tap' => $gB, 'so_buoi' => 12, 'ngay_ket_thuc' => now()->addDays(5)->toDateString()]);

        // 8a. Client gửi user_id=21 trong payload -> bị chặn ngay 422 tại backend
        $this->postJson('/api/assistant/chat', ['message' => 'Gói tập của tôi', 'user_id' => 21], $this->headersFor($memberA))
            ->assertUnprocessable()
            ->assertJsonPath('error_code', 'FORBIDDEN_IDENTITY_SELECTOR');

        // 8b. Model cố truyền user_id=21 vào tool args -> bị ToolRegistry chặn FORBIDDEN_ARGUMENT
        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_packages', ['user_id' => 21]]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame('FORBIDDEN_ARGUMENT', $resp['error_code']);
            return $this->modelTextTurn('Không thể xem dữ liệu hội viên khác.');
        });
        $rSpoof = $this->postJson('/api/assistant/chat', ['message' => 'Xem gói của user 21'], $this->headersFor($memberA))->assertOk();
        $this->assertStringNotContainsString('Gói Bí Mật Của Bob', (string) $rSpoof->json('answer'));

        // 8c. Member A gọi get_my_packages bình thường -> tuyệt đối không thấy gói của Bob
        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_packages', []]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame('no_package', $resp['status']);
            $this->assertEmpty($resp['packages']);
            return $this->modelTextTurn('Bạn chưa đăng ký gói tập nào.');
        });
        $this->postJson('/api/assistant/chat', ['message' => 'Gói tập của tôi'], $this->headersFor($memberA))->assertOk();

        // 8d. Trainer chỉ đếm hội viên được phân công trong đúng phòng tập (gym 10), bỏ qua hội viên gym 20 và hội viên không phân công
        $pt = Trainer::forceCreate(['id' => 30, 'id_phong_tap' => 10, 'ho_ten' => 'PT 30', 'tinh_trang' => 1, 'is_active' => 1]);
        $pId = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'P1', 'tinh_trang' => 1]);
        $dkA = DB::table('dang_ky_chuong_trinh')->insertGetId(['id_hoi_vien' => 20, 'id_chuong_trinh' => $pId, 'tinh_trang' => 1]);
        $dkC = DB::table('dang_ky_chuong_trinh')->insertGetId(['id_hoi_vien' => 22, 'id_chuong_trinh' => $pId, 'tinh_trang' => 1]);
        DB::table('lich_tap')->insert([
            ['id_dang_ky_chuong_trinh' => $dkA, 'id_chuong_trinh' => $pId, 'id_hoi_vien' => 20, 'id_trainner' => 30, 'ngay_tap' => now()->addDay()->toDateString(), 'gio_bat_dau' => '09:00:00'],
            ['id_dang_ky_chuong_trinh' => $dkC, 'id_chuong_trinh' => $pId, 'id_hoi_vien' => 22, 'id_trainner' => 30, 'ngay_tap' => now()->addDay()->toDateString(), 'gio_bat_dau' => '10:00:00'],
        ]);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_gym_summary', []]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame(1, $resp['summary']['assigned_members']);
            $this->assertNull($resp['summary']['expiring_members']);
            return $this->modelTextTurn('Bạn đang phụ trách 1 hội viên.');
        });
        $this->postJson('/api/assistant/chat', ['message' => 'Thống kê học viên của tôi'], $this->headersFor($pt))->assertOk();

        // 8e. Admin gym 10 không đếm hội viên gym 20
        config(['assistant.admin_gyms' => ['40' => 10]]);
        $admin = Admin::forceCreate(['id' => 40, 'id_chuc_vu' => 1, 'ho_ten' => 'Admin 40', 'email' => 'a40@test.local', 'password' => 'x', 'tinh_trang' => 1]);
        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_gym_summary', []]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame(2, $resp['summary']['assigned_members']); // Alice & Bob ở gym 10, KHÔNG có Charlie gym 20
            $this->assertSame(1, $resp['summary']['expiring_members']); // Bob hết hạn trong 5 ngày
            return $this->modelTextTurn('Phòng tập có 2 hội viên và 1 hội viên sắp hết hạn.');
        });
        $this->postJson('/api/assistant/chat', ['message' => 'Thống kê phòng tập'], $this->headersFor($admin))->assertOk();
    }

    // 9. Múi giờ Asia/Ho_Chi_Minh ở thời điểm qua nửa đêm (UTC 17:30 ngày 26 = VN 00:30 ngày 27!)
    public function test_today_tomorrow_and_midnight_boundary_use_asia_ho_chi_minh_timezone(): void
    {
        // Đóng băng thời gian tại 2026-11-26 17:30:00 UTC => tại Asia/Ho_Chi_Minh là 2026-11-27 00:30:00!
        CarbonImmutable::setTestNow(CarbonImmutable::create(2026, 11, 26, 17, 30, 0, 'UTC'));
        try {
            $member = $this->createMember(50, 10);
            $progId = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'Sáng VN', 'tinh_trang' => 1]);
            $dkId = DB::table('dang_ky_chuong_trinh')->insertGetId(['id_hoi_vien' => 50, 'id_chuong_trinh' => $progId, 'tinh_trang' => 1]);
            DB::table('lich_tap')->insert([
                ['id_dang_ky_chuong_trinh' => $dkId, 'id_chuong_trinh' => $progId, 'id_hoi_vien' => 50, 'ngay_tap' => '2026-11-27', 'gio_bat_dau' => '06:00:00', 'tinh_trang' => '0'],
                ['id_dang_ky_chuong_trinh' => $dkId, 'id_chuong_trinh' => $progId, 'id_hoi_vien' => 50, 'ngay_tap' => '2026-11-28', 'gio_bat_dau' => '07:00:00', 'tinh_trang' => '0'],
            ]);

            $svc = app(FitnessDataService::class);
            $actor = new \App\Services\Assistant\AssistantAuthContext(true, '50', '10', 'member', 'Member 50', $member);

            $todayRes = $svc->getMySchedule($actor, 'today');
            $this->assertSame('2026-11-27', $todayRes['today']);
            $this->assertCount(1, $todayRes['sessions']);
            $this->assertSame('2026-11-27', $todayRes['sessions'][0]['scheduled_date']);

            $tomorrowRes = $svc->getMySchedule($actor, 'tomorrow');
            $this->assertCount(1, $tomorrowRes['sessions']);
            $this->assertSame('2026-11-28', $tomorrowRes['sessions'][0]['scheduled_date']);
        } finally {
            CarbonImmutable::setTestNow();
        }
    }

    // 10. Xác nhận KHÔNG còn bất kỳ đường trả lời theo keyword/regex nào trong luồng chat chính
    public function test_no_keyword_regex_scripted_path_exists_in_controller_or_orchestrator(): void
    {
        $controllerSrc = file_get_contents(app_path('Http/Controllers/AssistantController.php'));
        $orchestratorSrc = file_get_contents(app_path('Services/Assistant/AssistantOrchestrator.php'));

        $this->assertStringNotContainsString('generateDynamicDatabaseReply', (string) $controllerSrc);
        $this->assertStringNotContainsString('visionfit_rag_api_backup', (string) $controllerSrc);
        $this->assertStringNotContainsString('generateDynamicDatabaseReply', (string) $orchestratorSrc);
        $this->assertStringNotContainsString('Mình đã nhận câu hỏi', (string) $orchestratorSrc);

        // Chuyển sang backup tool-calling provider khi primary lỗi (cùng cơ chế function calling, không regex)
        $primaryFail = new class implements LlmClientInterface {
            public function generateTurn(string $m, string $s, array $c, array $t, int $to = 12): array
            {
                throw new LlmProviderException('AI_QUOTA_EXCEEDED', 'Primary 429', 503, true);
            }
        };
        $backupOk = new class($this) implements LlmClientInterface {
            private $t;

            public function __construct($t)
            {
                $this->t = $t;
            }

            public function generateTurn(string $m, string $s, array $c, array $t, int $to = 12): array
            {
                return [
                    'text' => 'Phản hồi từ backup tool-calling provider.',
                    'function_calls' => [],
                    'raw_model_content' => ['role' => 'model', 'parts' => [['text' => 'Phản hồi từ backup tool-calling provider.']]],
                    'finish_reason' => 'STOP',
                    'model' => 'backup-fc-model',
                    'provider' => 'backup_fc',
                    'usage' => null,
                ];
            }
        };

        config(['assistant.backup_model' => 'backup-fc-model']);
        $orch = new AssistantOrchestrator(
            $primaryFail,
            app(AssistantToolRegistry::class),
            app(FitnessDataService::class),
            $backupOk
        );
        $res = $orch->handleChat('Xin chào', [], 'bear', \App\Services\Assistant\AssistantAuthContext::guest());
        $this->assertTrue($res['status']);
        $this->assertSame('backup_fc:backup-fc-model', $res['source']);
    }

    // 11. Kiểm thử thay đổi dữ liệu động (17 -> 9 buổi) & minh chứng gọi thật qua HTTP endpoint + middleware AssistantToken
    public function test_dynamic_database_mutation_and_real_internal_api_dispatch(): void
    {
        $member = $this->createMember(60, 10, ['ho_ten' => 'Dynamic Member']);
        $g = DB::table('goi_tap')->insertGetId([
            'id_phong_tap' => 10, 'ma_goi_tap' => 'DYN17', 'ten_goi_tap' => 'Gói PT 1-1 Linh Hoạt',
            'thoi_han_ngay' => 60, 'gia' => 4500000,
        ]);
        $d = DB::table('dang_ky_goi')->insertGetId(['id_hoi_vien' => 60]);
        $ctId = DB::table('chi_tiet_dang_ky_goi')->insertGetId([
            'id_dang_ky_goi' => $d, 'id_goi_tap' => $g, 'so_buoi' => 17,
            'ngay_ket_thuc' => now()->addDays(20)->toDateString(),
        ]);
        $headers = $this->headersFor($member);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step % 2 === 0) {
                return $this->modelToolCallTurn([['get_my_packages', []]]);
            }
            $resp = end($contents)['parts'][0]['functionResponse']['response'];
            $pkg = $resp['packages'][0];
            $remText = $pkg['remaining_sessions'] === null ? 'chưa có dữ liệu số buổi còn lại' : (string) $pkg['remaining_sessions'];
            return $this->modelTextTurn("Gói {$pkg['name']}: tổng {$pkg['total_sessions']} buổi, còn lại: {$remText}, hết hạn {$pkg['expires_at_vn']}.");
        });

        // Lượt 1: DB có so_buoi = 17 -> trả đúng 17 + ghi nhận thật GET /api/assistant/packages (HTTP 200)
        $r1 = $this->postJson('/api/assistant/chat', [
            'message' => 'Gói còn mấy buổi, bao giờ hết hạn?',
            'species' => 'bear',
        ], $headers)->assertOk();
        $r1->assertJsonPath('tool_calls.0.name', 'get_my_packages')
            ->assertJsonPath('tool_calls.0.method', 'GET')
            ->assertJsonPath('tool_calls.0.endpoint', '/api/assistant/packages')
            ->assertJsonPath('tool_calls.0.http_status', 200);
        $this->assertStringContainsString('tổng 17 buổi', (string) $r1->json('answer'));
        $this->assertStringContainsString('chưa có dữ liệu số buổi còn lại', (string) $r1->json('answer'));

        // Đổi trực tiếp DB: so_buoi 17 -> 9
        DB::table('chi_tiet_dang_ky_goi')->where('id', $ctId)->update(['so_buoi' => 9]);

        // Lượt 2: Hỏi lại nguyên câu -> phản hồi cập nhật ngay thành 9 (không cache cũ, không kịch bản cứng!)
        $r2 = $this->postJson('/api/assistant/chat', [
            'message' => 'Gói còn mấy buổi, bao giờ hết hạn?',
            'species' => 'bear',
        ], $headers)->assertOk();
        $r2->assertJsonPath('tool_calls.0.endpoint', '/api/assistant/packages')
            ->assertJsonPath('tool_calls.0.http_status', 200);
        $this->assertStringContainsString('tổng 9 buổi', (string) $r2->json('answer'));
        $this->assertStringNotContainsString('tổng 17 buổi', (string) $r2->json('answer'));
    }

    // 12. Quy tắc khi thiếu dữ liệu, dữ liệu một phần, 403 không có quyền, API 500/timeout và chặn endpoint nguy hiểm
    public function test_missing_data_partial_data_forbidden_api_error_and_unsafe_endpoint_blocking(): void
    {
        // 12a. Dữ liệu rỗng trả missing_data_phrase đúng quy chuẩn ("Tôi chưa có thông tin đó trong dữ liệu hiện có.")
        $emptyMember = $this->createMember(61, 10, ['ho_ten' => 'Empty User']);
        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_packages', []]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame('no_package', $resp['status']);
            $this->assertSame('Tôi chưa có thông tin đó trong dữ liệu hiện có.', $resp['missing_data_phrase']);
            return $this->modelTextTurn('Tôi chưa có thông tin đó trong dữ liệu hiện có. Bạn chưa đăng ký gói tập nào.');
        });
        $rEmpty = $this->postJson('/api/assistant/chat', ['message' => 'Gói của tôi đâu?'], $this->headersFor($emptyMember))->assertOk();
        $this->assertStringContainsString('Tôi chưa có thông tin đó trong dữ liệu hiện có.', (string) $rEmpty->json('answer'));

        // 12b. Chỉ có một phần dữ liệu (có cân nặng 68kg nhưng thiếu chiều cao -> status=partial_body_metrics, bmi=null, không thành 0!)
        $partialMember = $this->createMember(62, 10, [
            'ho_ten' => 'Partial User', 'can_nang_kg' => 68, 'chieu_cao_cm' => null, 'ngay_cap_nhat_chi_so' => now(),
        ]);
        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_body_metrics', []]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame('partial_body_metrics', $resp['status']);
            $this->assertEquals(68.0, $resp['metrics']['weight_kg']);
            $this->assertNull($resp['metrics']['height_cm']);
            $this->assertNull($resp['metrics']['bmi']);
            $this->assertNull($resp['metrics']['tdee_kcal']);
            return $this->modelTextTurn('Cân nặng hiện tại là 68 kg, nhưng thiếu chiều cao nên chưa tính được BMI và TDEE.');
        });
        $this->postJson('/api/assistant/chat', ['message' => 'Xem BMI và cân nặng của tôi'], $this->headersFor($partialMember))
            ->assertOk()
            ->assertJsonPath('tool_calls.0.endpoint', '/api/assistant/body-metrics')
            ->assertJsonPath('tool_calls.0.http_status', 200)
            ->assertJsonPath('tool_calls.0.status', 'partial_body_metrics');

        // 12c. Không có quyền (HTTP 403): Member gọi trực tiếp GET /api/assistant/summary -> 403; Blocked member qua /chat -> 403 từ middleware!
        $this->getJson('/api/assistant/summary', $this->headersFor($emptyMember))->assertForbidden();
        $this->getJson('/api/assistant/packages?user_id=62', $this->headersFor($emptyMember))->assertUnprocessable();

        $blockedMember = $this->createMember(63, 10, ['is_block' => 1]);
        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_packages', []]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame('forbidden', $resp['status']);
            $this->assertSame(403, $resp['http_status']);
            return $this->modelTextTurn('Tài khoản của bạn hiện không có quyền truy cập thông tin này.');
        });
        $this->postJson('/api/assistant/chat', ['message' => 'Gói tập của tôi'], $this->headersFor($blockedMember))
            ->assertOk()
            ->assertJsonPath('tool_calls.0.status', 'forbidden')
            ->assertJsonPath('tool_calls.0.http_status', 403);

        // 12d. API nội bộ bị lỗi 500 / timeout -> trả status=api_error (TUYỆT ĐỐI không nói "không có dữ liệu"!)
        $brokenApi = new class implements \App\Services\Assistant\InternalApiClientInterface {
            public function get(string $uri, array $query = [], ?string $bearerToken = null): array
            {
                return [
                    'ok' => false,
                    'http_status' => 504,
                    'method' => 'GET',
                    'endpoint' => $uri,
                    'body' => null,
                    'error_code' => 'API_TIMEOUT',
                    'error_message' => 'Timeout khi gọi API nội bộ.',
                ];
            }
        };
        $this->app->instance(\App\Services\Assistant\InternalApiClientInterface::class, $brokenApi);
        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_schedule', ['date_preset' => 'today']]]);
            }
            $resp = $contents[2]['parts'][0]['functionResponse']['response'];
            $this->assertSame('api_error', $resp['status']);
            $this->assertSame(504, $resp['http_status']);
            return $this->modelTextTurn('Hiện chưa truy xuất được lịch tập do kết nối máy chủ tạm gián đoạn, bạn thử lại sau nhé.');
        });
        $this->postJson('/api/assistant/chat', ['message' => 'Hôm nay tôi tập gì?'], $this->headersFor($emptyMember))
            ->assertOk()
            ->assertJsonPath('tool_calls.0.status', 'api_error')
            ->assertJsonPath('tool_calls.0.http_status', 504)
            ->assertJsonPath('emotion', 'apologetic');

        // 12e. Chặn tuyệt đối gọi endpoint ngoài allowlist: /api/assistant/chat (đệ quy), auto-thanh-toan-goi (GET gây thanh toán), URL ngoài
        $realClient = new \App\Services\Assistant\LaravelInternalApiClient($this->app);
        foreach ([
            '/api/assistant/chat',
            '/api/client/auto-thanh-toan-goi/1',
            'https://evil.example.com/steal',
            '/api/tong-quan',
        ] as $disallowed) {
            $blocked = $realClient->get($disallowed);
            $this->assertFalse($blocked['ok']);
            $this->assertSame(403, $blocked['http_status']);
            $this->assertSame('ENDPOINT_NOT_ALLOWED', $blocked['error_code']);
        }

        // 12f. Đảm bảo GeminiFunctionCallingClient serialize functionCall.args rỗng thành JSON object {} chứ không phải []
        $geminiClient = new \App\Services\Assistant\GeminiFunctionCallingClient('test-key');
        $normalized = $geminiClient->normalizeContentsForJson([
            [
                'role' => 'model',
                'parts' => [
                    ['functionCall' => ['name' => 'get_my_body_metrics', 'args' => []], 'thoughtSignature' => 'sig'],
                ],
            ],
        ]);
        $encoded = json_encode($normalized);
        $this->assertStringContainsString('"args":{}', (string) $encoded);
        $this->assertStringNotContainsString('"args":[]', (string) $encoded);
    }

    // 13. Phân biệt rõ tổng số buổi, đã sử dụng, còn lại: gói PT (tính từ buoi_tap_pt) vs gói thường (null + lý do) vs gói kết hợp
    public function test_package_sessions_distinguish_pt_ledger_regular_null_and_combined(): void
    {
        $member = $this->createMember(70, 10, ['ho_ten' => 'PT Package Member']);
        $trainer = Trainer::forceCreate(['id' => 71, 'id_phong_tap' => 10, 'ho_ten' => 'PT 71', 'tinh_trang' => 1, 'is_active' => 1]);
        $headers = $this->headersFor($member);

        // 13a. Gói thường (so_buoi=20, so_buoi_pt=0) -> remaining_sessions = null + lý do rõ ràng
        $gReg = DB::table('goi_tap')->insertGetId([
            'id_phong_tap' => 10, 'ma_goi_tap' => 'REG20', 'ten_goi_tap' => 'Gói Tập Thường 20 Buổi',
            'thoi_han_ngay' => 60, 'gia' => 1200000,
        ]);
        $dReg = DB::table('dang_ky_goi')->insertGetId(['id_hoi_vien' => 70]);
        DB::table('chi_tiet_dang_ky_goi')->insert([
            'id_dang_ky_goi' => $dReg, 'id_goi_tap' => $gReg, 'so_buoi' => 20, 'so_buoi_pt' => 0,
            'ngay_ket_thuc' => now()->addDays(25)->toDateString(),
        ]);

        // 13b. Gói PT thuần (so_buoi=0, so_buoi_pt=12) + 3 buổi hợp lệ (tinh_trang 0,2,3) + 1 buổi hủy (tinh_trang=4 KHÔNG trừ!)
        $gPt = DB::table('goi_tap')->insertGetId([
            'id_phong_tap' => 10, 'ma_goi_tap' => 'PT12', 'ten_goi_tap' => 'Gói PT 1-1 12 Buổi',
            'thoi_han_ngay' => 90, 'gia' => 6000000,
        ]);
        $dPt = DB::table('dang_ky_goi')->insertGetId(['id_hoi_vien' => 70]);
        $ctPtId = DB::table('chi_tiet_dang_ky_goi')->insertGetId([
            'id_dang_ky_goi' => $dPt, 'id_goi_tap' => $gPt, 'so_buoi' => 0, 'so_buoi_pt' => 12,
            'id_trainer' => $trainer->id, 'ngay_ket_thuc' => now()->addDays(40)->toDateString(),
        ]);
        DB::table('buoi_tap_pt')->insert([
            ['id_chi_tiet_dang_ky_goi' => $ctPtId, 'id_hoi_vien' => 70, 'id_trainer' => 71, 'tinh_trang' => 3], // hoàn thành
            ['id_chi_tiet_dang_ky_goi' => $ctPtId, 'id_hoi_vien' => 70, 'id_trainer' => 71, 'tinh_trang' => 2], // đã xác nhận
            ['id_chi_tiet_dang_ky_goi' => $ctPtId, 'id_hoi_vien' => 70, 'id_trainer' => 71, 'tinh_trang' => 0], // chờ đặt
            ['id_chi_tiet_dang_ky_goi' => $ctPtId, 'id_hoi_vien' => 70, 'id_trainer' => 71, 'tinh_trang' => 4], // ĐÃ HỦY -> không trừ!
        ]);

        // 13c. Gói kết hợp (so_buoi=30, so_buoi_pt=10) + 2 buổi PT đã dùng
        $gCombo = DB::table('goi_tap')->insertGetId([
            'id_phong_tap' => 10, 'ma_goi_tap' => 'CMB30', 'ten_goi_tap' => 'Gói Combo 30 Thường + 10 PT',
            'thoi_han_ngay' => 90, 'gia' => 7500000,
        ]);
        $dCombo = DB::table('dang_ky_goi')->insertGetId(['id_hoi_vien' => 70]);
        $ctComboId = DB::table('chi_tiet_dang_ky_goi')->insertGetId([
            'id_dang_ky_goi' => $dCombo, 'id_goi_tap' => $gCombo, 'so_buoi' => 30, 'so_buoi_pt' => 10,
            'id_trainer' => $trainer->id, 'ngay_ket_thuc' => now()->addDays(50)->toDateString(),
        ]);
        DB::table('buoi_tap_pt')->insert([
            ['id_chi_tiet_dang_ky_goi' => $ctComboId, 'id_hoi_vien' => 70, 'id_trainer' => 71, 'tinh_trang' => 3],
            ['id_chi_tiet_dang_ky_goi' => $ctComboId, 'id_hoi_vien' => 70, 'id_trainer' => 71, 'tinh_trang' => 2],
        ]);

        $res = $this->getJson('/api/assistant/packages', $headers)->assertOk();
        $pkgs = collect($res->json('data.packages'))->keyBy('name');

        // Gói PT thuần: tổng 12, đã dùng 3 (hoàn thành 1), còn lại 9 (không trừ buổi hủy!)
        $ptPkg = $pkgs['Gói PT 1-1 12 Buổi'];
        $this->assertSame('pt_package', $ptPkg['package_type']);
        $this->assertSame(12, $ptPkg['total_sessions']);
        $this->assertSame(3, $ptPkg['used_sessions']);
        $this->assertSame(1, $ptPkg['completed_sessions']);
        $this->assertSame(9, $ptPkg['remaining_sessions']);
        $this->assertNull($ptPkg['remaining_sessions_unavailable_reason']);

        // Gói thường: tổng 20, đã dùng null, còn lại null + có lý do thiếu dữ liệu
        $regPkg = $pkgs['Gói Tập Thường 20 Buổi'];
        $this->assertSame('regular_package', $regPkg['package_type']);
        $this->assertSame(20, $regPkg['total_sessions']);
        $this->assertNull($regPkg['used_sessions']);
        $this->assertNull($regPkg['remaining_sessions']);
        $this->assertNotEmpty($regPkg['remaining_sessions_unavailable_reason']);

        // Gói kết hợp: phần thường null, phần PT có đủ 10 / 2 / 8
        $cmbPkg = $pkgs['Gói Combo 30 Thường + 10 PT'];
        $this->assertSame('combined_package', $cmbPkg['package_type']);
        $this->assertSame(30, $cmbPkg['total_sessions']);
        $this->assertNull($cmbPkg['remaining_sessions']);
        $this->assertSame(10, $cmbPkg['pt_sessions']['total_sessions']);
        $this->assertSame(2, $cmbPkg['pt_sessions']['used_sessions']);
        $this->assertSame(8, $cmbPkg['pt_sessions']['remaining_sessions']);

        // Thêm 2 buổi PT mới vào buoi_tap_pt -> remaining_sessions giảm động 9 -> 7!
        DB::table('buoi_tap_pt')->insert([
            ['id_chi_tiet_dang_ky_goi' => $ctPtId, 'id_hoi_vien' => 70, 'id_trainer' => 71, 'tinh_trang' => 2],
            ['id_chi_tiet_dang_ky_goi' => $ctPtId, 'id_hoi_vien' => 70, 'id_trainer' => 71, 'tinh_trang' => 3],
        ]);
        $res2 = $this->getJson('/api/assistant/packages', $headers)->assertOk();
        $ptPkg2 = collect($res2->json('data.packages'))->keyBy('name')['Gói PT 1-1 12 Buổi'];
        $this->assertSame(5, $ptPkg2['used_sessions']);
        $this->assertSame(7, $ptPkg2['remaining_sessions']);
    }

    // 14. Cô lập trạng thái giữa nhiều người dùng xen kẽ qua Laravel Kernel sub-requests (Auth guard / Request / Token isolation)
    public function test_multi_user_interleaved_subrequests_never_leak_auth_guard_or_state(): void
    {
        $userA = $this->createMember(80, 10, ['ho_ten' => 'Alice 80', 'can_nang_kg' => 55, 'chieu_cao_cm' => 162, 'ngay_cap_nhat_chi_so' => now()]);
        $userB = $this->createMember(81, 10, ['ho_ten' => 'Bob 81', 'can_nang_kg' => 88, 'chieu_cao_cm' => 182, 'ngay_cap_nhat_chi_so' => now()]);
        $trainer = Trainer::forceCreate(['id' => 82, 'id_phong_tap' => 10, 'ho_ten' => 'PT 82', 'tinh_trang' => 1, 'is_active' => 1]);
        $blocked = $this->createMember(83, 10, ['ho_ten' => 'Blocked 83', 'is_block' => 1]);

        $hA = $this->headersFor($userA);
        $hB = $this->headersFor($userB);
        $hPT = $this->headersFor($trainer);
        $hBlocked = $this->headersFor($blocked);

        // Cố tình đặt Auth guard ở userB trước khi gọi cho userA -> sub-request phải quên guard và xác thực đúng token của userA!
        Auth::guard('sanctum')->setUser($userB);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step % 2 === 0) {
                $lastUserText = end($contents)['parts'][0]['text'] ?? '';
                if (str_contains($lastUserText, 'thống kê')) {
                    return $this->modelToolCallTurn([['get_gym_summary', []]]);
                }
                return $this->modelToolCallTurn([['get_my_body_metrics', []]]);
            }
            $resp = end($contents)['parts'][0]['functionResponse']['response'];
            $w = $resp['metrics']['weight_kg'] ?? ($resp['summary']['assigned_members'] ?? 'NONE');
            return $this->modelTextTurn("ST={$resp['status']}|VAL={$w}");
        });

        // 1. User A (dù guard ngoài đang bị gắn userB) -> phải nhận đúng 55kg của Alice, không phải 88kg của Bob!
        $rA = $this->postJson('/api/assistant/chat', ['message' => 'Chỉ số của tôi'], $hA)->assertOk();
        $this->assertSame('ST=ok|VAL=55', $rA->json('answer'));
        // Guard không còn giữ poisoned userB (81); nếu Sanctum lazy-resolve từ header request hiện tại thì phải là Alice (80)
        $this->assertSame(80, Auth::guard('sanctum')->user()?->getKey());

        // 2. Xen kẽ User B -> nhận đúng 88kg
        $rB = $this->postJson('/api/assistant/chat', ['message' => 'Chỉ số của tôi'], $hB)->assertOk();
        $this->assertSame('ST=ok|VAL=88', $rB->json('answer'));

        // 3. Xen kẽ Trainer -> gọi get_gym_summary (200), không bị dính state member
        $rPT = $this->postJson('/api/assistant/chat', ['message' => 'Xem thống kê'], $hPT)->assertOk();
        $this->assertSame('ST=ok|VAL=0', $rPT->json('answer'));
        $this->assertSame('/api/assistant/summary', $rPT->json('tool_calls.0.endpoint'));

        // 4. Xen kẽ Blocked user -> nhận 403 forbidden từ middleware
        $rBlk = $this->postJson('/api/assistant/chat', ['message' => 'Chỉ số của tôi'], $hBlocked)->assertOk();
        $this->assertSame('ST=forbidden|VAL=NONE', $rBlk->json('answer'));
        $this->assertSame(403, $rBlk->json('tool_calls.0.http_status'));

        // 5. Xen kẽ Guest (không token) -> nhận 401 unauthenticated, không kế thừa token hay Auth guard của user trước!
        $rGuest = $this->postJson('/api/assistant/chat', ['message' => 'Chỉ số của tôi'])->assertOk();
        $this->assertSame('ST=unauthenticated|VAL=NONE', $rGuest->json('answer'));
        $this->assertSame(401, $rGuest->json('tool_calls.0.http_status'));
        $this->assertNull(Auth::guard('sanctum')->user());

        // 6. Quay lại User A -> vẫn nguyên vẹn 55kg
        $rA2 = $this->postJson('/api/assistant/chat', ['message' => 'Chỉ số của tôi'], $hA)->assertOk();
        $this->assertSame('ST=ok|VAL=55', $rA2->json('answer'));
    }

    // 15. BUG-03 Regression: Payload trả đúng weekday_vn theo Asia/Ho_Chi_Minh và kiểm tra/sửa sai thứ trong câu trả lời cuối
    public function test_schedule_includes_verified_weekday_vn_and_detects_mismatched_final_answer_weekday(): void
    {
        // Đóng băng tại Thứ Năm 26/11/2026 (VN) -> ngày mốt 28/11/2026 là Thứ Bảy (KHÔNG phải Thứ Sáu!)
        CarbonImmutable::setTestNow(CarbonImmutable::create(2026, 11, 26, 10, 0, 0, 'Asia/Ho_Chi_Minh'));
        try {
            $member = $this->createMember(90, 10, ['ho_ten' => 'Weekday User']);
            $progId = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'Giảm mỡ Toàn thân', 'tinh_trang' => 1]);
            $dkId = DB::table('dang_ky_chuong_trinh')->insertGetId(['id_hoi_vien' => 90, 'id_chuong_trinh' => $progId, 'tinh_trang' => 1]);
            DB::table('lich_tap')->insert([
                'id_dang_ky_chuong_trinh' => $dkId, 'id_chuong_trinh' => $progId,
                'id_hoi_vien' => 90, 'ngay_tap' => '2026-11-28', 'gio_bat_dau' => '07:00:00', 'tinh_trang' => '0',
            ]);

            // 15a. Kiểm tra trực tiếp detector bắt đúng lỗi "Thứ Sáu, 28/11/2026" (phải là Thứ Bảy)
            $mismatches = \App\Services\Assistant\VietnameseDateVerifier::findWeekdayMismatches(
                'Lịch tập ngày mốt (Thứ Sáu, 28/11/2026) lúc 07:00.'
            );
            $this->assertCount(1, $mismatches);
            $this->assertSame('Thứ Sáu', $mismatches[0]['claimed_weekday']);
            $this->assertSame('Thứ Bảy', $mismatches[0]['expected_weekday']);
            $this->assertSame('28/11/2026', $mismatches[0]['date']);

            // 15b. Kiểm tra payload API trả đồng nhất scheduled_date, time_vn, weekday_vn và date_vn_with_weekday
            $headers = $this->headersFor($member);
            $this->getJson('/api/assistant/schedule?date_preset=custom&date_from=2026-11-28', $headers)
                ->assertOk()
                ->assertJsonPath('data.today_weekday_vn', 'Thứ Năm')
                ->assertJsonPath('data.tomorrow_weekday_vn', 'Thứ Sáu')
                ->assertJsonPath('data.sessions.0.scheduled_date', '2026-11-28')
                ->assertJsonPath('data.sessions.0.weekday_vn', 'Thứ Bảy')
                ->assertJsonPath('data.sessions.0.date_vn_with_weekday', 'Thứ Bảy, 28/11/2026');

            // 15c. Giả lập LLM viết nhầm "Thứ Sáu, 28/11/2026" -> Orchestrator phát hiện và chuẩn hóa về "Thứ Bảy, 28/11/2026"
            $this->bindFakeLlm(function (int $step, array $contents) {
                if ($step === 0) {
                    return $this->modelToolCallTurn([['get_my_schedule', ['date_preset' => 'custom', 'date_from' => '2026-11-28']]]);
                }
                return $this->modelTextTurn('Lịch tập ngày mốt (Thứ Sáu, 28/11/2026) của bạn là Giảm mỡ Toàn thân lúc 07:00.');
            });

            $res = $this->postJson('/api/assistant/chat', [
                'message' => 'ngay mot minh co buoi tap nao ko vay',
                'species' => 'bear',
            ], $headers)->assertOk();

            $finalAnswer = (string) $res->json('answer');
            $this->assertStringContainsString('Thứ Bảy, 28/11/2026', $finalAnswer);
            $this->assertStringNotContainsString('Thứ Sáu, 28/11/2026', $finalAnswer);
            $this->assertEmpty(\App\Services\Assistant\VietnameseDateVerifier::findWeekdayMismatches($finalAnswer));
        } finally {
            CarbonImmutable::setTestNow();
        }
    }

    // 16. OBS-01 Regression: Khi công cụ tri thức lỗi (embedding_unavailable) hoặc rỗng (empty), tầng điều phối chặn model tự bổ sung kiến thức nền; câu đa ý giữ phần đã xác minh
    public function test_obs01_orchestrator_blocks_ungrounded_advice_on_tool_failure_or_empty_knowledge_and_preserves_multi_intent(): void
    {
        $member = $this->createMember(91, 10, [
            'ho_ten' => 'Grounding User',
            'can_nang_kg' => 64,
            'chieu_cao_cm' => 168,
            'di_ung' => ['Hải sản'],
            'ngay_cap_nhat_chi_so' => now(),
        ]);
        $headers = $this->headersFor($member);

        // Giả lập embedding client lỗi hạn mức ngày (quota_scope=day)
        $this->app->instance(\App\Services\Assistant\EmbeddingClientInterface::class, new class implements \App\Services\Assistant\EmbeddingClientInterface {
            public function modelName(): string
            {
                return 'fake-quota-embed';
            }

            public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array
            {
                throw new \App\Services\Assistant\LlmProviderException(
                    'AI_QUOTA_EXCEEDED',
                    'Dịch vụ embedding Gemini đã hết hạn mức ngày (RPD).',
                    503,
                    false,
                    'day',
                    null
                );
            }
        });
        $this->seedKnowledgeIndex([['bai_tap', 1, 'exercise', 'Squat']]);

        // 16a. Toàn bộ công cụ lỗi (embedding_unavailable) + LLM cố chèn thêm "Tuy nhiên, về cơ bản..." -> Orchestrator PHẢI chặn!
        $this->bindFakeLlm(function (int $step) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['search_fitness_knowledge', ['query' => 'Nordic Hamstring Curl 888']]]);
            }
            return $this->modelTextTurn('Dịch vụ tìm kiếm đang lỗi. Tuy nhiên, về cơ bản bạn quỳ xuống và hạ thân người bằng cơ đùi sau!');
        });

        $rFail = $this->postJson('/api/assistant/chat', [
            'message' => 'Hướng dẫn Nordic Hamstring Curl 888',
        ], $headers)->assertOk();
        $this->assertStringContainsString('chưa thể truy xuất', (string) $rFail->json('answer'));
        $this->assertStringNotContainsString('quỳ xuống', (string) $rFail->json('answer'));
        $this->assertSame('apologetic', $rFail->json('emotion'));
        $this->assertFalse((bool) $rFail->json('retryable')); // hết hạn mức ngày -> retryable=false

        // 16b. Câu hỏi đa ý: get_my_body_metrics THÀNH CÔNG (dị ứng Hải sản) + search_fitness_knowledge LỖI -> giữ nguyên phần đã xác minh + nêu rõ phần chưa truy xuất được
        $this->bindFakeLlm(function (int $step) {
            if ($step === 0) {
                return $this->modelToolCallTurn([
                    ['get_my_body_metrics', []],
                    ['search_fitness_knowledge', ['query' => 'Salad tôm sú']],
                ]);
            }
            return $this->modelTextTurn('Hồ sơ của bạn ghi nhận dị ứng Hải sản nên món tôm sú không an toàn.');
        });

        $rMulti = $this->postJson('/api/assistant/chat', [
            'message' => 'Món salad tôm sú có hợp với tôi không?',
        ], $headers)->assertOk();
        $multiAns = (string) $rMulti->json('answer');
        $this->assertStringContainsString('dị ứng Hải sản', $multiAns);
        $this->assertStringContainsString('chưa thể truy xuất', $multiAns);

        // 16c. Chỉ gọi search_fitness_knowledge và trả về empty -> chặn model bịa tư vấn kiến thức nền
        $this->app->instance(\App\Services\Assistant\EmbeddingClientInterface::class, new class implements \App\Services\Assistant\EmbeddingClientInterface {
            public function modelName(): string
            {
                return 'fake-quota-embed';
            }

            public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array
            {
                return [0.0, 1.0]; // trực giao với [1.0, 0.0] -> similarity = 0.0 < 0.70 -> empty
            }
        });
        \Illuminate\Support\Facades\Cache::flush();

        $this->bindFakeLlm(function (int $step) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['search_fitness_knowledge', ['query' => 'giáo án leo Everest 8848m']]]);
            }
            return $this->modelTextTurn('Bạn nên tập chạy bộ 20km mỗi ngày để leo Everest!');
        });

        $rEmpty = $this->postJson('/api/assistant/chat', [
            'message' => 'Trong kho có giáo án leo Everest 8848m không?',
        ], $headers)->assertOk();
        $this->assertStringContainsString('Tôi chưa có thông tin đó trong dữ liệu hiện có.', (string) $rEmpty->json('answer'));
        $this->assertStringNotContainsString('chạy bộ 20km', (string) $rEmpty->json('answer'));
    }

    // 17. DEF-02 Regression: Phân biệt thiếu nhãn thứ với sai thứ; tự bổ sung đủ Thứ + ngày + giờ vào cả bảng lịch từ dữ liệu backend
    public function test_def02_schedule_table_missing_weekday_is_distinguished_and_enriched_from_backend(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::create(2026, 11, 27, 0, 5, 0, 'Asia/Ho_Chi_Minh'));
        try {
            $member = $this->createMember(92, 10, ['ho_ten' => 'Midnight Table User']);
            $trainer = Trainer::forceCreate(['id' => 93, 'id_phong_tap' => 10, 'ho_ten' => 'HLV Minh Tuấn', 'tinh_trang' => 1, 'is_active' => 1]);
            $progId = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'Giảm mỡ Toàn thân 30 ngày', 'tinh_trang' => 1]);
            $dkId = DB::table('dang_ky_chuong_trinh')->insertGetId(['id_hoi_vien' => 92, 'id_chuong_trinh' => $progId, 'tinh_trang' => 1]);
            DB::table('lich_tap')->insert([
                ['id_dang_ky_chuong_trinh' => $dkId, 'id_chuong_trinh' => $progId, 'id_hoi_vien' => 92, 'id_trainner' => $trainer->id, 'ngay_tap' => '2026-11-30', 'gio_bat_dau' => '23:55:00', 'tinh_trang' => '0'],
                ['id_dang_ky_chuong_trinh' => $dkId, 'id_chuong_trinh' => $progId, 'id_hoi_vien' => 92, 'id_trainner' => null, 'ngay_tap' => '2026-12-01', 'gio_bat_dau' => '00:05:00', 'tinh_trang' => '0'],
            ]);

            // 17a. Kiểm tra phân biệt thiếu nhãn thứ (missing_weekday) với sai thứ (mismatch = 0)
            $tableText = "| Buổi tập | Thời gian | PT |\n| :--- | :--- | :--- |\n| Giảm mỡ Toàn thân 30 ngày | 23:55 30/11/2026 | HLV Minh Tuấn |";
            $this->assertEmpty(\App\Services\Assistant\VietnameseDateVerifier::findWeekdayMismatches($tableText));
            $missing = \App\Services\Assistant\VietnameseDateVerifier::findDatesMissingWeekday($tableText, ['30/11/2026' => 'Thứ Hai']);
            $this->assertCount(1, $missing);
            $this->assertSame('Thứ Hai', $missing[0]['expected_weekday']);

            // 17b. Giả lập LLM xuất bảng lịch chỉ có "23:55 30/11/2026" (thiếu "Thứ Hai") -> Orchestrator bổ sung thành "23:55 Thứ Hai, 30/11/2026"
            $this->bindFakeLlm(function (int $step) use ($tableText) {
                if ($step === 0) {
                    return $this->modelToolCallTurn([['get_my_schedule', ['date_preset' => 'custom', 'date_from' => '2026-11-30', 'date_to' => '2026-11-30']]]);
                }
                return $this->modelTextTurn($tableText);
            });

            $res = $this->postJson('/api/assistant/chat', [
                'message' => 'Ngày 30/11/2026 lúc tối muộn tôi có lịch tập nào không?',
            ], $this->headersFor($member))->assertOk();

            $ans = (string) $res->json('answer');
            $this->assertStringContainsString('23:55 Thứ Hai, 30/11/2026', $ans);
            $this->assertEmpty(\App\Services\Assistant\VietnameseDateVerifier::findWeekdayMismatches($ans));
            $this->assertEmpty(\App\Services\Assistant\VietnameseDateVerifier::findDatesMissingWeekday($ans, ['30/11/2026' => 'Thứ Hai']));
        } finally {
            CarbonImmutable::setTestNow();
        }
    }

    // 18. OBS-01 Extended Regression: Kiểm chứng chặn tư vấn không có nguồn cho toàn bộ lỗi timeout (504), 429, 5xx, embedding minute-quota và multi-intent có công cụ 5xx
    public function test_obs01_blocks_ungrounded_advice_on_tool_timeout_429_and_5xx_and_preserves_multi_intent_partial_5xx(): void
    {
        $member = $this->createMember(94, 10, [
            'ho_ten' => 'Obs01 Error Matrix User',
            'can_nang_kg' => 65,
            'chieu_cao_cm' => 170,
            'ngay_cap_nhat_chi_so' => now(),
        ]);
        $headers = $this->headersFor($member);

        // 18a. Kiểm tra trực tiếp từng mã lỗi từ InternalApiClient: timeout (504), rate-limit (429), lỗi máy chủ (500/503)
        $errorMatrix = [
            ['http_status' => 504, 'error_code' => 'API_TIMEOUT', 'label' => 'timeout'],
            ['http_status' => 429, 'error_code' => 'RATE_LIMITED', 'label' => '429'],
            ['http_status' => 500, 'error_code' => 'INTERNAL_API_ERROR', 'label' => '500'],
            ['http_status' => 503, 'error_code' => 'SERVICE_UNAVAILABLE', 'label' => '503'],
        ];

        foreach ($errorMatrix as $case) {
            $status = $case['http_status'];
            $errCode = $case['error_code'];

            $this->app->instance(\App\Services\Assistant\InternalApiClientInterface::class, new class($status, $errCode) implements \App\Services\Assistant\InternalApiClientInterface {
                public function __construct(private int $status, private string $errorCode)
                {
                }

                public function get(string $uri, array $query = [], ?string $bearerToken = null): array
                {
                    return [
                        'ok' => false,
                        'http_status' => $this->status,
                        'method' => 'GET',
                        'endpoint' => $uri,
                        'body' => null,
                        'error_code' => $this->errorCode,
                        'error_message' => "Simulated {$this->status} failure",
                    ];
                }
            });

            $this->bindFakeLlm(function (int $step) {
                if ($step === 0) {
                    return $this->modelToolCallTurn([['get_my_schedule', ['date_preset' => 'today']]]);
                }
                return $this->modelTextTurn('Máy chủ đang bận. Tuy nhiên bạn vẫn nên tự chạy bộ 45 phút và hít đất 100 cái mỗi ngày nhé!');
            });

            $res = $this->postJson('/api/assistant/chat', [
                'message' => "Hôm nay tôi có lịch tập nào không? ({$case['label']})",
            ], $headers)->assertOk();

            $ans = (string) $res->json('answer');
            $this->assertStringContainsString('chưa thể truy xuất', $ans, "Case {$case['label']} must return operational error");
            $this->assertStringNotContainsString('hít đất 100 cái', $ans, "Case {$case['label']} must block ungrounded advice");
            $this->assertSame('apologetic', $res->json('emotion'));
            $this->assertSame($status, $res->json('tool_calls.0.http_status'));
            $this->assertSame('api_error', $res->json('tool_calls.0.status'));
            $this->assertTrue((bool) $res->json('retryable'));
        }

        // 18b. Multi-intent: get_my_body_metrics thành công (200) + get_my_schedule lỗi 503 -> giữ phần chỉ số đã xác minh và nêu rõ phần lịch tập bị lỗi
        $this->app->instance(\App\Services\Assistant\InternalApiClientInterface::class, new class implements \App\Services\Assistant\InternalApiClientInterface {
            public function get(string $uri, array $query = [], ?string $bearerToken = null): array
            {
                if ($uri === '/api/assistant/body-metrics') {
                    return [
                        'ok' => true,
                        'http_status' => 200,
                        'method' => 'GET',
                        'endpoint' => $uri,
                        'body' => [
                            'status' => true,
                            'data' => [
                                'status' => 'ok',
                                'metrics' => ['weight_kg' => 65, 'height_cm' => 170, 'bmi' => 22.49, 'bmi_status' => 'Bình thường'],
                            ],
                        ],
                        'error_code' => null,
                        'error_message' => null,
                    ];
                }

                return [
                    'ok' => false,
                    'http_status' => 503,
                    'method' => 'GET',
                    'endpoint' => $uri,
                    'body' => null,
                    'error_code' => 'SERVICE_UNAVAILABLE',
                    'error_message' => 'Schedule service down',
                ];
            }
        });

        $this->bindFakeLlm(function (int $step) {
            if ($step === 0) {
                return $this->modelToolCallTurn([
                    ['get_my_body_metrics', []],
                    ['get_my_schedule', ['date_preset' => 'today']],
                ]);
            }
            return $this->modelTextTurn('Cân nặng hiện tại của bạn là 65kg, chiều cao 170cm (BMI 22.49 - Bình thường).');
        });

        $rPartial = $this->postJson('/api/assistant/chat', [
            'message' => 'Xem giúp mình chỉ số cơ thể và lịch tập hôm nay',
        ], $headers)->assertOk();

        $partialAns = (string) $rPartial->json('answer');
        $this->assertStringContainsString('65kg', $partialAns);
        $this->assertStringContainsString('chưa thể truy xuất', $partialAns);

        // 18c. Embedding lỗi hạn mức phút (quota_scope=minute, 429) -> chặn kiến thức nền nhưng đánh dấu retryable=true
        $this->app->instance(
            \App\Services\Assistant\InternalApiClientInterface::class,
            new \App\Services\Assistant\LaravelInternalApiClient($this->app)
        );
        $this->app->instance(\App\Services\Assistant\EmbeddingClientInterface::class, new class implements \App\Services\Assistant\EmbeddingClientInterface {
            public function modelName(): string
            {
                return 'fake-minute-embed';
            }

            public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array
            {
                throw new \App\Services\Assistant\LlmProviderException(
                    'AI_QUOTA_EXCEEDED',
                    'Dịch vụ embedding Gemini tạm chạm giới hạn phút (RPM).',
                    503,
                    true,
                    'minute',
                    2.0
                );
            }
        });
        $this->seedKnowledgeIndex([['bai_tap', 99, 'exercise', 'Deadlift']]);

        $this->bindFakeLlm(function (int $step) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['search_fitness_knowledge', ['query' => 'Kỹ thuật Deadlift chuẩn']]]);
            }
            return $this->modelTextTurn('Hệ thống tìm kiếm tạm lỗi. Nhưng về cơ bản bạn chỉ cần giữ lưng thẳng và kéo tạ lên!');
        });

        $rMin = $this->postJson('/api/assistant/chat', [
            'message' => 'Hướng dẫn kỹ thuật Deadlift chuẩn',
        ], $headers)->assertOk();
        $this->assertStringContainsString('chưa thể truy xuất', (string) $rMin->json('answer'));
        $this->assertStringNotContainsString('kéo tạ lên', (string) $rMin->json('answer'));
        $this->assertTrue((bool) $rMin->json('retryable'));
    }

    // Khóa GEMINI_API_KEY bị từ chối: mọi model Gemini dùng chung khóa nên chỉ gọi 1 lần, không thử lần lượt từng model
    public function test_auth_error_stops_after_first_primary_model_instead_of_trying_every_model(): void
    {
        config(['assistant.gemini_fallback_models' => ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest']]);
        $member = $this->createMember(70, 10);

        $fake = $this->bindFakeLlm(fn () => throw new LlmProviderException('AI_AUTH_ERROR', 'API key not valid', 503, false));
        $res = $this->postJson('/api/assistant/chat', ['message' => 'Lịch tập hôm nay của tôi?'], $this->headersFor($member))
            ->assertStatus(503)
            ->assertJsonPath('status', false)
            ->assertJsonPath('error_code', 'AI_AUTH_ERROR')
            ->assertJsonPath('source', 'service_error')
            ->assertJsonPath('retryable', false);

        $this->assertCount(1, $fake->recordedCalls, 'Không được thử lại các model Gemini khác khi khóa API bị từ chối.');
        $this->assertSame([], $res->json('tool_calls'));
    }

    // Chỉ mục kho kiến thức đang được request khác khởi tạo (giữ khóa file): chặn model tự bổ sung kiến thức nền (OBS-01)
    public function test_knowledge_index_not_ready_blocks_ungrounded_pretraining_answer(): void
    {
        $member = $this->createMember(71, 10);
        // Giả lập một request khác đang lập chỉ mục lần đầu: giữ khóa file, chỉ mục còn trống
        $lock = fopen($this->kbIndexPath . '.lock', 'c');
        $this->assertTrue(flock($lock, LOCK_EX));

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['search_fitness_knowledge', ['query' => 'creatine uống lúc nào']]]);
            }
            $resp = end($contents)['parts'][0]['functionResponse']['response'];
            $this->assertSame('index_not_ready', $resp['status']);
            // Model cố "chữa cháy" bằng kiến thức nền -> orchestrator phải chặn
            return $this->modelTextTurn('Theo kiến thức chung, bạn nên uống creatine 5g mỗi ngày sau buổi tập.');
        });

        $res = $this->postJson('/api/assistant/chat', ['message' => 'Creatine nên uống lúc nào?'], $this->headersFor($member))
            ->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('error_code', 'KNOWLEDGE_INDEX_NOT_READY')
            ->assertJsonPath('emotion', 'apologetic')
            ->assertJsonPath('tool_calls.0.name', 'search_fitness_knowledge')
            ->assertJsonPath('tool_calls.0.status', 'index_not_ready');

        $answer = (string) $res->json('answer');
        $this->assertStringContainsString('chưa thể truy xuất kho kiến thức', $answer);
        $this->assertStringNotContainsString('5g', $answer);
        $this->assertTrue((bool) $res->json('retryable'));

        flock($lock, LOCK_UN);
        fclose($lock);
    }

    /** Tạo kế hoạch ăn hôm nay gồm các món [ten, bua_an, nguyen_lieu] cho hội viên. */
    private function seedTodayMealPlan(int $memberId, array $dishes): void
    {
        $progId = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'Tăng cơ', 'tinh_trang' => 1]);
        $dkId = DB::table('dang_ky_chuong_trinh')->insertGetId(['id_hoi_vien' => $memberId, 'id_chuong_trinh' => $progId, 'tinh_trang' => 1]);
        $khaId = DB::table('ke_hoach_an')->insertGetId([
            'id_chuong_trinh' => $progId, 'id_dang_ky_chuong_trinh' => $dkId, 'ten_ke_hoach' => 'KH tăng cơ', 'tinh_trang' => 1,
        ]);
        $today = CarbonImmutable::now('Asia/Ho_Chi_Minh')->toDateString();
        foreach ($dishes as $i => [$name, $bua, $ingredients]) {
            $monId = DB::table('mon_an')->insertGetId([
                'ten_mon_an' => $name, 'loai_bua' => $bua, 'nguyen_lieu' => $ingredients,
                'calo' => 400, 'protein' => 30, 'carb' => 40, 'fat' => 10, 'tinh_trang' => 1,
            ]);
            DB::table('khau_phan_an')->insert([
                'id_ke_hoach_an' => $khaId, 'id_muc_tieu_dinh_duong' => 1, 'id_mon_an' => $monId,
                'bua_an' => $bua, 'ngay_an' => $today, 'gio_an' => sprintf('%02d:00:00', 7 + $i * 2),
            ]);
        }
    }

    // Món trong thực đơn CÁ NHÂN chứa chất gây dị ứng phải được gắn allergy_warning (trước đây chỉ kho kiến thức mới cảnh báo)
    /**
     * @dataProvider allergyStorageShapes
     */
    public function test_personal_meal_plan_flags_allergens_including_marine_fish_for_seafood_allergy(string $shape): void
    {
        $member = $this->createMember(72, 10, $shape === 'json_array' ? ['di_ung' => ['Hải sản']] : []);
        if ($shape === 'plain_string') {
            // Dạng dữ liệu thật trong DB: chuỗi thường (không phải JSON) -> cast 'array' của Client trả NULL
            DB::table('clients')->where('id', 72)->update(['di_ung' => 'Hải sản']);
            $member = Client::find(72);
            $this->assertNull($member->di_ung, 'Tiền đề: cast array trả NULL với chuỗi thường');
        }
        $this->seedTodayMealPlan(72, [
            ['Cơm cá hồi và rau củ', 'TRUA', 'Cá hồi phi lê 150g, gạo lứt, bông cải'],
            ['Cơm gạo lứt ức gà', 'TRUA', 'Ức gà 150g, gạo lứt'],
            ['Cá lóc kho tộ', 'TOI', 'Cá lóc 200g, nước mắm'],
        ]);

        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([['get_my_meal_plan', ['date_preset' => 'today', 'meal_type' => 'ALL']]]);
            }
            $resp = end($contents)['parts'][0]['functionResponse']['response'];
            $byName = collect($resp['meals'])->keyBy('name');
            $this->assertSame(1, $resp['allergy_warnings_count']);
            $this->assertContains('cá hồi', $byName['Cơm cá hồi và rau củ']['matched_allergens']);
            $this->assertArrayNotHasKey('allergy_warning', $byName['Cơm gạo lứt ức gà']);
            // Cá nước ngọt không bị gắn nhầm là hải sản
            $this->assertArrayNotHasKey('allergy_warning', $byName['Cá lóc kho tộ']);
            return $this->modelTextTurn('⚠️ Cơm cá hồi chứa cá hồi — bạn dị ứng hải sản.');
        });

        $this->postJson('/api/assistant/chat', ['message' => 'Thực đơn hôm nay của tôi?'], $this->headersFor($member))
            ->assertOk()
            ->assertJsonPath('tool_calls.0.status', 'ok');

        // Hồ sơ chỉ số cũng phải hiện đúng dị ứng thay vì "Không"
        $this->assertSame('Hải sản', app(FitnessDataService::class)->allergyTextOf(Client::find(72)));
    }

    // Task 2.4: hội viên CHƯA đăng ký mà muốn tập -> báo chưa đăng ký + điều hướng tới ĐĂNG KÝ CHƯƠNG TRÌNH (không phải trang tập/gói tập)
    public function test_training_intent_without_program_redirects_to_register_program_and_auto_navigates(): void
    {
        $member = $this->createMember(74, 10);

        // Model gọi cả get_my_packages (tự gắn nút "đăng ký gói") lẫn suggest_app_navigation -> nút điều hướng phải thắng
        $this->bindFakeLlm(function (int $step, array $contents) {
            if ($step === 0) {
                return $this->modelToolCallTurn([
                    ['suggest_app_navigation', ['target' => 'NAVIGATE_WORKOUT']],
                    ['get_my_packages', []],
                ]);
            }
            $nav = $contents[count($contents) - 1]['parts'][0]['functionResponse']['response'];
            $this->assertSame('NAVIGATE_WORKOUT', $nav['requested_target']);
            $this->assertSame('NAVIGATE_REGISTER_PROGRAM', $nav['approved_target']);
            $this->assertTrue($nav['redirected']);
            $this->assertFalse($nav['has_registered_program']);
            $this->assertStringContainsString('CHƯA đăng ký chương trình tập', $nav['message']);
            return $this->modelTextTurn('Bạn chưa đăng ký chương trình tập.');
        });

        $this->postJson('/api/assistant/chat', ['message' => 'toi muon tap gym'], $this->headersFor($member))
            ->assertOk()
            ->assertJsonPath('action.type', 'NAVIGATE_REGISTER_PROGRAM')
            ->assertJsonPath('action.screen', 'WorkoutPlanScreen')
            ->assertJsonPath('auto_navigate', true);
    }

    // Đã có chương trình -> mở trang tập; câu hỏi tra cứu (chỉ có nút gợi ý phụ) thì KHÔNG tự chuyển trang
    public function test_training_intent_with_program_opens_workout_and_lookup_questions_do_not_auto_navigate(): void
    {
        $member = $this->createMember(75, 10);
        $progId = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'Tăng cơ', 'tinh_trang' => 1]);
        DB::table('dang_ky_chuong_trinh')->insert(['id_hoi_vien' => 75, 'id_chuong_trinh' => $progId, 'tinh_trang' => 1]);
        $h = $this->headersFor($member);

        $this->bindFakeLlm(fn (int $step) => $step === 0
            ? $this->modelToolCallTurn([['suggest_app_navigation', ['target' => 'NAVIGATE_WORKOUT']]])
            : $this->modelTextTurn('Mở kế hoạch tập cho bạn nhé!'));
        $this->postJson('/api/assistant/chat', ['message' => 'cho mình tập đi'], $h)
            ->assertOk()
            ->assertJsonPath('action.type', 'NAVIGATE_WORKOUT')
            ->assertJsonPath('auto_navigate', true);

        $this->bindFakeLlm(fn (int $step) => $step === 0
            ? $this->modelToolCallTurn([['get_my_schedule', ['date_preset' => 'today']]])
            : $this->modelTextTurn('Hôm nay chưa có buổi tập.'));
        $res = $this->postJson('/api/assistant/chat', ['message' => 'lịch hôm nay'], $h)->assertOk();
        $this->assertFalse((bool) $res->json('auto_navigate'));
    }

    /** Embedder giả: mọi văn bản -> cùng 1 vector, để kho kiến thức luôn trả kết quả 'ok'. */
    private function bindAlwaysMatchEmbedder(): void
    {
        $this->app->instance(\App\Services\Assistant\EmbeddingClientInterface::class, new class implements \App\Services\Assistant\EmbeddingClientInterface {
            public function modelName(): string { return 'fake-always-match'; }
            public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array { return [1.0, 0.0]; }
        });
        $this->seedKnowledgeIndex([['bai_tap', 1, 'exercise', 'Squat']]);
    }

    private function knowledgeOnlyLlm(string $answer): object
    {
        return $this->bindFakeLlm(fn (int $step) => $step % 2 === 0
            ? $this->modelToolCallTurn([['search_fitness_knowledge', ['query' => 'kỹ thuật squat']]])
            : $this->modelTextTurn($answer));
    }

    // Task tải cao: câu hỏi kiến thức chung giống nhau từ nhiều người -> chỉ gọi Gemini 1 lần
    public function test_general_knowledge_answer_is_shared_across_users_without_calling_gemini_again(): void
    {
        $this->bindAlwaysMatchEmbedder();
        $a = $this->createMember(80, 10, ['ho_ten' => 'Lê Văn Tèo']);
        $b = $this->createMember(81, 10, ['ho_ten' => 'Phạm Thị Na']);

        $fake = $this->knowledgeOnlyLlm('Squat: hạ hông ra sau, giữ lưng thẳng, gối theo mũi chân.');
        $this->postJson('/api/assistant/chat', ['message' => 'Kỹ thuật squat?'], $this->headersFor($a))->assertOk();
        $this->assertCount(2, $fake->recordedCalls);

        // Người khác, cùng câu hỏi (khác hoa/thường, khoảng trắng) -> lấy từ cache, KHÔNG gọi Gemini
        $res = $this->postJson('/api/assistant/chat', ['message' => '  kỹ thuật   SQUAT? '], $this->headersFor($b))->assertOk();
        $this->assertCount(2, $fake->recordedCalls);
        $this->assertStringStartsWith('answer_cache:', (string) $res->json('source'));
        $this->assertStringContainsString('giữ lưng thẳng', (string) $res->json('answer'));
    }

    // Những trường hợp KHÔNG được dùng chung câu trả lời
    public function test_answer_cache_never_shares_personal_contextual_or_allergy_sensitive_answers(): void
    {
        $this->bindAlwaysMatchEmbedder();
        $a = $this->createMember(82, 10, ['ho_ten' => 'Nguyễn Văn An']);
        $b = $this->createMember(83, 10);
        $allergic = $this->createMember(84, 10, ['di_ung' => ['Hải sản']]);
        $hA = $this->headersFor($a);

        // 1) Câu trả lời gọi tên người hỏi -> không cache (tránh "Chào An" cho người khác)
        $fake = $this->knowledgeOnlyLlm('Chào An! Squat cần giữ lưng thẳng.');
        $this->postJson('/api/assistant/chat', ['message' => 'squat tập sao'], $hA)->assertOk();
        $this->postJson('/api/assistant/chat', ['message' => 'squat tập sao'], $this->headersFor($b))->assertOk();
        $this->assertCount(4, $fake->recordedCalls);

        // Tên trùng từ thường ("an toàn") KHÔNG bị coi là gọi tên -> vẫn cache được
        $fake = $this->knowledgeOnlyLlm('Squat an toàn: giữ lưng thẳng.');
        $this->postJson('/api/assistant/chat', ['message' => 'squat an toàn không'], $hA)->assertOk();
        $this->postJson('/api/assistant/chat', ['message' => 'squat an toàn không'], $this->headersFor($b))->assertOk();
        $this->assertCount(2, $fake->recordedCalls);

        // 2) Người có hồ sơ dị ứng khác -> cache riêng (để cảnh báo dị ứng đúng người)
        $this->postJson('/api/assistant/chat', ['message' => 'squat an toàn không'], $this->headersFor($allergic))->assertOk();
        $this->assertCount(4, $fake->recordedCalls);

        // 3) Câu hỏi giữa hội thoại (phụ thuộc ngữ cảnh) -> không dùng cache
        $this->postJson('/api/assistant/chat', [
            'message' => 'squat an toàn không',
            'history' => [['sender' => 'user', 'text' => 'tôi bị đau lưng'], ['sender' => 'assistant', 'text' => 'Bạn nên nghỉ ngơi.']],
        ], $this->headersFor($b))->assertOk();
        $this->assertCount(6, $fake->recordedCalls);

        // 4) Có dùng dữ liệu cá nhân (tool khác ngoài kho kiến thức) -> không cache
        $fake = $this->bindFakeLlm(fn (int $step) => $step % 2 === 0
            ? $this->modelToolCallTurn([['search_fitness_knowledge', ['query' => 'squat']], ['get_my_packages', []]])
            : $this->modelTextTurn('Squat ổn, bạn chưa có gói tập.'));
        $this->postJson('/api/assistant/chat', ['message' => 'squat và gói của tôi'], $hA)->assertOk();
        $this->postJson('/api/assistant/chat', ['message' => 'squat và gói của tôi'], $this->headersFor($b))->assertOk();
        $this->assertCount(4, $fake->recordedCalls);
    }

    // Kho kiến thức thay đổi -> câu trả lời đã cache tự hết hiệu lực
    public function test_answer_cache_is_invalidated_when_knowledge_base_changes(): void
    {
        $this->bindAlwaysMatchEmbedder();
        $h = $this->headersFor($this->createMember(85, 10));

        $fake = $this->knowledgeOnlyLlm('Squat bản cũ.');
        $this->postJson('/api/assistant/chat', ['message' => 'kỹ thuật squat'], $h)->assertOk();
        $this->postJson('/api/assistant/chat', ['message' => 'kỹ thuật squat'], $h)->assertOk();
        $this->assertCount(2, $fake->recordedCalls);

        // Admin sửa nội dung kho kiến thức
        $this->seedKnowledgeIndex([['bai_tap', 1, 'exercise', 'Squat (đã cập nhật hướng dẫn)']]);
        $fake = $this->knowledgeOnlyLlm('Squat bản mới.');
        $res = $this->postJson('/api/assistant/chat', ['message' => 'kỹ thuật squat'], $h)->assertOk();
        $this->assertCount(2, $fake->recordedCalls);
        $this->assertStringContainsString('bản mới', (string) $res->json('answer'));
    }

    public static function allergyStorageShapes(): array
    {
        return ['chuỗi thường (dữ liệu thật)' => ['plain_string'], 'mảng JSON' => ['json_array']];
    }

    // Lọc bữa ăn phải khớp chính xác mã trong DB: hỏi TRUA không lẫn PHU_TRUA; PHU_CHIEU (tên cũ) = PHU_TRUA; PHU_TOI hợp lệ
    public function test_meal_type_filter_matches_exact_db_codes_and_accepts_legacy_phu_chieu(): void
    {
        $member = $this->createMember(73, 10);
        $this->seedTodayMealPlan(73, [
            ['Cơm gà trưa', 'TRUA', 'Ức gà'],
            ['Sữa chua phụ trưa', 'PHU_TRUA', 'Sữa chua'],
            ['Đậu nành phụ tối', 'PHU_TOI', 'Đậu nành'],
        ]);
        $h = $this->headersFor($member);

        $cases = [
            'TRUA' => ['Cơm gà trưa'],
            'PHU_TRUA' => ['Sữa chua phụ trưa'],
            'PHU_CHIEU' => ['Sữa chua phụ trưa'],
            'PHU_TOI' => ['Đậu nành phụ tối'],
        ];
        $fake = null;
        foreach ($cases as $mealType => $expected) {
            $fake = $this->bindFakeLlm(function (int $step, array $contents) use ($mealType, $expected) {
                if ($step === 0) {
                    return $this->modelToolCallTurn([['get_my_meal_plan', ['date_preset' => 'today', 'meal_type' => $mealType]]]);
                }
                $resp = end($contents)['parts'][0]['functionResponse']['response'];
                $this->assertSame('ok', $resp['status'], "meal_type={$mealType}");
                $this->assertSame($expected, array_column($resp['meals'], 'name'), "meal_type={$mealType}");
                return $this->modelTextTurn('ok');
            });
            $this->postJson('/api/assistant/chat', ['message' => "Bữa {$mealType} hôm nay?"], $h)
                ->assertOk()
                ->assertJsonPath('tool_calls.0.status', 'ok');
        }

        // Gemini nhận đúng enum theo mã DB (không còn PHU_CHIEU, có PHU_TRUA/PHU_TOI)
        $decl = collect($fake->recordedCalls[0]['tool_declarations'])->firstWhere('name', 'get_my_meal_plan');
        $this->assertNotNull($decl);
        $this->assertSame(FitnessDataService::MEAL_TYPE_FILTERS, $decl['parameters']['properties']['meal_type']['enum']);
    }
}
