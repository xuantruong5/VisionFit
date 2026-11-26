<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Trainer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AssistantApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Use the real relevant migrations, not the entire unrelated app schema.
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
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
        ] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
    }

    private function member(int $id, int $gym = 10): Client
    {
        return Client::forceCreate([
            'id' => $id, 'id_phong_tap' => $gym, 'email' => 'm'.$id.'@test.local',
            'password' => 'not-returned-secret', 'ho_ten' => 'Member '.$id,
            'tinh_trang' => 1, 'muc_tieu_hien_tai' => 'Mục tiêu '.$id,
        ]);
    }

    private function trainer(int $id, int $gym = 10): Trainer
    {
        return Trainer::forceCreate([
            'id' => $id, 'id_phong_tap' => $gym, 'ho_ten' => 'Trainer '.$id,
            'tinh_trang' => 1, 'is_active' => 1,
        ]);
    }

    private function package(int $member, int $gym, string $name): void
    {
        static $pkgSeq = 1;
        $g = DB::table('goi_tap')->insertGetId([
            'id_phong_tap' => $gym,
            'ma_goi_tap' => 'GT' . ($pkgSeq++),
            'ten_goi_tap' => $name,
            'thoi_han_ngay' => 30,
            'gia' => 100,
        ]);
        $d = DB::table('dang_ky_goi')->insertGetId(['id_hoi_vien' => $member]);
        DB::table('chi_tiet_dang_ky_goi')->insert([
            'id_dang_ky_goi' => $d, 'id_goi_tap' => $g, 'so_buoi' => 24,
            'ngay_ket_thuc' => now()->addDays(3)->toDateString(),
        ]);
    }

    private function schedule(int $member, ?int $trainer = null, ?string $time = '18:00:00'): void
    {
        $p = DB::table('chuong_trinh_tap')->insertGetId(['id_cap_do' => 1, 'ten_chuong_trinh' => 'Program '.$member]);
        $d = DB::table('dang_ky_chuong_trinh')->insertGetId([
            'id_hoi_vien' => $member, 'id_chuong_trinh' => $p, 'tinh_trang' => 1,
        ]);
        DB::table('lich_tap')->insert([
            'id_dang_ky_chuong_trinh' => $d, 'id_chuong_trinh' => $p,
            'id_hoi_vien' => $member, 'id_trainner' => $trainer,
            'ngay_tap' => now()->addDay()->toDateString(), 'gio_bat_dau' => $time,
        ]);
    }

    private function headersFor($user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('assistant-test')->plainTextToken];
    }

    public function test_missing_or_invalid_token_never_falls_back_to_first_member_even_in_local(): void
    {
        $this->member(1);
        $this->app->instance('env', 'local');
        $this->getJson('/api/assistant/me')->assertUnauthorized();
        $this->getJson('/api/assistant/context', ['Authorization' => 'Bearer invalid'])->assertUnauthorized();
    }

    public function test_member_context_reads_database_and_excludes_other_member_and_other_gym(): void
    {
        $a = $this->member(1); $this->member(2); $this->member(3, 20);
        $this->package(1, 10, 'OWN PACKAGE'); $this->package(2, 10, 'OTHER MEMBER');
        $this->package(1, 20, 'WRONG GYM'); $this->package(3, 20, 'OTHER GYM');
        $this->trainer(5, 20); $this->schedule(1, 5); $this->schedule(2);
        DB::table('buoi_tap')->insert([
            ['id_hoi_vien' => 1, 'thoi_gian_bat_dau' => now(), 'tinh_trang' => '2', 'phan_tram_hoan_thanh' => 60],
            ['id_hoi_vien' => 2, 'thoi_gian_bat_dau' => now(), 'tinh_trang' => '2', 'phan_tram_hoan_thanh' => 100],
        ]);
        $response = $this->getJson('/api/assistant/context', $this->headersFor($a))
            ->assertOk()->assertJsonPath('data.subject.id', '1')->assertJsonPath('data.subject.gym_id', '10')
            ->assertJsonCount(1, 'data.packages')->assertJsonPath('data.packages.0.name', 'OWN PACKAGE')
            ->assertJsonPath('data.packages.0.total_sessions', 24)->assertJsonPath('data.packages.0.remaining_sessions', null)
            ->assertJsonCount(1, 'data.schedule')->assertJsonPath('data.schedule.0.trainer', null)
            ->assertJsonPath('data.progress.sessions_this_week', 1)->assertJsonPath('data.progress.completion_percent', 60)
            ->assertJsonPath('data.summary', null);
        foreach (['OTHER MEMBER', 'WRONG GYM', 'OTHER GYM', 'not-returned-secret', '@test.local'] as $private) {
            $this->assertStringNotContainsString($private, $response->getContent());
        }
    }

    public function test_trainer_counts_only_assigned_members_in_own_gym(): void
    {
        $pt = $this->trainer(5); $this->trainer(6);
        $this->member(1); $this->member(2); $this->member(3, 20);
        $this->schedule(1, 5); $this->schedule(1, 5); $this->schedule(2, 6); $this->schedule(3, 5);
        $this->getJson('/api/assistant/context', $this->headersFor($pt))->assertOk()
            ->assertJsonPath('data.summary.assigned_members', 1)
            ->assertJsonPath('data.summary.expiring_members', null)->assertJsonCount(0, 'data.packages');
    }

    public function test_admin_requires_explicit_gym_mapping_and_counts_only_that_gym(): void
    {
        $admin = Admin::forceCreate(['id' => 7, 'id_chuc_vu' => 1, 'tinh_trang' => 1]);
        $headers = $this->headersFor($admin);
        $this->getJson('/api/assistant/me', $headers)->assertForbidden();
        config(['assistant.admin_gyms' => [7 => 10]]);
        $this->member(1); $this->member(2, 20);
        $this->package(1, 10, 'OWN'); $this->package(1, 10, 'SECOND OWN'); $this->package(2, 20, 'OTHER');
        $this->getJson('/api/assistant/context', $headers)->assertOk()
            ->assertJsonPath('data.subject.gym_id', '10')
            ->assertJsonPath('data.summary.assigned_members', 1)->assertJsonPath('data.summary.expiring_members', 1);
    }

    public function test_expired_revoked_and_under_scoped_tokens_are_rejected(): void
    {
        $user = $this->member(1);
        $expired = $user->createToken('expired', ['*'], now()->subMinute());
        $this->getJson('/api/assistant/me', ['Authorization' => 'Bearer '.$expired->plainTextToken])->assertUnauthorized();
        $revoked = $user->createToken('revoked'); $revoked->accessToken->delete();
        $this->getJson('/api/assistant/me', ['Authorization' => 'Bearer '.$revoked->plainTextToken])->assertUnauthorized();
        $limited = $user->createToken('limited', ['unrelated']);
        $this->getJson('/api/assistant/me', ['Authorization' => 'Bearer '.$limited->plainTextToken])->assertForbidden();
        config(['sanctum.expiration' => 10]);
        $old = $user->createToken('old'); $old->accessToken->forceFill(['created_at' => now()->subHour()])->save();
        $this->getJson('/api/assistant/me', ['Authorization' => 'Bearer '.$old->plainTextToken])->assertUnauthorized();
    }

    public function test_selectors_and_blocked_accounts_are_rejected(): void
    {
        $user = $this->member(1); $headers = $this->headersFor($user);
        $this->getJson('/api/assistant/context?id_nguoi_dung=2', $headers)->assertUnprocessable();
        $user->forceFill(['is_block' => 1])->save();
        $this->getJson('/api/assistant/me', $headers)->assertForbidden();
    }

    public function test_missing_schedule_time_and_empty_progress_stay_unknown(): void
    {
        $user = $this->member(1); $this->schedule(1, null, null);
        $this->getJson('/api/assistant/context', $this->headersFor($user))->assertOk()
            ->assertJsonPath('data.schedule.0.starts_at', null)
            ->assertJsonPath('data.schedule.0.scheduled_date', now()->addDay()->toDateString())
            ->assertJsonPath('data.progress.sessions_this_week', 0)->assertJsonPath('data.progress.completion_percent', null);
    }

    public function test_chat_without_token_never_leaks_first_member_data(): void
    {
        config(['assistant.gemini_api_key' => '']);
        Client::forceCreate([
            'id' => 1, 'id_phong_tap' => 10, 'email' => 'secret@test.local',
            'password' => 'secret', 'ho_ten' => 'Secret Member',
            'tinh_trang' => 1, 'chieu_cao_cm' => 175, 'can_nang_kg' => 70,
            'muc_tieu_hien_tai' => 'Tăng cơ',
        ]);

        $res = $this->postJson('/api/assistant/chat', [
            'message' => 'Cho tôi biết chỉ số thể trạng và dinh dưỡng calo của tôi',
            'species' => 'bear',
        ])->assertOk();

        $answer = (string) $res->json('answer');
        $this->assertStringContainsString('chưa đăng nhập', mb_strtolower($answer, 'UTF-8'));
        $this->assertStringNotContainsString('175', $answer);
        $this->assertStringNotContainsString('Secret Member', $answer);
    }

    public function test_new_member_without_metrics_or_program_gets_honest_responses(): void
    {
        config(['assistant.gemini_api_key' => '']);
        $fresh = Client::forceCreate([
            'id' => 99, 'id_phong_tap' => 10, 'email' => 'fresh@test.local',
            'password' => 'secret', 'ho_ten' => 'Fresh User',
            'tinh_trang' => 1, 'muc_tieu_hien_tai' => null,
            'chieu_cao_cm' => null, 'can_nang_kg' => null,
        ]);
        $headers = $this->headersFor($fresh);

        $this->getJson('/api/assistant/context', $headers)->assertOk()
            ->assertJsonPath('data.nutrition', null)
            ->assertJsonPath('data.account_status.has_body_metrics', false)
            ->assertJsonPath('data.account_status.has_registered_program', false)
            ->assertJsonCount(0, 'data.suggestions.meals');

        // 1. Lịch tập không dấu -> không bị trôi xuống câu mặc định
        $schedRes = $this->postJson('/api/assistant/chat', [
            'message' => 'Cho toi xem lich tap',
            'species' => 'bear',
        ], $headers)->assertOk();
        $this->assertStringNotContainsString('Mình đã nhận câu hỏi', (string) $schedRes->json('answer'));
        $this->assertStringContainsString('chưa đăng ký', mb_strtolower((string) $schedRes->json('answer'), 'UTF-8'));

        // 2. Chỉ số cơ thể -> báo rõ chưa cập nhật chỉ số
        $metricsRes = $this->postJson('/api/assistant/chat', [
            'message' => 'Cho tôi biết chỉ số thể trạng và dinh dưỡng calo của tôi',
            'species' => 'bear',
        ], $headers)->assertOk();
        $this->assertStringContainsString('chưa cập nhật chỉ số cơ thể', mb_strtolower((string) $metricsRes->json('answer'), 'UTF-8'));

        // 3. Thực đơn -> không trả bảng dữ liệu mẫu khi chưa nhập chỉ số & chưa đăng ký
        $mealRes = $this->postJson('/api/assistant/chat', [
            'message' => 'Gợi ý thực đơn ăn giảm mỡ Eat Clean',
            'species' => 'bear',
        ], $headers)->assertOk();
        $this->assertStringContainsString('chưa cập nhật chỉ số', mb_strtolower((string) $mealRes->json('answer'), 'UTF-8'));
        $this->assertStringNotContainsString('| Bữa |', (string) $mealRes->json('answer'));

        // 4. Gói tập -> báo rõ chưa đăng ký gói tập
        $pkgRes = $this->postJson('/api/assistant/chat', [
            'message' => 'Gói tập của tôi còn bao nhiêu buổi?',
            'species' => 'bear',
        ], $headers)->assertOk();
        $this->assertStringContainsString('chưa đăng ký gói tập', mb_strtolower((string) $pkgRes->json('answer'), 'UTF-8'));

        // 5. "bat dau tap" không bị nhận nhầm thành đau chấn thương
        $startRes = $this->postJson('/api/assistant/chat', [
            'message' => 'toi muon bat dau tap',
            'species' => 'bear',
        ], $headers)->assertOk();
        $this->assertSame('workout_navigation', $startRes->json('intent'));
        $this->assertStringNotContainsString('chườm lạnh', mb_strtolower((string) $startRes->json('answer'), 'UTF-8'));
    }
}
