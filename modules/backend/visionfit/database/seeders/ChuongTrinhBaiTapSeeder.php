<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChuongTrinhBaiTapSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('chuong_trinh_bai_tap')->truncate();
        DB::table('chuong_trinh_bai_tap')->insert([
            [
                'id_chuong_trinh' => 1,
                'id_bai_tap' => 1,
                'ngay_thu' => 1,
                'ten_ngay_tap' => 'Ngực và vai',
                'thu_tu' => 1,
                'so_hiep' => 4,
                'so_lan_lap' => 12,
                'trong_luong_goi_y' => 10.00,
                'thoi_gian_giay' => 60,
                'thoi_gian_nghi' => 60,
                'cho_phep_bo_qua' => false,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 2,
                'id_bai_tap' => 2,
                'ngay_thu' => 1,
                'ten_ngay_tap' => 'Toàn thân',
                'thu_tu' => 1,
                'so_hiep' => 3,
                'so_lan_lap' => 15,
                'trong_luong_goi_y' => 5.00,
                'thoi_gian_giay' => 45,
                'thoi_gian_nghi' => 60,
                'cho_phep_bo_qua' => true,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
