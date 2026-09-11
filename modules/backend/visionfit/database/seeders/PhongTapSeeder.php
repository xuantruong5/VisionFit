<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PhongTapSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('phong_taps')->truncate();

        DB::table('phong_taps')->insert([
            [
                'ten_phong_tap' => 'VisionFit Fitness Center',
                'dia_chi' => '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
                'so_dien_thoai' => '0236123456',
                'mo_ta' => 'Phòng tập thể hình hiện đại, cung cấp các dịch vụ tập luyện và huấn luyện cá nhân.',
                'email' => 'visionfit@gmail.com',
                'anh_banner' => 'visionfit-banner.jpg',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ten_phong_tap' => 'VisionFit Gym Sơn Trà',
                'dia_chi' => '456 Ngô Quyền, Sơn Trà, Đà Nẵng',
                'so_dien_thoai' => '0236123457',
                'mo_ta' => 'Không gian tập luyện rộng rãi, đầy đủ trang thiết bị.',
                'email' => 'sontra@visionfit.com',
                'anh_banner' => 'visionfit-sontra.jpg',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ten_phong_tap' => 'VisionFit Gym Cẩm Lệ',
                'dia_chi' => '789 Cách Mạng Tháng 8, Cẩm Lệ, Đà Nẵng',
                'so_dien_thoai' => '0236123458',
                'mo_ta' => 'Phòng tập phù hợp cho người mới bắt đầu và người tập lâu năm.',
                'email' => 'camle@visionfit.com',
                'anh_banner' => 'visionfit-camle.jpg',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ten_phong_tap' => 'VisionFit Gym Liên Chiểu',
                'dia_chi' => '321 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng',
                'so_dien_thoai' => '0236123459',
                'mo_ta' => 'Phòng tập với nhiều khu vực tập luyện và thiết bị chuyên nghiệp.',
                'email' => 'lienchieu@visionfit.com',
                'anh_banner' => 'visionfit-lienchieu.jpg',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ten_phong_tap' => 'VisionFit Gym Ngũ Hành Sơn',
                'dia_chi' => '555 Ngũ Hành Sơn, Ngũ Hành Sơn, Đà Nẵng',
                'so_dien_thoai' => '0236123460',
                'mo_ta' => 'Phòng tập hiện đại, hỗ trợ nhiều chương trình luyện tập.',
                'email' => 'nguhanhson@visionfit.com',
                'anh_banner' => 'visionfit-nguhanhson.jpg',
                'tinh_trang' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
