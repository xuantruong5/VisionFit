<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class BaiTapSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('bai_tap')->truncate();

        DB::table('bai_tap')->insert([
            [
                'id_bai_tap' => 1,
                'ma_bai_tap' => 'BT001',
                'ten_bai_tap' => 'Đẩy ngực với tạ đơn',
                'nhom_co' => 'Ngực',
                'cap_do' => 'Người mới',
                'mo_ta' => 'Bài tập giúp phát triển cơ ngực và hỗ trợ cơ vai, tay sau.',
                'huong_dan' => 'Nằm trên ghế, giữ hai quả tạ trước ngực, từ từ hạ xuống rồi đẩy tạ lên.',
                'loi_thuong_gap' => 'Hạ tạ quá nhanh, khuỷu tay mở quá rộng.',
                'thiet_bi' => 'Tạ đơn, ghế tập',
                'anh_dai_dien' => 'https://example.com/images/day-nguc-ta-don.jpg',
                'video_huong_dan' => 'https://example.com/videos/day-nguc-ta-don.mp4',
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc chính diện hoặc góc 45 độ',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_bai_tap' => 2,
                'ma_bai_tap' => 'BT002',
                'ten_bai_tap' => 'Squat',
                'nhom_co' => 'Chân',
                'cap_do' => 'Người mới',
                'mo_ta' => 'Bài tập cơ bản giúp phát triển cơ đùi, mông và cơ chân.',
                'huong_dan' => 'Đứng thẳng, hai chân rộng bằng vai, hạ người xuống rồi đứng lên về vị trí ban đầu.',
                'loi_thuong_gap' => 'Đầu gối đổ vào trong, lưng cong khi hạ người.',
                'thiet_bi' => 'Không cần thiết bị',
                'anh_dai_dien' => 'https://example.com/images/squat.jpg',
                'video_huong_dan' => 'https://example.com/videos/squat.mp4',
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc nghiêng 45 độ',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
