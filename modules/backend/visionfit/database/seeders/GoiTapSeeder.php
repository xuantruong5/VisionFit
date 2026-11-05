<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GoiTapSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('goi_tap')->truncate();

        DB::table('goi_tap')->insert([
            [
                'ma_goi_tap' => 'GYM BASIC ',
                'ten_goi_tap' => 'Gym Cơ Bản',
                'thoi_han_mua' => 30,
                'thoi_han_tang' => 0,
                'thoi_han_ngay' => 30,
                'gia' => 299000,
                'hinh_anh' => 'goi-tap/co-ban.jpg',
                'so_buoi' => 12,
                'so_buoi_pt' => 0,
                'co_ai' => 1,
                'co_trainer_review' => 1,
                'mo_ta' => 'Lựa chọn hoàn hảo dành cho người mới bắt đầu hành trình rèn luyện thể hình. Giúp bạn làm quen với các bài tập cơ bản, xây dựng thói quen vận động và cải thiện sức khỏe. Tích hợp công nghệ AI phân tích tư thế, phát hiện lỗi sai và hỗ trợ bạn tập luyện đúng kỹ thuật.',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ma_goi_tap' => 'GYM STANDARD',
                'ten_goi_tap' => 'Gym Tiêu Chuẩn',
                'thoi_han_mua' => 90,
                'thoi_han_tang' => 30,
                'thoi_han_ngay' => 120,
                'gia' => 799000,
                'hinh_anh' => 'goi-tap/tieu-chuan.jpg',
                'so_buoi' => 36,
                'so_buoi_pt' => 4,
                'co_ai' => 1,
                'co_trainer_review' => 1,
                'mo_ta' => 'Giải pháp dành cho những người muốn cải thiện vóc dáng và nâng cao thể lực một cách bài bản. Tận hưởng thời gian tập luyện lên đến 4 tháng cùng ưu đãi tặng thêm 1 tháng. AI phân tích chuyển động, phát hiện lỗi sai tư thế và theo dõi tiến độ, giúp bạn từng bước tiến gần hơn đến mục tiêu hình thể.',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ma_goi_tap' => 'GYM ADVANCED',
                'ten_goi_tap' => 'Gym Nâng Cao',
                'thoi_han_mua' => 180,
                'thoi_han_tang' => 60,
                'thoi_han_ngay' => 240,
                'gia' => 1499000,
                'hinh_anh' => 'goi-tap/nang-cao.jpg',
                'so_buoi' => 72,
                'so_buoi_pt' => 12,
                'co_ai' => 1,
                'co_trainer_review' => 1,
                'mo_ta' => 'Dành cho những người mong muốn bứt phá giới hạn và hướng đến sự thay đổi rõ rệt về vóc dáng. Sở hữu thời gian tập luyện lên đến 8 tháng, ưu đãi tặng thêm 2 tháng. Kết hợp công nghệ AI phân tích kỹ thuật tập luyện, theo dõi quá trình tiến bộ và hỗ trợ tối ưu hiệu quả từng buổi tập.',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ma_goi_tap' => 'GYM VIP',
                'ten_goi_tap' => 'Gym VIP',
                'thoi_han_mua' => 360,
                'thoi_han_tang' => 90,
                'thoi_han_ngay' => 450,
                'gia' => 2499000,
                'hinh_anh' => 'goi-tap/vip.jpg',
                'so_buoi' => 144,
                'so_buoi_pt' => 24,
                'co_ai' => 1,
                'co_trainer_review' => 1,
                'mo_ta' => 'Trải nghiệm giải pháp tập luyện toàn diện dành cho những người thực sự đầu tư vào sức khỏe và hình thể. Tận hưởng đặc quyền tập luyện lên đến 15 tháng, tặng thêm 3 tháng. Được đồng hành bởi công nghệ AI phân tích tư thế, nhận diện lỗi sai và theo dõi tiến độ xuyên suốt hành trình. Đây là lựa chọn lý tưởng để kiên trì theo đuổi và chinh phục những mục tiêu thể hình dài hạn.',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
