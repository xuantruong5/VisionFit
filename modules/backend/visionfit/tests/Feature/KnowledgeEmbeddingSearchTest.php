<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Services\Assistant\AssistantAuthContext;
use App\Services\Assistant\EmbeddingClientInterface;
use App\Services\Assistant\FitnessDataService;
use App\Services\Assistant\KnowledgeEmbeddingService;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\UsesIsolatedTestDatabase;
use Tests\TestCase;

/**
 * Kiểm thử tìm kiếm ngữ nghĩa bằng Embeddings cho công cụ `search_fitness_knowledge`:
 * - Lập chỉ mục trước và cập nhật tăng dần (thêm, sửa, xóa bản ghi đều đồng bộ vào chỉ mục).
 * - Xếp hạng cosine similarity chính xác theo ngữ nghĩa.
 * - Cảnh báo dị ứng khi tra cứu món ăn cho hội viên có dị ứng.
 */
class KnowledgeEmbeddingSearchTest extends TestCase
{
    use UsesIsolatedTestDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resetVerifiedTestDatabase([
            '2026_09_11_060235_create_clients_table.php',
            '2026_09_11_062608_create_bai_tap_table.php',
            '2026_10_15_170400_create_chi_tiet_bai_tap_table.php',
            '2026_10_15_172001_create_bai_tap_nhom_co_table.php',
            '2026_09_13_122736_create_mon_an_table.php',
            '2026_09_11_080320_create_chuong_trinh_tap_table.php',
            '2026_09_17_170000_create_bach_khoa_toan_thu_table.php',
            '2026_09_18_130000_create_dinh_duong_the_thao_table.php',
            '2026_11_26_000001_create_assistant_knowledge_embeddings_table.php',
        ]);
    }

    private function makeDeterministicEmbedder(): object
    {
        return new class implements EmbeddingClientInterface {
            public int $embedCalls = 0;

            public function modelName(): string
            {
                return 'gemini-embedding-001';
            }

            public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array
            {
                $this->embedCalls++;
                $lower = mb_strtolower($text, 'UTF-8');
                // 5-dim semantic toy space: [leg/squat, protein/chicken, seafood/shrimp, hypertrophy/science, off-topic]
                $v0 = (str_contains($lower, 'squat') || str_contains($lower, 'chân') || str_contains($lower, 'đùi') || str_contains($lower, 'gối')) ? 1.0 : 0.0;
                $v1 = (str_contains($lower, 'ức gà') || str_contains($lower, 'protein') || str_contains($lower, 'đạm') || str_contains($lower, 'whey')) ? 1.0 : 0.0;
                $v2 = (str_contains($lower, 'tôm') || str_contains($lower, 'salad') || str_contains($lower, 'hải sản')) ? 1.0 : 0.0;
                $v3 = (str_contains($lower, 'hypertrophy') || str_contains($lower, 'phì đại') || str_contains($lower, 'progressive')) ? 1.0 : 0.0;
                $v4 = ($v0 + $v1 + $v2 + $v3) === 0.0 ? 1.0 : 0.0;
                return [$v0, $v1, $v2, $v3, $v4];
            }
        };
    }

    public function test_incremental_indexing_does_not_reembed_unchanged_documents_and_updates_modified(): void
    {
        $exId = DB::table('bai_tap')->insertGetId([
            'ma_bai_tap' => 'SQ1', 'ten_bai_tap' => 'Bodyweight Squat',
            'mo_ta' => 'Bài tập phát triển cơ chân và đùi, giữ lưng thẳng.',
            'thoi_gian_phut' => 5, 'set_yeu_cau' => 4, 'rep_yeu_cau' => 15, 'tinh_trang' => 1,
        ]);
        DB::table('mon_an')->insert([
            'ten_mon_an' => 'Salad tôm dầu oliu', 'loai_bua' => 'TOI', 'the_loai' => 'Eat Clean',
            'calo' => 290, 'protein' => 28, 'carb' => 12, 'fat' => 10, 'khoi_luong_gram' => 240,
            'nguyen_lieu' => 'Tôm sú, xà lách, dầu oliu', 'tinh_trang' => 1,
        ]);
        DB::table('bach_khoa_toan_thu')->insert([
            'tieu_de' => 'Hypertrophy cơ bắp', 'chu_de' => 'Khoa học tập luyện',
            'tom_tat' => 'Hypertrophy là sự phì đại sợi cơ thông qua Progressive Overload.',
            'noi_dung' => 'Chi tiết...', 'tinh_trang' => 1,
        ]);

        $embedder = $this->makeDeterministicEmbedder();
        $service = new KnowledgeEmbeddingService($embedder, new FitnessDataService());

        // Lần 1: lập chỉ mục 3 tài liệu -> gọi embed đúng 3 lần
        $s1 = $service->syncIndex(false);
        $this->assertSame(3, $s1['indexed']);
        $this->assertSame(0, $s1['skipped']);
        $this->assertSame(3, $embedder->embedCalls);

        // Lần 2 (không đổi nội dung): bỏ qua cả 3 -> gọi embed thêm 0 lần!
        $s2 = $service->syncIndex(false);
        $this->assertSame(0, $s2['indexed']);
        $this->assertSame(0, $s2['updated']);
        $this->assertSame(3, $s2['skipped']);
        $this->assertSame(3, $embedder->embedCalls);

        // Sửa nội dung 1 bài tập -> chỉ re-embed đúng 1 tài liệu thay đổi
        DB::table('bai_tap')->where('id', $exId)->update(['mo_ta' => 'Bài tập chân đùi, mở đầu gối theo mũi chân.']);
        $s3 = $service->syncIndex(false);
        $this->assertSame(1, $s3['updated']);
        $this->assertSame(2, $s3['skipped']);
        $this->assertSame(4, $embedder->embedCalls);

        // Tìm kiếm ngữ nghĩa câu hỏi về chân/đùi -> xếp hạng Bodyweight Squat #1 mà không re-embed kho!
        $res = $service->search('Bài tập nào tốt cho cơ đùi và khớp gối?', 'all', 2);
        $this->assertSame('ok', $res['status']);
        $this->assertSame('semantic_embeddings', $res['retrieval_method']);
        $this->assertSame('Bodyweight Squat', $res['results'][0]['title']);
        $this->assertSame(5, $embedder->embedCalls); // Chỉ +1 lần embed cho query!

        // Tìm món ăn cho hội viên dị ứng Hải sản -> gắn allergy_warning cho Salad tôm
        $member = Client::forceCreate([
            'id' => 77, 'id_phong_tap' => 10, 'email' => 'alg@test.local', 'password' => 'x',
            'ho_ten' => 'Allergic User', 'di_ung' => ['Hải sản'], 'tinh_trang' => 1,
        ]);
        $actor = new AssistantAuthContext(true, '77', '10', 'member', 'Allergic User', $member);
        $foodRes = $service->search('Món salad buổi tối có tôm bao nhiêu calo?', 'food', 2, $actor);
        $this->assertSame('Salad tôm dầu oliu', $foodRes['results'][0]['title']);
        $this->assertNotEmpty($foodRes['results'][0]['allergy_warning'] ?? '');

        // Truy vấn hoàn toàn không khớp (embedding score dưới ngưỡng) -> trả status='empty', không bịa trích dẫn
        $unrelated = $service->search('Cách sửa máy giặt bị rò nước', 'all', 2, $actor);
        $this->assertSame('empty', $unrelated['status']);
        $this->assertEmpty($unrelated['results']);

        // Thêm 1 tài liệu mới -> syncIndex lập chỉ mục đúng 1 bản ghi mới
        $newFoodId = DB::table('mon_an')->insertGetId([
            'ten_mon_an' => 'Ức gà áp chảo giàu đạm', 'loai_bua' => 'TRUA', 'the_loai' => 'Eat Clean',
            'calo' => 380, 'protein' => 45, 'carb' => 10, 'fat' => 6, 'khoi_luong_gram' => 250,
            'nguyen_lieu' => 'Ức gà, tiêu, dầu oliu', 'tinh_trang' => 1,
        ]);
        $sAdd = $service->syncIndex(false);
        $this->assertSame(1, $sAdd['indexed']);
        $this->assertSame(3, $sAdd['skipped']);
        $this->assertSame(4, $sAdd['total_documents']);

        // Xóa tài liệu vừa thêm -> syncIndex gỡ khỏi chỉ mục (removed=1) và search không còn trả về
        DB::table('mon_an')->where('id', $newFoodId)->delete();
        $sDel = $service->syncIndex(false);
        $this->assertSame(0, $sDel['indexed']);
        $this->assertSame(1, $sDel['removed']);
        $this->assertSame(3, $sDel['total_documents']);
        $afterDel = $service->search('Ức gà giàu đạm bao nhiêu protein?', 'food', 3, $actor);
        $titlesAfterDel = array_map(fn ($r) => $r['title'], $afterDel['results']);
        $this->assertNotContains('Ức gà áp chảo giàu đạm', $titlesAfterDel);

        // BUG-01 Regression: LLM đoán hẹp category='exercise' (strict_category=false) cho bài nằm trong 'encyclopedia'
        // -> tự mở rộng sang 'all' với CÙNG ngưỡng similarity, tìm thấy bài viết và ghi nhận broadened_from_category
        $broadened = $service->search('Hypertrophy và phì đại cơ bằng progressive overload là gì?', 'exercise', 2, $actor, false);
        $this->assertSame('ok', $broadened['status']);
        $this->assertSame('all', $broadened['category']);
        $this->assertSame('exercise', $broadened['broadened_from_category']);
        $this->assertSame('Hypertrophy cơ bắp', $broadened['results'][0]['title']);

        // BUG-01 Regression: Khi người dùng yêu cầu rõ strict_category=true -> KHÔNG tự mở rộng, trả 'empty'
        $strictMiss = $service->search('Hypertrophy và phì đại cơ bằng progressive overload là gì?', 'exercise', 2, $actor, true);
        $this->assertSame('empty', $strictMiss['status']);
        $this->assertEmpty($strictMiss['results']);

        // BUG-01 Regression: Mở rộng category vẫn giữ nguyên cảnh báo dị ứng và ngưỡng similarity (câu lệch chủ đề vẫn empty)
        $broadFood = $service->search('Món salad buổi tối có tôm bao nhiêu calo?', 'exercise', 2, $actor, false);
        $this->assertSame('ok', $broadFood['status']);
        $this->assertSame('Salad tôm dầu oliu', $broadFood['results'][0]['title']);
        $this->assertNotEmpty($broadFood['results'][0]['allergy_warning'] ?? '');

        $broadOffTopic = $service->search('Cách sửa máy giặt bị rò nước', 'exercise', 2, $actor, false);
        $this->assertSame('empty', $broadOffTopic['status']);
        $this->assertEmpty($broadOffTopic['results']);
    }

    public function test_query_embedding_cache_saves_quota_while_preserving_per_user_allergy_filters_and_classifies_quota_scope(): void
    {
        \Illuminate\Support\Facades\Cache::flush();
        config(['assistant.embedding_query_cache_ttl' => 3600]);

        DB::table('mon_an')->insert([
            'id' => 301,
            'ten_mon_an' => 'Tôm hấp sả chanh',
            'loai_bua' => 'TRUA',
            'the_loai' => 'Eat Clean',
            'calo' => 240, 'protein' => 26, 'carb' => 4, 'fat' => 6, 'khoi_luong_gram' => 200,
            'nguyen_lieu' => 'Tôm sú tươi, sả, chanh',
            'tinh_trang' => 1,
        ]);

        $countingEmbedder = new class implements EmbeddingClientInterface {
            public int $queryEmbedCalls = 0;

            public function modelName(): string
            {
                return 'counting-embed-v1';
            }

            public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array
            {
                if ($taskType === 'RETRIEVAL_QUERY') {
                    $this->queryEmbedCalls++;
                }
                return [1.0, 0.0, 0.0];
            }
        };

        $service = new KnowledgeEmbeddingService($countingEmbedder, app(FitnessDataService::class));
        $sync = $service->syncIndex();
        $this->assertSame(1, $sync['indexed']);

        $allergicMember = Client::forceCreate([
            'id' => 911, 'id_phong_tap' => 10, 'email' => 'allergic911@test.local', 'password' => bcrypt('secret'),
            'ho_ten' => 'Allergic Member', 'tinh_trang' => 1, 'is_active' => 1, 'is_block' => 0, 'di_ung' => ['Hải sản'],
        ]);
        $safeMember = Client::forceCreate([
            'id' => 912, 'id_phong_tap' => 10, 'email' => 'safe912@test.local', 'password' => bcrypt('secret'),
            'ho_ten' => 'No Allergy Member', 'tinh_trang' => 1, 'is_active' => 1, 'is_block' => 0, 'di_ung' => [],
        ]);

        $actorAllergic = new AssistantAuthContext(true, '911', '10', 'member', 'Allergic Member', $allergicMember);
        $actorSafe = new AssistantAuthContext(true, '912', '10', 'member', 'No Allergy Member', $safeMember);

        // Lượt 1: gọi API embed 1 lần, nhận cảnh báo dị ứng cho hội viên dị ứng hải sản
        $r1 = $service->search('Tôm hấp sả chanh bao nhiêu calo?', 'all', 2, $actorAllergic, false);
        $this->assertSame('ok', $r1['status']);
        $this->assertFalse($r1['query_embedding_cached']);
        $this->assertSame(1, $countingEmbedder->queryEmbedCalls);
        $this->assertNotEmpty($r1['results'][0]['allergy_warning'] ?? '');

        // Lượt 2: cùng truy vấn bởi hội viên KHÁC (không dị ứng) -> dùng cache vector (0 gọi API mới) NHƯNG không bị dính cảnh báo dị ứng của hội viên 1!
        $r2 = $service->search('  tôm hấp sả chanh bao nhiêu calo? ', 'all', 2, $actorSafe, false);
        $this->assertSame('ok', $r2['status']);
        $this->assertTrue($r2['query_embedding_cached']);
        $this->assertSame(1, $countingEmbedder->queryEmbedCalls);
        $this->assertArrayNotHasKey('allergy_warning', $r2['results'][0]);

        // Kiểm tra phân loại hạn mức phút (RPM) vs hạn mức ngày (RPD)
        $dayQuota = \App\Services\Assistant\GeminiEmbeddingClient::parseQuotaFailure(json_encode([
            'error' => ['message' => 'Quota exceeded for metric: EmbedContentRequestsPerDay', 'details' => [['retryDelay' => '3600s']]],
        ]));
        $this->assertSame('day', $dayQuota['scope']);
        $this->assertSame(3600, $dayQuota['retry_after_seconds']);

        $minQuota = \App\Services\Assistant\GeminiEmbeddingClient::parseQuotaFailure(json_encode([
            'error' => ['message' => 'Quota exceeded for metric: EmbedContentRequestsPerMinute', 'details' => [['retryDelay' => '2s']]],
        ]));
        $this->assertSame('minute', $minQuota['scope']);
        $this->assertSame(2, $minQuota['retry_after_seconds']);
    }

    // Task 3.3 / 4.3 / 4.4 / 4.5: kết quả tra cứu kèm ảnh, ảnh động minh họa, nhóm cơ (%), hướng dẫn, lưu ý, cách nấu
    public function test_search_results_include_media_muscle_groups_and_full_details_from_source_tables(): void
    {
        config(['app.url' => 'http://visionfit.test']);
        $exId = DB::table('bai_tap')->insertGetId([
            'ma_bai_tap' => 'BP1', 'ten_bai_tap' => 'Barbell Bench Press',
            'mo_ta' => 'Bài đẩy ngực với protein... không, với thanh đòn.', 'thoi_gian_phut' => 5,
            'set_yeu_cau' => 4, 'rep_yeu_cau' => 10, 'anh_dai_dien' => 'https://cdn.test/bench.jpg',
            'loi_thuong_gap' => 'Nhún vai khi đẩy', 'thiet_bi' => 'Thanh đòn', 'tinh_trang' => 1,
        ]);
        DB::table('chi_tiet_bai_tap')->insert([
            'id_bai_tap' => $exId, 'video_huong_dan' => 'https://cdn.test/bench-ok.gif', 'video_sai' => 'https://cdn.test/bench-wrong.gif',
            'huong_dan' => 'Nằm ngửa, hạ tạ xuống giữa ngực rồi đẩy lên.', 'canh_bao' => '• Không khóa cứng khuỷu tay\n• Giữ bả vai ổn định',
        ]);
        DB::table('bai_tap_nhom_co')->insert([
            ['id_bai_tap' => $exId, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 20],
            ['id_bai_tap' => $exId, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 70],
        ]);
        DB::table('mon_an')->insert([
            'ten_mon_an' => 'Cơm ức gà', 'loai_bua' => 'TRUA', 'calo' => 500, 'protein' => 42, 'carb' => 55, 'fat' => 10,
            'nguyen_lieu' => 'Ức gà 150g, gạo lứt', 'huong_dan_nau' => 'Áp chảo ức gà, hấp rau.',
            'anh_dai_dien' => 'uploads/mon-an/com-uc-ga.jpg', 'tinh_trang' => 1,
        ]);

        $service = new KnowledgeEmbeddingService($this->makeDeterministicEmbedder(), new FitnessDataService());
        $service->syncIndex(false);

        $res = $service->search('bài tập protein', 'exercise', 1);
        $ex = $res['results'][0];
        $this->assertSame('Barbell Bench Press', $ex['title']);
        $this->assertArrayNotHasKey('_ref', $ex);
        $this->assertSame('https://cdn.test/bench.jpg', $ex['details']['image_url']);
        $this->assertSame('https://cdn.test/bench-ok.gif', $ex['details']['demo_gif_url']);
        $this->assertSame('https://cdn.test/bench-wrong.gif', $ex['details']['wrong_form_gif_url']);
        // Nhóm cơ sắp theo % giảm dần
        $this->assertSame([['muscle' => 'Ngực', 'percent' => 70.0], ['muscle' => 'Tay sau', 'percent' => 20.0]], $ex['details']['muscle_groups']);
        $this->assertSame('Nhún vai khi đẩy', $ex['details']['common_mistakes']);
        // Chuỗi "\n" (2 ký tự) lưu trong DB được đổi thành xuống dòng thật để hiển thị gạch đầu dòng gọn gàng
        $this->assertSame("• Không khóa cứng khuỷu tay\n• Giữ bả vai ổn định", $ex['details']['safety_notes']);
        $this->assertSame(4, $ex['details']['sets']);

        $food = $service->search('ức gà nhiều đạm', 'food', 1)['results'][0];
        $this->assertSame('Cơm ức gà', $food['title']);
        // Ảnh upload lưu đường dẫn tương đối -> ghép APP_URL
        $this->assertSame('http://visionfit.test/uploads/mon-an/com-uc-ga.jpg', $food['details']['image_url']);
        $this->assertSame('Áp chảo ức gà, hấp rau.', $food['details']['cooking_steps']);
    }

    // DB cũ của thành viên có thể thiếu bảng nhóm cơ / chi tiết bài tập -> vẫn trả kết quả, không lỗi SQL
    public function test_search_details_degrade_gracefully_when_optional_tables_are_missing(): void
    {
        DB::table('bai_tap')->insert([
            'ma_bai_tap' => 'SQ2', 'ten_bai_tap' => 'Goblet Squat', 'mo_ta' => 'Bài chân đùi với tạ đơn.',
            'thoi_gian_phut' => 5, 'set_yeu_cau' => 3, 'rep_yeu_cau' => 12, 'tinh_trang' => 1,
        ]);
        \Illuminate\Support\Facades\Schema::dropIfExists('bai_tap_nhom_co');
        \Illuminate\Support\Facades\Schema::dropIfExists('chi_tiet_bai_tap');

        $service = new KnowledgeEmbeddingService($this->makeDeterministicEmbedder(), new FitnessDataService());
        $service->syncIndex(false);
        $res = $service->search('bài squat cho chân', 'exercise', 1);

        $this->assertSame('ok', $res['status']);
        $this->assertSame('Goblet Squat', $res['results'][0]['title']);
        $this->assertArrayNotHasKey('muscle_groups', $res['results'][0]['details'] ?? []);
        $this->assertArrayNotHasKey('demo_gif_url', $res['results'][0]['details'] ?? []);
    }
}

