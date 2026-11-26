<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Services\Assistant\AssistantAuthContext;
use App\Services\Assistant\EmbeddingClientInterface;
use App\Services\Assistant\FitnessDataService;
use App\Services\Assistant\KnowledgeEmbeddingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Kiểm thử tìm kiếm ngữ nghĩa bằng Embeddings cho công cụ `search_fitness_knowledge`:
 * - Lập chỉ mục trước và cập nhật tăng dần (chỉ re-embed bản ghi mới/thay đổi, không re-embed toàn kho).
 * - Xếp hạng cosine similarity chính xác theo ngữ nghĩa.
 * - Cảnh báo dị ứng khi tra cứu món ăn cho hội viên có dị ứng.
 */
class KnowledgeEmbeddingSearchTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));

        Schema::dropAllTables();
        foreach ([
            '2026_09_11_060235_create_clients_table.php',
            '2026_09_11_062608_create_bai_tap_table.php',
            '2026_10_15_170400_create_chi_tiet_bai_tap_table.php',
            '2026_09_13_122736_create_mon_an_table.php',
            '2026_09_11_080320_create_chuong_trinh_tap_table.php',
            '2026_09_17_170000_create_bach_khoa_toan_thu_table.php',
            '2026_09_18_130000_create_dinh_duong_the_thao_table.php',
            '2026_11_26_000001_create_assistant_knowledge_embeddings_table.php',
        ] as $migration) {
            (require database_path('migrations/' . $migration))->up();
        }
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
                // 4-dim semantic toy space: [leg/squat, protein/chicken, seafood/shrimp, hypertrophy/science]
                return [
                    (str_contains($lower, 'squat') || str_contains($lower, 'chân') || str_contains($lower, 'đùi') || str_contains($lower, 'gối')) ? 1.0 : 0.05,
                    (str_contains($lower, 'ức gà') || str_contains($lower, 'protein') || str_contains($lower, 'đạm') || str_contains($lower, 'whey')) ? 1.0 : 0.05,
                    (str_contains($lower, 'tôm') || str_contains($lower, 'salad') || str_contains($lower, 'hải sản')) ? 1.0 : 0.05,
                    (str_contains($lower, 'hypertrophy') || str_contains($lower, 'phì đại') || str_contains($lower, 'progressive')) ? 1.0 : 0.05,
                ];
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
    }
}

