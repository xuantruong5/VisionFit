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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Kiểm thử toàn diện luồng Gemini Function Calling (mock provider),
 * phân quyền theo vai trò/phòng tập, múi giờ Asia/Ho_Chi_Minh, và xử lý lỗi dịch vụ.
 */
class AssistantFunctionCallingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));

        config([
            'assistant.gemini_api_key' => 'test-mock-key',
            'assistant.gemini_model' => 'gemini-2.5-flash',
            'assistant.gemini_fallback_models' => ['gemini-2.5-flash'],
            'assistant.max_tool_rounds' => 5,
            'assistant.max_retries_per_call' => 1,
            'assistant.total_timeout_seconds' => 25,
            'assistant.backup_api_url' => '',
            'assistant.backup_api_key' => '',
            'assistant.backup_model' => '',
        ]);

        Schema::dropAllTables();
        foreach ([
            '2026_09_11_060235_create_clients_table.php',
            '2026_09_11_081536_create_trainers_table.php',
            '2026_09_11_081651_create_admins_table.php',
            '2026_09_11_122454_create_personal_access_tokens_table.php',
            '2026_09_11_062223_create_goi_tap_table.php',
            '2026_09_11_074132_create_dang_ky_goi_table.php',
            '2026_09_11_074714_create_chi_tiet_dang_ky_goi_table.php',
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
            '2026_11_26_000001_create_assistant_knowledge_embeddings_table.php',
        ] as $migration) {
            (require database_path('migrations/' . $migration))->up();
        }
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
}
