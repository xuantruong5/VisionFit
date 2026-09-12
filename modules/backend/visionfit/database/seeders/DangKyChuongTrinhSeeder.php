<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class DangKyChuongTrinhSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('dang_ky_chuong_trinh')->truncate();
        DB::table('dang_ky_chuong_trinh')->insert([
            [
                'id_hoi_vien' => 1,
                'id_chuong_trinh' => 1,
                'ngay_bat_dau' => '2026-09-12',
                'ngay_du_kien_ket_thuc' => '2026-10-12',
                'phan_tram_hoan_thanh' => 0,
                'tinh_trang' => '0',
                'ngay_tao' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
