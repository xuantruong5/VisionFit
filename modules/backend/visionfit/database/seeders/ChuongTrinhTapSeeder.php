<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChuongTrinhTapSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('chuong_trinh_tap')->truncate();
        DB::table('chuong_trinh_tap')->insert([
            [
                'id_chuong_trinh' => 1,
                'ten_chuong_trinh' => 'Tăng cơ bắp',
                'mo_ta' => 'Chương trình tập luyện dành cho người mới bắt đầu muốn tăng cơ.',
                'muc_tieu' => 'Tăng cơ',
                'cap_do' => 'Người mới',
                'gioi_tinh_ap_dung' => 0,
                'nhom_muc_tieu' => 1,
                'noi_tap' => 'Phòng gym',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => 'https://images2.thanhnien.vn/zoom/686_429/Uploaded/ngocquy/2020_10_13/gym-shutterstock_EHXV.jpg',
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 2,
                'ten_chuong_trinh' => 'Chương trình giảm mỡ toàn thân',
                'mo_ta' => 'Chương trình kết hợp cardio và tập sức mạnh giúp hỗ trợ giảm mỡ.',
                'muc_tieu' => 'Giảm mỡ',
                'cap_do' => 'Trung bình',
                'gioi_tinh_ap_dung' => 1,
                'nhom_muc_tieu' => 0,
                'noi_tap' => 'Phòng gym',
                'so_ngay' => 28,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => 'https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/486526Kzy/anh-mo-ta.png',
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

    }
}
