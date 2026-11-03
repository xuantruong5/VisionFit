<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KhuyenMaiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('khuyen_mai')->truncate();
        DB::table('khuyen_mai')->insert([
            [
                'ten_khuyen_mai' => 'Khuyến mãi hội viên mới',
                'ma_khuyen_mai' => 'NEW10',
                'loai_giam' => 'phan_tram',
                'gia_tri_giam' => 10,
                'lan_dang_ky_tu' => 1,
                'lan_dang_ky_den' => 1,
                'ngay_bat_dau' => '2026-01-01',
                'ngay_ket_thuc' => '2027-12-31',
                'id_goi_tap' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_khuyen_mai' => 'Ưu đãi hội viên đăng ký lần đầu',
                'ma_khuyen_mai' => 'FIRST50',
                'loai_giam' => 'tien_mat',
                'gia_tri_giam' => 50000,
                'lan_dang_ky_tu' => 1,
                'lan_dang_ky_den' => 1,
                'ngay_bat_dau' => '2026-01-01',
                'ngay_ket_thuc' => '2027-12-31',
                'id_goi_tap' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_khuyen_mai' => 'Ưu đãi đăng ký gói tập nhiều lần',
                'ma_khuyen_mai' => 'MEMBER5',
                'loai_giam' => 'phan_tram',
                'gia_tri_giam' => 5,
                'lan_dang_ky_tu' => 2,
                'lan_dang_ky_den' => null,
                'ngay_bat_dau' => '2026-01-01',
                'ngay_ket_thuc' => '2027-12-31',
                'id_goi_tap' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
