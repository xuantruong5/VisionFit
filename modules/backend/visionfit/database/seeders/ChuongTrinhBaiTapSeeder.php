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
                'ten_ngay_tap' => 'Luyện tập chức năng',
                'thu_tu' => 1,
                'so_hiep' => 3,
                'so_lan_lap' => 15,
                'trong_luong_goi_y' => 0.00,
                'thoi_gian_giay' => 300,
                'thoi_gian_nghi' => 30,
                'cho_phep_bo_qua' => false,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 1,
                'id_bai_tap' => 2,
                'ngay_thu' => 1,
                'ten_ngay_tap' => 'Luyện tập chức năng',
                'thu_tu' => 2,
                'so_hiep' => 2,
                'so_lan_lap' => 10,
                'trong_luong_goi_y' => 0.00,
                'thoi_gian_giay' => 240,
                'thoi_gian_nghi' => 45,
                'cho_phep_bo_qua' => false,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 1,
                'id_bai_tap' => 3,
                'ngay_thu' => 1,
                'ten_ngay_tap' => 'Luyện tập chức năng',
                'thu_tu' => 3,
                'so_hiep' => 2,
                'so_lan_lap' => 15,
                'trong_luong_goi_y' => 0.00,
                'thoi_gian_giay' => 240,
                'thoi_gian_nghi' => 30,
                'cho_phep_bo_qua' => false,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 1,
                'id_bai_tap' => 4,
                'ngay_thu' => 1,
                'ten_ngay_tap' => 'Luyện tập chức năng',
                'thu_tu' => 4,
                'so_hiep' => 2,
                'so_lan_lap' => 15,
                'trong_luong_goi_y' => 0.00,
                'thoi_gian_giay' => 300,
                'thoi_gian_nghi' => 45,
                'cho_phep_bo_qua' => false,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 1,
                'id_bai_tap' => 5,
                'ngay_thu' => 1,
                'ten_ngay_tap' => 'Luyện tập chức năng',
                'thu_tu' => 5,
                'so_hiep' => 2,
                'so_lan_lap' => 10,
                'trong_luong_goi_y' => 0.00,
                'thoi_gian_giay' => 240,
                'thoi_gian_nghi' => 30,
                'cho_phep_bo_qua' => false,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 1,
                'id_bai_tap' => 6,
                'ngay_thu' => 1,
                'ten_ngay_tap' => 'Luyện tập chức năng',
                'thu_tu' => 6,
                'so_hiep' => 2,
                'so_lan_lap' => 20,
                'trong_luong_goi_y' => 0.00,
                'thoi_gian_giay' => 300,
                'thoi_gian_nghi' => 30,
                'cho_phep_bo_qua' => false,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 1,
                'id_bai_tap' => 7,
                'ngay_thu' => 1,
                'ten_ngay_tap' => 'Luyện tập chức năng',
                'thu_tu' => 7,
                'so_hiep' => 3,
                'so_lan_lap' => 30,
                'trong_luong_goi_y' => 0.00,
                'thoi_gian_giay' => 300,
                'thoi_gian_nghi' => 60,
                'cho_phep_bo_qua' => false,
                'tinh_trang' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
